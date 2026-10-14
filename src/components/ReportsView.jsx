import React from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  Building, 
  CreditCard, 
  Truck, 
  Briefcase, 
  Receipt, 
  HardHat, 
  Wrench, 
  DollarSign, 
  Users,
  PieChart
} from 'lucide-react';
import { 
  exportMasterWorkbook, 
  exportPartnerWorkbook, 
  exportToExcel, 
  exportPartnerExpenseBreakdownReport,
  exportPurchaseOrdersWithMaterials 
} from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function ReportsView({ data }) {
  const moduleInfo = MODULE_DESCRIPTIONS.reports;

  const reportCards = [
    {
      id: 'partnerBreakdown',
      title: 'Partner Expense Breakdown Report (₹1.25 Crore Split)',
      desc: 'Complete dossier showing P1 (Rajesh), P2 (Suresh), P3 (Vikram) ₹1.25 Cr expenditure across 7 material categories (Cement, Steel, Sand, Concrete, Labour, Subcontractors, Utilities).',
      icon: PieChart,
      badge: 'Mentor Requirement',
      color: 'from-blue-600 to-indigo-500',
      action: () => exportPartnerExpenseBreakdownReport()
    },
    {
      id: 'poMaterials',
      title: 'PO Materials & Linked Bills Master Ledger',
      desc: 'Itemized material descriptions, quantities, units, rates, delivery percentages, and matched supplier bill references.',
      icon: Truck,
      badge: 'Feature 1 & 4',
      action: () => exportPurchaseOrdersWithMaterials(data.purchaseOrders || [], data.purchaseBills || [])
    },
    {
      id: 'master',
      title: 'Master ERP Executive Excel Workbook',
      desc: 'Complete multi-tab Excel workbook containing full accounting sheets for all 12 construction modules.',
      icon: FileSpreadsheet,
      badge: 'Master Excel',
      color: 'from-amber-600 to-amber-400',
      action: () => exportMasterWorkbook(data)
    },
    {
      id: 'projects',
      title: 'Projects & Sites Financial Report',
      desc: 'Sanctioned budgets vs actual costs, site locations, partner allocations, and completion percentages.',
      icon: Building,
      badge: 'Projects',
      action: () => {
        const rows = data.projects.map(p => ({
          'Project ID': p.id,
          'Project Name': p.name,
          'Location': p.location,
          'Partner': p.partnerName,
          'Client': p.clientName,
          'Budget (INR)': p.budget,
          'Actual Cost (INR)': p.actualCost,
          'Status': p.status,
          'Completion %': `${p.completionPercent}%`
        }));
        exportToExcel(rows, 'Shivshakti_Projects_Report.xlsx', 'Projects');
      }
    },
    {
      id: 'deliveries',
      title: 'Vehicle & Material Delivery Logs',
      desc: 'Driver names, mobile numbers, truck numbers, PO refs, dispatch statuses, and gate check-in notes.',
      icon: Truck,
      badge: 'Logistics',
      action: () => {
        const rows = (data.purchaseOrders || []).map(po => ({
          'PO Ref': po.poNumber,
          'Supplier': po.supplierName,
          'Site': po.projectName,
          'Driver Name': po.driverName,
          'Driver Mobile': po.driverMobile,
          'Vehicle No': po.vehicleNumber,
          'Delivery Status': po.deliveryStatus,
          'Dispatch Notes': po.dispatchNotes
        }));
        exportToExcel(rows, 'Shivshakti_Material_Delivery_Logs.xlsx', 'Delivery Logs');
      }
    },
    {
      id: 'clients',
      title: 'Client Billing & Payment Receivables',
      desc: 'Contract values, total payments received to date, UTR numbers, milestone progress, and balance due.',
      icon: CreditCard,
      badge: 'Receivables',
      action: () => {
        const rows = (data.clientPayments || []).map(cp => ({
          'Payment ID': cp.id,
          'Client': cp.clientName,
          'Project Site': cp.projectName,
          'Amount (INR)': cp.amount,
          'Date': cp.date,
          'Mode': cp.mode,
          'Milestone': cp.milestone,
          'Status': cp.receiptStatus
        }));
        exportToExcel(rows, 'Shivshakti_Client_Payments_Report.xlsx', 'Client Payments');
      }
    },
    {
      id: 'suppliers',
      title: 'Supplier Payables & Purchase Ledger',
      desc: 'Supplier tax invoices, GST amounts, PO matching, and outstanding payables ledger.',
      icon: Briefcase,
      badge: 'Payables',
      action: () => {
        const rows = (data.purchaseBills || []).map(pb => ({
          'Bill No': pb.billNumber,
          'Supplier': pb.supplierName,
          'PO Ref': pb.poRef,
          'Base Amount': pb.baseAmount,
          'GST Tax': pb.gstAmount,
          'Total Bill': pb.totalBillAmount,
          'Approval': pb.approvalStatus,
          'Payment': pb.paymentStatus
        }));
        exportToExcel(rows, 'Shivshakti_Supplier_Bills_Report.xlsx', 'Supplier Bills');
      }
    },
    {
      id: 'labour',
      title: 'Labour Wages Muster Roll Report',
      desc: 'Weekly worker attendance, mason vs helper counts, daily rates, and site payout breakdown.',
      icon: HardHat,
      badge: 'Labour',
      action: () => {
        const rows = (data.labourWages || []).map(lw => ({
          'Wages ID': lw.id,
          'Project Site': lw.projectName,
          'Week Ending': lw.weekEndingDate,
          'Masons': lw.masonCount,
          'Helpers': lw.helperCount,
          'Daily Total': lw.totalDailyWage,
          'Weekly Payout': lw.totalWeeklyWage,
          'Status': lw.status
        }));
        exportToExcel(rows, 'Shivshakti_Labour_Wages_Report.xlsx', 'Labour Wages');
      }
    },
    {
      id: 'assets',
      title: 'Machinery & Security Deposit Register',
      desc: 'Heavy excavators, cranes, shuttering assets, and tender EMD fixed deposit receipts.',
      icon: Wrench,
      badge: 'Assets',
      action: () => {
        const rows = (data.assetsAndDeposits || []).map(a => ({
          'Asset ID': a.id,
          'Name': a.assetName,
          'Category': a.category,
          'Site': a.siteAssigned,
          'Purchase/Deposit Value': a.purchaseValue,
          'Current Valuation': a.valuationCurrent,
          'Status': a.status
        }));
        exportToExcel(rows, 'Shivshakti_Assets_Report.xlsx', 'Assets');
      }
    },
    {
      id: 'expenses',
      title: 'Site Petty Cash & Fuel Expense Sheet',
      desc: 'Daily site expenses, diesel fuel logs, police NOC permits, and refreshments.',
      icon: DollarSign,
      badge: 'Petty Cash',
      action: () => {
        const rows = (data.otherExpenses || []).map(e => ({
          'Expense ID': e.id,
          'Project Site': e.projectName,
          'Date': e.date,
          'Category': e.category,
          'Title': e.expenseTitle,
          'Amount': e.amount,
          'Paid By': e.paidBy
        }));
        exportToExcel(rows, 'Shivshakti_Petty_Expenses_Report.xlsx', 'Site Expenses');
      }
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header Bar with Feature 3 Subtitle & Tooltip */}
      <ModuleHeader
        icon={BarChart3}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge="Excel Generation Suite"
        actions={
          <button
            onClick={() => exportMasterWorkbook(data)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Excel Workbook</span>
          </button>
        }
      />

      {/* Dedicated Partner-wise Statement Downloads (Requirement 3) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#2563EB]">
              <Users className="w-4 h-4 text-[#2563EB]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Partner-Specific Dossier & Statement Exports</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download separate, dedicated Excel workbooks containing each partner's managed sites, expenses, bills, and receipts.
              </p>
            </div>
          </div>
          <span className="badge badge-info text-[11px] font-medium">
            3 Partner Workbooks Available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {(data.partners || []).map((partner) => {
            const partnerProjects = (data.projects || []).filter(p => p.partnerId === partner.id);
            return (
              <div key={partner.id} className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#2563EB]">{partner.id}</span>
                    <span className="badge badge-neutral text-[10px]">{partnerProjects.length} Sites</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-2">{partner.name}</h4>
                  <p className="text-xs text-slate-500">{partner.role} &bull; {partner.location}</p>
                  <p className="text-xs font-semibold text-slate-800 mt-2">
                    Capital: ₹{Number(partner.capitalInvested || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <button
                  onClick={() => exportPartnerWorkbook(partner.id, data)}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 shadow-xs transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-white" />
                  <span>Download {partner.name.split(' ')[0]}'s Excel (.xlsx)</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid of Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportCards.map((card) => {
          const Icon = card.icon;
          const isMaster = card.id === 'master';

          return (
            <div 
              key={card.id} 
              className={`p-6 rounded-2xl space-y-4 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all ${
                isMaster 
                  ? 'bg-blue-50/30 border border-blue-200/90' 
                  : 'bg-white border border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isMaster 
                      ? 'bg-blue-100/70 border border-blue-200 text-[#2563EB]' 
                      : 'bg-slate-50 border border-slate-200/80 text-[#2563EB]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={isMaster ? 'badge badge-info text-[11px]' : 'badge badge-neutral text-[11px]'}>{card.badge}</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{card.desc}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  onClick={card.action}
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white w-full py-2.5 rounded-xl flex items-center justify-center space-x-2 text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Download `.xlsx` Report Sheet</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
