import React, { useState, useEffect } from 'react';
import { 
  Building, 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Clock, 
  Upload, 
  FileText, 
  Send,
  MessageSquare,
  AlertCircle,
  PhoneCall,
  Mail,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';

export default function ClientPortalView({ user, data, onRecordClientPayment }) {
  const [portalData, setPortalData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'milestones' | 'payments' | 'documents' | 'queries'
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showQueryModal, setShowQueryModal] = useState(false);

  // Notify form state
  const [notifyAmount, setNotifyAmount] = useState('');
  const [notifyMode, setNotifyMode] = useState('RTGS');
  const [notifyRef, setNotifyRef] = useState('');
  const [notifyMilestone, setNotifyMilestone] = useState('');

  // Query form state
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg, isErr = false) => {
    setToastMsg({ msg, isErr });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadPortalData = async () => {
    try {
      const serverData = await api.getClientPortalData();
      if (serverData) {
        setPortalData(serverData);
      }
    } catch (e) {
      console.warn('Fallback to props data:', e);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user]);

  // Fallbacks if server data not yet returned
  const clientInfo = portalData?.client || (data?.clients || []).find(c => c.id === user.clientId) || (data?.clients || [])[0] || {};
  const clientProjects = portalData?.projects || (data?.projects || []).filter(p => p.clientName === clientInfo.name || p.id === clientInfo.projectAssigned);
  const activeProject = clientProjects[0] || (data?.projects || [])[0] || {};
  const clientPayments = portalData?.payments || (data?.clientPayments || []).filter(cp => cp.clientId === clientInfo.id || cp.clientName === clientInfo.name);
  const queriesList = portalData?.queries || data?.clientQueries || [];
  const documentsList = portalData?.documents || [
    { id: 'DOC-101', name: 'Approved Architectural Blueprints & Site Layout', type: 'PDF', date: '2026-03-15', size: '4.2 MB' },
    { id: 'DOC-102', name: 'Municipal Corporation Environmental NOC', type: 'PDF', date: '2026-04-01', size: '1.8 MB' },
    { id: 'DOC-103', name: 'Structural Safety & Soil Testing Certificate', type: 'PDF', date: '2026-05-10', size: '2.5 MB' },
    { id: 'DOC-104', name: 'Phase 3 Slab RCC Pouring Quality Audit Report', type: 'PDF', date: '2026-08-20', size: '3.1 MB' }
  ];

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  const handleNotifySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.notifyClientPayment({
        clientId: clientInfo.id,
        projectId: activeProject.id,
        amount: parseFloat(notifyAmount) || 0,
        mode: notifyMode,
        refNo: notifyRef,
        milestone: notifyMilestone || 'Milestone Payment Submission'
      });
      showToast('Payment notification sent successfully to project partners!');
      setShowNotifyModal(false);
      setNotifyAmount('');
      setNotifyRef('');
      setNotifyMilestone('');
      loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to submit payment notification.', true);
    }
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.submitClientQuery({
        clientId: clientInfo.id,
        projectId: activeProject.id,
        subject: querySubject,
        message: queryMessage
      });
      showToast('Inquiry submitted. The site project manager has been notified.');
      setShowQueryModal(false);
      setQuerySubject('');
      setQueryMessage('');
      loadPortalData();
    } catch (err) {
      showToast(err.message || 'Failed to submit inquiry.', true);
    }
  };

  const milestones = [
    { name: 'Site Excavation & Foundation Piling', status: 'Completed', date: 'March 2026', progress: 100 },
    { name: 'Basement & Lower Ground RCC Work', status: 'Completed', date: 'May 2026', progress: 100 },
    { name: 'Podium & Plinth Structural Slabs', status: 'In Progress', date: 'July 2026', progress: 75 },
    { name: 'Commercial Floors 1 to 8 Superstructure', status: 'Scheduled', date: 'October 2026', progress: 30 },
    { name: 'Facade Glazing & Internal MEP Services', status: 'Upcoming', date: 'January 2027', progress: 0 },
    { name: 'Finishing & Handover Completion', status: 'Upcoming', date: 'April 2027', progress: 0 }
  ];

  return (
    <div className="space-y-6 pb-8 max-w-6xl mx-auto font-sans">
      {/* Toast Alert */}
      {toastMsg && (
        <div className={`p-4 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
          toastMsg.isErr ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        } animate-in fade-in duration-200`}>
          {toastMsg.isErr ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toastMsg.msg}</span>
        </div>
      )}

      {/* Top Client Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
            <Building className="w-6 h-6 text-[#2563EB]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-info text-[10px] font-semibold uppercase tracking-wider">
                Client Project Dashboard
              </span>
              <span className="text-xs text-slate-400 font-mono">Client ID: {clientInfo.id || 'CL-01'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{clientInfo.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned Project: <strong className="text-slate-800 font-semibold">{activeProject.name || clientInfo.projectAssigned}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowQueryModal(true)}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Raise Query / Issue</span>
          </button>
          <button
            onClick={() => setShowNotifyModal(true)}
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Notify Bank Transfer</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'overview' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Project Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'milestones' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Construction Milestones</span>
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'payments' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Payment & Receipts History</span>
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'documents' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Approved Documents</span>
        </button>
        <button
          onClick={() => setActiveTab('queries')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${
            activeTab === 'queries' ? 'bg-[#2563EB] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Support Queries ({queriesList.length})</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Contract Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Contract Valuation</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{formatCurrency(clientInfo.totalContractValue)}</p>
              <p className="text-xs text-slate-400">Sanctioned Commercial Agreement</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Received</span>
              <p className="text-2xl font-bold text-emerald-600 tracking-tight tabular-nums">{formatCurrency(clientInfo.totalReceived)}</p>
              <p className="text-xs text-emerald-600/80 font-medium">Verified Receipts to Date</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Balance</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{formatCurrency(clientInfo.pendingBalance)}</p>
              <p className="text-xs text-slate-400">Due upon upcoming milestone</p>
            </div>
          </div>

          {/* Project Progress Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl space-y-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Building className="w-4 h-4 text-[#2563EB]" />
                  <span>Site Construction Progress: {activeProject.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Location: {activeProject.location} • Status: <strong className="text-slate-800">{activeProject.status || 'In Progress'}</strong>
                </p>
              </div>
              <span className="badge badge-info text-xs font-semibold px-3 py-1">
                {activeProject.completionPercent || 48}% Completed
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-[#2563EB] h-full rounded-full transition-all duration-700" 
                style={{ width: `${activeProject.completionPercent || 48}%` }}
              />
            </div>
          </div>

          {/* Site Manager Contact Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Project Manager / Partner</span>
              <h4 className="text-sm font-bold text-slate-900">{activeProject.partnerName || 'Rajesh Patel'}</h4>
              <p className="text-xs text-slate-500">Managing Partner & Senior Civil Engineer</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium text-slate-700">
              <div className="flex items-center space-x-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>+91 98220 11223</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Mail className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>rajesh@shivshakti.com</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MILESTONES */}
      {activeTab === 'milestones' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <h3 className="text-base font-bold text-slate-900">Project Timeline & Milestone Execution</h3>
          <div className="space-y-4">
            {milestones.map((m, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{m.name}</span>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    m.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                    m.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-500'
                  }`}>
                    {m.status}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${m.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === 'payments' && (
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
                    <td className="text-slate-800 font-medium text-xs">{cp.milestone}</td>
                    <td className="font-bold text-emerald-600 text-sm tabular-nums">{formatCurrency(cp.amount)}</td>
                    <td>
                      <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold">
                        {cp.mode}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-600">{cp.refNo}</td>
                    <td>
                      <span className="badge badge-success flex items-center space-x-1 w-fit text-[10px]">
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
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="text-base font-bold text-slate-900">Approved Project Documents & Compliance Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documentsList.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {doc.type}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{doc.name}</h4>
                    <p className="text-[11px] text-slate-400">Date: {doc.date} &bull; Size: {doc.size}</p>
                  </div>
                </div>
                <button
                  onClick={() => alert(`Downloading verified document ${doc.name}...`)}
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: QUERIES */}
      {activeTab === 'queries' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Communication & Inquiry Log</h3>
            <button
              onClick={() => setShowQueryModal(true)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit New Query</span>
            </button>
          </div>

          <div className="space-y-3">
            {queriesList.map((q) => (
              <div key={q.id} className="p-4 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{q.subject}</h4>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    q.status === 'ANSWERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {q.status}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{q.message}</p>
                {q.reply && (
                  <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900">
                    <strong>Site Manager Response:</strong> {q.reply}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: NOTIFY PAYMENT */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-[#2563EB]" />
                <span>Notify Bank Transfer</span>
              </h3>
              <button onClick={() => setShowNotifyModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleNotifySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Amount (INR)</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode</label>
                  <select value={notifyMode} onChange={(e) => setNotifyMode(e.target.value)} className="form-select">
                    <option value="RTGS">RTGS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">UTR / Ref Number</label>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Milestone Description</label>
                <input
                  type="text"
                  value={notifyMilestone}
                  onChange={(e) => setNotifyMilestone(e.target.value)}
                  placeholder="e.g. Slab 10 Completion Payment"
                  className="form-input"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNotifyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Submit Payment Notification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT QUERY */}
      {showQueryModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-[#2563EB]" />
                <span>Submit Project Query / Issue</span>
              </h3>
              <button onClick={() => setShowQueryModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleQuerySubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={querySubject}
                  onChange={(e) => setQuerySubject(e.target.value)}
                  placeholder="e.g. Request for site progress photos"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Message Details</label>
                <textarea
                  rows="4"
                  required
                  value={queryMessage}
                  onChange={(e) => setQueryMessage(e.target.value)}
                  placeholder="Describe your inquiry or request..."
                  className="form-input"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowQueryModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Send Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
