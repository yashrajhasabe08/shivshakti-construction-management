import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';

export function createWorkerRouter(prisma, logAudit) {
  const router = express.Router();

  // All endpoints require valid JWT and WORKER or ADMIN role
  router.use(authenticateToken);
  router.use(requireRole(['WORKER', 'ADMIN']));

  // 1. GET /api/worker/portal-data - Sanitized worker-scoped information from PostgreSQL
  router.get('/portal-data', async (req, res) => {
    try {
      const currentUser = req.user;

      // Find worker assigned POs (matching vehicle or driver name)
      const allPOs = await prisma.purchaseOrder.findMany({
        include: { items: true },
        orderBy: { orderDate: 'desc' }
      });

      const assignedPOs = allPOs.filter(po => 
        (currentUser.driverVehicleNo && po.vehicleNumber === currentUser.driverVehicleNo) ||
        (po.driverName && po.driverName.toLowerCase().includes(currentUser.name.toLowerCase()))
      ).map(po => ({
        id: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplierName,
        projectName: po.projectName,
        deliveryStatus: po.deliveryStatus,
        dispatchNotes: po.dispatchNotes || '',
        orderDate: po.orderDate,
        items: (po.items || []).map(i => ({
          name: i.materialName,
          quantity: i.quantity,
          unit: i.unit
        })) // Quantities visible, but NO purchase prices or vendor rates!
      }));

      // Find assigned tasks from PostgreSQL
      const tasks = await prisma.workerTask.findMany({
        where: {
          OR: [
            { workerId: currentUser.userId },
            { workerName: { equals: currentUser.name, mode: 'insensitive' } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      // Find today's attendance
      const today = new Date().toISOString().slice(0, 10);
      const todayAttendance = await prisma.workerAttendance.findFirst({
        where: {
          OR: [
            { workerId: currentUser.userId },
            { workerName: currentUser.name }
          ],
          date: today
        }
      });

      // Project info (sanitized - no budget or financials)
      let project = null;
      if (currentUser.assignedProject) {
        project = await prisma.project.findUnique({ where: { id: currentUser.assignedProject } });
      }
      if (!project) {
        project = await prisma.project.findFirst();
      }

      const projectInfo = project ? {
        id: project.id,
        name: project.name,
        location: project.location,
        status: project.status,
        completionPercent: project.completionPercent,
        partnerName: project.partnerName
      } : null;

      res.json({
        worker: {
          id: currentUser.userId,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          vehicleNo: currentUser.driverVehicleNo || 'MH 12 QG 4821',
          assignedSite: projectInfo?.name || 'Shivshakti Commercial Tower'
        },
        project: projectInfo,
        tasks,
        assignedPOs,
        attendance: todayAttendance || { status: 'NOT_MARKED', date: today }
      });
    } catch (err) {
      console.error('Worker portal data error:', err.message);
      res.status(500).json({ error: 'Failed to retrieve worker assignments.' });
    }
  });

  // 2. PATCH /api/worker/tasks/:id/status - Update task status in PostgreSQL
  router.patch('/tasks/:id/status', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status.toUpperCase())) {
        return res.status(400).json({ error: 'Valid status is required (PENDING, IN_PROGRESS, COMPLETED).' });
      }

      const task = await prisma.workerTask.findUnique({ where: { id } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }

      const updated = await prisma.workerTask.update({
        where: { id },
        data: { status: status.toUpperCase() }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'TASK_STATUS_UPDATE',
          module: 'WORKER_PORTAL',
          details: `Updated task ${updated.id} (${updated.title}) to ${updated.status}`,
          ipAddress: ip
        });
      }

      res.json({ success: true, task: updated });
    } catch (err) {
      console.error('Task status update error:', err.message);
      res.status(500).json({ error: 'Failed to update task status.' });
    }
  });

  // 3. POST /api/worker/attendance - Mark attendance (punch in) in PostgreSQL
  router.post('/attendance', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const today = new Date().toISOString().slice(0, 10);
      const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      let existing = await prisma.workerAttendance.findFirst({
        where: {
          OR: [
            { workerId: req.user.userId },
            { workerName: req.user.name }
          ],
          date: today
        }
      });

      if (existing) {
        return res.json({ success: true, message: 'Attendance already marked for today.', attendance: existing });
      }

      const newRecord = await prisma.workerAttendance.create({
        data: {
          workerId: req.user.userId,
          workerName: req.user.name,
          projectId: req.user.assignedProject || 'PRJ-001',
          projectName: 'Shivshakti Commercial Tower',
          date: today,
          punchInTime: currentTime,
          status: 'PRESENT'
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'WORKER_PUNCH_IN',
          module: 'ATTENDANCE',
          details: `Worker marked attendance at ${currentTime}`,
          ipAddress: ip
        });
      }

      res.json({ success: true, message: 'Attendance punched successfully!', attendance: newRecord });
    } catch (err) {
      console.error('Worker attendance error:', err.message);
      res.status(500).json({ error: 'Failed to record attendance.' });
    }
  });

  // 4. POST /api/worker/site-update - Submit daily progress / site issue
  router.post('/site-update', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { updateType, notes, projectId } = req.body;
      if (!notes) {
        return res.status(400).json({ error: 'Update details are required.' });
      }

      await prisma.notification.create({
        data: {
          role: 'PARTNER',
          title: `Site Update from ${req.user.name}`,
          message: `[${updateType || 'PROGRESS'}] ${notes.trim()}`,
          type: updateType === 'ISSUE' ? 'WARNING' : 'INFO'
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'SITE_UPDATE_SUBMIT',
          module: 'WORKER_PORTAL',
          details: `Site update submitted: ${updateType || 'PROGRESS'}`,
          ipAddress: ip
        });
      }

      res.json({ success: true, message: 'Site update recorded and forwarded to project in-charge.' });
    } catch (err) {
      console.error('Site update error:', err.message);
      res.status(500).json({ error: 'Failed to record site update.' });
    }
  });

  // 5. POST /api/worker/delivery-status - Driver update dispatch/delivery status
  router.post('/delivery-status', async (req, res) => {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    try {
      const { poId, status, notes } = req.body;
      if (!poId || !status) {
        return res.status(400).json({ error: 'Purchase Order ID and new delivery status are required.' });
      }

      const po = await prisma.purchaseOrder.findFirst({
        where: {
          OR: [
            { id: poId },
            { poNumber: poId }
          ]
        }
      });

      if (!po) {
        return res.status(404).json({ error: 'Purchase Order not found.' });
      }

      const updated = await prisma.purchaseOrder.update({
        where: { id: po.id },
        data: {
          deliveryStatus: status,
          dispatchNotes: notes || po.dispatchNotes
        }
      });

      await prisma.notification.create({
        data: {
          role: 'PARTNER',
          title: `Delivery Update: PO ${po.poNumber}`,
          message: `Status changed to '${status}' by driver ${req.user.name}. Notes: ${notes || 'None'}`,
          type: status === 'Delivered' ? 'SUCCESS' : 'INFO'
        }
      });

      if (logAudit) {
        logAudit({
          userId: req.user.userId,
          userName: req.user.name,
          userRole: req.user.role,
          action: 'DELIVERY_STATUS_UPDATE',
          module: 'DELIVERY_TRACKER',
          details: `Updated PO ${po.poNumber} status to ${status}`,
          ipAddress: ip
        });
      }

      res.json({ success: true, message: `PO status updated to '${status}'.`, po: updated });
    } catch (err) {
      console.error('Delivery status error:', err.message);
      res.status(500).json({ error: 'Failed to update delivery status.' });
    }
  });

  return router;
}
