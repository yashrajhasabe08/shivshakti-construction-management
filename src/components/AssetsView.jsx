import React, { useState, useMemo } from 'react';
import { Wrench, Plus, Download, ShieldCheck, Building, Edit3, Trash2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function AssetsView({ data, onAddNew, onEdit, onDelete }) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [deleteTarget, setDeleteTarget] = useState(null);

  const moduleInfo = MODULE_DESCRIPTIONS.assets;
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const categories = useMemo(() => {
    const set = new Set(assets.map(a => a.category).filter(Boolean));
    return Array.from(set);
  }, [assets]);

  const columns = [
    {
      key: 'assetName',
      header: 'Asset / Deposit & ID',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => (
        <span className="badge badge-info text-[11px] font-medium">
          {val || 'General Asset'}
        </span>
      )
    },
    {
      key: 'siteAssigned',
      header: 'Assigned Site',
      render: (val) => (
        <span className="text-xs text-slate-700 font-medium inline-flex items-center space-x-1">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val || 'Central Inventory'}</span>
        </span>
      )
    },
    {
      key: 'purchaseValue',
      header: 'Acquisition / Deposit',
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'valuationCurrent',
      header: 'Current Book Value',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-[#2563EB] font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'condition',
      header: 'Condition',
      render: (val) => (
        <span className="text-xs text-slate-600 font-medium">{val || 'Working'}</span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => {
        const isGood = val?.includes('Operational') || val?.includes('Active');
        return (
          <span className={`badge ${isGood ? 'badge-success' : 'badge-warning'}`}>
            {val || 'Operational'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            onClick={() => onEdit ? onEdit(row) : onAddNew('assetsAndDeposits')}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Asset"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Asset"
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
        icon={Wrench}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Total Assets: ${assets.length}`}
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
              onClick={() => onAddNew('assetsAndDeposits')}
              className="btn-primary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Register Asset / EMD</span>
            </button>
          </div>
        }
      />

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={assets}
          searchPlaceholder="Search assets by name, category, site, condition..."
          filterKey="category"
          filterOptions={categories}
          filterLabel="All Categories"
          pageSize={10}
          exportFileName="Shivshakti_Assets_And_Deposits.xlsx"
        />
      ) : (
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

                <div className="flex items-center space-x-2">
                  <span className={`badge ${
                    item.status?.includes('Operational') || item.status?.includes('Active') ? 'badge-success' : 'badge-warning'
                  }`}>
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit ? onEdit(item) : onAddNew('assetsAndDeposits')}
                    className="p-1 text-slate-400 hover:text-blue-600 rounded"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
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
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Registered Asset"
        message={`Are you sure you want to delete asset "${deleteTarget?.assetName}"? Asset tracking and balance sheets will be updated.`}
        confirmLabel="Yes, Delete Asset"
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
