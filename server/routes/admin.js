import express from 'express';
import bcrypt from 'bcryptjs';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createAdminRouter(prisma, logAudit) {
  const router = express.Router();

  // All endpoints require valid JWT and ADMIN role
  router.use(authenticateToken);
  router.use(requireRole(['ADMIN']));

  // 1. GET /api/admin/users - List and filter users from PostgreSQL
  router.get('/users', async (req, res) => {
    try {
      const { role, status, search } = req.query;

      const where = {};
      if (role && role !== 'ALL') {
        where.role = role.toUpperCase();
      }
      if (status && status !== 'ALL') {
        where.status = status.toUpperCase();
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ];
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          partnerId: true,
          clientId: true,
          assignedProject: true,
          location: true,
          title: true,
          status: true,
          driverVehicleNo: true,
          createdAt: true,
          lastLogin: true
        }
      });

      res.json(users);
    } catch (err) {
      console.error('Admin users error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve user directory.' });
    }
  });

  // 2. POST /api/admin/users - Create new user in PostgreSQL
  router.post('/users', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { email, password, name, role, phone, partnerId, clientId, assignedProject, location, title } = req.body;

      if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Email, password, name, and role are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return res.status(400).json({ error: 'Invalid email address format.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const validRoles = ['ADMIN', 'PARTNER', 'CLIENT', 'WORKER'];
      const normalizedRole = role.toUpperCase();
      if (!validRoles.includes(normalizedRole)) {
        return res.status(400).json({ error: `Invalid role. Allowed roles: ${validRoles.join(', ')}` });
      }

      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail }
      });
      if (existing) {
        return res.status(409).json({ error: 'A user with this email address already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          name: name.trim(),
          role: normalizedRole,
          phone: phone ? phone.trim() : null,
          partnerId: normalizedRole === 'PARTNER' ? partnerId || 'P1' : null,
          clientId: normalizedRole === 'CLIENT' ? clientId || 'CL-01' : null,
          assignedProject: assignedProject || null,
          location: location || null,
          title: title || `${normalizedRole.charAt(0) + normalizedRole.slice(1).toLowerCase()} User`,
          status: 'ACTIVE'
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'CREATE_USER',
          module: 'USER_MANAGEMENT',
          details: `Created new user ${newUser.email} with role ${newUser.role}`,
          ipAddress: ip
        });
      }

      res.status(201).json({
        success: true,
        message: 'User created successfully.',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          phone: newUser.phone,
          partnerId: newUser.partnerId,
          clientId: newUser.clientId,
          assignedProject: newUser.assignedProject,
          status: newUser.status,
          createdAt: newUser.createdAt
        }
      });
    } catch (err) {
      console.error('Create user error:', err.message);
      res.status(500).json({ error: 'Failed to create user.' });
    }
  });

  // 3. PUT /api/admin/users/:id - Update user details & role in PostgreSQL
  router.put('/users/:id', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { id } = req.params;
      const { name, role, phone, partnerId, clientId, assignedProject, location, title, status } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        return res.status(404).json({ error: 'User record not found.' });
      }

      // Prevent non-admin modification or user modifying their own role
      if (req.user.userId === id && role && role !== existingUser.role) {
        return res.status(400).json({ error: 'Administrators cannot alter their own role.' });
      }

      const validRoles = ['ADMIN', 'PARTNER', 'CLIENT', 'WORKER'];
      const targetRole = role ? role.toUpperCase() : existingUser.role;
      if (!validRoles.includes(targetRole)) {
        return res.status(400).json({ error: `Invalid role specified.` });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          name: name ? name.trim() : existingUser.name,
          role: targetRole,
          phone: phone !== undefined ? phone : existingUser.phone,
          partnerId: targetRole === 'PARTNER' ? partnerId || existingUser.partnerId : null,
          clientId: targetRole === 'CLIENT' ? clientId || existingUser.clientId : null,
          assignedProject: assignedProject !== undefined ? assignedProject : existingUser.assignedProject,
          location: location !== undefined ? location : existingUser.location,
          title: title !== undefined ? title : existingUser.title,
          status: status ? status.toUpperCase() : existingUser.status
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'UPDATE_USER',
          module: 'USER_MANAGEMENT',
          details: `Updated user profile for ${updatedUser.email} (Role: ${updatedUser.role}, Status: ${updatedUser.status})`,
          ipAddress: ip
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully.',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          phone: updatedUser.phone,
          partnerId: updatedUser.partnerId,
          clientId: updatedUser.clientId,
          assignedProject: updatedUser.assignedProject,
          status: updatedUser.status
        }
      });
    } catch (err) {
      console.error('Update user error:', err.message);
      res.status(500).json({ error: 'Failed to update user profile.' });
    }
  });

  // 4. PATCH /api/admin/users/:id/status - Toggle activate/deactivate
  router.patch('/users/:id/status', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['ACTIVE', 'INACTIVE'].includes(status.toUpperCase())) {
        return res.status(400).json({ error: "Status must be either 'ACTIVE' or 'INACTIVE'." });
      }

      if (req.user.userId === id && status.toUpperCase() === 'INACTIVE') {
        return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User record not found.' });
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { status: status.toUpperCase() }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: updated.status === 'ACTIVE' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
          module: 'USER_MANAGEMENT',
          details: `${updated.status === 'ACTIVE' ? 'Activated' : 'Deactivated'} account for ${updated.email}`,
          ipAddress: ip
        });
      }

      res.json({
        success: true,
        message: `Account has been ${updated.status === 'ACTIVE' ? 'activated' : 'deactivated'}.`,
        user: { id: updated.id, email: updated.email, status: updated.status }
      });
    } catch (err) {
      console.error('Toggle status error:', err.message);
      res.status(500).json({ error: 'Failed to update user status.' });
    }
  });

  // 5. PATCH /api/admin/users/:id/reset-password - Admin password reset
  router.patch('/users/:id/reset-password', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({ error: 'User record not found.' });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id },
        data: { passwordHash }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'PASSWORD_RESET',
          module: 'USER_MANAGEMENT',
          details: `Administrator reset password for user ${user.email}`,
          ipAddress: ip
        });
      }

      res.json({ success: true, message: `Password reset successfully for ${user.email}.` });
    } catch (err) {
      console.error('Password reset error:', err.message);
      res.status(500).json({ error: 'Failed to reset user password.' });
    }
  });

  // 6. DELETE /api/admin/users/:id - Delete user from PostgreSQL
  router.delete('/users/:id', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { id } = req.params;

      if (req.user.userId === id) {
        return res.status(400).json({ error: 'You cannot delete your own administrative account.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        return res.status(404).json({ error: 'User record not found.' });
      }

      await prisma.user.delete({ where: { id } });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'DELETE_USER',
          module: 'USER_MANAGEMENT',
          details: `Administrator deleted user ${existingUser.email} (${existingUser.role})`,
          ipAddress: ip
        });
      }

      res.json({ success: true, message: `User ${existingUser.email} deleted successfully.` });
    } catch (err) {
      console.error('Delete user error:', err.message);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  });

  // 7. GET /api/admin/audit-logs - View audit trail from PostgreSQL
  router.get('/audit-logs', async (req, res) => {
    try {
      const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200
      });
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Failed to retrieve audit trail.' });
    }
  });

  return router;
}
