import express from 'express';

export function createValidationRouter(readDB) {
  const router = express.Router();

  // GET /api/validation/check
  router.get('/check', (req, res) => {
    try {
      const db = readDB();
      const partners = db.partners || [];
      const projects = db.projects || [];
      const otherExpenses = db.otherExpenses || [];
      const purchaseOrders = db.purchaseOrders || [];
      const purchaseBills = db.purchaseBills || [];
      const labourWages = db.labourWages || [];
      const subcontractors = db.subcontractors || [];
      const clientPayments = db.clientPayments || [];

      // Check missing partnerIds
      const missingPartnerIdRecords = [];
      const checkList = [
        { mod: 'otherExpenses', list: otherExpenses },
        { mod: 'purchaseOrders', list: purchaseOrders },
        { mod: 'purchaseBills', list: purchaseBills },
        { mod: 'labourWages', list: labourWages },
        { mod: 'subcontractors', list: subcontractors },
        { mod: 'clientPayments', list: clientPayments }
      ];

      checkList.forEach(({ mod, list }) => {
        list.forEach(item => {
          if (!item.partnerId) {
            missingPartnerIdRecords.push({ module: mod, id: item.id });
          }
        });
      });

      // Partner Financial Reconciliation
      const partnerBreakdown = partners.map(partner => {
        const pProjects = projects.filter(p => p.partnerId === partner.id);
        const pExpenses = otherExpenses.filter(e => e.partnerId === partner.id);
        const pPOs = purchaseOrders.filter(po => po.partnerId === partner.id);
        const pBills = purchaseBills.filter(pb => pb.partnerId === partner.id);
        const pWages = labourWages.filter(lw => lw.partnerId === partner.id);
        const pSubs = subcontractors.filter(sc => sc.partnerId === partner.id);
        const pReceipts = clientPayments.filter(cp => cp.partnerId === partner.id);

        const sumDirect = pExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
        const sumPOs = pPOs.reduce((s, po) => s + (Number(po.totalAmount) || 0), 0);
        const sumBills = pBills.reduce((s, pb) => s + (Number(pb.totalBillAmount) || 0), 0);
        const sumWages = pWages.reduce((s, lw) => s + (Number(lw.totalWeeklyWage) || 0), 0);
        const sumSubs = pSubs.reduce((s, sc) => s + (Number(sc.paidAmount) || 0), 0);
        const sumReceipts = pReceipts.reduce((s, cp) => s + (Number(cp.amount) || 0), 0);

        const totalOperationalOutflow = sumDirect + sumBills + sumWages + sumSubs;

        return {
          partnerId: partner.id,
          name: partner.name,
          location: partner.location,
          capitalInvested: Number(partner.capitalInvested),
          projectsCount: pProjects.length,
          totalDirectExpenses: sumDirect,
          totalPurchaseOrders: sumPOs,
          totalMaterialBills: sumBills,
          totalLabourWages: sumWages,
          totalSubcontractorsPaid: sumSubs,
          totalOperationalOutflow,
          totalClientReceipts: sumReceipts
        };
      });

      const isConsistent = missingPartnerIdRecords.length === 0;

      res.json({
        status: isConsistent ? 'CONSISTENT' : 'INCONSISTENCIES_FOUND',
        allRecordsTaggedWithPartner: isConsistent,
        missingPartnerIdCount: missingPartnerIdRecords.length,
        missingPartnerIdRecords,
        partners: partnerBreakdown,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
