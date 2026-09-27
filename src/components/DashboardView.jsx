import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Truck, 
  Users, 
  MapPin, 
  ArrowUpRight, 
  PhoneCall, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet,
  Clock,
  Briefcase,
  PieChart,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

export default function DashboardView({ data, selectedPartner, onNavigateTo }) {
  // Active partner view tab: 'ALL' or 'P1', 'P2', 'P3'
  const [activePartnerId, setActivePartnerId] = useState(
    selectedPartner && selectedPartner !== 'ALL' ? selectedPartner : 'ALL'
  );

  useEffect(() => {
    if (selectedPartner) {
      setActivePartnerId(selectedPartner);
    }
  }, [selectedPartner]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Partners list
  const partners = data.partners || [];

  // Active Partner Object (if specific partner is selected)
  const currentPartner = useMemo(() => {
    if (activePartnerId === 'ALL') return null;
    return partners.find(p => p.id === activePartnerId) || partners[0];
  }, [partners, activePartnerId]);

  // Projects filtered by active partner selection
  const currentProjects = useMemo(() => {
    if (activePartnerId === 'ALL') return data.projects || [];
    return (data.projects || []).filter(p => p.partnerId === activePartnerId);
  }, [data.projects, activePartnerId]);

  // Partner specific POs
  const currentPOs = useMemo(() => {
    if (activePartnerId === 'ALL') return data.purchaseOrders || [];
    const projectIds = new Set(currentProjects.map(p => p.id));
    const projectNames = new Set(currentProjects.map(p => p.name?.toLowerCase()));
    return (data.purchaseOrders || []).filter(
      po => projectIds.has(po.projectId) || projectNames.has(po.projectName?.toLowerCase())
    );
  }, [data.purchaseOrders, currentProjects, activePartnerId]);

  // Calculate detailed financial metrics per partner
  const partnerMetrics = useMemo(() => {
    const pId = activePartnerId;
    const isAll = pId === 'ALL';

    const projects = isAll ? (data.projects || []) : (data.projects || []).filter(p => p.partnerId === pId);
    const projectIds = new Set(projects.map(p => p.id));
    const projectNames = new Set(projects.map(p => p.name?.toLowerCase()));

    const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalActualCost = projects.reduce((acc, p) => acc + (p.actualCost || 0), 0);

    // Client Inflows (received payments)
    const clientPayments = (data.clientPayments || []).filter(
      cp => isAll || projectIds.has(cp.projectId) || projectNames.has(cp.projectName?.toLowerCase())
    );
    const totalClientReceived = clientPayments.reduce((acc, cp) => acc + (cp.amount || 0), 0);

    // Client Pending Receivables
    const relevantClients = (data.clients || []).filter(
      c => isAll || projects.some(p => p.clientName?.toLowerCase() === c.name?.toLowerCase() || p.name === c.projectAssigned)
    );
    const totalPendingReceivables = relevantClients.reduce((acc, c) => acc + (c.pendingBalance || 0), 0);

    // Supplier Bills & Payables
    const pos = (data.purchaseOrders || []).filter(
      po => isAll || projectIds.has(po.projectId) || projectNames.has(po.projectName?.toLowerCase())
    );
    const poRefs = new Set(pos.map(po => po.poNumber));
    const bills = (data.purchaseBills || []).filter(
      pb => isAll || poRefs.has(pb.poRef) || projectIds.has(pb.projectId)
    );
    const totalSupplierBilled = bills.reduce((acc, b) => acc + (b.totalBillAmount || 0), 0);

    // Labour wages
    const wages = (data.labourWages || []).filter(
      lw => isAll || projectIds.has(lw.projectId) || projectNames.has(lw.projectName?.toLowerCase())
    );
    const totalLabourWages = wages.reduce((acc, lw) => acc + (lw.totalWeeklyWage || 0), 0);

    // Subcontractors
    const subs = (data.subcontractors || []).filter(
      sub => isAll || projectIds.has(sub.projectId) || projectNames.has(sub.projectName?.toLowerCase())
    );
    const totalSubcontractorsBilled = subs.reduce((acc, s) => acc + (s.totalBilled || 0), 0);

    // Other / Petty expenses
    const otherExp = (data.otherExpenses || []).filter(
      e => isAll || projectIds.has(e.projectId) || projectNames.has(e.projectName?.toLowerCase())
    );
    const totalPettyExpenses = otherExp.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Net Operational Surplus / P&L: Client Inflows Received - Total Actual Expenses
    const netSurplus = totalClientReceived - totalActualCost;

    return {
      totalBudget,
      totalActualCost,
      totalClientReceived,
      totalPendingReceivables,
      totalSupplierBilled,
      totalLabourWages,
      totalSubcontractorsBilled,
      totalPettyExpenses,
      netSurplus,
      sitesCount: projects.length,
      deliveriesInTransit: pos.filter(po => po.deliveryStatus === 'In-Transit' || po.deliveryStatus === 'Dispatched').length
    };
  }, [data, activePartnerId]);

  // Comparative metrics across all 3 partners for Consolidated view
  const comparativePartners = useMemo(() => {
    return partners.map(p => {
      const pProjects = (data.projects || []).filter(proj => proj.partnerId === p.id);
      const pBudget = pProjects.reduce((acc, proj) => acc + (proj.budget || 0), 0);
      const pActual = pProjects.reduce((acc, proj) => acc + (proj.actualCost || 0), 0);
      const pClientInflows = (data.clientPayments || [])
        .filter(cp => pProjects.some(proj => proj.id === cp.projectId || proj.name === cp.projectName))
        .reduce((acc, cp) => acc + (cp.amount || 0), 0);
      const pSurplus = pClientInflows - pActual;

      return {
        ...p,
        sitesCount: pProjects.length,
        totalBudget: pBudget,
        totalActualCost: pActual,
        clientInflows: pClientInflows,
        netSurplus: pSurplus,
        projects: pProjects
      };
    });
  }, [data, partners]);

  // Recharts Chart Data
  const chartData = useMemo(() => {
    return currentProjects.map(p => ({
      name: p.name.length > 16 ? p.name.substring(0, 16) + '...' : p.name,
      Budget: Math.round((p.budget || 0) / 100000), // Lakhs
      ActualCost: Math.round((p.actualCost || 0) / 100000),
    }));
  }, [currentProjects]);

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Top Banner with Partner Mode Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                <span>Shivshakti Partner Executive Dashboard</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Multi-partner investment, site operations, capital allocation, and P&L tracking.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => onNavigateTo('projects')}
              className="btn-secondary flex items-center space-x-2 text-xs font-medium"
            >
              <Briefcase className="w-4 h-4 text-slate-500" />
              <span>Explore Sites Hierarchy</span>
            </button>
            <button
              onClick={() => onNavigateTo('deliveryTracker')}
              className="btn-primary flex items-center space-x-2 text-xs font-medium"
            >
              <Truck className="w-4 h-4" />
              <span>Driver Deliveries ({partnerMetrics.deliveriesInTransit})</span>
            </button>
          </div>
        </div>

        {/* Partner Dashboard Tabs (Requirement 2) */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium mr-1 text-[11px] uppercase tracking-wider">Dashboard View:</span>
          
          <div className="inline-flex flex-wrap items-center p-1 bg-slate-100/80 rounded-xl gap-1">
            <button
              onClick={() => setActivePartnerId('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                activePartnerId === 'ALL'
                  ? 'bg-white text-blue-600 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 font-medium'
              }`}
            >
              Consolidated (All 3 Partners)
            </button>

            {partners.map(p => {
              const isActive = activePartnerId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePartnerId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-white text-blue-600 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <span>{p.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-200/70 text-slate-600'}`}>
                    {p.location}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================
          INDIVIDUAL PARTNER DEDICATED VIEW (Requirement 2)
          ========================================================= */}
      {currentPartner && activePartnerId !== 'ALL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Partner Profile Hero Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-[#2563EB] text-base shrink-0">
                {currentPartner.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="badge badge-info">
                    Partner ID: {currentPartner.id}
                  </span>
                  <span className="text-xs text-slate-500">
                    Base City: <strong className="text-slate-700 font-medium">{currentPartner.location}</strong>
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{currentPartner.name}</h3>
                <p className="text-xs text-slate-500">{currentPartner.role}</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Capital Invested</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {formatCurrency(currentPartner.capitalInvested)}
                </span>
              </div>
              <a
                href={`tel:${currentPartner.mobile}`}
                className="btn-secondary px-3.5 py-2 text-xs font-medium flex items-center space-x-1.5"
              >
                <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                <span>Call ({currentPartner.mobile})</span>
              </a>
            </div>
          </div>

          {/* Partner Dedicated Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Capital Invested</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(currentPartner.capitalInvested)}</p>
              <p className="text-xs text-emerald-600 font-medium">Partner Equity Deployed</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Partner Sites Budget</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(partnerMetrics.totalBudget)}</p>
              <p className="text-xs text-slate-500">{partnerMetrics.sitesCount} Allocated Sites</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incurred Site Expenses</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(partnerMetrics.totalActualCost)}</p>
              <p className="text-xs text-slate-500">
                {partnerMetrics.totalBudget > 0 ? Math.round((partnerMetrics.totalActualCost / partnerMetrics.totalBudget) * 100) : 0}% of Budget Consumed
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Cash Position / P&L</span>
                <span className={partnerMetrics.netSurplus >= 0 ? 'badge badge-success' : 'badge badge-info'}>
                  {partnerMetrics.netSurplus >= 0 ? 'Net Surplus' : 'Capital Outlay'}
                </span>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${partnerMetrics.netSurplus >= 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {formatCurrency(partnerMetrics.netSurplus)}
              </p>
              <p className="text-xs text-slate-500">
                Client Inflows: {formatCurrency(partnerMetrics.totalClientReceived)}
              </p>
            </div>
          </div>

          {/* Partner Linked Sites Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-[#2563EB]" />
                  <span>Sites Linked to {currentPartner.name}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Direct site management and cost accounting responsibility.</p>
              </div>

              <button
                onClick={() => onNavigateTo('projects')}
                className="btn-secondary text-xs font-medium flex items-center space-x-1"
              >
                <span>Drill-Down in Projects</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Site ID & Name</th>
                    <th>District & Division</th>
                    <th>Client Organization</th>
                    <th>Sanctioned Budget</th>
                    <th>Actual Spent</th>
                    <th>Completion %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                        No sites assigned to this partner yet.
                      </td>
                    </tr>
                  ) : (
                    currentProjects.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div>
                            <span className="font-semibold text-slate-900 text-xs block">{p.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">{p.id}</span>
                          </div>
                        </td>
                        <td className="text-xs text-slate-600">
                          <span className="font-medium text-slate-900">{p.district || 'General'}</span>
                          <span className="text-slate-400 block text-[10px]">{p.division || 'Main'}</span>
                        </td>
                        <td className="text-xs font-medium text-slate-700">{p.clientName}</td>
                        <td className="text-xs font-semibold text-slate-900">{formatCurrency(p.budget)}</td>
                        <td className="text-xs font-medium text-slate-700">{formatCurrency(p.actualCost)}</td>
                        <td>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${p.completionPercent}%` }} />
                            </div>
                            <span className="text-xs font-medium text-slate-600">{p.completionPercent}%</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-info">{p.status}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Partner Chart & Deliveries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {currentPartner.name} &bull; Site Budget vs Spent Comparison
                  </h4>
                  <p className="text-xs text-slate-500">Values represented in Lakhs (₹ INR)</p>
                </div>
                <span className="badge badge-info">
                  Partner Cashflow
                </span>
              </div>

              <div className="h-64 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="L" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '10px', color: '#0F172A', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)' }} 
                      formatter={(val) => [`₹ ${val} Lakhs`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }} />
                    <Bar dataKey="Budget" fill="#2563EB" radius={[4, 4, 0, 0]} name="Sanctioned Budget (L)" />
                    <Bar dataKey="ActualCost" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Actual Cost Spent (L)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Partner's Material Logistics */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-[#2563EB]" />
                  <span>Deliveries for Partner Sites</span>
                </h4>
                <span className="badge badge-info">{currentPOs.length} Total</span>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-64 pr-1">
                {currentPOs.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No active material dispatches for this partner's sites.</p>
                ) : (
                  currentPOs.map(po => (
                    <div key={po.id} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">{po.poNumber}</span>
                        <span className="badge badge-info text-[10px]">{po.deliveryStatus}</span>
                      </div>
                      <p className="font-semibold text-slate-900">{po.supplierName}</p>
                      <p className="text-[11px] text-slate-500">Destination: <strong className="text-slate-700 font-medium">{po.projectName}</strong></p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          CONSOLIDATED VIEW: ALL 3 PARTNERS (Default / 'ALL')
          ========================================================= */}
      {activePartnerId === 'ALL' && (
        <div className="space-y-6">
          {/* Company-wide KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Active Budget</span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(partnerMetrics.totalBudget)}</p>
              <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <span>{partnerMetrics.sitesCount} Active Construction Sites</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Actual Expenses</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(partnerMetrics.totalActualCost)}</p>
              <p className="text-xs text-slate-500">
                {partnerMetrics.totalBudget > 0 ? Math.round((partnerMetrics.totalActualCost / partnerMetrics.totalBudget) * 100) : 0}% of Budget Consumed
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client Inflows Received</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 tracking-tight">{formatCurrency(partnerMetrics.totalClientReceived)}</p>
              <p className="text-xs text-slate-500">Verified Bank Receipts</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Net Cash Position / P&L</span>
                <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${partnerMetrics.netSurplus >= 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {formatCurrency(partnerMetrics.netSurplus)}
              </p>
              <p className="text-xs text-slate-500">Total Revenue vs Incurred Cost</p>
            </div>
          </div>

          {/* 3 PARTNERS COMPARATIVE BREAKDOWN (Requirement 2) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-[#2563EB]" />
                  <span>3 Business Partners Comparative Breakdown</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Separate accounting per partner — capital invested, managed sites, share of expenses, and profit/loss.
                </p>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">Click any partner card to view their dashboard</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {comparativePartners.map((p) => (
                <div 
                  key={p.id}
                  className="bg-white border border-slate-200/80 hover:border-blue-300 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="badge badge-info uppercase tracking-wider text-[10px]">
                          {p.location} Office
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-1.5">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.role}</p>
                      </div>
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                        {p.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Capital Invested:</span>
                        <p className="font-semibold text-slate-900">{formatCurrency(p.capitalInvested)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Managed Sites:</span>
                        <p className="font-semibold text-slate-900">{p.sitesCount} Projects</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Total Site Budget:</span>
                        <p className="font-medium text-slate-700">{formatCurrency(p.totalBudget)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Expenses Spent:</span>
                        <p className="font-medium text-slate-700">{formatCurrency(p.totalActualCost)}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex justify-between items-center">
                      <span className="text-slate-500">Net Cash Surplus / P&L:</span>
                      <span className={`font-semibold ${p.netSurplus >= 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {formatCurrency(p.netSurplus)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActivePartnerId(p.id)}
                    className="btn-primary w-full py-2 text-xs font-medium flex items-center justify-center space-x-1.5"
                  >
                    <span>View {p.name.split(' ')[0]}'s Dashboard</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Section: Chart & Live Deliveries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Company-Wide Site Budget vs Actual Cost</h3>
                  <p className="text-xs text-slate-500">Values represented in Lakhs (₹ INR)</p>
                </div>
                <span className="badge badge-info">
                  Consolidated Overview
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} unit="L" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '10px', color: '#0F172A', boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)' }} 
                      formatter={(val) => [`₹ ${val} Lakhs`, '']}
                    />
                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
                    <Bar dataKey="Budget" fill="#2563EB" radius={[4, 4, 0, 0]} name="Sanctioned Budget (Lakhs)" />
                    <Bar dataKey="ActualCost" fill="#94A3B8" radius={[4, 4, 0, 0]} name="Actual Cost Incurred (Lakhs)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live Deliveries Stream */}
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Truck className="w-4 h-4 text-[#2563EB]" />
                  <span>Live Material Deliveries</span>
                </h3>
                <button 
                  onClick={() => onNavigateTo('deliveryTracker')}
                  className="text-xs text-[#2563EB] hover:underline font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-72 pr-1">
                {(data.purchaseOrders || []).map((po) => (
                  <div key={po.id} className="bg-slate-50/70 border border-slate-100 rounded-xl p-3.5 space-y-1.5 text-xs hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">{po.poNumber}</span>
                        <h5 className="text-xs font-semibold text-slate-900">{po.supplierName}</h5>
                      </div>
                      <span className="badge badge-info text-[10px]">{po.deliveryStatus}</span>
                    </div>

                    <p className="text-xs text-slate-600 truncate">
                      {po.items?.map(i => `${i.quantity} ${i.unit} ${i.name}`).join(', ')}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                      <span className="truncate font-medium">{po.vehicleNumber}</span>
                      <a 
                        href={`tel:${po.driverMobile}`}
                        className="text-[#2563EB] hover:underline font-semibold flex items-center space-x-1"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>{po.driverName}</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
