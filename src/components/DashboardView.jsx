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
  Award,
  HelpCircle,
  Info,
  RefreshCw,
  ExternalLink,
  Receipt
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import CostDistributionView from './CostDistributionView';
import PartnerExpenseBreakdown from './PartnerExpenseBreakdown';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';
import { PARTNER_EXPENSE_BREAKDOWNS } from '../data/costDistributionData';

export default function DashboardView({ 
  data = {}, 
  selectedPartner = 'ALL', 
  onNavigateTo, 
  currentUser = null,
  onRetry = null 
}) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const moduleInfo = MODULE_DESCRIPTIONS.dashboard;

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

  const handleManualRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  // Partners list
  const partners = data.partners || [];
  const projects = data.projects || [];
  const purchaseOrders = data.purchaseOrders || [];
  const purchaseBills = data.purchaseBills || [];
  const clientPayments = data.clientPayments || [];
  const clients = data.clients || [];
  const labourWages = data.labourWages || [];
  const subcontractors = data.subcontractors || [];
  const otherExpenses = data.otherExpenses || [];

  // Check if live data failed or is empty
  const hasApiError = !projects || projects.length === 0;

  // 7 Core Executive Metrics Calculated Directly from PostgreSQL State
  const executiveMetrics = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status !== 'Completed');
    const activeProjectsCount = activeProjects.length;
    const completedProjectsCount = totalProjects - activeProjectsCount;

    // Budget & Expenditure
    const totalApprovedBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalActualExpenditure = projects.reduce((acc, p) => acc + (p.actualCost || 0), 0);
    const remainingBudget = totalApprovedBudget - totalActualExpenditure;
    const budgetUtilizationPct = totalApprovedBudget > 0 
      ? Math.round((totalActualExpenditure / totalApprovedBudget) * 100) 
      : 0;

    // Payments Received and Outstanding Balances
    const totalPaymentsReceived = clientPayments.reduce((acc, cp) => acc + (cp.amount || 0), 0);
    const totalOutstandingBalances = clients.reduce((acc, c) => acc + (c.pendingBalance || 0), 0);

    // Pending Purchase Bills and Approvals
    const pendingBills = purchaseBills.filter(pb => pb.paymentStatus !== 'Paid' || pb.approvalStatus !== 'Approved');
    const pendingBillsCount = pendingBills.length;
    const pendingBillsAmount = pendingBills.reduce((acc, pb) => acc + (pb.totalBillAmount || 0), 0);
    const pendingApprovalsCount = purchaseBills.filter(pb => pb.approvalStatus === 'Pending' || pb.approvalStatus !== 'Approved').length;

    // Project Completion and Delivery Status
    const avgCompletionPercent = totalProjects > 0 
      ? Math.round(projects.reduce((acc, p) => acc + (p.completionPercent || 0), 0) / totalProjects) 
      : 0;

    const inTransitDeliveries = purchaseOrders.filter(
      po => po.deliveryStatus === 'In-Transit' || po.deliveryStatus === 'Dispatched'
    );
    const inTransitDeliveriesCount = inTransitDeliveries.length;

    return {
      totalProjects,
      activeProjectsCount,
      completedProjectsCount,
      totalApprovedBudget,
      totalActualExpenditure,
      remainingBudget,
      budgetUtilizationPct,
      totalPaymentsReceived,
      totalOutstandingBalances,
      pendingBillsCount,
      pendingBillsAmount,
      pendingApprovalsCount,
      avgCompletionPercent,
      inTransitDeliveriesCount,
      totalPOs: purchaseOrders.length
    };
  }, [projects, purchaseOrders, purchaseBills, clientPayments, clients]);

  // Active Partner Object (if specific partner is selected)
  const currentPartner = useMemo(() => {
    if (activePartnerId === 'ALL') return null;
    return partners.find(p => p.id === activePartnerId) || partners[0];
  }, [partners, activePartnerId]);

  // Projects filtered by active partner selection
  const currentProjects = useMemo(() => {
    if (activePartnerId === 'ALL') return projects;
    return projects.filter(p => p.partnerId === activePartnerId);
  }, [projects, activePartnerId]);

  // Partner specific POs
  const currentPOs = useMemo(() => {
    if (activePartnerId === 'ALL') return purchaseOrders;
    const projectIds = new Set(currentProjects.map(p => p.id));
    const projectNames = new Set(currentProjects.map(p => p.name?.toLowerCase()));
    return purchaseOrders.filter(
      po => projectIds.has(po.projectId) || projectNames.has(po.projectName?.toLowerCase())
    );
  }, [purchaseOrders, currentProjects, activePartnerId]);

  // Calculate detailed financial metrics per partner
  const partnerMetrics = useMemo(() => {
    const pId = activePartnerId;
    const isAll = pId === 'ALL';

    const pProjects = isAll ? projects : projects.filter(p => p.partnerId === pId);
    const projectIds = new Set(pProjects.map(p => p.id));
    const projectNames = new Set(pProjects.map(p => p.name?.toLowerCase()));

    const totalBudget = pProjects.reduce((acc, p) => acc + (p.budget || 0), 0);
    const totalActualCost = pProjects.reduce((acc, p) => acc + (p.actualCost || 0), 0);

    // Client Inflows (received payments)
    const pClientPayments = clientPayments.filter(
      cp => isAll || projectIds.has(cp.projectId) || projectNames.has(cp.projectName?.toLowerCase())
    );
    const totalClientReceived = pClientPayments.reduce((acc, cp) => acc + (cp.amount || 0), 0);

    // Client Pending Receivables
    const relevantClients = clients.filter(
      c => isAll || pProjects.some(p => p.clientName?.toLowerCase() === c.name?.toLowerCase() || p.name === c.projectAssigned)
    );
    const totalPendingReceivables = relevantClients.reduce((acc, c) => acc + (c.pendingBalance || 0), 0);

    // Supplier Bills & Payables
    const pos = purchaseOrders.filter(
      po => isAll || projectIds.has(po.projectId) || projectNames.has(po.projectName?.toLowerCase())
    );
    const poRefs = new Set(pos.map(po => po.poNumber));
    const bills = purchaseBills.filter(
      pb => isAll || poRefs.has(pb.poRef) || projectIds.has(pb.projectId)
    );
    const totalSupplierBilled = bills.reduce((acc, b) => acc + (b.totalBillAmount || 0), 0);

    // Labour wages
    const wages = labourWages.filter(
      lw => isAll || projectIds.has(lw.projectId) || projectNames.has(lw.projectName?.toLowerCase())
    );
    const totalLabourWages = wages.reduce((acc, lw) => acc + (lw.totalWeeklyWage || 0), 0);

    // Subcontractors
    const subs = subcontractors.filter(
      sub => isAll || projectIds.has(sub.projectId) || projectNames.has(sub.projectName?.toLowerCase())
    );
    const totalSubcontractorsBilled = subs.reduce((acc, s) => acc + (s.totalBilled || 0), 0);

    // Other / Petty expenses
    const otherExp = otherExpenses.filter(
      e => isAll || projectIds.has(e.projectId) || projectNames.has(e.projectName?.toLowerCase())
    );
    const totalPettyExpenses = otherExp.reduce((acc, e) => acc + (e.amount || 0), 0);

    // Net Operational Surplus: Client Inflows - Actual Incurred Cost
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
      sitesCount: pProjects.length,
      deliveriesInTransit: pos.filter(po => po.deliveryStatus === 'In-Transit' || po.deliveryStatus === 'Dispatched').length
    };
  }, [projects, purchaseOrders, purchaseBills, clientPayments, clients, labourWages, subcontractors, otherExpenses, activePartnerId]);

  // Comparative metrics across all partners for Consolidated view
  const comparativePartners = useMemo(() => {
    return partners.map(p => {
      const pProjects = projects.filter(proj => proj.partnerId === p.id);
      const pBudget = pProjects.reduce((acc, proj) => acc + (proj.budget || 0), 0);
      const pActual = pProjects.reduce((acc, proj) => acc + (proj.actualCost || 0), 0);
      const pClientInflows = clientPayments
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
  }, [projects, partners, clientPayments]);

  // Recharts Chart Data
  const chartData = useMemo(() => {
    return currentProjects.map(p => ({
      name: p.name.length > 16 ? p.name.substring(0, 16) + '...' : p.name,
      Budget: Math.round((p.budget || 0) / 100000), // in Lakhs
      ActualCost: Math.round((p.actualCost || 0) / 100000),
    }));
  }, [currentProjects]);

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* API Failure / Offline State Banner */}
      {hasApiError && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">Database Connection Notice</h4>
              <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                Could not retrieve live metrics from the PostgreSQL database. The server may still be connecting or synchronizing tables.
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={handleManualRetry}
              disabled={isRetrying}
              className="btn-primary flex items-center space-x-2 text-xs font-semibold py-2 px-4 shrink-0 bg-amber-600 hover:bg-amber-700 border-amber-600"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Connecting...' : 'Retry Connection'}</span>
            </button>
          )}
        </div>
      )}

      {/* Top Banner with Partner Mode Switcher */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                  {currentUser?.role === 'ADMIN' ? 'Executive Admin Dashboard' : moduleInfo.title}
                </h2>
                <div className="relative inline-block">
                  <button
                    type="button"
                    onMouseEnter={() => setShowInfoTooltip(true)}
                    onMouseLeave={() => setShowInfoTooltip(false)}
                    onClick={() => setShowInfoTooltip(prev => !prev)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 rounded-full hover:bg-slate-100"
                    title="Module Description"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                  {showInfoTooltip && (
                    <div className="absolute left-0 z-40 w-72 sm:w-80 mt-1 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-xl pointer-events-none animate-in fade-in zoom-in-95 duration-150 leading-relaxed font-normal">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-slate-100 mb-1">{moduleInfo.title}</p>
                          <p className="text-slate-300 text-[11px]">{moduleInfo.fullDescription}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Live PostgreSQL analytics &bull; 7 Executive Metrics &bull; Multi-partner cost tracking
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
              <span>Driver Deliveries ({executiveMetrics.inTransitDeliveriesCount})</span>
            </button>
          </div>
        </div>

        {/* Partner Dashboard Tabs */}
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
              Consolidated (Company-Wide)
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
          CONSOLIDATED VIEW: ALL 3 PARTNERS (Default / 'ALL')
          ========================================================= */}
      {activePartnerId === 'ALL' && (
        <div className="space-y-6">
          {/* SECTION 1: 7 CORE EXECUTIVE ADMIN METRICS (Required) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Core Construction Portfolio Overview
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">Realtime Live Sync &bull; PostgreSQL</span>
            </div>

            {/* Row 1: 4 Key Project & Financial Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Metric 1: Total Active Projects */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Active Projects</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight">
                  {executiveMetrics.activeProjectsCount} Active Sites
                </p>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                  <span className="text-emerald-600 font-semibold">{executiveMetrics.completedProjectsCount} Handed Over</span>
                  <span>&bull;</span>
                  <span>{executiveMetrics.totalProjects} Total Registered</span>
                </div>
              </div>

              {/* Metric 2: Total Approved Project Budgets */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Approved Project Budgets</span>
                  <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {formatCurrency(executiveMetrics.totalApprovedBudget)}
                </p>
                <p className="text-xs text-slate-500">
                  Approved Portfolio Sanctions (&le; ₹50L/site)
                </p>
              </div>

              {/* Metric 3: Total Actual Expenditure */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Actual Expenditure</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                  {formatCurrency(executiveMetrics.totalActualExpenditure)}
                </p>
                <p className="text-xs text-slate-500">
                  {executiveMetrics.budgetUtilizationPct}% of Sanctioned Budget Incurred
                </p>
              </div>

              {/* Metric 4: Remaining Budget */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Remaining Budget</span>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600 tracking-tight font-mono">
                  {formatCurrency(executiveMetrics.remainingBudget)}
                </p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${Math.max(0, 100 - executiveMetrics.budgetUtilizationPct)}%` }} 
                  />
                </div>
              </div>
            </div>

            {/* Row 2: 3 Operational & Commercial Controls */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
              {/* Metric 5: Payments Received and Outstanding Balances */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Client Cashflow & Receivables</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Payments Received:</span>
                    <span className="text-base font-bold text-emerald-600 font-mono">
                      {formatCurrency(executiveMetrics.totalPaymentsReceived)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Outstanding Balance:</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {formatCurrency(executiveMetrics.totalOutstandingBalances)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <button 
                    onClick={() => onNavigateTo('clientPayments')}
                    className="text-[#2563EB] hover:underline font-semibold text-[11px]"
                  >
                    View Inflow Receipts &rarr;
                  </button>
                  <button 
                    onClick={() => onNavigateTo('clients')}
                    className="text-slate-500 hover:text-slate-800 text-[11px]"
                  >
                    Client Directory
                  </button>
                </div>
              </div>

              {/* Metric 6: Pending Purchase Bills and Approvals */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Bills & Approvals Pending</span>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Pending Bills:</span>
                    <span className="text-base font-bold text-amber-700 font-mono">
                      {executiveMetrics.pendingBillsCount} Invoices
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Unsettled Value:</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {formatCurrency(executiveMetrics.pendingBillsAmount)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs pt-1">
                  <span className="text-[11px] font-semibold text-amber-700">
                    {executiveMetrics.pendingApprovalsCount} Bills Awaiting Approval
                  </span>
                  <button 
                    onClick={() => onNavigateTo('purchaseBills')}
                    className="text-[#2563EB] hover:underline font-semibold text-[11px]"
                  >
                    Review Bills &rarr;
                  </button>
                </div>
              </div>

              {/* Metric 7: Project Completion and Delivery Status */}
              <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Completion & Delivery Status</span>
                  <div className="p-2 rounded-xl bg-blue-50 text-[#2563EB]">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Average Project Progress:</span>
                    <span className="font-bold text-slate-900 font-mono">{executiveMetrics.avgCompletionPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#2563EB] h-full rounded-full transition-all duration-300" 
                      style={{ width: `${executiveMetrics.avgCompletionPercent}%` }} 
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-200/60">
                    <span className="text-slate-500">Active Material Logistics:</span>
                    <span className="font-semibold text-blue-700">{executiveMetrics.inTransitDeliveriesCount} In-Transit</span>
                  </div>
                </div>
                <div className="flex justify-end items-center text-xs pt-1">
                  <button 
                    onClick={() => onNavigateTo('deliveryTracker')}
                    className="text-[#2563EB] hover:underline font-semibold text-[11px]"
                  >
                    Open Live Driver Tracker &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: LIVE PROJECT COMPLETION & DELIVERY STATUS TABLE */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                  <Building2 className="w-4 h-4 text-[#2563EB]" />
                  <span>Live Project Completion & Budget Health</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time status across all active construction sites backed by Supabase PostgreSQL.
                </p>
              </div>
              <button
                onClick={() => onNavigateTo('projects')}
                className="btn-secondary text-xs font-medium flex items-center space-x-1"
              >
                <span>Full Hierarchy View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Site Name & ID</th>
                    <th>District & Taluka</th>
                    <th>Client Authority</th>
                    <th>Partner In-Charge</th>
                    <th>Approved Budget</th>
                    <th>Actual Spent</th>
                    <th>Budget Health</th>
                    <th>Completion %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-xs text-slate-400">
                        No projects loaded from PostgreSQL database.
                      </td>
                    </tr>
                  ) : (
                    projects.map(p => {
                      const budget = p.budget || 0;
                      const spent = p.actualCost || 0;
                      const isOver = spent > budget;
                      const nearLimit = spent >= budget * 0.9 && !isOver;

                      return (
                        <tr key={p.id}>
                          <td>
                            <div>
                              <span className="font-semibold text-slate-900 text-xs block">{p.name}</span>
                              <span className="text-[10px] font-mono text-slate-400">{p.id}</span>
                            </div>
                          </td>
                          <td className="text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{p.district || 'General'}</span>
                            <span className="text-slate-400 block text-[10px]">{p.division || 'Main'}</span>
                          </td>
                          <td className="text-xs font-medium text-slate-700">{p.clientName || 'Private'}</td>
                          <td>
                            <span className="badge badge-info text-[10px] font-medium">{p.partnerName}</span>
                          </td>
                          <td className="text-xs font-bold text-slate-900 font-mono">{formatCurrency(budget)}</td>
                          <td className="text-xs font-medium text-slate-700 font-mono">{formatCurrency(spent)}</td>
                          <td>
                            <span className={`badge text-[10px] font-medium ${
                              isOver ? 'badge-danger' : nearLimit ? 'badge-warning' : 'badge-success'
                            }`}>
                              {isOver ? 'Over Budget' : nearLimit ? 'Near Limit (90%)' : 'Healthy (Under Budget)'}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${p.completionPercent >= 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`} 
                                  style={{ width: `${Math.min(p.completionPercent || 0, 100)}%` }} 
                                />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 font-mono">{p.completionPercent || 0}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${p.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3: COST DISTRIBUTION DASHBOARD */}
          <CostDistributionView 
            data={data} 
            onNavigateTo={onNavigateTo} 
          />

          {/* SECTION 4: 3 BUSINESS PARTNERS COMPARATIVE BREAKDOWN */}
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
                      <span className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600 font-mono">
                        {p.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Capital Invested:</span>
                        <p className="font-semibold text-slate-900 font-mono">{formatCurrency(p.capitalInvested)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Managed Sites:</span>
                        <p className="font-semibold text-slate-900">{p.sitesCount} Projects</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Total Site Budget:</span>
                        <p className="font-medium text-slate-700 font-mono">{formatCurrency(p.totalBudget)}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Expenses Spent:</span>
                        <p className="font-medium text-slate-700 font-mono">{formatCurrency(p.totalActualCost)}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 text-xs flex justify-between items-center">
                      <span className="text-slate-500">Net Cash Position / P&L:</span>
                      <span className={`font-semibold font-mono ${p.netSurplus >= 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
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

          {/* SECTION 5: CHART & LIVE DELIVERIES STREAM */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Company-Wide Site Budget vs Actual Cost</h3>
                  <p className="text-xs text-slate-500">Values represented in Lakhs (₹ INR) &bull; Maximum Budget limit ₹50 Lakhs per site</p>
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
                {purchaseOrders.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">No purchase orders recorded yet.</p>
                ) : (
                  purchaseOrders.map((po) => (
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
                        <span className="truncate font-medium">{po.vehicleNumber || 'Vehicle Assigned'}</span>
                        <a 
                          href={`tel:${po.driverMobile}`}
                          className="text-[#2563EB] hover:underline font-semibold flex items-center space-x-1"
                        >
                          <PhoneCall className="w-3 h-3" />
                          <span>{po.driverName}</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          INDIVIDUAL PARTNER DEDICATED VIEW (When P1, P2, P3 selected)
          ========================================================= */}
      {currentPartner && activePartnerId !== 'ALL' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Partner Profile Hero Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center font-bold text-[#2563EB] text-base shrink-0 font-mono">
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
              <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{formatCurrency(currentPartner.capitalInvested)}</p>
              <p className="text-xs text-emerald-600 font-medium">Partner Equity Deployed</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Partner Sites Budget</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{formatCurrency(partnerMetrics.totalBudget)}</p>
              <p className="text-xs text-slate-500">{partnerMetrics.sitesCount} Allocated Sites</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Incurred Site Expenses</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight font-mono">{formatCurrency(partnerMetrics.totalActualCost)}</p>
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
              <p className={`text-2xl font-bold tracking-tight font-mono ${partnerMetrics.netSurplus >= 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
                {formatCurrency(partnerMetrics.netSurplus)}
              </p>
              <p className="text-xs text-slate-500">
                Client Inflows: {formatCurrency(partnerMetrics.totalClientReceived)}
              </p>
            </div>
          </div>

          {/* Individual Partner Expense Breakdown */}
          <PartnerExpenseBreakdown 
            partnerId={currentPartner.id}
            partnerName={currentPartner.name}
            totalSpent={PARTNER_EXPENSE_BREAKDOWNS[currentPartner.id]?.totalSpent || partnerMetrics.totalActualCost}
            showTitle={true}
            allowDrillDown={true}
          />

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
                        <td className="text-xs font-semibold text-slate-900 font-mono">{formatCurrency(p.budget)}</td>
                        <td className="text-xs font-medium text-slate-700 font-mono">{formatCurrency(p.actualCost)}</td>
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
    </div>
  );
}
