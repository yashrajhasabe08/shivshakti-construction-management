const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'database.json');
const mockDataPath = path.join(__dirname, '..', 'src', 'data', 'mockData.js');

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('====================================================');
console.log('⚖️ NORMALIZING FINANCIAL DATA FOR COLLEGE ERP LIMIT');
console.log('   Maximum Individual Project Budget: ₹50,00,000');
console.log('====================================================\n');

// 1. Normalize Projects (All <= ₹50,00,000)
const projectUpdates = {
  'PRJ-001': { budget: 4500000, actualCost: 2850000, completionPercent: 65 },
  'PRJ-002': { budget: 4800000, actualCost: 3360000, completionPercent: 70 },
  'PRJ-003': { budget: 3200000, actualCost: 1520000, completionPercent: 48 },
  'PRJ-004': { budget: 2800000, actualCost: 2650000, completionPercent: 92 },
  'PRJ-KOL-01': { budget: 3800000, actualCost: 2280000, completionPercent: 60 },
  'PRJ-KOL-02': { budget: 4200000, actualCost: 2860000, completionPercent: 68 },
  'PRJ-KOL-03': { budget: 2500000, actualCost: 1450000, completionPercent: 55 }
};

(db.projects || []).forEach(p => {
  if (projectUpdates[p.id]) {
    Object.assign(p, projectUpdates[p.id]);
    console.log(`✓ Project ${p.id} (${p.name}): Budget = ₹${p.budget.toLocaleString('en-IN')}, Actual = ₹${p.actualCost.toLocaleString('en-IN')}`);
  }
});

// 2. Normalize Partners Capital
const partnerUpdates = {
  'P1': 4500000, // ₹45 Lakh
  'P2': 5000000, // ₹50 Lakh
  'P3': 3500000  // ₹35 Lakh
};

(db.partners || []).forEach(p => {
  if (partnerUpdates[p.id]) {
    p.capitalInvested = partnerUpdates[p.id];
    console.log(`✓ Partner ${p.id} (${p.name}): Capital = ₹${p.capitalInvested.toLocaleString('en-IN')}`);
  }
});

// 3. Normalize Clients & Contract Values (All <= ₹50,00,000)
const clientUpdates = {
  'CL-01': { totalContractValue: 4800000, totalReceived: 3200000, pendingBalance: 1600000 },
  'CL-02': { totalContractValue: 5000000, totalReceived: 3500000, pendingBalance: 1500000 },
  'CL-03': { totalContractValue: 3400000, totalReceived: 1800000, pendingBalance: 1600000 },
  'CL-04': { totalContractValue: 3000000, totalReceived: 2600000, pendingBalance: 400000 },
  'CL-05': { totalContractValue: 4000000, totalReceived: 2500000, pendingBalance: 1500000 }
};

(db.clients || []).forEach(c => {
  if (clientUpdates[c.id]) {
    Object.assign(c, clientUpdates[c.id]);
    console.log(`✓ Client ${c.id} (${c.name}): Contract = ₹${c.totalContractValue.toLocaleString('en-IN')}, Recv = ₹${c.totalReceived.toLocaleString('en-IN')}, Pend = ₹${c.pendingBalance.toLocaleString('en-IN')}`);
  }
});

// 4. Normalize Client Payments
const clientPaymentUpdates = {
  'CP-101': 1500000, // ₹15 Lakh
  'CP-102': 2000000, // ₹20 Lakh
  'CP-103': 800000,  // ₹8 Lakh
  'CP-104': 1000000, // ₹10 Lakh
  'CP-105': 1200000, // ₹12 Lakh
  'CP-01': 700000    // ₹7 Lakh
};

(db.clientPayments || []).forEach(cp => {
  if (clientPaymentUpdates[cp.id]) {
    cp.amount = clientPaymentUpdates[cp.id];
  }
});
console.log('✓ Client Payments normalized to scale');

// 5. Normalize Purchase Orders & PO Items
(db.purchaseOrders || []).forEach(po => {
  if (po.id === 'PO-2026-089') {
    po.totalAmount = 527500;
    po.items = [
      { id: `${po.id}-IT-1`, name: 'OPC 53 Grade Cement', materialName: 'OPC 53 Grade Cement', quantity: 200, unit: 'Bags', rate: 450, ratePerUnit: 450, amount: 90000, totalAmount: 90000, deliveryStatus: 'Delivered' },
      { id: `${po.id}-IT-2`, name: 'TMT Steel Bars (Primary)', materialName: 'TMT Steel Bars (Primary)', quantity: 5, unit: 'MT', rate: 55000, ratePerUnit: 55000, amount: 275000, totalAmount: 275000, deliveryStatus: 'Delivered' },
      { id: `${po.id}-IT-3`, name: 'Washed M-Sand', materialName: 'Washed M-Sand', quantity: 80, unit: 'Brass', rate: 1500, ratePerUnit: 1500, amount: 120000, totalAmount: 120000, deliveryStatus: 'Delivered' },
      { id: `${po.id}-IT-4`, name: 'Ready-Mix Concrete (M25)', materialName: 'Ready-Mix Concrete (M25)', quantity: 50, unit: 'Cum', rate: 850, ratePerUnit: 850, amount: 42500, totalAmount: 42500, deliveryStatus: 'Delivered' }
    ];
  } else if (po.id === 'PO-2026-090') {
    po.totalAmount = 290000;
    po.items = [
      { id: `${po.id}-IT-1`, name: 'TMT Steel Bars 16mm Fe550D', materialName: 'TMT Steel Bars 16mm Fe550D', quantity: 5, unit: 'MT', rate: 58000, ratePerUnit: 58000, amount: 290000, totalAmount: 290000, deliveryStatus: 'In-Transit' }
    ];
  } else if (po.id === 'PO-2026-091') {
    po.totalAmount = 189000;
  } else if (po.id === 'PO-2026-092') {
    po.totalAmount = 256000;
  } else if (po.id === 'PO-2026-093') {
    po.totalAmount = 146000;
  }
});
console.log('✓ Purchase Orders & Materials scaled to realistic project amounts');

