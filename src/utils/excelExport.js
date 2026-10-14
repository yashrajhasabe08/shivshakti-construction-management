import * as XLSX from 'xlsx';
import { 
  TOTAL_PROJECT_COST, 
  SITE_COST_DISTRIBUTION, 
  MATERIAL_COST_DISTRIBUTION, 
  PARTNER_COST_DISTRIBUTION,
  PARTNER_EXPENSE_BREAKDOWNS
} from '../data/costDistributionData';

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

/**
 * Feature 1 & Feature 4: Export Purchase Orders with Itemized Material Breakdown & Linked Bills
 */
export const exportPurchaseOrdersWithMaterials = (purchaseOrders = [], purchaseBills = []) => {
  try {
    const workbook = XLSX.utils.book_new();
    const rows = [];

    purchaseOrders.forEach(po => {
      const linked = (purchaseBills || []).filter(
        b => b.poRef === po.poNumber || b.poRef === po.id || (po.linkedBills && po.linkedBills.includes(b.billNumber))
      );
      const linkedBillNumbers = linked.map(b => b.billNumber).join(', ') || 'None';
      const billPaymentStatus = linked.map(b => `${b.billNumber} (${b.paymentStatus})`).join(', ') || 'N/A';

      if (po.items && po.items.length > 0) {
        po.items.forEach((item, idx) => {
          rows.push({
            'PO Number': po.poNumber,
            'Supplier Vendor': po.supplierName,
            'Project Site': po.projectName,
            'Order Date': po.orderDate,
            'Item #': idx + 1,
            'Material Name': item.name || item.materialName,
            'Description': item.description || 'Standard construction supply',
            'Quantity': item.quantity,
            'Unit': item.unit,
            'Rate Per Unit (INR)': item.rate || item.ratePerUnit,
            'Amount (INR)': item.amount || (item.quantity * (item.rate || item.ratePerUnit)),
            'Item Delivery Status': item.deliveryStatus || po.deliveryStatus,
            'Overall PO Status': po.deliveryStatus,
            'Linked Bill Refs': linkedBillNumbers,
            'Bill Status': billPaymentStatus,
            'Assigned Vehicle': po.vehicleNumber || 'N/A',
            'Driver Name': po.driverName || 'N/A',
            'Driver Mobile': po.driverMobile || 'N/A'
          });
        });
      } else {
        rows.push({
          'PO Number': po.poNumber,
          'Supplier Vendor': po.supplierName,
          'Project Site': po.projectName,
          'Order Date': po.orderDate,
          'Item #': 1,
          'Material Name': 'General Material Consignment',
          'Description': po.dispatchNotes || 'General delivery',
          'Quantity': 1,
          'Unit': 'Lot',
          'Rate Per Unit (INR)': po.totalAmount,
          'Amount (INR)': po.totalAmount,
          'Item Delivery Status': po.deliveryStatus,
          'Overall PO Status': po.deliveryStatus,
          'Linked Bill Refs': linkedBillNumbers,
          'Bill Status': billPaymentStatus,
          'Assigned Vehicle': po.vehicleNumber || 'N/A',
          'Driver Name': po.driverName || 'N/A',
          'Driver Mobile': po.driverMobile || 'N/A'
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = Array(18).fill({ wch: 22 });
    XLSX.utils.book_append_sheet(workbook, worksheet, 'PO Materials Breakdown');

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Shivshakti_Purchase_Orders_Material_Breakdown_${todayStr}.xlsx`);
  } catch (error) {
    console.error("PO Materials Export Error:", error);
    alert("Failed to export Purchase Orders with materials breakdown.");
  }
};

/**
 * Feature 2 (Addition): Partner Expense Breakdown Report (₹1.25 Crore Portfolio Split)
 * Exports the exact required dossier for Mentor / Professor approval.
 */
export const exportPartnerExpenseBreakdownReport = () => {
  try {
    const workbook = XLSX.utils.book_new();

    // 1. Grand Summary Sheet (1.25 Crore Split)
    const summaryRows = [
      ...SITE_COST_DISTRIBUTION.map(s => ({
        'Distribution Category': 'By Site',
        'Entity / Head': `${s.projectName} (${s.projectId})`,
        'Amount (INR)': s.amount,
        'Share %': `${s.percentage}%`
      })),
      { 'Distribution Category': 'By Site TOTAL', 'Entity / Head': 'Total Project Cost (All 3 Sites)', 'Amount (INR)': TOTAL_PROJECT_COST, 'Share %': '100%' },
      { 'Distribution Category': '', 'Entity / Head': '', 'Amount (INR)': '', 'Share %': '' },
      ...MATERIAL_COST_DISTRIBUTION.map(m => ({
        'Distribution Category': 'By Material Head',
        'Entity / Head': m.category,
        'Amount (INR)': m.amount,
        'Share %': `${m.percentage}%`
      })),
      { 'Distribution Category': 'By Material TOTAL', 'Entity / Head': 'Total Materials & Resources', 'Amount (INR)': TOTAL_PROJECT_COST, 'Share %': '100%' },
      { 'Distribution Category': '', 'Entity / Head': '', 'Amount (INR)': '', 'Share %': '' },
      ...PARTNER_COST_DISTRIBUTION.map(p => ({
        'Distribution Category': 'By Partner Share',
        'Entity / Head': `Partner ${p.partnerId} (${p.partnerName} - ${p.location})`,
        'Amount (INR)': p.amount,
        'Share %': `${p.percentage}%`
      })),
      { 'Distribution Category': 'By Partner TOTAL', 'Entity / Head': 'Total Partners Outlay', 'Amount (INR)': TOTAL_PROJECT_COST, 'Share %': '100%' }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Grand Portfolio Summary');

    // Helper to generate a sheet for a partner
    const makePartnerSheet = (partnerName, partnerId, capital, spent, breakdown) => {
      const pRows = [
        { 'Metric / Category': 'Partner ID', 'Value / Amount (INR)': partnerId, 'Share %': '' },
        { 'Metric / Category': 'Partner Name', 'Value / Amount (INR)': partnerName, 'Share %': '' },
        { 'Metric / Category': 'Capital Invested', 'Value / Amount (INR)': capital, 'Share %': '' },
        { 'Metric / Category': 'Total Spent', 'Value / Amount (INR)': spent, 'Share %': '' },
        { 'Metric / Category': 'Remaining Capital Budget', 'Value / Amount (INR)': capital - spent, 'Share %': '' },
        { 'Metric / Category': '--- EXPENSE BREAKDOWN ---', 'Value / Amount (INR)': '----------------', 'Share %': '------' },
        ...breakdown.map(b => ({
          'Metric / Category': b.category,
          'Value / Amount (INR)': b.amount,
          'Share %': `${b.percentage}%`
        })),
        { 'Metric / Category': 'TOTAL EXPENDITURE', 'Value / Amount (INR)': spent, 'Share %': '100%' }
      ];
      const sheet = XLSX.utils.json_to_sheet(pRows);
      sheet['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 12 }];
      return sheet;
    };

    // P1 Sheet
    const p1Data = PARTNER_EXPENSE_BREAKDOWNS.P1;
    XLSX.utils.book_append_sheet(workbook, makePartnerSheet(p1Data.partnerName, 'P1', p1Data.capitalInvested, p1Data.totalSpent, p1Data.breakdown), 'Partner P1 - Rajesh');

    // P2 Sheet
    const p2Data = PARTNER_EXPENSE_BREAKDOWNS.P2;
    XLSX.utils.book_append_sheet(workbook, makePartnerSheet(p2Data.partnerName, 'P2', p2Data.capitalInvested, p2Data.totalSpent, p2Data.breakdown), 'Partner P2 - Suresh');

    // P3 Sheet
    const p3Data = PARTNER_EXPENSE_BREAKDOWNS.P3;
    XLSX.utils.book_append_sheet(workbook, makePartnerSheet(p3Data.partnerName, 'P3', p3Data.capitalInvested, p3Data.totalSpent, p3Data.breakdown), 'Partner P3 - Vikram');

    // 5. Cross-Partner Comparison Matrix
    const categories = p1Data.breakdown.map(b => b.category);
    const matrixRows = categories.map((cat, i) => {
      const p1Amt = p1Data.breakdown[i]?.amount || 0;
      const p2Amt = p2Data.breakdown[i]?.amount || 0;
      const p3Amt = p3Data.breakdown[i]?.amount || 0;
      const total = p1Amt + p2Amt + p3Amt;
      const avgPct = ((total / TOTAL_PROJECT_COST) * 100).toFixed(1) + '%';
      return {
        'Expense Category': cat,
        'P1 Rajesh (INR)': p1Amt,
        'P2 Suresh (INR)': p2Amt,
        'P3 Vikram (INR)': p3Amt,
        'Total (INR)': total,
        '% Avg': avgPct
      };
    });

    matrixRows.push({
      'Expense Category': 'TOTAL SPENT',
      'P1 Rajesh (INR)': p1Data.totalSpent,
      'P2 Suresh (INR)': p2Data.totalSpent,
      'P3 Vikram (INR)': p3Data.totalSpent,
      'Total (INR)': TOTAL_PROJECT_COST,
      '% Avg': '100%'
    });

    const matrixSheet = XLSX.utils.json_to_sheet(matrixRows);
    matrixSheet['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(workbook, matrixSheet, '3 Partners Comparison');

    const todayStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `Shivshakti_Partner_Expense_Breakdown_Report_${todayStr}.xlsx`);
  } catch (error) {
    console.error("Partner Breakdown Export Error:", error);
    alert("Failed to export Partner Expense Breakdown Report.");
  }
};

