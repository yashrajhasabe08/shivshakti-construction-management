import React from 'react';
import { Briefcase, Plus, Download, Phone, MapPin, FileCheck } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function SuppliersView({ data, onAddNew, onDelete }) {
  const suppliers = data.suppliers || [];

  const handleExport = () => {
    const exportData = suppliers.map(s => ({
      'Supplier ID': s.id,
      'Supplier Name': s.name,
      'Category': s.category,
      'Contact Person': s.contactPerson,
      'Mobile': s.mobile,
      'GSTIN': s.gstin,
      'Depot / Location': s.location,
      'Outstanding Balance (INR)': s.outstandingBalance
    }));
    exportToExcel(exportData, 'Shivshakti_Suppliers_Directory.xlsx', 'Suppliers');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Material Suppliers Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered vendors for Cement, TMT Steel, Aggregates, RMC Concrete & Electrical Hardware.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Suppliers Excel</span>
          </button>
          <button
            onClick={() => onAddNew('suppliers')}
            className="btn-primary flex items-center space-x-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white border border-slate-200/80 hover:border-blue-200 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md space-y-4 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="badge badge-info text-[10px] uppercase tracking-wider">
                    {supplier.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">{supplier.name}</h3>
                  <p className="text-xs font-mono text-slate-400">GST: {supplier.gstin}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Contact Person:</span>
                  <span className="font-medium text-slate-800">{supplier.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mobile:</span>
                  <a href={`tel:${supplier.mobile}`} className="font-medium text-[#2563EB] hover:underline">
                    {supplier.mobile}
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Depot Location:</span>
                  <span className="font-medium text-slate-700">{supplier.location}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-400 block text-[11px]">Outstanding Balance:</span>
                <span className="font-semibold text-slate-900 text-sm">{formatCurrency(supplier.outstandingBalance)}</span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(supplier.id)}
                className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
