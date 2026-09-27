import React from 'react';
import { Wrench, Plus, Download, ShieldCheck, Building } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function AssetsView({ data, onAddNew, onDelete }) {
  const assets = data.assetsAndDeposits || [];

  const handleExport = () => {
    const exportData = assets.map(a => ({
      'Asset ID': a.id,
      'Description': a.assetName,
      'Category': a.category,
      'Assigned Site': a.siteAssigned,
      'Purchase / Deposit Value (INR)': a.purchaseValue,
      'Current Valuation (INR)': a.valuationCurrent,
      'Condition': a.condition,
      'Status': a.status
    }));
    exportToExcel(exportData, 'Shivshakti_Assets_And_Deposits.xlsx', 'Assets & Deposits');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center text-[#2563EB]">
            <Wrench className="w-5 h-5 text-[#2563EB]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Assets, Machinery & Tender Security Deposits</h2>
            <p className="text-xs text-slate-500 mt-1">
              Hydraulic excavators, tower cranes, transit mixers, shuttering material & tender EMD bank deposits.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Assets Excel</span>
          </button>
          <button
            onClick={() => onAddNew('assetsAndDeposits')}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Asset / EMD</span>
          </button>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {assets.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200/80 hover:border-slate-300 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <span className="badge badge-info text-[11px] font-medium">
                  {item.category}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">{item.assetName}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1.5 mt-1">
                  <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Site: <strong className="text-slate-800 font-semibold">{item.siteAssigned}</strong></span>
                </p>
              </div>

              <span className={`badge ${
                item.status.includes('Operational') || item.status.includes('Active') ? 'badge-success' : 'badge-warning'
              }`}>
                {item.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-4 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Value / Deposit Amount:</span>
                <p className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(item.purchaseValue)}</p>
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Current Book Value:</span>
                <p className="text-sm font-bold text-[#2563EB] tabular-nums">{formatCurrency(item.valuationCurrent)}</p>
              </div>
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between pt-3 border-t border-slate-100">
              <span>Condition: <strong className="text-slate-800 font-medium">{item.condition}</strong></span>
              <span className="text-slate-400 font-mono text-[11px]">{item.id}</span>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="text-xs font-medium text-slate-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                Delete Asset
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
