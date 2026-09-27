import React from 'react';
import { CreditCard, Plus, Download, CheckCircle2, FileText, ArrowDownLeft } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function ClientPaymentsView({ data, onAddNew, onDelete }) {
  const clientPayments = data.clientPayments || [];

  const handleExport = () => {
    const exportData = clientPayments.map(cp => ({
      'Payment ID': cp.id,
      'Client Name': cp.clientName,
      'Project Site': cp.projectName,
      'Amount Received (INR)': cp.amount,
      'Date Received': cp.date,
      'Payment Mode': cp.mode,
      'Ref / UTR No': cp.refNo,
      'Construction Milestone': cp.milestone,
      'Receipt Status': cp.receiptStatus
    }));
    exportToExcel(exportData, 'Shivshakti_Client_Payments_Ledger.xlsx', 'Client Payments');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const totalReceived = clientPayments.reduce((sum, cp) => sum + (cp.amount || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-900">Client Payments & Incoming Funds</h2>
              <span className="badge badge-info">
                Total: {formatCurrency(totalReceived)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Incoming milestone payment receipts from client project contracts.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Payments Excel</span>
          </button>
          <button
            onClick={() => onAddNew('clientPayments')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Record Client Payment</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt ID & Date</th>
                <th>Client Name</th>
                <th>Project Site</th>
                <th>Amount (INR)</th>
                <th>Mode & UTR Ref</th>
                <th>Milestone Covered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientPayments.map((cp) => (
                <tr key={cp.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900 font-mono text-xs">{cp.id}</span>
                      <span className="block text-[11px] text-slate-400">{cp.date}</span>
                    </div>
                  </td>
                  <td className="font-medium text-slate-900">{cp.clientName}</td>
                  <td className="text-slate-600 font-medium">{cp.projectName}</td>
                  <td>
                    <span className="font-semibold text-slate-900 text-sm flex items-center space-x-1">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formatCurrency(cp.amount)}</span>
                    </span>
                  </td>
                  <td>
                    <div className="text-xs">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-medium">
                        {cp.mode}
                      </span>
                      <span className="block text-[11px] font-mono text-slate-400 mt-0.5">{cp.refNo}</span>
                    </div>
                  </td>
                  <td className="text-xs text-slate-500 max-w-xs">{cp.milestone}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-success flex items-center space-x-1 w-fit">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{cp.receiptStatus}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onDelete(cp.id)}
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
