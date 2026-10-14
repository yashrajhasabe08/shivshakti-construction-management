import React, { useState } from 'react';
import { FileText, Plus, Download, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function PurchaseBillsView({ data, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const purchaseBills = data.purchaseBills || [];
  const moduleInfo = MODULE_DESCRIPTIONS.purchaseBills;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const columns = [
    {
      key: 'billNumber',
      header: 'Invoice No & Date',
      render: (val, row) => (
        <div>
          <span className="font-bold text-slate-900 font-mono text-xs block">{val || row.id}</span>
          <span className="text-[11px] text-slate-400">{row.billDate || '—'}</span>
        </div>
      )
    },
    {
      key: 'poRef',
      header: 'Linked PO Ref',
      render: (val) => (
        <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          {val || 'Direct Bill'}
        </span>
      )
    },
    {
      key: 'supplierName',
      header: 'Supplier Vendor',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 text-xs block">{val}</span>
          <span className="text-[11px] text-slate-400">{row.billDescription || 'Material Supplies'}</span>
        </div>
      )
    },
    {
      key: 'baseAmount',
      header: 'Base (₹)',
      align: 'right',
      render: (val) => (
        <span className="font-mono text-slate-700 text-xs">{formatCurrency(val)}</span>
      )
    },
    {
      key: 'gstAmount',
      header: 'GST 18% (₹)',
      align: 'right',
      render: (val) => (
        <span className="font-mono text-slate-500 text-[11px]">{formatCurrency(val)}</span>
      )
    },
    {
      key: 'totalBillAmount',
      header: 'Total Bill (₹)',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'approvalStatus',
      header: 'Verification',
      align: 'center',
      render: (val) => {
        const isApproved = val === 'Approved';
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider inline-flex items-center space-x-1 ${
            isApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            {isApproved ? <CheckCircle2 className="w-2.5 h-2.5 mr-1" /> : <Clock className="w-2.5 h-2.5 mr-1" />}
            <span>{val || 'Under Review'}</span>
          </span>
        );
      }
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      align: 'center',
      render: (val) => {
        const isPaid = val === 'Paid';
        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${
            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {val || 'Pending'}
          </span>
        );
      }
    }
  ];

  const filterOptions = [
    {
      key: 'paymentStatus',
      label: 'Payment Status',
      options: [
        { value: 'ALL', label: 'All Payment Statuses' },
        { value: 'Paid', label: 'Paid' },
        { value: 'Pending', label: 'Pending' }
      ]
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      options: [
        { value: 'ALL', label: 'All Approval Statuses' },
        { value: 'Approved', label: 'Approved' },
        { value: 'Under Review', label: 'Under Review' },
        { value: 'Rejected', label: 'Rejected' }
      ]
    }
  ];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete('purchaseBills', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={FileText}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`${purchaseBills.length} Invoices Recorded`}
        actions={
          <button
            onClick={() => onAddNew('purchaseBills')}
            className="btn-primary flex items-center space-x-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Record Supplier Bill</span>
          </button>
        }
      />

      <DataTable
        data={purchaseBills}
        columns={columns}
        searchKeys={['billNumber', 'supplierName', 'poRef', 'id', 'billDescription']}
        searchPlaceholder="Search bill by invoice number, supplier, PO ref..."
        filters={filterOptions}
        onAddNew={() => onAddNew('purchaseBills')}
        addNewLabel="Record Supplier Bill"
        onEdit={(row) => onEdit('purchaseBills', row)}
        onDelete={(row) => setDeleteTarget(row)}
        exportFilename="Shivshakti_Purchase_Bills.xlsx"
        exportSheetName="PurchaseBills"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Purchase Bill"
        message={`Are you sure you want to permanently delete purchase invoice ${deleteTarget?.billNumber || deleteTarget?.id} from ${deleteTarget?.supplierName}? This record will be permanently deleted from PostgreSQL.`}
        confirmLabel="Confirm Delete Bill"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
