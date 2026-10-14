import jwt from 'jsonwebtoken';

// Enforce that JWT_SECRET is loaded from environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

// In-memory token blacklist for logout and revoked sessions
const tokenBlacklist = new Set();

export function revokeToken(token) {
  if (token) {
    tokenBlacklist.add(token);
  }
}

export function isTokenRevoked(token) {
  return tokenBlacklist.has(token);
}

// Simple IP-based rate limiting for authentication endpoints
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      if (now - record.firstAttempt < LOCKOUT_PERIOD_MS) {
        const remainingMinutes = Math.ceil((LOCKOUT_PERIOD_MS - (now - record.firstAttempt)) / 60000);
        return res.status(429).json({
          error: `Too many failed login attempts from this IP. Please try again after ${remainingMinutes} minute(s).`
        });
      } else {
        // Reset after lockout expiration
        loginAttempts.set(ip, { count: 0, firstAttempt: now });
      }
    }
  }

  next();
}

export function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  record.count += 1;
  loginAttempts.set(ip, record);
}

export function resetLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

/**
 * Authentication Middleware: Validates JWT Bearer Token and verifies session
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Missing bearer token.' });
  }

  if (isTokenRevoked(token)) {
    return res.status(401).json({ error: 'Session has been invalidated. Please log in again.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Session token has expired. Please log in again.' });
      }
      return res.status(403).json({ error: 'Invalid authentication token.' });
    }

    if (decoded.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account has been deactivated. Contact your ERP administrator.' });
    }

    req.user = decoded;
    req.token = token;
    next();
  });
}

/**
 * Role-Based Access Control Middleware (RBAC)
 * Strictly verifies that the authenticated user possesses an allowed role.
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => r.toUpperCase());

    if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ 
        error: `Forbidden: role '${userRole}' lacks permission to access this resource.` 
      });
    }

    next();
  };
}

/**
 * Partner Data Scoping Middleware
 * Enforces that non-admin partners can only access data belonging to their own partnerId.
 */
export function checkPartnerAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  // ADMIN has system-wide access
  if (req.user.role === 'ADMIN') return next();

  if (req.user.role !== 'PARTNER') {
    return res.status(403).json({ error: 'Partner access required.' });
  }

  const targetPartnerId = req.params.partnerId || req.query.partnerId || req.body?.partnerId;
  if (targetPartnerId && req.user.partnerId && targetPartnerId !== req.user.partnerId) {
    return res.status(403).json({ 
      error: `Forbidden: you can only view or manage data belonging to partner ${req.user.partnerId}.` 
    });
  }

  next();
}

/**
 * Client Data Scoping Middleware
 */
export function checkClientAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });

  if (req.user.role === 'ADMIN') return next();

  if (req.user.role !== 'CLIENT') {
    return res.status(403).json({ error: 'Client access required.' });
  }

  const targetClientId = req.params.clientId || req.query.clientId || req.body?.clientId;
  if (targetClientId && req.user.clientId && targetClientId !== req.user.clientId) {
    return res.status(403).json({ 
      error: `Forbidden: you cannot access other client records.` 
    });
  }

  next();
}

export { JWT_SECRET };
