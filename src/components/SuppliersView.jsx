import React, { useState, useMemo } from 'react';
import { Briefcase, Plus, Download, Phone, MapPin, Edit3, Trash2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function SuppliersView({ data, onAddNew, onEdit, onDelete }) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [deleteTarget, setDeleteTarget] = useState(null);

  const moduleInfo = MODULE_DESCRIPTIONS.suppliers;
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const categories = useMemo(() => {
    const set = new Set(suppliers.map(s => s.category).filter(Boolean));
    return Array.from(set);
  }, [suppliers]);

  const columns = [
    {
      key: 'name',
      header: 'Supplier & GSTIN',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
            {val ? val.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">GST: {row.gstin || '—'}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Material Category',
      render: (val) => (
        <span className="badge badge-info text-[11px] font-medium uppercase tracking-wider">
          {val || 'General'}
        </span>
      )
    },
    {
      key: 'contactPerson',
      header: 'Contact Person & Mobile',
      render: (val, row) => (
        <div className="space-y-0.5">
          <span className="text-slate-800 font-medium text-xs block">{val || '—'}</span>
          <span className="inline-flex items-center space-x-1 text-slate-500 text-[11px] font-mono">
            <Phone className="w-2.5 h-2.5 text-slate-400" />
            <a href={`tel:${row.mobile}`} className="text-[#2563EB] hover:underline">
              {row.mobile || '—'}
            </a>
          </span>
        </div>
      )
    },
    {
      key: 'location',
      header: 'Depot Location',
      render: (val) => (
        <span className="text-xs text-slate-600 font-medium inline-flex items-center space-x-1">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{val || '—'}</span>
        </span>
      )
    },
    {
      key: 'outstandingBalance',
      header: 'Outstanding Balance',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            onClick={() => onEdit ? onEdit(row) : onAddNew('suppliers')}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Supplier"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Supplier"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={Briefcase}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Active Vendors: ${suppliers.length}`}
        actions={
          <div className="flex items-center space-x-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors ${
                  viewMode === 'cards' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={() => onAddNew('suppliers')}
              className="btn-primary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Supplier</span>
            </button>
          </div>
        }
      />

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={suppliers}
          searchPlaceholder="Search suppliers by name, GSTIN, contact, location..."
          filterKey="category"
          filterOptions={categories}
          filterLabel="All Categories"
          pageSize={10}
          exportFileName="Shivshakti_Suppliers_Directory.xlsx"
        />
      ) : (
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
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => onEdit ? onEdit(supplier) : onAddNew('suppliers')}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(supplier)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                  onClick={() => setDeleteTarget(supplier)}
                  className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Supplier Record"
        message={`Are you sure you want to remove supplier "${deleteTarget?.name}"? Outstanding ledger entries and historical purchase records may be affected.`}
        confirmLabel="Yes, Delete Supplier"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
