import React, { useState, useMemo } from 'react';
import { Award, Users, Download, Plus, MapPin, Phone, Building, Briefcase } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';

export default function PartnersView({ data, onAddNew, onEdit, onDelete }) {
  const [deleteTarget, setDeleteTarget] = useState(null);

  const partners = data.partners || [];
  const projects = data.projects || [];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Enhance partner rows with project counts
  const partnerRows = useMemo(() => {
    return partners.map(p => {
      const assignedSites = projects.filter(proj => proj.partnerId === p.id);
      return {
        ...p,
        sitesCount: assignedSites.length,
        capitalFormatted: formatCurrency(p.capitalInvested)
      };
    });
  }, [partners, projects]);

  const columns = [
    {
      key: 'id',
      header: 'Partner ID & Name',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
            {row.id}
          </span>
          <div>
            <span className="font-bold text-slate-900 block">{row.name}</span>
            <span className="text-[11px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role & Scope',
      render: (val) => (
        <span className="text-slate-800 font-medium text-xs">
          {val || 'Executive Partner'}
        </span>
      )
    },
    {
      key: 'location',
      header: 'Base Location',
      render: (val) => (
        <span className="inline-flex items-center space-x-1 text-slate-600 font-medium text-xs">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>{val || 'Pune, MH'}</span>
        </span>
      )
    },
    {
      key: 'mobile',
      header: 'Contact Phone',
      render: (val) => (
        <span className="inline-flex items-center space-x-1 text-slate-600 text-xs font-mono">
          <Phone className="w-3 h-3 text-slate-400" />
          <span>{val || '—'}</span>
        </span>
      )
    },
    {
      key: 'sitesCount',
      header: 'Managed Sites',
      align: 'center',
      render: (val) => (
        <span className="px-2.5 py-1 rounded-full font-bold text-xs bg-blue-50 text-blue-700">
          {val} {val === 1 ? 'Site' : 'Sites'}
        </span>
      )
    },
    {
      key: 'capitalInvested',
      header: 'Capital Invested',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-sm">
          {formatCurrency(val)}
        </span>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'location',
      label: 'Location',
      options: [
        { value: 'ALL', label: 'All Locations' },
        ...Array.from(new Set(partners.map(p => p.location).filter(Boolean))).map(loc => ({
          value: loc,
          label: loc
        }))
      ]
    }
  ];

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      onDelete('partners', deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={Award}
        title="Business Partners & Capital Allocation"
        subtitle="Manage executive partners, operational oversight regions, and capital stakes."
        fullDescription="Authorized administrators can add, update capital investment limits, and maintain contact details for all Shivshakti Construction partners."
        badge={`Total Partners: ${partners.length}`}
        actions={
          <button
            onClick={() => onAddNew('partners')}
            className="btn-primary flex items-center space-x-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Add Partner</span>
          </button>
        }
      />

      <DataTable
        data={partnerRows}
        columns={columns}
        searchKeys={['name', 'id', 'location', 'role', 'mobile']}
        searchPlaceholder="Search partner by name, ID, location, or mobile..."
        filters={filterOptions}
        onAddNew={() => onAddNew('partners')}
        addNewLabel="Add Partner"
        onEdit={(row) => onEdit('partners', row)}
        onDelete={(row) => setDeleteTarget(row)}
        exportFilename="Shivshakti_Partners_Directory.xlsx"
        exportSheetName="Partners"
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Partner Record"
        message={`Are you sure you want to permanently remove partner ${deleteTarget?.name} (${deleteTarget?.id}) from PostgreSQL? This action cannot be reversed.`}
        confirmLabel="Confirm Delete Partner"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
