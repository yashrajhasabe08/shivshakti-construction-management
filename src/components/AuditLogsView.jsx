import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, RefreshCw, Clock, Filter, Database, Shield } from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import { api } from '../services/api';

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const auditData = await api.getAuditLogs();
      setLogs(auditData || []);
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const columns = [
    {
      key: 'createdAt',
      header: 'Timestamp',
      render: (val) => {
        const d = val ? new Date(val) : new Date();
        return (
          <div className="space-y-0.5">
            <span className="font-semibold text-slate-800 block text-xs">
              {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-[10px] text-slate-400 font-mono flex items-center space-x-1">
              <Clock className="w-2.5 h-2.5 inline" />
              <span>{d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </span>
          </div>
        );
      }
    },
    {
      key: 'userName',
      header: 'Actor / User',
      render: (val, row) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{val || 'System'}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.userRole || 'ANONYMOUS'}</span>
        </div>
      )
    },
    {
      key: 'action',
      header: 'Action Performed',
      render: (val) => {
        let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
        if (val?.includes('DELETE')) badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
        if (val?.includes('CREATE') || val?.includes('SAVE')) badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (val?.includes('LOGIN') || val?.includes('AUTH')) badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

        return (
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider font-mono ${badgeColor}`}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'module',
      header: 'ERP Module',
      render: (val) => (
        <span className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
          {val || 'SYSTEM'}
        </span>
      )
    },
    {
      key: 'details',
      header: 'Operation Details',
      render: (val) => (
        <span className="text-slate-600 text-xs block max-w-md truncate" title={val}>
          {val}
        </span>
      )
    },
    {
      key: 'ipAddress',
      header: 'IP Address',
      align: 'right',
      render: (val) => (
        <span className="text-slate-400 text-[11px] font-mono">
          {val || '127.0.0.1'}
        </span>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'module',
      label: 'Module',
      options: [
        { value: 'ALL', label: 'All Modules' },
        ...Array.from(new Set(logs.map(l => l.module).filter(Boolean))).map(m => ({
          value: m,
          label: m
        }))
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={ShieldCheck}
        title="Security & System Audit Trails"
        subtitle="Immutable historical audit records stored in Supabase PostgreSQL."
        fullDescription="Every authentication attempt, user creation, role alteration, project budget update, and administrative deletion is cryptographically tracked with actor ID, timestamp, and IP address."
        badge={`Audit Events: ${logs.length}`}
        actions={
          <button
            onClick={loadLogs}
            className="btn-secondary flex items-center space-x-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit Logs</span>
          </button>
        }
      />

      <DataTable
        data={logs}
        columns={columns}
        searchKeys={['action', 'userName', 'module', 'details', 'ipAddress', 'userRole']}
        searchPlaceholder="Search audit trails by action, user, module, IP..."
        filters={filterOptions}
        isLoading={isLoading}
        exportFilename="Shivshakti_Audit_Trail_Report.xlsx"
        exportSheetName="AuditLogs"
      />
    </div>
  );
}
