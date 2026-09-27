const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'database.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));

console.log('=== DATA CONSISTENCY AUDIT ===');

const projectMap = {};
(db.projects || []).forEach(p => {
  projectMap[p.id] = p;
  projectMap[p.name] = p;
});

let missingPartnerId = 0;
const modulesToCheck = ['otherExpenses', 'purchaseOrders', 'purchaseBills', 'labourWages', 'subcontractors', 'clientPayments'];

modulesToCheck.forEach(mod => {
  const items = db[mod] || [];
  let modMissing = 0;
  items.forEach(item => {
    if (!item.partnerId) {
      modMissing++;
      missingPartnerId++;
      // Find matching project
      const proj = projectMap[item.projectId] || projectMap[item.projectName] || projectMap[item.siteAssigned];
      if (proj && proj.partnerId) {
        item.partnerId = proj.partnerId;
        if (!item.projectId) item.projectId = proj.id;
      }
    }
  });
  console.log(`Module [${mod}]: ${items.length} records, ${modMissing} missing partnerId.`);
});

console.log(`\nTotal records initially missing partnerId: ${missingPartnerId}`);

// Reconcile financial figures by partner
const partners = db.partners || [];
partners.forEach(partner => {
  const partnerProjects = (db.projects || []).filter(p => p.partnerId === partner.id);
  const partnerExpenses = (db.otherExpenses || []).filter(e => e.partnerId === partner.id);
  const partnerPOs = (db.purchaseOrders || []).filter(po => po.partnerId === partner.id);
  const partnerBills = (db.purchaseBills || []).filter(pb => pb.partnerId === partner.id);
  const partnerWages = (db.labourWages || []).filter(lw => lw.partnerId === partner.id);
  const partnerSubs = (db.subcontractors || []).filter(sc => sc.partnerId === partner.id);
  const partnerReceipts = (db.clientPayments || []).filter(cp => cp.partnerId === partner.id);

  const totalOtherExpenses = partnerExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalPOAmount = partnerPOs.reduce((s, po) => s + (Number(po.totalAmount) || 0), 0);
  const totalBillsAmount = partnerBills.reduce((s, pb) => s + (Number(pb.totalBillAmount) || 0), 0);
  const totalWagesAmount = partnerWages.reduce((s, lw) => s + (Number(lw.totalWeeklyWage) || 0), 0);
  const totalSubsPaid = partnerSubs.reduce((s, sc) => s + (Number(sc.paidAmount) || 0), 0);
  const totalReceipts = partnerReceipts.reduce((s, cp) => s + (Number(cp.amount) || 0), 0);

  const grandExpense = totalOtherExpenses + totalBillsAmount + totalWagesAmount + totalSubsPaid;

  console.log(`\nPartner ${partner.id} (${partner.name}):`);
  console.log(`  - Projects Count: ${partnerProjects.length}`);
  console.log(`  - Direct Expenses: ₹${totalOtherExpenses.toLocaleString('en-IN')}`);
  console.log(`  - Material Bills: ₹${totalBillsAmount.toLocaleString('en-IN')}`);
  console.log(`  - Labour Wages: ₹${totalWagesAmount.toLocaleString('en-IN')}`);
  console.log(`  - Subcontractors: ₹${totalSubsPaid.toLocaleString('en-IN')}`);
  console.log(`  - Total Operational Outflow: ₹${grandExpense.toLocaleString('en-IN')}`);
  console.log(`  - Total Client Collections: ₹${totalReceipts.toLocaleString('en-IN')}`);
});

console.log('\nAudit complete.');
