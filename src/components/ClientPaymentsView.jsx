import React, { useState, useMemo } from 'react';
import { CreditCard, Plus, Download, CheckCircle2, ArrowDownLeft, Edit3, Trash2, Building } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function ClientPaymentsView({ data, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const moduleInfo = MODULE_DESCRIPTIONS.clientPayments;
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
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const totalReceived = clientPayments.reduce((sum, cp) => sum + (cp.amount || 0), 0);

  const paymentModes = useMemo(() => {
    const set = new Set(clientPayments.map(cp => cp.mode).filter(Boolean));
    return Array.from(set);
  }, [clientPayments]);

  const columns = [
    {
      key: 'id',
      header: 'Receipt ID & Date',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 font-mono text-xs block">{val}</span>
          <span className="text-[11px] text-slate-400">{row.date}</span>
        </div>
      )
    },
    {
      key: 'clientName',
      header: 'Client Name',
      render: (val) => (
        <span className="font-bold text-slate-900 text-xs">{val}</span>
      )
    },
    {
      key: 'projectName',
      header: 'Project Site',
      render: (val) => (
        <span className="text-xs text-slate-700 font-medium inline-flex items-center space-x-1">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val || 'General Contract'}</span>
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount Received',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-emerald-600 font-mono text-xs flex items-center justify-end space-x-1">
          <ArrowDownLeft className="w-3 h-3 text-emerald-500" />
          <span>{formatCurrency(val)}</span>
        </span>
      )
    },
    {
      key: 'mode',
      header: 'Mode & UTR Ref',
      render: (val, row) => (
        <div className="text-xs">
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold">
            {val || 'NEFT'}
          </span>
          <span className="block text-[11px] font-mono text-slate-400 mt-0.5">{row.refNo || '—'}</span>
        </div>
      )
    },
    {
      key: 'milestone',
      header: 'Milestone Covered',
      render: (val) => (
        <span className="text-xs text-slate-600 truncate max-w-xs block">{val || 'Project Stage'}</span>
      )
    },
    {
      key: 'receiptStatus',
      header: 'Status',
      render: (val) => (
        <span className="badge badge-success flex items-center space-x-1 w-fit text-[11px]">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>{val || 'Verified'}</span>
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
            onClick={() => onEdit ? onEdit(row) : onAddNew('clientPayments')}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Payment"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Payment"
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
        icon={CreditCard}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Total Inflow: ${formatCurrency(totalReceived)}`}
        actions={
          <>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Payments Excel</span>
            </button>
            <button
              onClick={() => onAddNew('clientPayments')}
              className="btn-primary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Record Client Payment</span>
            </button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={clientPayments}
        searchPlaceholder="Search client payments by client, site, receipt ID, UTR..."
        filterKey="mode"
        filterOptions={paymentModes}
        filterLabel="All Payment Modes"
        pageSize={10}
        exportFileName="Shivshakti_Client_Payments_Ledger.xlsx"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Client Payment Voucher"
        message={`Are you sure you want to delete payment voucher "${deleteTarget?.id}" for ${deleteTarget?.clientName} (${formatCurrency(deleteTarget?.amount)})? Client receivables and financial accounts will be adjusted.`}
        confirmLabel="Yes, Delete Payment"
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
