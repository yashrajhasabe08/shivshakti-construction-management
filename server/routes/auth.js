import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { 
  JWT_SECRET, 
  authenticateToken, 
  checkLoginRateLimit, 
  recordFailedLogin, 
  resetLoginAttempts, 
  revokeToken 
} from '../middleware/auth.js';

export function createAuthRouter(prisma, logAudit) {
  const router = express.Router();

  // POST /api/auth/login
  router.post('/login', checkLoginRateLimit, async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { email, password } = req.body;

      if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Valid email and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email address format.' });
      }

      // Query authoritative PostgreSQL via Prisma
      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });

      if (!user) {
        recordFailedLogin(ip);
        if (logAudit) {
          logAudit({
            userId: 'ANONYMOUS',
            userName: normalizedEmail,
            userRole: 'UNKNOWN',
            action: 'LOGIN_FAILURE',
            module: 'AUTH',
            details: `Failed login attempt for non-existent email: ${normalizedEmail}`,
            ipAddress: ip
          });
        }
        return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
      }

      // Check account activation status
      if (user.status === 'INACTIVE') {
        return res.status(403).json({ error: 'Account has been deactivated. Please contact your administrator.' });
      }

      // Verify password strictly with bcrypt
      if (!user.passwordHash) {
        return res.status(500).json({ error: 'Account security configuration error. Please contact administrator.' });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);

      if (!isMatch) {
        recordFailedLogin(ip);
        if (logAudit) {
          logAudit({
            userId: user.id,
            userName: user.name,
            userRole: user.role,
            action: 'LOGIN_FAILURE',
            module: 'AUTH',
            details: 'Incorrect password provided',
            ipAddress: ip
          });
        }
        return res.status(401).json({ error: 'Invalid credentials. Please verify your email and password.' });
      }

      // Reset failed login count on successful authentication
      resetLoginAttempts(ip);

      // Update user lastLogin timestamp in PostgreSQL
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Sign JWT with 12-hour expiration
      const tokenPayload = {
        userId: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status || 'ACTIVE',
        partnerId: updatedUser.partnerId || null,
        clientId: updatedUser.clientId || null,
        assignedProject: updatedUser.assignedProject || null,
        driverVehicleNo: updatedUser.driverVehicleNo || null
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '12h' });

      // Sanitized profile (no password hashes ever sent)
      const sanitizedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone || null,
        partnerId: updatedUser.partnerId || null,
        clientId: updatedUser.clientId || null,
        assignedProject: updatedUser.assignedProject || null,
        location: updatedUser.location || null,
        title: updatedUser.title || null,
        status: updatedUser.status || 'ACTIVE',
        driverVehicleNo: updatedUser.driverVehicleNo || null,
        lastLogin: updatedUser.lastLogin
      };

      if (logAudit) {
        logAudit({
          userId: updatedUser.id,
          userName: updatedUser.name,
          userRole: updatedUser.role,
          action: 'LOGIN_SUCCESS',
          module: 'AUTH',
          details: `User logged in successfully (Role: ${updatedUser.role})`,
          ipAddress: ip
        });
      }

      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: sanitizedUser
      });
    } catch (err) {
      console.error('Login error:', err.message);
      res.status(500).json({ error: 'An error occurred during authentication.' });
    }
  });

  // GET /api/auth/me
  router.get('/me', authenticateToken, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User account not found.' });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({ error: 'Account has been deactivated.' });
      }

      res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone || null,
        partnerId: user.partnerId || null,
        clientId: user.clientId || null,
        assignedProject: user.assignedProject || null,
        location: user.location || null,
        title: user.title || null,
        status: user.status || 'ACTIVE',
        driverVehicleNo: user.driverVehicleNo || null,
        lastLogin: user.lastLogin || null
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify session profile.' });
    }
  });

  // POST /api/auth/change-password
  router.post('/change-password', authenticateToken, async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User record not found.' });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'Incorrect current password.' });
      }

      // Hash new password and persist to PostgreSQL
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      if (logAudit) {
        logAudit({
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          action: 'PASSWORD_CHANGE',
          module: 'AUTH',
          details: 'User successfully updated account password',
          ipAddress: ip
        });
      }

      res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      console.error('Password change error:', err.message);
      res.status(500).json({ error: 'Failed to update password.' });
    }
  });

  // POST /api/auth/logout
  router.post('/logout', authenticateToken, (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    if (req.token) {
      revokeToken(req.token);
    }

    if (logAudit && req.user) {
      logAudit({
        userId: req.user.userId,
        userName: req.user.name,
        userRole: req.user.role,
        action: 'LOGOUT',
        module: 'AUTH',
        details: 'User logged out and session token invalidated',
        ipAddress: ip
      });
    }

    res.json({ success: true, message: 'Logged out successfully.' });
  });

  return router;
}
