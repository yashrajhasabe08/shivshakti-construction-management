import React from 'react';
import { FileText, Plus, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function PurchaseBillsView({ data, onAddNew, onDelete }) {
  const purchaseBills = data.purchaseBills || [];

  const handleExport = () => {
    const exportData = purchaseBills.map(pb => ({
      'Bill ID': pb.id,
      'Invoice Number': pb.billNumber,
      'Supplier Name': pb.supplierName,
      'PO Ref': pb.poRef,
      'Bill Date': pb.billDate,
      'Base Amount (INR)': pb.baseAmount,
      'GST Amount (INR)': pb.gstAmount,
      'Total Bill (INR)': pb.totalBillAmount,
      'Approval Status': pb.approvalStatus,
      'Payment Status': pb.paymentStatus
    }));
    exportToExcel(exportData, 'Shivshakti_Purchase_Bills.xlsx', 'Purchase Bills');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Purchase Bills (PB) & GST Invoices</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supplier tax invoices matched against Purchase Orders and material gate receipts.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Bills Excel</span>
          </button>
          <button
            onClick={() => onAddNew('purchaseBills')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Record Supplier Bill</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice No & Date</th>
                <th>Supplier Name</th>
                <th>PO Reference</th>
                <th>Base Amount</th>
                <th>GST Tax (18%)</th>
                <th>Total Payable</th>
                <th>Approval</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {purchaseBills.map((pb) => (
                <tr key={pb.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900 text-xs">{pb.billNumber}</span>
                      <span className="block text-[11px] text-slate-400">{pb.billDate}</span>
                    </div>
                  </td>
                  <td className="font-medium text-slate-900">{pb.supplierName}</td>
                  <td>
                    <span className="badge badge-info font-mono text-[11px]">
                      {pb.poRef}
                    </span>
                  </td>
                  <td className="text-slate-600 font-medium">{formatCurrency(pb.baseAmount)}</td>
                  <td className="text-slate-400 font-medium">{formatCurrency(pb.gstAmount)}</td>
                  <td className="font-semibold text-slate-900">{formatCurrency(pb.totalBillAmount)}</td>
                  <td>
                    <span className="badge badge-success flex items-center space-x-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>{pb.approvalStatus}</span>
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${
                        pb.paymentStatus === 'Paid' ? 'badge-success' : pb.paymentStatus === 'Partially Paid' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {pb.paymentStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(pb.id)}
                        className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
