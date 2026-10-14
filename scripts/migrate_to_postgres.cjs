const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 MIGRATING SHIVSHAKTI ERP DATA TO POSTGRESQL (SUPABASE)');
  console.log('====================================================\n');

  const dbPath = path.join(__dirname, '..', 'server', 'database.json');
  if (!fs.existsSync(dbPath)) {
    throw new Error('Local database.json file not found at: ' + dbPath);
  }

  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // 1. Company Settings
  if (db.company) {
    console.log('📦 Migrating Company Profile...');
    await prisma.companySetting.upsert({
      where: { id: 'COMPANY-DEFAULT' },
      update: {
        name: db.company.name || 'Shivshakti Construction Management System',
        tagline: db.company.tagline || null,
        established: db.company.established || 2012,
        headquarters: db.company.headquarters || null,
        gstin: db.company.gstin || null,
        pan: db.company.pan || null,
        phone: db.company.contact?.phone || null,
        email: db.company.contact?.email || null,
        website: db.company.contact?.website || null
      },
      create: {
        id: 'COMPANY-DEFAULT',
        name: db.company.name || 'Shivshakti Construction Management System',
        tagline: db.company.tagline || null,
        established: db.company.established || 2012,
        headquarters: db.company.headquarters || null,
        gstin: db.company.gstin || null,
        pan: db.company.pan || null,
        phone: db.company.contact?.phone || null,
        email: db.company.contact?.email || null,
        website: db.company.contact?.website || null
      }
    });
    console.log('  ✓ Company settings migrated');
  }

  // 2. Partners
  console.log('📦 Migrating Partners...');
  for (const p of db.partners || []) {
    await prisma.partner.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        location: p.location,
        role: p.role,
        mobile: p.mobile,
        capitalInvested: BigInt(p.capitalInvested || 0)
      },
      create: {
        id: p.id,
        name: p.name,
        location: p.location,
        role: p.role,
        mobile: p.mobile,
        capitalInvested: BigInt(p.capitalInvested || 0)
      }
    });
  }
  console.log(`  ✓ ${db.partners?.length || 0} Partners migrated`);

  // 3. Clients
  console.log('📦 Migrating Clients...');
  for (const c of db.clients || []) {
    await prisma.client.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        contactPerson: c.contactPerson || '',
        mobile: c.mobile || '',
        email: c.email || '',
        projectAssigned: c.projectAssigned || null,
        totalContractValue: BigInt(c.totalContractValue || 0),
        totalReceived: BigInt(c.totalReceived || 0),
        pendingBalance: BigInt(c.pendingBalance || 0)
      },
      create: {
        id: c.id,
        name: c.name,
        contactPerson: c.contactPerson || '',
        mobile: c.mobile || '',
        email: c.email || '',
        projectAssigned: c.projectAssigned || null,
        totalContractValue: BigInt(c.totalContractValue || 0),
        totalReceived: BigInt(c.totalReceived || 0),
        pendingBalance: BigInt(c.pendingBalance || 0)
      }
    });
  }
  console.log(`  ✓ ${db.clients?.length || 0} Clients migrated`);

  // 4. Users
  console.log('📦 Migrating Users with Bcrypt Hashes...');
  for (const u of db.users || []) {
    let passwordHash = u.passwordHash;
    if (!passwordHash) {
      passwordHash = await bcrypt.hash('Shivshakti@2026', 10);
    }

    await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        name: u.name,
        role: u.role,
        phone: u.phone || null,
        partnerId: u.partnerId || null,
        clientId: u.clientId || null,
        assignedProject: u.assignedProject || null,
        location: u.location || null,
        title: u.title || null,
        status: u.status || 'ACTIVE',
        driverVehicleNo: u.driverVehicleNo || null
      },
      create: {
        id: u.id,
        email: u.email.toLowerCase(),
        passwordHash,
        name: u.name,
        role: u.role,
        phone: u.phone || null,
        partnerId: u.partnerId || null,
        clientId: u.clientId || null,
        assignedProject: u.assignedProject || null,
        location: u.location || null,
        title: u.title || null,
        status: u.status || 'ACTIVE',
        driverVehicleNo: u.driverVehicleNo || null
      }
    });
  }
  console.log(`  ✓ ${db.users?.length || 0} Users migrated with secure credentials`);

  // 5. Projects
  console.log('📦 Migrating Projects...');
  for (const p of db.projects || []) {
    await prisma.project.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        district: p.district || null,
        division: p.division || null,
        location: p.location,
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        clientName: p.clientName,
        budget: BigInt(p.budget || 0),
        actualCost: BigInt(p.actualCost || 0),
        status: p.status,
        completionPercent: p.completionPercent || 0,
        description: p.description || null
      },
      create: {
        id: p.id,
        name: p.name,
        district: p.district || null,
        division: p.division || null,
        location: p.location,
        partnerId: p.partnerId,
        partnerName: p.partnerName,
        clientName: p.clientName,
        budget: BigInt(p.budget || 0),
        actualCost: BigInt(p.actualCost || 0),
        status: p.status,
        completionPercent: p.completionPercent || 0,
        description: p.description || null
      }
    });
  }
  console.log(`  ✓ ${db.projects?.length || 0} Projects migrated`);

  // 6. Expenses
  console.log('📦 Migrating Expenses...');
  for (const exp of db.otherExpenses || []) {
    await prisma.expense.upsert({
      where: { id: exp.id },
      update: {
        projectId: exp.projectId,
        projectName: exp.projectName,
        category: exp.category,
        expenseTitle: exp.expenseTitle,
        amount: BigInt(exp.amount || 0),
        paidBy: exp.paidBy,
        receiptNo: exp.receiptNo || null,
        partnerId: exp.partnerId || null
      },
      create: {
        id: exp.id,
        projectId: exp.projectId,
        projectName: exp.projectName,
        category: exp.category,
        expenseTitle: exp.expenseTitle,
        amount: BigInt(exp.amount || 0),
        paidBy: exp.paidBy,
        receiptNo: exp.receiptNo || null,
        partnerId: exp.partnerId || null
      }
    });
  }
  console.log(`  ✓ ${db.otherExpenses?.length || 0} Expenses migrated`);

  // 7. Purchase Orders & Items
  console.log('📦 Migrating Purchase Orders...');
  for (const po of db.purchaseOrders || []) {
    await prisma.purchaseOrder.upsert({
      where: { id: po.id },
      update: {
        poNumber: po.poNumber,
        supplierId: po.supplierId || null,
        supplierName: po.supplierName,
        projectId: po.projectId,
        projectName: po.projectName,
        partnerId: po.partnerId || null,
        totalAmount: BigInt(po.totalAmount || 0),
        deliveryStatus: po.deliveryStatus,
        dispatchNotes: po.dispatchNotes || null,
        driverName: po.driverName || null,
        driverMobile: po.driverMobile || null,
        vehicleNumber: po.vehicleNumber || null,
        linkedBills: po.linkedBills ? JSON.stringify(po.linkedBills) : null
      },
      create: {
        id: po.id,
        poNumber: po.poNumber,
        supplierId: po.supplierId || null,
        supplierName: po.supplierName,
        projectId: po.projectId,
        projectName: po.projectName,
        partnerId: po.partnerId || null,
        totalAmount: BigInt(po.totalAmount || 0),
        deliveryStatus: po.deliveryStatus,
        dispatchNotes: po.dispatchNotes || null,
        driverName: po.driverName || null,
        driverMobile: po.driverMobile || null,
        vehicleNumber: po.vehicleNumber || null,
        linkedBills: po.linkedBills ? JSON.stringify(po.linkedBills) : null
      }
    });

    // PO Items
    for (let idx = 0; idx < (po.items || []).length; idx++) {
      const it = po.items[idx];
      const itemId = it.id || `${po.id}-IT-${idx + 1}`;
      await prisma.purchaseOrderItem.upsert({
        where: { id: itemId },
        update: {
          materialName: it.materialName || it.name || 'Material Item',
          description: it.description || null,
          quantity: it.quantity || 1,
          unit: it.unit || 'Nos',
          ratePerUnit: BigInt(it.ratePerUnit || it.rate || 0),
          totalAmount: BigInt(it.totalAmount || it.amount || 0),
          deliveryStatus: it.deliveryStatus || po.deliveryStatus
        },
        create: {
          id: itemId,
          poId: po.id,
          materialName: it.materialName || it.name || 'Material Item',
          description: it.description || null,
          quantity: it.quantity || 1,
          unit: it.unit || 'Nos',
          ratePerUnit: BigInt(it.ratePerUnit || it.rate || 0),
          totalAmount: BigInt(it.totalAmount || it.amount || 0),
          deliveryStatus: it.deliveryStatus || po.deliveryStatus
        }
      });
    }
  }
  console.log(`  ✓ ${db.purchaseOrders?.length || 0} Purchase Orders migrated`);

  // 8. Purchase Bills
  console.log('📦 Migrating Purchase Bills...');
  for (const pb of db.purchaseBills || []) {
    await prisma.purchaseBill.upsert({
      where: { id: pb.id },
      update: {
        billNumber: pb.billNumber,
        supplierId: pb.supplierId || null,
        supplierName: pb.supplierName,
        poRef: pb.poRef || null,
        projectId: pb.projectId || null,
        projectName: pb.projectName || null,
        partnerId: pb.partnerId || null,
        billDate: pb.billDate || null,
        billDescription: pb.billDescription || null,
        baseAmount: BigInt(pb.baseAmount || 0),
        gstAmount: BigInt(pb.gstAmount || 0),
        totalBillAmount: BigInt(pb.totalBillAmount || 0),
        approvalStatus: pb.approvalStatus || 'Pending',
        paymentStatus: pb.paymentStatus || 'Unpaid'
      },
      create: {
        id: pb.id,
        billNumber: pb.billNumber,
        supplierId: pb.supplierId || null,
        supplierName: pb.supplierName,
        poRef: pb.poRef || null,
        projectId: pb.projectId || null,
        projectName: pb.projectName || null,
        partnerId: pb.partnerId || null,
        billDate: pb.billDate || null,
        billDescription: pb.billDescription || null,
        baseAmount: BigInt(pb.baseAmount || 0),
        gstAmount: BigInt(pb.gstAmount || 0),
        totalBillAmount: BigInt(pb.totalBillAmount || 0),
        approvalStatus: pb.approvalStatus || 'Pending',
        paymentStatus: pb.paymentStatus || 'Unpaid'
      }
    });
  }
  console.log(`  ✓ ${db.purchaseBills?.length || 0} Purchase Bills migrated`);

  // 9. Purchase Payments
  console.log('📦 Migrating Purchase Payments...');
  for (const pp of db.purchasePayments || []) {
    await prisma.purchasePayment.upsert({
      where: { id: pp.id },
      update: {
        supplierId: pp.supplierId || null,
        supplierName: pp.supplierName,
        billId: pp.billId || null,
        amountPaid: BigInt(pp.amountPaid || 0),
        paymentDate: pp.paymentDate || null,
        paymentMode: pp.paymentMode || 'NEFT',
        bankRefNo: pp.bankRefNo || null,
        remarks: pp.remarks || null,
        partnerId: pp.partnerId || null
      },
      create: {
        id: pp.id,
        supplierId: pp.supplierId || null,
        supplierName: pp.supplierName,
        billId: pp.billId || null,
        amountPaid: BigInt(pp.amountPaid || 0),
        paymentDate: pp.paymentDate || null,
        paymentMode: pp.paymentMode || 'NEFT',
        bankRefNo: pp.bankRefNo || null,
        remarks: pp.remarks || null,
        partnerId: pp.partnerId || null
      }
    });
  }
  console.log(`  ✓ ${db.purchasePayments?.length || 0} Purchase Payments migrated`);

  // 10. Labour Wages
  console.log('📦 Migrating Labour Wages...');
  for (const lw of db.labourWages || []) {
    await prisma.labourWage.upsert({
      where: { id: lw.id },
      update: {
        projectId: lw.projectId,
        projectName: lw.projectName,
        partnerId: lw.partnerId || null,
        masonCount: lw.masonCount || 0,
        helperCount: lw.helperCount || 0,
        supervisorCount: lw.supervisorCount || 0,
        masonRate: BigInt(lw.masonRate || 0),
        helperRate: BigInt(lw.helperRate || 0),
        totalDailyWage: BigInt(lw.totalDailyWage || 0),
        daysWorked: lw.daysWorked || 6,
        totalWeeklyWage: BigInt(lw.totalWeeklyWage || 0),
        status: lw.status || 'Paid',
        paidDate: lw.paidDate ? new Date(lw.paidDate) : null
      },
      create: {
        id: lw.id,
        projectId: lw.projectId,
        projectName: lw.projectName,
        partnerId: lw.partnerId || null,
        masonCount: lw.masonCount || 0,
        helperCount: lw.helperCount || 0,
        supervisorCount: lw.supervisorCount || 0,
        masonRate: BigInt(lw.masonRate || 0),
        helperRate: BigInt(lw.helperRate || 0),
        totalDailyWage: BigInt(lw.totalDailyWage || 0),
        daysWorked: lw.daysWorked || 6,
        totalWeeklyWage: BigInt(lw.totalWeeklyWage || 0),
        status: lw.status || 'Paid',
        paidDate: lw.paidDate ? new Date(lw.paidDate) : null
      }
    });
  }
  console.log(`  ✓ ${db.labourWages?.length || 0} Labour Wages migrated`);

  // 11. Client Payments
  console.log('📦 Migrating Client Payments...');
  for (const cp of db.clientPayments || []) {
    await prisma.clientPayment.upsert({
      where: { id: cp.id },
      update: {
        clientId: cp.clientId || null,
        clientName: cp.clientName,
        projectId: cp.projectId || null,
        projectName: cp.projectName || null,
        amount: BigInt(cp.amount || 0),
        date: cp.date || null,
        mode: cp.mode || 'RTGS',
        refNo: cp.refNo || null,
        milestone: cp.milestone || null,
        receiptStatus: cp.receiptStatus || 'Verified',
        partnerId: cp.partnerId || null
      },
      create: {
        id: cp.id,
        clientId: cp.clientId || null,
        clientName: cp.clientName,
        projectId: cp.projectId || null,
        projectName: cp.projectName || null,
        amount: BigInt(cp.amount || 0),
        date: cp.date || null,
        mode: cp.mode || 'RTGS',
        refNo: cp.refNo || null,
        milestone: cp.milestone || null,
        receiptStatus: cp.receiptStatus || 'Verified',
        partnerId: cp.partnerId || null
      }
    });
  }
  console.log(`  ✓ ${db.clientPayments?.length || 0} Client Payments migrated`);

  // 12. Suppliers
  console.log('📦 Migrating Suppliers...');
  for (const s of db.suppliers || []) {
    await prisma.supplier.upsert({
      where: { id: s.id },
      update: {
        name: s.name,
        category: s.category || s.materialCategory || null,
        materialCategory: s.materialCategory || s.category || null,
        contactPerson: s.contactPerson || null,
        mobile: s.mobile || null,
        email: s.email || null,
        city: s.city || s.location || null,
        location: s.location || s.city || null,
        gstin: s.gstin || null,
        outstandingBalance: BigInt(s.outstandingBalance || 0)
      },
      create: {
        id: s.id,
        name: s.name,
        category: s.category || s.materialCategory || null,
        materialCategory: s.materialCategory || s.category || null,
        contactPerson: s.contactPerson || null,
        mobile: s.mobile || null,
        email: s.email || null,
        city: s.city || s.location || null,
        location: s.location || s.city || null,
        gstin: s.gstin || null,
        outstandingBalance: BigInt(s.outstandingBalance || 0)
      }
    });
  }
  console.log(`  ✓ ${db.suppliers?.length || 0} Suppliers migrated`);

  // 13. Subcontractors
  console.log('📦 Migrating Subcontractors...');
  for (const sc of db.subcontractors || []) {
    await prisma.subcontractor.upsert({
      where: { id: sc.id },
      update: {
        name: sc.name || sc.firmName || 'Subcontractor',
        firmName: sc.firmName || sc.name || 'Subcontractor',
        workType: sc.workType || sc.tradeScope || null,
        tradeScope: sc.tradeScope || sc.workType || null,
        projectId: sc.projectId || null,
        projectName: sc.projectName || null,
        partnerId: sc.partnerId || null,
        contractValue: BigInt(sc.contractValue || 0),
        paidAmount: BigInt(sc.paidAmount || sc.totalPaid || 0),
        totalPaid: BigInt(sc.totalPaid || sc.paidAmount || 0),
        pendingAmount: BigInt(sc.pendingAmount || sc.pendingBalance || 0),
        pendingBalance: BigInt(sc.pendingBalance || sc.pendingAmount || 0),
        totalBilled: BigInt(sc.totalBilled || 0),
        progress: sc.progress || sc.completionPercent || 0,
        completionPercent: sc.completionPercent || sc.progress || 0
      },
      create: {
        id: sc.id,
        name: sc.name || sc.firmName || 'Subcontractor',
        firmName: sc.firmName || sc.name || 'Subcontractor',
        workType: sc.workType || sc.tradeScope || null,
        tradeScope: sc.tradeScope || sc.workType || null,
        projectId: sc.projectId || null,
        projectName: sc.projectName || null,
        partnerId: sc.partnerId || null,
        contractValue: BigInt(sc.contractValue || 0),
        paidAmount: BigInt(sc.paidAmount || sc.totalPaid || 0),
        totalPaid: BigInt(sc.totalPaid || sc.paidAmount || 0),
        pendingAmount: BigInt(sc.pendingAmount || sc.pendingBalance || 0),
        pendingBalance: BigInt(sc.pendingBalance || sc.pendingAmount || 0),
        totalBilled: BigInt(sc.totalBilled || 0),
        progress: sc.progress || sc.completionPercent || 0,
        completionPercent: sc.completionPercent || sc.progress || 0
      }
    });
  }
  console.log(`  ✓ ${db.subcontractors?.length || 0} Subcontractors migrated`);

  // 14. Assets & Deposits
  console.log('📦 Migrating Assets...');
  for (const a of db.assetsAndDeposits || []) {
    await prisma.asset.upsert({
      where: { id: a.id },
      update: {
        assetName: a.assetName,
        category: a.category,
        siteAssigned: a.siteAssigned || null,
        projectId: a.projectId || null,
        projectName: a.projectName || null,
        partnerId: a.partnerId || null,
        purchaseValue: BigInt(a.purchaseValue || 0),
        valuationCurrent: BigInt(a.valuationCurrent || 0),
        condition: a.condition || 'Good',
        status: a.status || 'Active'
      },
      create: {
        id: a.id,
        assetName: a.assetName,
        category: a.category,
        siteAssigned: a.siteAssigned || null,
        projectId: a.projectId || null,
        projectName: a.projectName || null,
        partnerId: a.partnerId || null,
        purchaseValue: BigInt(a.purchaseValue || 0),
        valuationCurrent: BigInt(a.valuationCurrent || 0),
        condition: a.condition || 'Good',
        status: a.status || 'Active'
      }
    });
  }
  console.log(`  ✓ ${db.assetsAndDeposits?.length || 0} Assets migrated`);

  // 15. Vehicles
  console.log('📦 Migrating Vehicles...');
  for (const v of db.vehicles || []) {
    await prisma.vehicle.upsert({
      where: { vehicleNo: v.vehicleNo },
      update: {
        type: v.type,
        driverName: v.driverName || null,
        driverMobile: v.driverMobile || null,
        currentSite: v.currentSite || null,
        status: v.status || 'Active',
        fuelConsumptionMonthly: v.fuelConsumptionMonthly ? String(v.fuelConsumptionMonthly) : null
      },
      create: {
        id: v.id,
        vehicleNo: v.vehicleNo,
        type: v.type,
        driverName: v.driverName || null,
        driverMobile: v.driverMobile || null,
        currentSite: v.currentSite || null,
        status: v.status || 'Active',
        fuelConsumptionMonthly: v.fuelConsumptionMonthly ? String(v.fuelConsumptionMonthly) : null
      }
    });
  }
  console.log(`  ✓ ${db.vehicles?.length || 0} Vehicles migrated`);

  // 16. Audit Logs
  console.log('📦 Migrating Audit Logs...');
  for (const al of db.auditLogs || []) {
    await prisma.auditLog.upsert({
      where: { id: al.id },
      update: {
        userId: al.userId || 'SYSTEM',
        userName: al.userName || 'System',
        userRole: al.userRole || 'SYSTEM',
        action: al.action,
        module: al.module,
        details: al.details || '',
        ipAddress: al.ipAddress || '127.0.0.1'
      },
      create: {
        id: al.id,
        userId: al.userId || 'SYSTEM',
        userName: al.userName || 'System',
        userRole: al.userRole || 'SYSTEM',
        action: al.action,
        module: al.module,
        details: al.details || '',
        ipAddress: al.ipAddress || '127.0.0.1'
      }
    });
  }
  console.log(`  ✓ ${db.auditLogs?.length || 0} Audit Logs migrated`);

  // 17. Worker Tasks
  console.log('📦 Migrating Worker Tasks...');
  for (const wt of db.workerTasks || []) {
    await prisma.workerTask.upsert({
      where: { id: wt.id },
      update: {
        workerId: wt.workerId,
        workerName: wt.workerName || null,
        projectId: wt.projectId || null,
        projectName: wt.projectName || null,
        title: wt.title,
        description: wt.description || null,
        priority: wt.priority || 'NORMAL',
        status: wt.status || 'PENDING',
        dueDate: wt.dueDate || null
      },
      create: {
        id: wt.id,
        workerId: wt.workerId,
        workerName: wt.workerName || null,
        projectId: wt.projectId || null,
        projectName: wt.projectName || null,
        title: wt.title,
        description: wt.description || null,
        priority: wt.priority || 'NORMAL',
        status: wt.status || 'PENDING',
        dueDate: wt.dueDate || null
      }
    });
  }
  console.log(`  ✓ ${db.workerTasks?.length || 0} Worker Tasks migrated`);

  // 18. Client Queries
  console.log('📦 Migrating Client Queries...');
  for (const cq of db.clientQueries || []) {
    await prisma.clientQuery.upsert({
      where: { id: cq.id },
      update: {
        clientId: cq.clientId,
        clientName: cq.clientName,
        projectId: cq.projectId,
        projectName: cq.projectName || null,
        subject: cq.subject,
        message: cq.message,
        status: cq.status || 'SUBMITTED',
        reply: cq.reply || null
      },
      create: {
        id: cq.id,
        clientId: cq.clientId,
        clientName: cq.clientName,
        projectId: cq.projectId,
        projectName: cq.projectName || null,
        subject: cq.subject,
        message: cq.message,
        status: cq.status || 'SUBMITTED',
        reply: cq.reply || null
      }
    });
  }
  console.log(`  ✓ ${db.clientQueries?.length || 0} Client Queries migrated`);

  // 19. Worker Attendance
  console.log('📦 Migrating Worker Attendance...');
  for (const wa of db.workerAttendance || []) {
    await prisma.workerAttendance.upsert({
      where: { id: wa.id },
      update: {
        workerId: wa.workerId,
        workerName: wa.workerName,
        projectId: wa.projectId || null,
        projectName: wa.projectName || null,
        date: wa.date,
        punchInTime: wa.punchInTime,
        status: wa.status || 'PRESENT'
      },
      create: {
        id: wa.id,
        workerId: wa.workerId,
        workerName: wa.workerName,
        projectId: wa.projectId || null,
        projectName: wa.projectName || null,
        date: wa.date,
        punchInTime: wa.punchInTime,
        status: wa.status || 'PRESENT'
      }
    });
  }
  console.log(`  ✓ ${db.workerAttendance?.length || 0} Worker Attendance records migrated`);

  console.log('\n====================================================');
  console.log('🎉 ALL DATA SUCCESSFULLY MIGRATED TO POSTGRESQL!');
  console.log('====================================================\n');
}

runMigration()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
