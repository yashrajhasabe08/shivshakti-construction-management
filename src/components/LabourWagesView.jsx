import React from 'react';
import { HardHat, Plus, Download, Users, CheckCircle2, Calendar } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function LabourWagesView({ data, selectedPartner, onAddNew, onDelete }) {
  const wages = (data.labourWages || []).filter(lw => {
    if (selectedPartner === 'ALL') return true;
    const proj = (data.projects || []).find(p => p.id === lw.projectId);
    return proj && proj.partnerId === selectedPartner;
  });

  const handleExport = () => {
    const exportData = wages.map(lw => ({
      'Wages ID': lw.id,
      'Project Site': lw.projectName,
      'Week Ending Date': lw.weekEndingDate,
      'Mason Count': lw.masonCount,
      'Helper Count': lw.helperCount,
      'Supervisor Count': lw.supervisorCount,
      'Mason Daily Rate (INR)': lw.masonRate,
      'Helper Daily Rate (INR)': lw.helperRate,
      'Total Daily Wage (INR)': lw.totalDailyWage,
      'Days Worked': lw.daysWorked,
      'Total Weekly Payout (INR)': lw.totalWeeklyWage,
      'Status': lw.status
    }));
    exportToExcel(exportData, 'Shivshakti_Labour_Wages_Muster.xlsx', 'Labour Wages');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const totalWeeklyWageSum = wages.reduce((sum, lw) => sum + (lw.totalWeeklyWage || 0), 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <HardHat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-semibold text-slate-900">Labour Wages & Muster Roll</h2>
              <span className="badge badge-info">
                Total Payout: {formatCurrency(totalWeeklyWageSum)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily site worker count, daily rates, and weekly payout ledger for Masons & Helpers.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Wage Muster Excel</span>
          </button>
          <button
            onClick={() => onAddNew('labourWages')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Record Weekly Muster</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Wages ID & Site</th>
                <th>Week Ending Date</th>
                <th>Worker Attendance</th>
                <th>Daily Rates</th>
                <th>Daily Total</th>
                <th>Weekly Payout</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {wages.map((lw) => (
                <tr key={lw.id}>
                  <td>
                    <div>
                      <span className="font-medium text-slate-900">{lw.projectName}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{lw.id}</span>
                    </div>
                  </td>
                  <td className="text-xs text-slate-600 font-medium">{lw.weekEndingDate}</td>
                  <td>
                    <div className="text-xs space-y-0.5">
                      <span className="text-slate-900 font-medium">{lw.masonCount} Masons</span> +{' '}
                      <span className="text-slate-600">{lw.helperCount} Helpers</span>
                      <span className="block text-[10px] text-slate-400">({lw.supervisorCount} Supervisor)</span>
                    </div>
                  </td>
                  <td>
                    <div className="text-[11px] text-slate-500">
                      Mason: <span className="text-slate-800 font-medium">₹{lw.masonRate}</span>/day
                      <span className="block">Helper: <span className="text-slate-800 font-medium">₹{lw.helperRate}</span>/day</span>
                    </div>
                  </td>
                  <td className="font-medium text-slate-700">{formatCurrency(lw.totalDailyWage)}</td>
                  <td>
                    <div className="text-xs">
                      <span className="font-semibold text-slate-900 text-sm">{formatCurrency(lw.totalWeeklyWage)}</span>
                      <span className="block text-[10px] text-slate-400">For {lw.daysWorked} days</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${lw.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                      {lw.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => onDelete(lw.id)}
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
