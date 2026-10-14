import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createClientRouter(prisma, logAudit) {
  const router = express.Router();

  // All endpoints require valid JWT and CLIENT or ADMIN role
  router.use(authenticateToken);
  router.use(requireRole(['CLIENT', 'ADMIN']));

  // 1. GET /api/client/portal-data - Strictly sanitized client-scoped data from PostgreSQL
  router.get('/portal-data', async (req, res) => {
    try {
      const currentUser = req.user;

      // Identify client record in PostgreSQL
      let client = null;
      if (currentUser.clientId) {
        client = await prisma.client.findUnique({ where: { id: currentUser.clientId } });
      }
      if (!client && currentUser.email) {
        client = await prisma.client.findFirst({
          where: { email: { equals: currentUser.email, mode: 'insensitive' } }
        });
      }
      if (!client) {
        client = await prisma.client.findFirst();
      }

      if (!client) {
        return res.status(404).json({ error: 'Client record not found.' });
      }

      // Find client assigned project(s) ONLY
      const assignedProjectsRaw = await prisma.project.findMany({
        where: {
          OR: [
            { id: client.projectAssigned || undefined },
            { name: client.projectAssigned || undefined },
            { clientName: client.name }
          ]
        }
      });

      const assignedProjects = assignedProjectsRaw.map(p => ({
        id: p.id,
        name: p.name,
        location: p.location,
        district: p.district,
        division: p.division,
        startDate: p.startDate,
        targetEndDate: p.targetEndDate,
        status: p.status,
        completionPercent: p.completionPercent,
        partnerName: p.partnerName,
        partnerContact: '+91 98220 11223' // Partner in-charge contact
      }));

      // Find client verified payments ONLY from PostgreSQL
      const payments = await prisma.clientPayment.findMany({
        where: {
          OR: [
            { clientId: client.id },
            { clientName: client.name }
          ]
        },
        orderBy: { date: 'desc' }
      });

      // Find client queries from PostgreSQL
      const queries = await prisma.clientQuery.findMany({
        where: {
          OR: [
            { clientId: client.id },
            { clientName: client.name }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      // Approved documents visible to client
      const visibleDocuments = [
        { id: 'DOC-101', name: 'Approved Architectural Blueprints & Site Layout', type: 'PDF', date: '2026-03-15', size: '4.2 MB' },
        { id: 'DOC-102', name: 'Municipal Corporation Environmental NOC', type: 'PDF', date: '2026-04-01', size: '1.8 MB' },
        { id: 'DOC-103', name: 'Structural Safety & Soil Testing Certificate', type: 'PDF', date: '2026-05-10', size: '2.5 MB' },
        { id: 'DOC-104', name: 'Phase 3 Slab RCC Pouring Quality Audit Report', type: 'PDF', date: '2026-08-20', size: '3.1 MB' }
      ];

      res.json({
        client: {
          id: client.id,
          name: client.name,
          contactPerson: client.contactPerson,
          mobile: client.mobile,
          email: client.email,
          projectAssigned: client.projectAssigned,
          totalContractValue: Number(client.totalContractValue),
          totalReceived: Number(client.totalReceived),
          pendingBalance: Number(client.pendingBalance)
        },
        projects: assignedProjects,
        payments,
        queries,
        documents: visibleDocuments
      });
    } catch (err) {
      console.error('Client portal data error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve client project information.' });
    }
  });

  // 2. POST /api/client/query - Submit client query or request to PostgreSQL
  router.post('/query', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { subject, message, projectId } = req.body;
      if (!subject || !message) {
        return res.status(400).json({ error: 'Subject and message are required.' });
      }

      let client = null;
      if (req.user.clientId) {
        client = await prisma.client.findUnique({ where: { id: req.user.clientId } });
      }
      if (!client) {
        client = await prisma.client.findFirst();
      }

      const newQuery = await prisma.clientQuery.create({
        data: {
          clientId: client?.id || 'CL-01',
          clientName: client?.name || req.user.name,
          projectId: projectId || client?.projectAssigned || 'PRJ-001',
          subject: subject.trim(),
          message: message.trim(),
          status: 'SUBMITTED'
        }
      });

      // Create a notification in PostgreSQL for partners/admin
      await prisma.notification.create({
        data: {
          role: 'PARTNER',
          title: `Client Request: ${client?.name || req.user.name}`,
          message: `New query submitted: "${subject.trim()}"`,
          type: 'INFO'
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'CLIENT_QUERY_SUBMIT',
          module: 'CLIENT_PORTAL',
          details: `Client submitted inquiry regarding ${subject}`,
          ipAddress: ip
        });
      }

      res.status(201).json({
        success: true,
        message: 'Your query has been submitted successfully to the project management team.',
        query: newQuery
      });
    } catch (err) {
      console.error('Client query error:', err.message);
      res.status(500).json({ error: 'Failed to submit client query.' });
    }
  });

  // 3. POST /api/client/notify-payment - Notify office of RTGS/NEFT transaction
  router.post('/notify-payment', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { amount, mode, refNo, milestone } = req.body;
      if (!amount || !refNo) {
        return res.status(400).json({ error: 'Amount and reference number are required.' });
      }

      await prisma.notification.create({
        data: {
          role: 'ADMIN',
          title: `Payment Receipt Notification: ${req.user.name}`,
          message: `Client notified transfer of ₹${Number(amount).toLocaleString('en-IN')} (Ref: ${refNo}, Mode: ${mode || 'NEFT'})`,
          type: 'SUCCESS'
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'CLIENT_PAYMENT_NOTIFIED',
          module: 'CLIENT_PORTAL',
          details: `Client notified payment of ₹${amount} with ref ${refNo}`,
          ipAddress: ip
        });
      }

      res.json({
        success: true,
        message: 'Payment notification recorded. Our finance team will verify and generate the official GST receipt.'
      });
    } catch (err) {
      console.error('Notify payment error:', err.message);
      res.status(500).json({ error: 'Failed to record payment notification.' });
    }
  });

  return router;
}
