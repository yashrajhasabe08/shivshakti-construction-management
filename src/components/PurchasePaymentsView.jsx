import React, { useState, useMemo } from 'react';
import { Receipt, Plus, Download, Edit3, Trash2, ArrowUpRight } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function PurchasePaymentsView({ data, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const purchasePayments = data.purchasePayments || [];
  const moduleInfo = MODULE_DESCRIPTIONS.purchasePayments;

  const handleExport = () => {
    const exportData = purchasePayments.map(pp => ({
      'Payment Voucher ID': pp.id,
      'Supplier Name': pp.supplierName,
      'Bill ID Ref': pp.billId,
      'Amount Paid (INR)': pp.amountPaid,
      'Payment Date': pp.paymentDate,
      'Payment Mode': pp.paymentMode,
      'Bank Ref / UTR No': pp.bankRefNo,
      'Remarks': pp.remarks
    }));
    exportToExcel(exportData, 'Shivshakti_Purchase_Payments_Ledger.xlsx', 'Purchase Payments');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const totalPaid = purchasePayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);

  const paymentModes = useMemo(() => {
    const set = new Set(purchasePayments.map(p => p.paymentMode).filter(Boolean));
    return Array.from(set);
  }, [purchasePayments]);

  const columns = [
    {
      key: 'id',
      header: 'Voucher ID & Date',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 font-mono text-xs block">{val}</span>
          <span className="text-[11px] text-slate-400">{row.paymentDate}</span>
        </div>
      )
    },
    {
      key: 'supplierName',
      header: 'Supplier / Vendor',
      render: (val) => (
        <span className="font-bold text-slate-900 text-xs">{val}</span>
      )
    },
    {
      key: 'billId',
      header: 'Purchase Bill Ref',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-[#2563EB] bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100">
          {val || 'Direct Pymt'}
        </span>
      )
    },
    {
      key: 'amountPaid',
      header: 'Amount Paid',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs flex items-center justify-end space-x-1">
          <ArrowUpRight className="w-3 h-3 text-blue-600" />
          <span>{formatCurrency(val)}</span>
        </span>
      )
    },
    {
      key: 'paymentMode',
      header: 'Mode & Bank UTR',
      render: (val, row) => (
        <div className="text-xs">
          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono text-[10px] uppercase font-semibold">
            {val || 'RTGS'}
          </span>
          <span className="block text-[11px] font-mono text-slate-400 mt-0.5">{row.bankRefNo || '—'}</span>
        </div>
      )
    },
    {
      key: 'remarks',
      header: 'Remarks / Account Note',
      render: (val) => (
        <span className="text-xs text-slate-600 truncate max-w-xs block">{val || '—'}</span>
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
            onClick={() => onEdit ? onEdit(row) : onAddNew('purchasePayments')}
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
        icon={Receipt}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Total Paid: ${formatCurrency(totalPaid)}`}
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
              onClick={() => onAddNew('purchasePayments')}
              className="btn-primary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>Make Supplier Payment</span>
            </button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={purchasePayments}
        searchPlaceholder="Search payments by supplier, voucher ID, bill ref, UTR..."
        filterKey="paymentMode"
        filterOptions={paymentModes}
        filterLabel="All Payment Modes"
        pageSize={10}
        exportFileName="Shivshakti_Purchase_Payments_Ledger.xlsx"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Supplier Payment Voucher"
        message={`Are you sure you want to delete payment voucher "${deleteTarget?.id}" for ${deleteTarget?.supplierName} (${formatCurrency(deleteTarget?.amountPaid)})? Supplier account ledger balance will be reversed.`}
        confirmLabel="Yes, Delete Voucher"
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
