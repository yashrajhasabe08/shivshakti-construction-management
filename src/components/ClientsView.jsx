import React, { useState } from 'react';
import { Users, Plus, Download, Mail, Phone, Building, Edit3, Trash2 } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function ClientsView({ data, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const moduleInfo = MODULE_DESCRIPTIONS.clients;
  const clients = data.clients || [];
  const projects = data.projects || [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const columns = [
    {
      key: 'name',
      header: 'Client / Firm Name',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
            {val ? val.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      key: 'contactPerson',
      header: 'Contact Person & Phone',
      render: (val, row) => (
        <div className="space-y-0.5">
          <span className="text-slate-800 font-medium text-xs block">{val || '—'}</span>
          <span className="inline-flex items-center space-x-1 text-slate-500 text-[11px] font-mono">
            <Phone className="w-2.5 h-2.5 text-slate-400" />
            <span>{row.mobile || '—'}</span>
          </span>
        </div>
      )
    },
    {
      key: 'projectAssigned',
      header: 'Assigned Project Site',
      render: (val) => (
        <span className="text-xs font-medium text-slate-700 inline-flex items-center space-x-1.5">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{val || 'General Contract'}</span>
        </span>
      )
    },
    {
      key: 'totalContractValue',
      header: 'Contract Value',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'totalReceived',
      header: 'Total Received',
      align: 'right',
      render: (val) => (
        <span className="font-semibold text-emerald-600 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'pendingBalance',
      header: 'Pending Balance',
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
      key: 'projectAssigned',
      label: 'Assigned Site',
      options: [
        { value: 'ALL', label: 'All Project Sites' },
        ...projects.map(p => ({
          value: p.name,
          label: p.name
        }))
      ]
    }
  ];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete('clients', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={Users}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={`Total Clients: ${clients.length}`}
        actions={
          <button
            onClick={() => onAddNew('clients')}
            className="btn-primary flex items-center space-x-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        }
      />

      <DataTable
        data={clients}
        columns={columns}
        searchKeys={['name', 'id', 'contactPerson', 'mobile', 'email', 'projectAssigned']}
        searchPlaceholder="Search client by name, ID, contact person, or site..."
        filters={filterOptions}
        onAddNew={() => onAddNew('clients')}
        addNewLabel="Add New Client"
        onEdit={(row) => onEdit('clients', row)}
        onDelete={(row) => setDeleteTarget(row)}
        exportFilename="Shivshakti_Clients_Directory.xlsx"
        exportSheetName="Clients"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Client Record"
        message={`Are you sure you want to permanently delete client ${deleteTarget?.name} (${deleteTarget?.id}) from PostgreSQL? This action cannot be undone.`}
        confirmLabel="Confirm Delete Client"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
