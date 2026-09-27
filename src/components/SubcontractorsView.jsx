import React from 'react';
import { Users, Plus, Download, Wrench, Building } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function SubcontractorsView({ data, onAddNew }) {
  const subcontractors = data.subcontractors || [];

  const handleExport = () => {
    const exportData = subcontractors.map(s => ({
      'Subcontractor ID': s.id,
      'Contractor Name': s.name,
      'Work Type': s.workType,
      'Project Site': s.projectName,
      'Contract Value (INR)': s.contractValue,
      'Completion %': `${s.completionPercent}%`,
      'Total Billed (INR)': s.totalBilled,
      'Total Paid (INR)': s.totalPaid,
      'Pending Balance (INR)': s.pendingBalance
    }));
    exportToExcel(exportData, 'Shivshakti_Subcontractors_Ledger.xlsx', 'Subcontractors');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Subcontractors Ledger & Payouts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Work contracts for Plumbing, Electrical, Plastering, Steel Fabrication & Shuttering.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Subcontractors Excel</span>
          </button>
          <button
            onClick={() => onAddNew('subcontractors')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subcontractor</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Contractor & ID</th>
                <th>Work Category</th>
                <th>Project Site</th>
                <th>Contract Value</th>
                <th>Progress %</th>
                <th>Total Billed</th>
                <th>Paid Amount</th>
                <th>Balance Due</th>
              </tr>
            </thead>
            <tbody>
              {subcontractors.map((sub) => (
                <tr key={sub.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900">{sub.name}</span>
                      <span className="block text-[11px] text-slate-400 font-mono">{sub.id}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">{sub.workType}</span>
                  </td>
                  <td className="text-slate-600 font-medium">{sub.projectName}</td>
                  <td className="font-semibold text-slate-900">{formatCurrency(sub.contractValue)}</td>
                  <td>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${sub.completionPercent}%` }} />
                      </div>
                      <span className="text-xs font-medium text-slate-600">{sub.completionPercent}%</span>
                    </div>
                  </td>
                  <td className="text-slate-600 font-medium">{formatCurrency(sub.totalBilled)}</td>
                  <td className="font-medium text-emerald-600">{formatCurrency(sub.totalPaid)}</td>
                  <td className="font-semibold text-slate-900">{formatCurrency(sub.pendingBalance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
