import React, { useState } from 'react';
import { HardHat, Plus, Download, Users, CheckCircle2, Calendar, Building } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function LabourWagesView({ data, selectedPartner, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const moduleInfo = MODULE_DESCRIPTIONS.labourWages;

  const wages = (data.labourWages || []).filter(lw => {
    if (selectedPartner === 'ALL') return true;
    const proj = (data.projects || []).find(p => p.id === lw.projectId);
    return proj && proj.partnerId === selectedPartner;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const totalWeeklyWageSum = wages.reduce((sum, lw) => sum + (lw.totalWeeklyWage || 0), 0);

  const columns = [
    {
      key: 'id',
      header: 'Muster ID & Date',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 font-mono text-xs block">{val}</span>
          <span className="text-[11px] text-slate-400">Week Ending: {row.weekEndingDate || '—'}</span>
        </div>
      )
    },
    {
      key: 'projectName',
      header: 'Project Site',
      render: (val) => (
        <span className="text-slate-800 font-medium text-xs inline-flex items-center space-x-1">
          <Building className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{val || 'General Site'}</span>
        </span>
      )
    },
    {
      key: 'headMason',
      header: 'Muster Gang / Head',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{val || 'Site Labor Gang'}</span>
          <span className="text-[10px] text-slate-400">{row.tradeType || 'Masonry & Helpers'}</span>
        </div>
      )
    },
    {
      key: 'workerCount',
      header: 'Workers',
      align: 'center',
      render: (val, row) => {
        const count = val || (Number(row.masonCount || 0) + Number(row.helperCount || 0)) || '—';
        return (
          <span className="px-2 py-0.5 rounded-full font-semibold text-xs bg-slate-100 text-slate-700">
            {count} Workers
          </span>
        );
      }
    },
    {
      key: 'totalWeeklyWage',
      header: 'Weekly Payout (₹)',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Disbursement',
      align: 'center',
      render: (val) => {
        const isPaid = val === 'Paid';
        return (
          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {val || 'Processing'}
          </span>
        );
      }
    }
  ];

  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'Paid', label: 'Paid' },
        { value: 'Pending', label: 'Pending' }
      ]
    },
    {
      key: 'projectName',
      label: 'Site',
      options: [
        { value: 'ALL', label: 'All Project Sites' },
        ...Array.from(new Set(wages.map(w => w.projectName).filter(Boolean))).map(s => ({
          value: s,
          label: s
        }))
      ]
    }
  ];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete('labourWages', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={HardHat}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Total Payout: ${formatCurrency(totalWeeklyWageSum)}`}
        actions={
          <button
            onClick={() => onAddNew('labourWages')}
            className="btn-primary flex items-center space-x-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Record Wage Muster</span>
          </button>
        }
      />

      <DataTable
        data={wages}
        columns={columns}
        searchKeys={['projectName', 'id', 'headMason', 'tradeType', 'status']}
        searchPlaceholder="Search wage muster by site, gang head, ID, status..."
        filters={filterOptions}
        onAddNew={() => onAddNew('labourWages')}
        addNewLabel="Record Wage Muster"
        onEdit={(row) => onEdit('labourWages', row)}
        onDelete={(row) => setDeleteTarget(row)}
        exportFilename="Shivshakti_Labour_Wages.xlsx"
        exportSheetName="LabourWages"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Labour Wage Record"
        message={`Are you sure you want to permanently delete wage muster record ${deleteTarget?.id} for ${deleteTarget?.projectName}? This will permanently remove the record from PostgreSQL.`}
        confirmLabel="Confirm Delete Muster"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
