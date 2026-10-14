import React, { useState } from 'react';
import { DollarSign, Plus, Download, Receipt, Calendar, User, Tag } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function ExpensesView({ data, selectedPartner, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);
  const moduleInfo = MODULE_DESCRIPTIONS.otherExpenses;

  const expenses = (data.otherExpenses || []).filter(e => {
    if (selectedPartner === 'ALL') return true;
    const proj = (data.projects || []).find(p => p.id === e.projectId);
    return proj && proj.partnerId === selectedPartner;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const totalExpenseSum = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const columns = [
    {
      key: 'id',
      header: 'Expense ID & Date',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 font-mono text-xs">{val}</span>
          <span className="block text-[11px] text-slate-400">{row.date || '—'}</span>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (val) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          {val || 'General'}
        </span>
      )
    },
    {
      key: 'expenseTitle',
      header: 'Expense Title / Description',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-800 text-xs block">{val || row.title}</span>
          {row.receiptNo && (
            <span className="text-[10px] text-slate-400 font-mono">Receipt: {row.receiptNo}</span>
          )}
        </div>
      )
    },
    {
      key: 'projectName',
      header: 'Project Site',
      render: (val) => (
        <span className="text-slate-700 font-medium text-xs">
          {val || 'General Operations'}
        </span>
      )
    },
    {
      key: 'paidBy',
      header: 'Paid By',
      render: (val) => (
        <span className="text-slate-600 text-xs">
          {val || 'Site Supervisor'}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'category',
      label: 'Category',
      options: [
        { value: 'ALL', label: 'All Categories' },
        ...Array.from(new Set(expenses.map(e => e.category).filter(Boolean))).map(cat => ({
          value: cat,
          label: cat
        }))
      ]
    },
    {
      key: 'projectName',
      label: 'Project Site',
      options: [
        { value: 'ALL', label: 'All Projects' },
        ...Array.from(new Set(expenses.map(e => e.projectName).filter(Boolean))).map(p => ({
          value: p,
          label: p
        }))
      ]
    }
  ];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete('otherExpenses', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={DollarSign}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Total Outlay: ${formatCurrency(totalExpenseSum)}`}
        actions={
          <button
            onClick={() => onAddNew('otherExpenses')}
            className="btn-primary flex items-center space-x-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Record Site Expense</span>
          </button>
        }
      />

      <DataTable
        data={expenses}
        columns={columns}
        searchKeys={['expenseTitle', 'id', 'category', 'projectName', 'paidBy', 'receiptNo']}
        searchPlaceholder="Search expense by title, category, project, voucher..."
        filters={filterOptions}
        onAddNew={() => onAddNew('otherExpenses')}
        addNewLabel="Record Site Expense"
        onEdit={(row) => onEdit('otherExpenses', row)}
        onDelete={(row) => setDeleteTarget(row)}
        exportFilename="Shivshakti_Site_Expenses.xlsx"
        exportSheetName="SiteExpenses"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Site Expense Record"
        message={`Are you sure you want to permanently delete expense record ${deleteTarget?.id} (${deleteTarget?.expenseTitle}) from PostgreSQL? This action cannot be undone.`}
        confirmLabel="Confirm Delete Expense"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
