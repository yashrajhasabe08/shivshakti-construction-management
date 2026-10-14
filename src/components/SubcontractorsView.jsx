import React, { useState, useMemo } from 'react';
import { Users, Plus, Download, Edit3, Trash2, Building, Wrench } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function SubcontractorsView({ data, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const subcontractors = data.subcontractors || [];
  const moduleInfo = MODULE_DESCRIPTIONS.subcontractors;

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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const workTypes = useMemo(() => {
    const set = new Set(subcontractors.map(s => s.workType).filter(Boolean));
    return Array.from(set);
  }, [subcontractors]);

  const columns = [
    {
      key: 'name',
      header: 'Contractor & Trade',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
            {val ? val.charAt(0).toUpperCase() : 'S'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      key: 'workType',
      header: 'Scope of Work',
      render: (val) => (
        <span className="badge badge-info text-[11px] font-medium">
          {val || 'General Subcontract'}
        </span>
      )
    },
    {
      key: 'projectName',
      header: 'Project Site',
      render: (val) => (
        <span className="text-xs text-slate-700 font-medium inline-flex items-center space-x-1">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val || '—'}</span>
        </span>
      )
    },
    {
      key: 'contractValue',
      header: 'Contract Value',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'completionPercent',
      header: 'Progress %',
      render: (val) => {
        const pct = val || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`} 
                style={{ width: `${Math.min(pct, 100)}%` }} 
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 font-mono">{pct}%</span>
          </div>
        );
      }
    },
    {
      key: 'totalBilled',
      header: 'Total Billed',
      align: 'right',
      render: (val) => (
        <span className="text-xs text-slate-600 font-mono">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'totalPaid',
      header: 'Paid Amount',
      align: 'right',
      render: (val) => (
        <span className="text-xs font-semibold text-emerald-600 font-mono">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'pendingBalance',
      header: 'Balance Due',
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
            onClick={() => onEdit ? onEdit(row) : onAddNew('subcontractors')}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Subcontractor"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Subcontractor"
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
        icon={Users}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`${subcontractors.length} Trade Contracts`}
        actions={
          <>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Subcontractors Excel</span>
            </button>
            <button
              onClick={() => onAddNew('subcontractors')}
              className="btn-primary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subcontractor</span>
            </button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={subcontractors}
        searchPlaceholder="Search by contractor name, scope of work, site..."
        filterKey="workType"
        filterOptions={workTypes}
        filterLabel="All Work Trades"
        pageSize={10}
        exportFileName="Shivshakti_Subcontractors_Ledger.xlsx"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Subcontractor Contract"
        message={`Are you sure you want to delete subcontractor "${deleteTarget?.name}" (${deleteTarget?.workType})? Contract milestones and ledger history will be removed.`}
        confirmLabel="Yes, Delete Contract"
        isDestructive={true}
        onConfirm={() => {
          if (deleteTarget && onDelete) {
            onDelete(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
