import React, { useState } from 'react';
import { Building, CreditCard, Download, CheckCircle2, Clock, Upload, ArrowDownLeft, FileText, Send } from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';

export default function ClientPortalView({ user, data, onRecordClientPayment }) {
  const clientInfo = (data.clients || []).find(c => c.id === user.clientId) || data.clients[0];
  const clientPayments = (data.clientPayments || []).filter(cp => cp.clientId === clientInfo.id || cp.clientName === clientInfo.name);
  const clientProject = (data.projects || []).find(p => p.name === clientInfo.projectAssigned || p.clientName === clientInfo.name) || data.projects[0];

  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyAmount, setNotifyAmount] = useState('');
  const [notifyMode, setNotifyMode] = useState('RTGS');
  const [notifyRef, setNotifyRef] = useState('');
  const [notifyMilestone, setNotifyMilestone] = useState('');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const handleNotifySubmit = (e) => {
    e.preventDefault();
    const newPaymentObj = {
      id: `CP-${Date.now().toString().slice(-4)}`,
      clientId: clientInfo.id,
      clientName: clientInfo.name,
      projectId: clientProject.id,
      projectName: clientProject.name,
      amount: parseFloat(notifyAmount) || 0,
      date: new Date().toISOString().slice(0, 10),
      mode: notifyMode,
      refNo: notifyRef,
      milestone: notifyMilestone || 'Milestone Payment Submission',
      receiptStatus: 'Verified'
    };

    onRecordClientPayment('clientPayments', newPaymentObj);
    setShowNotifyModal(false);
    alert('Payment notification sent successfully to Shivshakti Construction partner dashboard!');
  };

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-info text-[10px] font-semibold uppercase tracking-wider">
                Client Corporate Portal
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {clientInfo.id}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{clientInfo.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Project Site: <strong className="text-slate-800 font-semibold">{clientInfo.projectAssigned}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowNotifyModal(true)}
          className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Notify New Bank Transfer</span>
        </button>
      </div>

      {/* Contract Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Contract Value</span>
          <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{formatCurrency(clientInfo.totalContractValue)}</p>
          <p className="text-xs text-slate-400">Sanctioned Project Budget</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Payments Paid to Date</span>
          <p className="text-2xl font-bold text-emerald-600 tracking-tight tabular-nums">{formatCurrency(clientInfo.totalReceived)}</p>
          <p className="text-xs text-emerald-600/80 font-medium">Verified Receipts</p>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Balance</span>
          <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{formatCurrency(clientInfo.pendingBalance)}</p>
          <p className="text-xs text-slate-400">Due upon next milestone</p>
        </div>
      </div>

      {/* Project Construction Progress Bar */}
      {clientProject && (
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Building className="w-4 h-4 text-[#2563EB]" />
                <span>Construction Site Progress: {clientProject.name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">{clientProject.location} • Partner In-Charge: {clientProject.partnerName}</p>
            </div>
            <span className="badge badge-info text-xs font-semibold">
              {clientProject.completionPercent}% Completed
            </span>
          </div>

          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#2563EB] h-full rounded-full transition-all duration-700" 
              style={{ width: `${clientProject.completionPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Payment Receipts History */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-[#2563EB]" />
            <span>Verified Payment Receipts & Milestone History</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Receipt Ref & Date</th>
                <th>Milestone Description</th>
                <th>Amount (INR)</th>
                <th>Payment Mode</th>
                <th>Bank UTR Ref</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {clientPayments.map((cp) => (
                <tr key={cp.id}>
                  <td>
                    <div>
                      <span className="font-bold text-slate-900 font-mono text-xs">{cp.id}</span>
                      <span className="block text-[11px] text-slate-400 mt-0.5">{cp.date}</span>
                    </div>
                  </td>
                  <td className="text-slate-800 font-medium">{cp.milestone}</td>
                  <td className="font-bold text-emerald-600 text-sm tabular-nums">{formatCurrency(cp.amount)}</td>
                  <td>
                    <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold">
                      {cp.mode}
                    </span>
                  </td>
                  <td className="font-mono text-xs text-slate-600">{cp.refNo}</td>
                  <td>
                    <span className="badge badge-success flex items-center space-x-1 w-fit">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{cp.receiptStatus}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Transfer Notify Modal */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-[#2563EB]" />
                <span>Notify Payment Transfer</span>
              </h3>
              <button onClick={() => setShowNotifyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleNotifySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transfer Amount (INR)</label>
                <input
                  type="number"
                  required
                  value={notifyAmount}
                  onChange={(e) => setNotifyAmount(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Mode</label>
                  <select value={notifyMode} onChange={(e) => setNotifyMode(e.target.value)} className="form-select">
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">UTR / Ref Number</label>
                  <input
                    type="text"
                    required
                    value={notifyRef}
                    onChange={(e) => setNotifyRef(e.target.value)}
                    placeholder="HDFCR52026..."
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Milestone Paid For</label>
                <input
                  type="text"
                  value={notifyMilestone}
                  onChange={(e) => setNotifyMilestone(e.target.value)}
                  placeholder="e.g. Slab 10 Completion Payment"
                  className="form-input"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-2 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Payment Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
