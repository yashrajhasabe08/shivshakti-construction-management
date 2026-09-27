import React from 'react';
import { Users, Plus, Download, Mail, Phone, Building } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function ClientsView({ data, onAddNew, onDelete }) {
  const clients = data.clients || [];

  const handleExport = () => {
    const exportData = clients.map(c => ({
      'Client ID': c.id,
      'Client Name': c.name,
      'Contact Person': c.contactPerson,
      'Mobile': c.mobile,
      'Email': c.email,
      'Assigned Project': c.projectAssigned,
      'Total Contract (INR)': c.totalContractValue,
      'Total Received (INR)': c.totalReceived,
      'Pending Balance (INR)': c.pendingBalance
    }));
    exportToExcel(exportData, 'Shivshakti_Clients_Directory.xlsx', 'Clients');
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Clients Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Corporate clients, contract valuations, and assigned project sites.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-2 text-xs font-medium"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Clients Excel</span>
          </button>
          <button
            onClick={() => onAddNew('clients')}
            className="btn-primary flex items-center gap-2 text-xs font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Client ID & Name</th>
                <th>Contact Person</th>
                <th>Assigned Site</th>
                <th>Contract Value</th>
                <th>Received</th>
                <th>Pending Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id}>
                  <td>
                    <div>
                      <span className="font-semibold text-slate-900">{client.name}</span>
                      <span className="block text-[10px] text-slate-400 font-mono">{client.id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="space-y-0.5">
                      <span className="text-slate-800 font-medium">{client.contactPerson}</span>
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.mobile}</span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-700 flex items-center space-x-1">
                      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{client.projectAssigned}</span>
                    </span>
                  </td>
                  <td className="font-semibold text-slate-900">{formatCurrency(client.totalContractValue)}</td>
                  <td className="font-medium text-emerald-600">{formatCurrency(client.totalReceived)}</td>
                  <td className="font-semibold text-slate-900">{formatCurrency(client.pendingBalance)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${client.email}`}
                        className="btn-secondary px-2.5 py-1 text-xs font-medium inline-flex items-center space-x-1"
                      >
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>Email</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => onDelete(client.id)}
                        className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
