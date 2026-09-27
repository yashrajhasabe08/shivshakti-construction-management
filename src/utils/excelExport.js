import * as XLSX from 'xlsx';

export const exportToExcel = (data, filename = 'Shivshakti_Report.xlsx', sheetName = 'Data') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-size columns width roughly
    const max_width = data.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(max_width).fill({ wch: 22 });

    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error("Excel Export Error:", error);
    alert("Failed to export Excel file. Please try again.");
  }
};

/**
 * Export a dedicated standalone Excel file for a single partner containing all their sites,
 * expenses, bills, labour wages, and client payments.
 */
export const exportPartnerWorkbook = (partnerId, fullData) => {
  try {
    const partner = (fullData.partners || []).find(p => p.id === partnerId) || {
      id: partnerId,
      name: partnerId,
      role: 'Partner',
      capitalInvested: 0
    };

    const partnerProjects = (fullData.projects || []).filter(p => p.partnerId === partnerId);
    const partnerProjIds = new Set(partnerProjects.map(p => p.id));
    const partnerProjNames = new Set(partnerProjects.map(p => p.name));

    const workbook = XLSX.utils.book_new();

    // 1. Partner Profile & Financial Summary Sheet
    const totalBudget = partnerProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = partnerProjects.reduce((sum, p) => sum + (p.actualCost || 0), 0);
    
    const partnerBills = (fullData.purchaseBills || []).filter(b => {
      const po = (fullData.purchaseOrders || []).find(o => o.poNumber === b.poRef || o.id === b.poRef);
      return po && partnerProjNames.has(po.projectName);
    });
    const billsTotal = partnerBills.reduce((sum, b) => sum + (b.totalBillAmount || 0), 0);

    const partnerWages = (fullData.labourWages || []).filter(w => partnerProjNames.has(w.projectName));
    const wagesTotal = partnerWages.reduce((sum, w) => sum + (w.totalWeeklyWage || 0), 0);

    const partnerSubs = (fullData.subcontractors || []).filter(s => partnerProjIds.has(s.projectId) || partnerProjNames.has(s.projectName));
    const subsTotal = partnerSubs.reduce((sum, s) => sum + (s.totalBilled || 0), 0);

    const partnerOtherExp = (fullData.otherExpenses || []).filter(e => partnerProjIds.has(e.projectId) || partnerProjNames.has(e.projectName));
    const otherExpTotal = partnerOtherExp.reduce((sum, e) => sum + (e.amount || 0), 0);

    const partnerClientPayments = (fullData.clientPayments || []).filter(cp => partnerProjNames.has(cp.projectName));
    const clientPaymentsTotal = partnerClientPayments.reduce((sum, cp) => sum + (cp.amount || 0), 0);

    const summaryRows = [
      { 'Metric': 'Partner Full Name', 'Value': partner.name },
      { 'Metric': 'Operational Role', 'Value': partner.role },
      { 'Metric': 'Base Location', 'Value': partner.location || 'Maharashtra' },
      { 'Metric': 'Capital Invested (INR)', 'Value': partner.capitalInvested },
      { 'Metric': 'Active Sites Count', 'Value': partnerProjects.length },
      { 'Metric': 'Total Sanctioned Budget (INR)', 'Value': totalBudget },
      { 'Metric': 'Total Actual Site Expenses (INR)', 'Value': totalSpent },
      { 'Metric': 'Material Purchase Bills (INR)', 'Value': billsTotal },
      { 'Metric': 'Labour Wages Incurred (INR)', 'Value': wagesTotal },
      { 'Metric': 'Subcontractor Billings (INR)', 'Value': subsTotal },
      { 'Metric': 'Site Petty Cash & Fuel (INR)', 'Value': otherExpTotal },
      { 'Metric': 'Client Collections Received (INR)', 'Value': clientPaymentsTotal },
      { 'Metric': 'Net Operating Surplus / (Deficit) (INR)', 'Value': clientPaymentsTotal - totalSpent }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Partner Financial Summary');

    // 2. Partner Sites Sheet
    if (partnerProjects.length > 0) {
      const sitesSheet = XLSX.utils.json_to_sheet(
        partnerProjects.map(p => ({
          'Site ID': p.id,
          'Site Name': p.name,
          'District': p.district || 'N/A',
          'Division / Taluka': p.division || 'N/A',
          'Location': p.location,
          'Client Name': p.clientName,
          'Sanctioned Budget (INR)': p.budget,
          'Actual Cost Spent (INR)': p.actualCost,
          'Start Date': p.startDate,
          'Target End Date': p.targetEndDate,
          'Status': p.status,
          'Completion %': `${p.completionPercent}%`
        }))
      );
      sitesSheet['!cols'] = Array(12).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(workbook, sitesSheet, 'Sites & Projects');
    }

    // 3. Consolidated Expenses Ledger
    const combinedLedger = [];
    partnerBills.forEach(b => {
      combinedLedger.push({
        'Date': b.billDate,
        'Type': 'Material Purchase Bill',
        'Bill / Voucher Ref': b.billNumber,
        'Payee / Vendor': b.supplierName,
        'Amount (INR)': b.totalBillAmount,
        'Approval Status': b.approvalStatus,
        'Payment Status': b.paymentStatus
      });
    });
    partnerWages.forEach(w => {
      combinedLedger.push({
        'Date': w.weekEndingDate,
        'Type': 'Labour Wage Muster',
        'Bill / Voucher Ref': w.id,
        'Payee / Vendor': `Masons (${w.masonCount}) & Helpers (${w.helperCount})`,
        'Amount (INR)': w.totalWeeklyWage,
        'Approval Status': 'Approved',
        'Payment Status': w.status
      });
    });
    partnerSubs.forEach(s => {
      combinedLedger.push({
        'Date': 'Current Cycle',
        'Type': 'Subcontractor Billing',
        'Bill / Voucher Ref': s.id,
        'Payee / Vendor': s.name,
        'Amount (INR)': s.totalBilled,
        'Approval Status': 'Verified',
        'Payment Status': `Paid: ${s.totalPaid} | Due: ${s.pendingBalance}`
      });
    });
    partnerOtherExp.forEach(e => {
      combinedLedger.push({
        'Date': e.date,
        'Type': e.category || 'Petty Cash',
        'Bill / Voucher Ref': e.receiptNo || e.id,
        'Payee / Vendor': e.paidBy,
        'Amount (INR)': e.amount,
        'Approval Status': 'Verified',
        'Payment Status': 'Settled'
      });
    });

    if (combinedLedger.length > 0) {
      const ledgerSheet = XLSX.utils.json_to_sheet(combinedLedger);
      ledgerSheet['!cols'] = Array(7).fill({ wch: 22 });
      XLSX.utils.book_append_sheet(workbook, ledgerSheet, 'Expenses Ledger');
    }

    // 4. Client Payments Received for this Partner's Sites
    if (partnerClientPayments.length > 0) {
      const clientSheet = XLSX.utils.json_to_sheet(
        partnerClientPayments.map(cp => ({
          'Receipt ID': cp.id,
          'Project Site': cp.projectName,
          'Client Name': cp.clientName,
          'Amount Received (INR)': cp.amount,
          'Date': cp.date,
          'Mode': cp.mode,
          'UTR / Reference': cp.refNo,
          'Milestone': cp.milestone,
          'Status': cp.receiptStatus
        }))
      );
      clientSheet['!cols'] = Array(9).fill({ wch: 22 });
      XLSX.utils.book_append_sheet(workbook, clientSheet, 'Client Receipts');
    }

    const safeName = partner.name.replace(/\s+/g, '_');
    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Shivshakti_${safeName}_Statement_${todayStr}.xlsx`);
  } catch (err) {
    console.error("Partner Workbook Export Error:", err);
    alert("Error generating partner Excel workbook.");
  }
};

/**
 * Export Master Workbook separated per owner/partner with individual sheets
 * per partner plus comparative summary.
 */
export const exportMasterWorkbook = (fullData) => {
  try {
    const workbook = XLSX.utils.book_new();
    const partners = fullData.partners || [];
    const projects = fullData.projects || [];
    const bills = fullData.purchaseBills || [];
    const pos = fullData.purchaseOrders || [];
    const wages = fullData.labourWages || [];
    const subs = fullData.subcontractors || [];
    const otherExp = fullData.otherExpenses || [];
    const clientPayments = fullData.clientPayments || [];

    // Sheet 1: 3-Partner Comparative Executive Summary
    const partnerSummaryRows = partners.map(p => {
      const pProjects = projects.filter(proj => proj.partnerId === p.id);
      const pBudget = pProjects.reduce((sum, proj) => sum + (proj.budget || 0), 0);
      const pSpent = pProjects.reduce((sum, proj) => sum + (proj.actualCost || 0), 0);
      const pNames = new Set(pProjects.map(proj => proj.name));

      const pInflows = clientPayments
        .filter(cp => pNames.has(cp.projectName))
        .reduce((sum, cp) => sum + (cp.amount || 0), 0);

      return {
        'Partner ID': p.id,
        'Partner Name': p.name,
        'Region / Role': p.role,
        'Capital Invested (INR)': p.capitalInvested,
        'Sites Managed Count': pProjects.length,
        'Total Allocated Budget (INR)': pBudget,
        'Total Actual Expenses (INR)': pSpent,
        'Client Inflows Collected (INR)': pInflows,
        'Net Operational Position (INR)': pInflows - pSpent
      };
    });

    const summarySheet = XLSX.utils.json_to_sheet(partnerSummaryRows);
    summarySheet['!cols'] = Array(9).fill({ wch: 24 });
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Partner P&L Overview');

    // For EACH of the 3 partners, generate dedicated separated sheets
    partners.forEach(partner => {
      const pProjects = projects.filter(proj => proj.partnerId === partner.id);
      const pProjNames = new Set(pProjects.map(proj => proj.name));
      const pProjIds = new Set(pProjects.map(proj => proj.id));

      // Partner Sites Sheet
      const pSitesRows = pProjects.map(p => ({
        'Site ID': p.id,
        'District': p.district || 'N/A',
        'Division': p.division || 'N/A',
        'Site Name': p.name,
        'Location': p.location,
        'Client Name': p.clientName,
        'Budget (INR)': p.budget,
        'Actual Spent (INR)': p.actualCost,
        'Completion %': `${p.completionPercent}%`,
        'Status': p.status,
        'Start Date': p.startDate,
        'Target End Date': p.targetEndDate
      }));

      const safeShortName = partner.name.split(' ')[0]; // e.g. "Rajesh", "Suresh", "Vikram"
      const sitesSheetName = `${safeShortName} - Sites`;
      const pSitesSheet = XLSX.utils.json_to_sheet(pSitesRows.length > 0 ? pSitesRows : [{ 'Notice': 'No active sites assigned' }]);
      pSitesSheet['!cols'] = Array(12).fill({ wch: 20 });
      XLSX.utils.book_append_sheet(workbook, pSitesSheet, sitesSheetName.slice(0, 31));

      // Partner Expenses Ledger Sheet
      const pLedgerRows = [];

      // Material bills
      bills.forEach(b => {
        const matchingPo = pos.find(o => o.poNumber === b.poRef || o.id === b.poRef);
        if (matchingPo && pProjNames.has(matchingPo.projectName)) {
          pLedgerRows.push({
            'Date': b.billDate,
            'Category': 'Materials & Bills',
            'Project Site': matchingPo.projectName,
            'Ref / Bill No': b.billNumber,
            'Payee / Item': b.supplierName,
            'Amount (INR)': b.totalBillAmount,
            'Status': b.paymentStatus
          });
        }
      });

      // Labour wages
      wages.forEach(w => {
        if (pProjNames.has(w.projectName)) {
          pLedgerRows.push({
            'Date': w.weekEndingDate,
            'Category': 'Labour Wages',
            'Project Site': w.projectName,
            'Ref / Bill No': w.id,
            'Payee / Item': `Masons (${w.masonCount}) & Helpers (${w.helperCount})`,
            'Amount (INR)': w.totalWeeklyWage,
            'Status': w.status
          });
        }
      });

      // Subcontractors
      subs.forEach(s => {
        if (pProjIds.has(s.projectId) || pProjNames.has(s.projectName)) {
          pLedgerRows.push({
            'Date': 'Ongoing Cycle',
            'Category': 'Subcontractor',
            'Project Site': s.projectName,
            'Ref / Bill No': s.id,
            'Payee / Item': `${s.name} (${s.workType})`,
            'Amount (INR)': s.totalBilled,
            'Status': `Paid: ${s.totalPaid} | Bal: ${s.pendingBalance}`
          });
        }
      });

      // Other / Petty expenses
      otherExp.forEach(e => {
        if (pProjIds.has(e.projectId) || pProjNames.has(e.projectName)) {
          pLedgerRows.push({
            'Date': e.date,
            'Category': e.category || 'Petty Cash',
            'Project Site': e.projectName,
            'Ref / Bill No': e.receiptNo || e.id,
            'Payee / Item': e.expenseTitle || e.paidBy,
            'Amount (INR)': e.amount,
            'Status': 'Settled'
          });
        }
      });

      const ledgerSheetName = `${safeShortName} - Expenses`;
      const pLedgerSheet = XLSX.utils.json_to_sheet(pLedgerRows.length > 0 ? pLedgerRows : [{ 'Notice': 'No expenses recorded yet' }]);
      pLedgerSheet['!cols'] = Array(7).fill({ wch: 22 });
      XLSX.utils.book_append_sheet(workbook, pLedgerSheet, ledgerSheetName.slice(0, 31));
    });

    // Reference Sheets: Suppliers & Assets
    if (fullData.suppliers) {
      const supSheet = XLSX.utils.json_to_sheet(
        fullData.suppliers.map(s => ({
          'Supplier ID': s.id,
          'Name': s.name,
          'Category': s.materialCategory,
          'Contact': s.contactPerson,
          'Mobile': s.mobile,
          'Total Billed': s.totalBilled,
          'Total Paid': s.totalPaid,
          'Pending Dues': s.pendingPayment
        }))
      );
      supSheet['!cols'] = Array(8).fill({ wch: 22 });
      XLSX.utils.book_append_sheet(workbook, supSheet, 'Suppliers Registry');
    }

    if (fullData.assetsAndDeposits) {
      const astSheet = XLSX.utils.json_to_sheet(
        fullData.assetsAndDeposits.map(a => ({
          'Asset ID': a.id,
          'Asset Name': a.assetName,
          'Category': a.category,
          'Site Location': a.siteAssigned,
          'Purchase / Deposit (INR)': a.purchaseValue,
          'Current Valuation (INR)': a.valuationCurrent,
          'Status': a.status
        }))
      );
      astSheet['!cols'] = Array(7).fill({ wch: 22 });
      XLSX.utils.book_append_sheet(workbook, astSheet, 'Machinery & Assets');
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Shivshakti_Master_Partner_Split_Ledger_${todayStr}.xlsx`);
  } catch (err) {
    console.error("Master Excel Export Error:", err);
    alert("Error building Master Excel Workbook.");
  }
};
