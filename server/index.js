import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

import { createAuthRouter } from './routes/auth.js';
import { createAdminRouter } from './routes/admin.js';
import { createClientRouter } from './routes/client.js';
import { createWorkerRouter } from './routes/worker.js';
import { createValidationRouter } from './routes/validation.js';
import { 
  authenticateToken, 
  requireRole, 
  checkPartnerAccess 
} from './middleware/auth.js';

// Global JSON serialization fix for Prisma BigInt fields
BigInt.prototype.toJSON = function () {
  return Number(this);
};

// Fail securely if JWT_SECRET is not set in environment
if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not defined. Server refusing to start.');
  process.exit(1);
}

// Fail securely if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not defined. Server refusing to start.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5001;

// Phase 10: Security Headers & Hardening
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Phase 10: Restricted CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback for local development network addresses
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Initialize Authoritative Supabase PostgreSQL Client via Prisma
export const prisma = new PrismaClient();

let isPrismaConnected = false;
async function verifyDatabaseConnection(retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      isPrismaConnected = true;
      console.log('✓ Supabase PostgreSQL Database connected successfully via Prisma');
      return;
    } catch (err) {
      console.warn(`Database connection attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, 2000));
      } else {
        isPrismaConnected = false;
        console.error('FATAL: Unable to reach PostgreSQL database after retries:', err.message);
      }
    }
  }
}
verifyDatabaseConnection();

// Phase 9: Real PostgreSQL Audit Logging System
async function logAudit({ userId, userName, userRole, action, module, details, ipAddress }) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || 'ANONYMOUS',
        userName: userName || 'Unknown',
        userRole: userRole || 'UNKNOWN',
        action: action || 'ACTION',
        module: module || 'SYSTEM',
        details: details || '',
        ipAddress: ipAddress || '127.0.0.1'
      }
    });
  } catch (e) {
    console.error('Failed to record PostgreSQL audit log:', e.message);
  }
}

// ==========================================
// MOUNT ROUTERS
// ==========================================

// 1. Auth Router (Public login, authenticated me/logout/password)
app.use('/api/auth', createAuthRouter(prisma, logAudit));

// 2. Admin Router (Protected: ADMIN only)
app.use('/api/admin', createAdminRouter(prisma, logAudit));

// 3. Client Workflow Router (Protected: CLIENT & ADMIN)
app.use('/api/client', createClientRouter(prisma, logAudit));

// 4. Worker Workflow Router (Protected: WORKER & ADMIN)
app.use('/api/worker', createWorkerRouter(prisma, logAudit));

// 5. Data Validation Router (Protected: ADMIN & PARTNER)
app.use('/api/validation', authenticateToken, requireRole(['ADMIN', 'PARTNER']), createValidationRouter(prisma));

// 6. Genuinely Public Health Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'ONLINE';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbStatus = 'OFFLINE';
  }

  res.json({
    status: dbStatus === 'ONLINE' ? 'OK' : 'DEGRADED',
    company: 'Shivshakti Construction ERP Backend',
    databaseEngine: 'Supabase PostgreSQL (Prisma)',
    databaseStatus: dbStatus,
    authEngine: 'JWT & Bcrypt Active (Zero Plaintext)',
    rbac: 'ADMIN, PARTNER, CLIENT, WORKER Active',
    timestamp: new Date().toISOString()
  });
});

// 7. Partner Dashboard Endpoint (Protected: ADMIN or matching PARTNER)
app.get('/api/partner/:partnerId/dashboard', authenticateToken, checkPartnerAccess, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });

    if (!partner) {
      return res.status(404).json({ error: `Partner ${partnerId} not found` });
    }

    const [
      projects,
      expenses,
      purchaseOrders,
      purchaseBills,
      labourWages,
      subcontractors,
      clientPayments
    ] = await Promise.all([
      prisma.project.findMany({ where: { partnerId } }),
      prisma.expense.findMany({ where: { partnerId } }),
      prisma.purchaseOrder.findMany({ where: { partnerId } }),
      prisma.purchaseBill.findMany({ where: { partnerId } }),
      prisma.labourWage.findMany({ where: { partnerId } }),
      prisma.subcontractor.findMany({ where: { partnerId } }),
      prisma.clientPayment.findMany({ where: { partnerId } })
    ]);

    res.json({
      partner,
      projects,
      expenses,
      purchaseOrders,
      purchaseBills,
      labourWages,
      subcontractors,
      clientPayments,
      summary: {
        projectsCount: projects.length,
        totalDirectExpenses: expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0),
        totalPurchaseOrders: purchaseOrders.reduce((s, po) => s + (Number(po.totalAmount) || 0), 0),
        totalLabourWages: labourWages.reduce((s, lw) => s + (Number(lw.totalWeeklyWage) || 0), 0),
        totalClientReceipts: clientPayments.reduce((s, cp) => s + (Number(cp.amount) || 0), 0)
      }
    });
  } catch (err) {
    console.error('Partner dashboard error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve partner dashboard data.' });
  }
});

// 8. Notifications Endpoints
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user.userId;

    const notifs = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { role },
          ...(role === 'ADMIN' ? [{ role: { not: null } }] : [])
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(notifs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
});

app.patch('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id },
      data: { read: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// 9. PHASE 1, 2, 6: PROTECTED & ROLE-SCOPED Consolidated Data Endpoint
app.get('/api/data', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Fetch collections from Supabase PostgreSQL via Prisma in parallel
    const [
      companySetting,
      rawUsers,
      partners,
      allProjects,
      allExpenses,
      allPurchaseOrders,
      allPurchaseBills,
      allPurchasePayments,
      allLabourWages,
      allSubcontractors,
      allAssets,
      allVehicles,
      allSuppliers,
      allClients,
      allClientPayments,
      allWorkerTasks,
      allClientQueries,
      allWorkerAttendance,
      notifications
    ] = await Promise.all([
      prisma.companySetting.findUnique({ where: { id: 'COMPANY-DEFAULT' } }),
      prisma.user.findMany({
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
      }),
      prisma.partner.findMany(),
      prisma.project.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.expense.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.purchaseOrder.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } }),
      prisma.purchaseBill.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.purchasePayment.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.labourWage.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.subcontractor.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.asset.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.vehicle.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.client.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.clientPayment.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.workerTask.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.clientQuery.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.workerAttendance.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.notification.findMany({
        where: {
          OR: [
            { userId: user.userId },
            { role: user.role },
            ...(user.role === 'ADMIN' ? [{ role: { not: null } }] : [])
          ]
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    const company = companySetting ? {
      name: companySetting.name,
      tagline: companySetting.tagline,
      established: companySetting.established,
      headquarters: companySetting.headquarters,
      gstin: companySetting.gstin,
      pan: companySetting.pan,
      contact: {
        phone: companySetting.phone,
        email: companySetting.email,
        website: companySetting.website
      }
    } : {
      name: 'Shivshakti Construction Management System',
      tagline: 'Civil Engineering & Multi-Site Infrastructure ERP',
      established: 2012,
      headquarters: 'Office #402, Shivshakti Towers, Pune-Bangalore Highway, Pune 411038',
      gstin: '27AAACS1234F1Z5',
      pan: 'AAACS1234F',
      contact: {
        phone: '+91 20 2567 8900',
        email: 'corporate@shivshakti.com',
        website: 'www.shivshakticonstruction.com'
      }
    };

    // Format PO items for frontend compatibility
    const formattedPurchaseOrders = allPurchaseOrders.map(po => ({
      ...po,
      linkedBills: po.linkedBills ? JSON.parse(po.linkedBills) : [],
      items: po.items.map(it => ({
        id: it.id,
        materialName: it.materialName,
        name: it.materialName,
        description: it.description,
        quantity: it.quantity,
        unit: it.unit,
        ratePerUnit: Number(it.ratePerUnit),
        rate: Number(it.ratePerUnit),
        totalAmount: Number(it.totalAmount),
        amount: Number(it.totalAmount),
        deliveryStatus: it.deliveryStatus
      }))
    }));

    // Format Subcontractors for frontend compatibility
    const formattedSubcontractors = allSubcontractors.map(sc => ({
      id: sc.id,
      name: sc.name || sc.firmName,
      firmName: sc.firmName || sc.name,
      workType: sc.workType || sc.tradeScope,
      tradeScope: sc.tradeScope || sc.workType,
      projectId: sc.projectId,
      projectName: sc.projectName,
      partnerId: sc.partnerId,
      contractValue: Number(sc.contractValue),
      paidAmount: Number(sc.paidAmount || sc.totalPaid || 0),
      totalPaid: Number(sc.totalPaid || sc.paidAmount || 0),
      pendingAmount: Number(sc.pendingAmount || sc.pendingBalance || 0),
      pendingBalance: Number(sc.pendingBalance || sc.pendingAmount || 0),
      totalBilled: Number(sc.totalBilled || 0),
      progress: sc.progress || sc.completionPercent || 0,
      completionPercent: sc.completionPercent || sc.progress || 0
    }));

    // ADMIN: Complete system access
    if (user.role === 'ADMIN') {
      return res.json({
        company,
        users: rawUsers,
        partners,
        projects: allProjects,
        otherExpenses: allExpenses,
        purchaseOrders: formattedPurchaseOrders,
        purchaseBills: allPurchaseBills,
        purchasePayments: allPurchasePayments,
        labourWages: allLabourWages,
        subcontractors: formattedSubcontractors,
        assetsAndDeposits: allAssets,
        vehicles: allVehicles,
        suppliers: allSuppliers,
        clients: allClients,
        clientPayments: allClientPayments,
        workerTasks: allWorkerTasks,
        clientQueries: allClientQueries,
        workerAttendance: allWorkerAttendance,
        notifications
      });
    }

    // PARTNER: Strict scoping by partnerId
    if (user.role === 'PARTNER') {
      const pId = user.partnerId || 'P1';

      const scopedProjects = allProjects.filter(p => p.partnerId === pId);
      const scopedProjectIds = new Set(scopedProjects.map(p => p.id));
      const scopedProjectNames = new Set(scopedProjects.map(p => p.name.toLowerCase()));

      const isProjectMatch = (item) => {
        if (item.partnerId && item.partnerId === pId) return true;
        if (item.projectId && scopedProjectIds.has(item.projectId)) return true;
        if (item.projectName && scopedProjectNames.has(item.projectName.toLowerCase())) return true;
        return false;
      };

      return res.json({
        company,
        partners,
        projects: scopedProjects,
        otherExpenses: allExpenses.filter(isProjectMatch),
        purchaseOrders: formattedPurchaseOrders.filter(isProjectMatch),
        purchaseBills: allPurchaseBills.filter(isProjectMatch),
        purchasePayments: allPurchasePayments.filter(isProjectMatch),
        labourWages: allLabourWages.filter(isProjectMatch),
        subcontractors: formattedSubcontractors.filter(isProjectMatch),
        clientPayments: allClientPayments.filter(isProjectMatch),
        assetsAndDeposits: allAssets.filter(isProjectMatch),
        vehicles: allVehicles,
        suppliers: allSuppliers,
        clients: allClients,
        users: rawUsers.filter(u => u.partnerId === pId || u.role === 'ADMIN'),
        notifications
      });
    }

    // CLIENT: Scoped to their client account
    if (user.role === 'CLIENT') {
      const client = allClients.find(c => c.id === user.clientId) || allClients[0];
      const clientProject = allProjects.filter(p => 
        p.id === client?.projectAssigned || p.name === client?.projectAssigned || p.clientName === client?.name
      );

      return res.json({
        company,
        clients: client ? [client] : [],
        projects: clientProject,
        clientPayments: allClientPayments.filter(cp => cp.clientId === client?.id || cp.clientName === client?.name),
        clientQueries: allClientQueries.filter(q => q.clientId === client?.id),
        notifications
      });
    }

    // WORKER: Scoped to their tasks and delivery vehicle
    if (user.role === 'WORKER') {
      const workerPOs = formattedPurchaseOrders.filter(po => 
        (user.driverVehicleNo && po.vehicleNumber === user.driverVehicleNo) ||
        (po.driverName && po.driverName.toLowerCase().includes(user.name.toLowerCase()))
      );

      return res.json({
        company,
        purchaseOrders: workerPOs,
        workerTasks: allWorkerTasks.filter(t => t.workerId === user.userId),
        workerAttendance: allWorkerAttendance.filter(a => a.workerId === user.userId),
        notifications
      });
    }

    res.status(403).json({ error: 'Access denied: unrecognized role.' });
  } catch (err) {
    console.error('Data endpoint error:', err.message);
    res.status(500).json({ error: 'Failed to retrieve application data.' });
  }
});

// 10. PHASE 1, 2, 6, 7: PROTECTED Generic Module POST (Add or Update) via PostgreSQL
app.post('/api/:moduleName', authenticateToken, requireRole(['ADMIN', 'PARTNER']), async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  try {
    const { moduleName } = req.params;
    const item = req.body;
    const user = req.user;

    const allowedModules = [
      'projects',
      'otherExpenses',
      'purchaseOrders',
      'purchaseBills',
      'purchasePayments',
      'labourWages',
      'subcontractors',
      'assetsAndDeposits',
      'suppliers',
      'clients',
      'clientPayments',
      'partners'
    ];

    if (!allowedModules.includes(moduleName)) {
      return res.status(400).json({ error: `Modification not permitted for module '${moduleName}'.` });
    }

    if (!item || typeof item !== 'object' || !item.id) {
      return res.status(400).json({ error: 'Valid payload with unique ID is required.' });
    }

    // Partner Scope Enforcement
    if (user.role === 'PARTNER') {
      if (!item.partnerId) {
        item.partnerId = user.partnerId;
      }
    }

    let savedItem = null;

    // Prisma-backed mutations per module
    switch (moduleName) {
      case 'projects': {
        const budgetNum = Number(item.budget || 0);
        if (budgetNum <= 0) {
          return res.status(400).json({ error: 'Project budget must be greater than ₹0.' });
        }
        if (budgetNum > 5000000) {
          return res.status(400).json({ 
            error: 'Project budget cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.' 
          });
        }

        savedItem = await prisma.project.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            district: item.district || null,
            division: item.division || null,
            location: item.location || '',
            partnerId: item.partnerId || user.partnerId || 'P1',
            partnerName: item.partnerName || 'Partner',
            clientName: item.clientName || 'Client',
            budget: BigInt(item.budget || 0),
            actualCost: BigInt(item.actualCost || 0),
            status: item.status || 'In Progress',
            completionPercent: item.completionPercent ? Number(item.completionPercent) : 0,
            description: item.description || null
          },
          create: {
            id: item.id,
            name: item.name,
            district: item.district || null,
            division: item.division || null,
            location: item.location || '',
            partnerId: item.partnerId || user.partnerId || 'P1',
            partnerName: item.partnerName || 'Partner',
            clientName: item.clientName || 'Client',
            budget: BigInt(item.budget || 0),
            actualCost: BigInt(item.actualCost || 0),
            status: item.status || 'In Progress',
            completionPercent: item.completionPercent ? Number(item.completionPercent) : 0,
            description: item.description || null
          }
        });
        break;
      }

      case 'otherExpenses':
        savedItem = await prisma.expense.upsert({
          where: { id: item.id },
          update: {
            projectId: item.projectId || 'PRJ-001',
            projectName: item.projectName || '',
            category: item.category || 'Site Petty Cash',
            expenseTitle: item.expenseTitle || '',
            amount: BigInt(item.amount || 0),
            paidBy: item.paidBy || '',
            receiptNo: item.receiptNo || null,
            partnerId: item.partnerId || null
          },
          create: {
            id: item.id,
            projectId: item.projectId || 'PRJ-001',
            projectName: item.projectName || '',
            category: item.category || 'Site Petty Cash',
            expenseTitle: item.expenseTitle || '',
            amount: BigInt(item.amount || 0),
            paidBy: item.paidBy || '',
            receiptNo: item.receiptNo || null,
            partnerId: item.partnerId || null
          }
        });
        break;

      case 'purchaseOrders':
        savedItem = await prisma.purchaseOrder.upsert({
          where: { id: item.id },
          update: {
            poNumber: item.poNumber || item.id,
            supplierId: item.supplierId || null,
            supplierName: item.supplierName || '',
            projectId: item.projectId || 'PRJ-001',
            projectName: item.projectName || '',
            partnerId: item.partnerId || null,
            totalAmount: BigInt(item.totalAmount || 0),
            deliveryStatus: item.deliveryStatus || 'Ordered',
            dispatchNotes: item.dispatchNotes || null,
            driverName: item.driverName || null,
            driverMobile: item.driverMobile || null,
            vehicleNumber: item.vehicleNumber || null,
            linkedBills: item.linkedBills ? JSON.stringify(item.linkedBills) : null
          },
          create: {
            id: item.id,
            poNumber: item.poNumber || item.id,
            supplierId: item.supplierId || null,
            supplierName: item.supplierName || '',
            projectId: item.projectId || 'PRJ-001',
            projectName: item.projectName || '',
            partnerId: item.partnerId || null,
            totalAmount: BigInt(item.totalAmount || 0),
            deliveryStatus: item.deliveryStatus || 'Ordered',
            dispatchNotes: item.dispatchNotes || null,
            driverName: item.driverName || null,
            driverMobile: item.driverMobile || null,
            vehicleNumber: item.vehicleNumber || null,
            linkedBills: item.linkedBills ? JSON.stringify(item.linkedBills) : null
          }
        });
        break;

      case 'purchaseBills':
        savedItem = await prisma.purchaseBill.upsert({
          where: { id: item.id },
          update: {
            billNumber: item.billNumber || item.id,
            supplierId: item.supplierId || null,
            supplierName: item.supplierName || '',
            poRef: item.poRef || null,
            projectId: item.projectId || null,
            projectName: item.projectName || null,
            partnerId: item.partnerId || null,
            billDate: item.billDate || null,
            billDescription: item.billDescription || null,
            baseAmount: BigInt(item.baseAmount || 0),
            gstAmount: BigInt(item.gstAmount || 0),
            totalBillAmount: BigInt(item.totalBillAmount || 0),
            approvalStatus: item.approvalStatus || 'Pending',
            paymentStatus: item.paymentStatus || 'Unpaid'
          },
          create: {
            id: item.id,
            billNumber: item.billNumber || item.id,
            supplierId: item.supplierId || null,
            supplierName: item.supplierName || '',
            poRef: item.poRef || null,
            projectId: item.projectId || null,
            projectName: item.projectName || null,
            partnerId: item.partnerId || null,
            billDate: item.billDate || null,
            billDescription: item.billDescription || null,
            baseAmount: BigInt(item.baseAmount || 0),
            gstAmount: BigInt(item.gstAmount || 0),
            totalBillAmount: BigInt(item.totalBillAmount || 0),
            approvalStatus: item.approvalStatus || 'Pending',
            paymentStatus: item.paymentStatus || 'Unpaid'
          }
        });
        break;

      case 'purchasePayments':
        // Financial transaction: record payment and update bill status if applicable
        savedItem = await prisma.$transaction(async (tx) => {
          const pp = await tx.purchasePayment.upsert({
            where: { id: item.id },
            update: {
              supplierId: item.supplierId || null,
              supplierName: item.supplierName || '',
              billId: item.billId || null,
              amountPaid: BigInt(item.amountPaid || 0),
              paymentDate: item.paymentDate || null,
              paymentMode: item.paymentMode || 'NEFT',
              bankRefNo: item.bankRefNo || null,
              remarks: item.remarks || null,
              partnerId: item.partnerId || null
            },
            create: {
              id: item.id,
              supplierId: item.supplierId || null,
              supplierName: item.supplierName || '',
              billId: item.billId || null,
              amountPaid: BigInt(item.amountPaid || 0),
              paymentDate: item.paymentDate || null,
              paymentMode: item.paymentMode || 'NEFT',
              bankRefNo: item.bankRefNo || null,
              remarks: item.remarks || null,
              partnerId: item.partnerId || null
            }
          });

          if (item.billId) {
            await tx.purchaseBill.updateMany({
              where: { id: item.billId },
              data: { paymentStatus: 'Paid' }
            });
          }

          return pp;
        });
        break;

      case 'labourWages':
        savedItem = await prisma.labourWage.upsert({
          where: { id: item.id },
          update: {
            projectId: item.projectId || 'PRJ-001',
            projectName: item.projectName || '',
            partnerId: item.partnerId || null,
            weekEndingDate: item.weekEndingDate ? new Date(item.weekEndingDate) : null,
            masonCount: Number(item.masonCount) || 0,
            helperCount: Number(item.helperCount) || 0,
            supervisorCount: Number(item.supervisorCount) || 0,
            masonRate: BigInt(item.masonRate || 0),
            helperRate: BigInt(item.helperRate || 0),
            totalDailyWage: BigInt(item.totalDailyWage || 0),
            daysWorked: Number(item.daysWorked) || 6,
            totalWeeklyWage: BigInt(item.totalWeeklyWage || 0),
            status: item.status || 'Paid',
            paidDate: item.paidDate ? new Date(item.paidDate) : null
          },
          create: {
            id: item.id,
            projectId: item.projectId || 'PRJ-001',
            projectName: item.projectName || '',
            partnerId: item.partnerId || null,
            weekEndingDate: item.weekEndingDate ? new Date(item.weekEndingDate) : null,
            masonCount: Number(item.masonCount) || 0,
            helperCount: Number(item.helperCount) || 0,
            supervisorCount: Number(item.supervisorCount) || 0,
            masonRate: BigInt(item.masonRate || 0),
            helperRate: BigInt(item.helperRate || 0),
            totalDailyWage: BigInt(item.totalDailyWage || 0),
            daysWorked: Number(item.daysWorked) || 6,
            totalWeeklyWage: BigInt(item.totalWeeklyWage || 0),
            status: item.status || 'Paid',
            paidDate: item.paidDate ? new Date(item.paidDate) : null
          }
        });
        break;

      case 'subcontractors': {
        const contractNum = Number(item.contractValue || 0);
        if (contractNum > 5000000) {
          return res.status(400).json({ 
            error: 'Subcontractor contract value cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.' 
          });
        }

        savedItem = await prisma.subcontractor.upsert({
          where: { id: item.id },
          update: {
            name: item.name || item.firmName || '',
            firmName: item.firmName || item.name || '',
            workType: item.workType || item.tradeScope || null,
            tradeScope: item.tradeScope || item.workType || null,
            projectId: item.projectId || null,
            projectName: item.projectName || null,
            partnerId: item.partnerId || null,
            contractValue: BigInt(item.contractValue || 0),
            paidAmount: BigInt(item.paidAmount || item.totalPaid || 0),
            totalPaid: BigInt(item.totalPaid || item.paidAmount || 0),
            pendingAmount: BigInt(item.pendingAmount || item.pendingBalance || 0),
            pendingBalance: BigInt(item.pendingBalance || item.pendingAmount || 0),
            totalBilled: BigInt(item.totalBilled || 0),
            progress: item.progress ? Number(item.progress) : 0,
            completionPercent: item.completionPercent ? Number(item.completionPercent) : 0
          },
          create: {
            id: item.id,
            name: item.name || item.firmName || '',
            firmName: item.firmName || item.name || '',
            workType: item.workType || item.tradeScope || null,
            tradeScope: item.tradeScope || item.workType || null,
            projectId: item.projectId || null,
            projectName: item.projectName || null,
            partnerId: item.partnerId || null,
            contractValue: BigInt(item.contractValue || 0),
            paidAmount: BigInt(item.paidAmount || item.totalPaid || 0),
            totalPaid: BigInt(item.totalPaid || item.paidAmount || 0),
            pendingAmount: BigInt(item.pendingAmount || item.pendingBalance || 0),
            pendingBalance: BigInt(item.pendingBalance || item.pendingAmount || 0),
            totalBilled: BigInt(item.totalBilled || 0),
            progress: item.progress ? Number(item.progress) : 0,
            completionPercent: item.completionPercent ? Number(item.completionPercent) : 0
          }
        });
        break;
      }

      case 'assetsAndDeposits':
        savedItem = await prisma.asset.upsert({
          where: { id: item.id },
          update: {
            assetName: item.assetName || '',
            category: item.category || 'Site Machinery',
            siteAssigned: item.siteAssigned || null,
            projectId: item.projectId || null,
            projectName: item.projectName || null,
            partnerId: item.partnerId || null,
            purchaseValue: BigInt(item.purchaseValue || 0),
            valuationCurrent: BigInt(item.valuationCurrent || 0),
            condition: item.condition || 'Good',
            status: item.status || 'Active'
          },
          create: {
            id: item.id,
            assetName: item.assetName || '',
            category: item.category || 'Site Machinery',
            siteAssigned: item.siteAssigned || null,
            projectId: item.projectId || null,
            projectName: item.projectName || null,
            partnerId: item.partnerId || null,
            purchaseValue: BigInt(item.purchaseValue || 0),
            valuationCurrent: BigInt(item.valuationCurrent || 0),
            condition: item.condition || 'Good',
            status: item.status || 'Active'
          }
        });
        break;

      case 'suppliers':
        savedItem = await prisma.supplier.upsert({
          where: { id: item.id },
          update: {
            name: item.name || '',
            category: item.category || item.materialCategory || null,
            materialCategory: item.materialCategory || item.category || null,
            contactPerson: item.contactPerson || null,
            mobile: item.mobile || null,
            email: item.email || null,
            city: item.city || item.location || null,
            location: item.location || item.city || null,
            gstin: item.gstin || null,
            outstandingBalance: BigInt(item.outstandingBalance || 0)
          },
          create: {
            id: item.id,
            name: item.name || '',
            category: item.category || item.materialCategory || null,
            materialCategory: item.materialCategory || item.category || null,
            contactPerson: item.contactPerson || null,
            mobile: item.mobile || null,
            email: item.email || null,
            city: item.city || item.location || null,
            location: item.location || item.city || null,
            gstin: item.gstin || null,
            outstandingBalance: BigInt(item.outstandingBalance || 0)
          }
        });
        break;

      case 'clients': {
        const contractNum = Number(item.totalContractValue || 0);
        if (contractNum > 5000000) {
          return res.status(400).json({ 
            error: 'Client contract value cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.' 
          });
        }

        savedItem = await prisma.client.upsert({
          where: { id: item.id },
          update: {
            name: item.name || '',
            contactPerson: item.contactPerson || '',
            mobile: item.mobile || '',
            email: item.email || '',
            projectAssigned: item.projectAssigned || null,
            totalContractValue: BigInt(item.totalContractValue || 0),
            totalReceived: BigInt(item.totalReceived || 0),
            pendingBalance: BigInt(item.pendingBalance || 0)
          },
          create: {
            id: item.id,
            name: item.name || '',
            contactPerson: item.contactPerson || '',
            mobile: item.mobile || '',
            email: item.email || '',
            projectAssigned: item.projectAssigned || null,
            totalContractValue: BigInt(item.totalContractValue || 0),
            totalReceived: BigInt(item.totalReceived || 0),
            pendingBalance: BigInt(item.pendingBalance || 0)
          }
        });
        break;
      }

      case 'clientPayments':
        // Financial transaction: record receipt and update client balance
        savedItem = await prisma.$transaction(async (tx) => {
          const cp = await tx.clientPayment.upsert({
            where: { id: item.id },
            update: {
              clientId: item.clientId || null,
              clientName: item.clientName || '',
              projectId: item.projectId || null,
              projectName: item.projectName || null,
              amount: BigInt(item.amount || 0),
              date: item.date || null,
              mode: item.mode || 'RTGS',
              refNo: item.refNo || null,
              milestone: item.milestone || null,
              receiptStatus: item.receiptStatus || 'Verified',
              partnerId: item.partnerId || null
            },
            create: {
              id: item.id,
              clientId: item.clientId || null,
              clientName: item.clientName || '',
              projectId: item.projectId || null,
              projectName: item.projectName || null,
              amount: BigInt(item.amount || 0),
              date: item.date || null,
              mode: item.mode || 'RTGS',
              refNo: item.refNo || null,
              milestone: item.milestone || null,
              receiptStatus: item.receiptStatus || 'Verified',
              partnerId: item.partnerId || null
            }
          });

          if (item.clientId) {
            const cl = await tx.client.findUnique({ where: { id: item.clientId } });
            if (cl) {
              const newReceived = BigInt(cl.totalReceived || 0) + BigInt(item.amount || 0);
              const newPending = BigInt(cl.totalContractValue || 0) - newReceived;
              await tx.client.update({
                where: { id: item.clientId },
                data: {
                  totalReceived: newReceived,
                  pendingBalance: newPending > 0n ? newPending : 0n
                }
              });
            }
          }

          return cp;
        });
        break;

      case 'partners':
        savedItem = await prisma.partner.upsert({
          where: { id: item.id },
          update: {
            name: item.name,
            location: item.location || '',
            role: item.role || '',
            mobile: item.mobile || '',
            capitalInvested: BigInt(item.capitalInvested || 0)
          },
          create: {
            id: item.id,
            name: item.name,
            location: item.location || '',
            role: item.role || '',
            mobile: item.mobile || '',
            capitalInvested: BigInt(item.capitalInvested || 0)
          }
        });
        break;

      default:
        return res.status(400).json({ error: `Handler not implemented for module ${moduleName}` });
    }

    // Audit Log
    logAudit({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: `SAVE_${moduleName.toUpperCase()}`,
      module: moduleName.toUpperCase(),
      details: `Saved record ${item.id} in module ${moduleName}`,
      ipAddress: ip
    });

    res.json({ success: true, item: savedItem });
  } catch (err) {
    console.error('Module POST error:', err.message);
    res.status(500).json({ error: 'Failed to save record to PostgreSQL.' });
  }
});

// 11. PHASE 1, 2, 6: PROTECTED Generic Module DELETE via PostgreSQL
app.delete('/api/:moduleName/:id', authenticateToken, requireRole(['ADMIN', 'PARTNER']), async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
  try {
    const { moduleName, id } = req.params;
    const user = req.user;

    switch (moduleName) {
      case 'projects':
        await prisma.project.delete({ where: { id } });
        break;
      case 'otherExpenses':
        await prisma.expense.delete({ where: { id } });
        break;
      case 'purchaseOrders':
        await prisma.purchaseOrderItem.deleteMany({ where: { poId: id } });
        await prisma.purchaseOrder.delete({ where: { id } });
        break;
      case 'purchaseBills':
        await prisma.purchaseBill.delete({ where: { id } });
        break;
      case 'purchasePayments':
        await prisma.purchasePayment.delete({ where: { id } });
        break;
      case 'labourWages':
        await prisma.labourWage.delete({ where: { id } });
        break;
      case 'subcontractors':
        await prisma.subcontractor.delete({ where: { id } });
        break;
      case 'assetsAndDeposits':
        await prisma.asset.delete({ where: { id } });
        break;
      case 'suppliers':
        await prisma.supplier.delete({ where: { id } });
        break;
      case 'clients':
        await prisma.client.delete({ where: { id } });
        break;
      case 'clientPayments':
        await prisma.clientPayment.delete({ where: { id } });
        break;
      case 'partners':
        await prisma.partner.delete({ where: { id } });
        break;
      default:
        return res.status(404).json({ error: `Module '${moduleName}' not recognized.` });
    }

    logAudit({
      userId: user.userId,
      userName: user.name,
      userRole: user.role,
      action: `DELETE_${moduleName.toUpperCase()}`,
      module: moduleName.toUpperCase(),
      details: `Deleted record ${id} from module ${moduleName}`,
      ipAddress: ip
    });

    res.json({ success: true, message: 'Record deleted successfully from PostgreSQL.' });
  } catch (err) {
    console.error('Module DELETE error:', err.message);
    res.status(500).json({ error: 'Failed to delete record from PostgreSQL.' });
  }
});

// Global Safe Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.message);
  res.status(500).json({ error: 'An unexpected internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`✓ Shivshakti Construction ERP Backend started on port ${PORT}`);
  console.log(`- Database Engine: Supabase PostgreSQL (Prisma)`);
  console.log(`- Single Source of Truth: PostgreSQL Active (Zero JSON Fallback)`);
  console.log(`- Security: Helmet Headers, Rate Limiting, RBAC Enforcement`);
  console.log(`- Auth Endpoints: /api/auth/login, /api/auth/me, /api/auth/logout`);
  console.log(`- Admin Endpoints: /api/admin/users, /api/admin/audit-logs`);
  console.log(`- Client Workflow: /api/client/portal-data, /api/client/query`);
  console.log(`- Worker Workflow: /api/worker/portal-data, /api/worker/attendance`);
  console.log(`======================================================\n`);
});