// 6. Normalize Purchase Bills & Payments
const billUpdates = {
  'PB-BILL-045': { base: 150000, gst: 27000, total: 177000 },
  'PB-BILL-046': { base: 250000, gst: 45000, total: 295000 },
  'PB-BILL-047': { base: 200000, gst: 36000, total: 236000 },
  'PB-401': { base: 228000, gst: 41040, total: 269040 },
  'PB-402': { base: 290000, gst: 52200, total: 342200 },
  'PB-403': { base: 256000, gst: 12800, total: 268800 },
  'PB-404': { base: 146000, gst: 26280, total: 172280 },
  'PB-01': { base: 150000, gst: 27000, total: 177000 }
};

(db.purchaseBills || []).forEach(pb => {
  if (billUpdates[pb.id]) {
    pb.baseAmount = billUpdates[pb.id].base;
    pb.gstAmount = billUpdates[pb.id].gst;
    pb.totalBillAmount = billUpdates[pb.id].total;
  }
});

(db.purchasePayments || []).forEach(pp => {
  if (pp.id === 'PP-301') pp.amountPaid = 200000;
  if (pp.id === 'PP-302') pp.amountPaid = 268800;
  if (pp.id === 'PP-01') pp.amountPaid = 150000;
});
console.log('✓ Purchase Bills & Payments synchronized');

// 7. Normalize Subcontractors (Realistic trade values <= ₹5 Lakh)
const subcontractorUpdates = {
  'SUB-01': { contractValue: 320000, paidAmount: 180000, pendingAmount: 140000 },
  'SUB-02': { contractValue: 480000, paidAmount: 250000, pendingAmount: 230000 },
  'SUB-03': { contractValue: 280000, paidAmount: 120000, pendingAmount: 160000 },
  'SUB-04': { contractValue: 350000, paidAmount: 200000, pendingAmount: 150000 },
  'SUB-05': { contractValue: 240000, paidAmount: 120000, pendingAmount: 120000 }
};

(db.subcontractors || []).forEach(sc => {
  if (subcontractorUpdates[sc.id]) {
    sc.contractValue = subcontractorUpdates[sc.id].contractValue;
    sc.paidAmount = subcontractorUpdates[sc.id].paidAmount;
    sc.totalPaid = subcontractorUpdates[sc.id].paidAmount;
    sc.pendingAmount = subcontractorUpdates[sc.id].pendingAmount;
    sc.pendingBalance = subcontractorUpdates[sc.id].pendingAmount;
    sc.totalBilled = subcontractorUpdates[sc.id].contractValue;
  }
});
console.log('✓ Subcontractor contracts scaled to realistic trade sizes');

// 8. Normalize Assets & Deposits
const assetUpdates = {
  'AST-101': { purchaseValue: 1200000, valuationCurrent: 950000 },
  'AST-102': { purchaseValue: 850000, valuationCurrent: 680000 },
  'AST-103': { purchaseValue: 1400000, valuationCurrent: 1150000 },
  'DEP-201': { purchaseValue: 150000, valuationCurrent: 150000 },
  'DEP-202': { purchaseValue: 85000, valuationCurrent: 85000 }
};

(db.assetsAndDeposits || []).forEach(a => {
  if (assetUpdates[a.id]) {
    a.purchaseValue = assetUpdates[a.id].purchaseValue;
    a.valuationCurrent = assetUpdates[a.id].valuationCurrent;
  }
});
console.log('✓ Plant, machinery assets & EMD deposits normalized');

// 9. Normalize Suppliers Outstanding Balances
const supplierUpdates = {
  'SUP-01': 185000,
  'SUP-02': 240000,
  'SUP-03': 75000,
  'SUP-04': 115000,
  'SUP-05': 48000
};

(db.suppliers || []).forEach(s => {
  if (supplierUpdates[s.id] !== undefined) {
    s.outstandingBalance = supplierUpdates[s.id];
  }
});
console.log('✓ Supplier ledger balances normalized');

// 10. Normalize Users Capital
(db.users || []).forEach(u => {
  if (u.partnerId && partnerUpdates[u.partnerId]) {
    u.capitalInvested = partnerUpdates[u.partnerId];
  }
});

// Save to server/database.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log('\n✓ Saved normalized database to server/database.json');

// Save to src/data/mockData.js
fs.writeFileSync(mockDataPath, `export const initialData = ${JSON.stringify(db, null, 2)};\n`, 'utf8');
console.log('✓ Saved normalized initialData to src/data/mockData.js');
