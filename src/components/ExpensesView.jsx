import React from 'react';
import { DollarSign, Plus, Download, Receipt, Calendar, User } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function ExpensesView({ data, selectedPartner, onAddNew, onDelete }) {
  const expenses = (data.otherExpenses || []).filter(e => {
    if (selectedPartner === 'ALL') return true;
    const proj = (data.projects || []).find(p => p.id === e.projectId);
    return proj && proj.partnerId === selectedPartner;
  });

  const handleExport = () => {
    const exportData = expenses.map(e => ({
      'Expense ID': e.id,
      'Project Site': e.projectName,
      'Date': e.date,
      'Category': e.category,
      'Title / Description': e.expenseTitle,
      'Amount (INR)': e.amount,
      'Paid By Partner': e.paidBy,
      'Receipt No': e.receiptNo
    }));
    exportToExcel(exportData, 'Shivshakti_Site_Petty_Expenses.xlsx', 'Site Expenses');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Other Site Expenses & Petty Cash
                </h2>
                <span className="badge badge-info">
                  Total: {formatCurrency(totalExpenseSum)}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Fuel logs, municipal permit fees, worker refreshments, and site petty cash vouchers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Expenses Excel</span>
          </button>
          <button
            onClick={() => onAddNew('otherExpenses')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Record Site Expense</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Expense ID & Date</th>
                <th>Category</th>
                <th>Expense Title</th>
                <th>Project Site</th>
                <th>Amount (INR)</th>
                <th>Paid By</th>
                <th>Receipt / Voucher</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900 font-mono text-xs">{e.id}</span>
                      <span className="block text-[11px] text-slate-400">{e.date}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-warning">{e.category}</span>
                  </td>
                  <td className="font-medium text-slate-900">{e.expenseTitle}</td>
                  <td className="text-slate-600 font-medium">{e.projectName}</td>
                  <td className="font-semibold text-slate-900">{formatCurrency(e.amount)}</td>
                  <td className="text-slate-600 font-medium">{e.paidBy}</td>
                  <td>
                    <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {e.receiptNo || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onDelete(e.id)}
                      className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
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
