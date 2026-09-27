import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';

export function createAuthRouter(readDB, writeDB) {
  const router = express.Router();

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const db = readDB();
      const users = db.users || [];
      const user = users.find(u => 
        (u.email && u.email.toLowerCase() === email.trim().toLowerCase()) ||
        (u.altEmail && u.altEmail.toLowerCase() === email.trim().toLowerCase())
      );

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials. User does not exist.' });
      }

      // Check password using bcrypt comparison
      let isMatch = false;
      if (user.passwordHash) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      }
      
      // Fallback for transition if plain text password exists
      if (!isMatch && (user.password === password || user.altPassword === password)) {
        isMatch = true;
        // Auto-upgrade to bcrypt hash
        user.passwordHash = await bcrypt.hash(password, 10);
        writeDB(db);
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials. Incorrect password.' });
      }

      // Generate JWT Token (valid 24 hours)
      const tokenPayload = {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        partnerId: user.partnerId || null,
        clientId: user.clientId || null
      };

      const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

      // Sanitized user profile returned to client
      const userProfile = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        partnerId: user.partnerId,
        clientId: user.clientId,
        location: user.location,
        title: user.title,
        capitalInvested: user.capitalInvested,
        driverVehicleNo: user.driverVehicleNo
      };

      res.json({
        success: true,
        message: 'Authentication successful',
        token,
        user: userProfile
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error during authentication.' });
    }
  });

  // POST /api/auth/register (Admin only or bootstrap)
  router.post('/register', async (req, res) => {
    try {
      const { email, password, name, role = 'PARTNER', partnerId, clientId } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' });
      }

      const db = readDB();
      if (!db.users) db.users = [];

      const exists = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
      if (exists) {
        return res.status(400).json({ error: 'A user with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = {
        id: `USR-${Date.now().toString().slice(-4)}`,
        email: email.trim().toLowerCase(),
        passwordHash,
        name,
        role: role.toUpperCase(),
        partnerId: partnerId || null,
        clientId: clientId || null,
        createdAt: new Date().toISOString()
      };

      db.users.push(newUser);
      writeDB(db);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          partnerId: newUser.partnerId
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/auth/me (Verify JWT and return current user)
  router.get('/me', authenticateToken, (req, res) => {
    const db = readDB();
    const user = (db.users || []).find(u => u.id === req.user.userId || u.email === req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User record not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      partnerId: user.partnerId,
      clientId: user.clientId,
      location: user.location,
      title: user.title
    });
  });

  // POST /api/auth/logout
  router.post('/logout', (req, res) => {
    res.json({ success: true, message: 'Logged out successfully.' });
  });

  return router;
}
