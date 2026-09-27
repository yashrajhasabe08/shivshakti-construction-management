import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'shivshakti-super-secure-production-jwt-secret-key-2026';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token. Please log in again.' });
    }
    req.user = decoded;
    next();
  });
}

// Role-Based Access Control Middleware
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Forbidden: role '${req.user.role}' lacks permission to perform this action.` 
      });
    }

    next;
    next();
  };
}

// Partner Data Scoping Middleware
export function checkPartnerAccess(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });

  // ADMIN can access any partner data
  if (req.user.role === 'ADMIN') return next();

  // If request contains target partnerId, verify ownership
  const targetPartnerId = req.params.partnerId || req.query.partnerId || req.body?.partnerId;
  if (targetPartnerId && req.user.partnerId && targetPartnerId !== req.user.partnerId) {
    return res.status(403).json({ 
      error: `Forbidden: you can only view/manage data belonging to partner ${req.user.partnerId}.` 
    });
  }

  next();
}

export { JWT_SECRET };
