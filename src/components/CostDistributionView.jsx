import React, { useState } from 'react';
import { 
  Building2, 
  Layers, 
  Users, 
  PieChart as PieIcon, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpRight,
  TrendingUp,
  Download,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { 
  TOTAL_PROJECT_COST, 
  SITE_COST_DISTRIBUTION, 
  MATERIAL_COST_DISTRIBUTION, 
  PARTNER_COST_DISTRIBUTION 
} from '../data/costDistributionData';
import PartnerExpenseBreakdown from './PartnerExpenseBreakdown';
import { exportToExcel } from '../utils/excelExport';

export default function CostDistributionView({ data, onNavigateTo }) {
  // View mode: 'site' | 'material' | 'partner'
  const [activeView, setActiveView] = useState('site');
  // Expanded partner ID for detailed breakdown accordion
  const [expandedPartnerId, setExpandedPartnerId] = useState('P1');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatLakhsOrCrores = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(2)} L`;
  };

  const handleExportDistribution = () => {
    let rows = [];
    if (activeView === 'site') {
      rows = SITE_COST_DISTRIBUTION.map(s => ({
        'Site / Project Name': s.projectName,
        'Project ID': s.projectId,
        'District & Division': `${s.district}, ${s.division}`,
        'Cost Allocated (INR)': s.amount,
        'Cost Share (%)': `${s.percentage}%`,
        'Partner In-Charge': s.partnerName
      }));
    } else if (activeView === 'material') {
      rows = MATERIAL_COST_DISTRIBUTION.map(m => ({
        'Material Category': m.category,
        'Description': m.description,
        'Amount (INR)': m.amount,
        'Share (%)': `${m.percentage}%`
      }));
    } else {
      rows = PARTNER_COST_DISTRIBUTION.map(p => ({
        'Partner ID': p.partnerId,
        'Partner Name': p.partnerName,
        'Role & Location': `${p.role} (${p.location})`,
        'Capital Invested (INR)': p.capitalInvested,
        'Total Spent (INR)': p.amount,
        'Share of Portfolio (%)': `${p.percentage}%`
      }));
    }
    exportToExcel(rows, `Shivshakti_Cost_Distribution_${activeView.toUpperCase()}.xlsx`, 'Cost Distribution');
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Cost Distribution Summary Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
              <PieIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Cost Distribution Dashboard (₹1.25 Crore Multi-Site Portfolio)
                </h3>
                <span className="badge badge-info font-bold">Total: ₹1,25,00,000</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete capital allocation analysis by Site, Material Category, and Partner Share (Each Site &le; ₹50 Lakh).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleExportDistribution}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-medium"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export {activeView.toUpperCase()} Breakdown</span>
            </button>
          </div>
        </div>

        {/* 3 View Tabs: [View By Site] [View By Material] [View By Partner] */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl space-x-1">
            <button
              onClick={() => setActiveView('site')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeView === 'site'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>View By Site</span>
            </button>
            <button
              onClick={() => setActiveView('material')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeView === 'material'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>View By Material</span>
            </button>
            <button
              onClick={() => setActiveView('partner')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center space-x-2 ${
                activeView === 'partner'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>View By Partner</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Currently Showing: <strong className="text-slate-900 uppercase font-bold">By {activeView}</strong> &bull; Total Portfolio Budget: <strong className="text-blue-600 font-mono font-bold">₹1,25,00,000 (100%)</strong>
          </div>
        </div>
      </div>

      {/* VIEW 1: BY SITE */}
      {activeView === 'site' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Table (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Site-Wise Expenditure Allocation</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-semibold text-left">
                      <th className="py-2.5 px-3">Project Site</th>
                      <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                      <th className="py-2.5 px-3 text-center">% Share</th>
                      <th className="py-2.5 px-3">Visual Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SITE_COST_DISTRIBUTION.map((item) => (
                      <tr key={item.projectId} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{item.projectName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{item.projectId} &bull; {item.district}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700">
                            {item.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 min-w-[140px]">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${item.percentage}%`, backgroundColor: item.color }} 
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                      <td className="py-3 px-3">TOTAL PROJECT COST</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600">{formatCurrency(TOTAL_PROJECT_COST)}</td>
                      <td className="py-3 px-3 text-center">100%</td>
                      <td className="py-3 px-3 text-slate-500 font-normal text-[11px]">3 Key Construction Hubs</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pie Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Site Cost Distribution Ratio
              </span>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={SITE_COST_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="amount"
                      nameKey="projectName"
                    >
                      {SITE_COST_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name, props) => [`${formatCurrency(val)} (${props.payload.percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '11px', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col space-y-1.5 w-full mt-2">
                {SITE_COST_DISTRIBUTION.map((site) => (
                  <div key={site.projectId} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-50">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: site.color }} />
                      <span className="text-slate-800 font-medium truncate">{site.projectName}</span>
                    </div>
                    <span className="font-semibold text-slate-900 ml-2 font-mono shrink-0">
                      {formatLakhsOrCrores(site.amount)} ({site.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: BY MATERIAL */}
      {activeView === 'material' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Table (7 Cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Material & Resource Category Allocation</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-semibold text-left">
                      <th className="py-2.5 px-3">Material Category</th>
                      <th className="py-2.5 px-3 text-right">Cost (₹)</th>
                      <th className="py-2.5 px-3 text-center">% Share</th>
                      <th className="py-2.5 px-3">Distribution Bar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {MATERIAL_COST_DISTRIBUTION.map((item) => (
                      <tr key={item.category} className="hover:bg-slate-50/80">
                        <td className="py-3 px-3">
                          <span className="font-semibold text-slate-900 block">{item.category}</span>
                          <span className="text-[11px] text-slate-400">{item.description}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono">
                          {formatCurrency(item.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md font-bold text-xs bg-blue-50 text-blue-700">
                            {item.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 min-w-[130px]">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${item.percentage * 2.5}%`, backgroundColor: item.color }} 
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                      <td className="py-3 px-3">TOTAL PROJECT EXPENDITURE</td>
                      <td className="py-3 px-3 text-right font-mono text-blue-600">{formatCurrency(TOTAL_PROJECT_COST)}</td>
                      <td className="py-3 px-3 text-center">100%</td>
                      <td className="py-3 px-3 text-slate-500 font-normal text-[11px]">Consolidated 6 Major Cost Heads</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Pie Chart (5 Cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Material & Cost Head Ratio
              </span>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={MATERIAL_COST_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="amount"
                      nameKey="category"
                    >
                      {MATERIAL_COST_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val, name, props) => [`${formatCurrency(val)} (${props.payload.percentage}%)`, name]}
                      contentStyle={{ backgroundColor: '#0F172A', borderRadius: '8px', color: '#FFF', fontSize: '11px', border: 'none' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-col space-y-1.5 w-full mt-2">
                {MATERIAL_COST_DISTRIBUTION.map((mat) => (
                  <div key={mat.category} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-slate-50">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: mat.color }} />
                      <span className="text-slate-800 font-medium truncate">{mat.category}</span>
                    </div>
                    <span className="font-semibold text-slate-900 ml-2 font-mono shrink-0">
                      {formatLakhsOrCrores(mat.amount)} ({mat.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: BY PARTNER (Includes PARTNER EXPENSE BREAKDOWN) */}
      {activeView === 'partner' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Main Partner Table with "View Details ▼" */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Cost Distribution &mdash; By Partner Share</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click on any partner row or <strong>View Details ▼</strong> to inspect their itemized expense breakdown.
                </p>
              </div>
              <span className="badge badge-info">3 Remote Partners</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200/80 text-slate-600 font-semibold text-left">
                    <th className="py-2.5 px-3">Partner Name & Scope</th>
                    <th className="py-2.5 px-3 text-right">Capital Invested</th>
                    <th className="py-2.5 px-3 text-right">Total Spent (₹)</th>
                    <th className="py-2.5 px-3 text-center">% Share of Portfolio</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PARTNER_COST_DISTRIBUTION.map((p) => {
                    const isExpanded = expandedPartnerId === p.partnerId;

                    return (
                      <tr 
                        key={p.partnerId} 
                        className={`transition-colors cursor-pointer ${isExpanded ? 'bg-blue-50/40' : 'hover:bg-slate-50/80'}`}
                        onClick={() => setExpandedPartnerId(isExpanded ? null : p.partnerId)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 font-bold flex items-center justify-center text-xs">
                              {p.partnerId}
                            </span>
                            <div>
                              <span className="font-bold text-slate-900 block">{p.partnerName}</span>
                              <span className="text-[11px] text-slate-400">{p.role} &bull; {p.location}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-medium text-slate-600 font-mono">
                          {formatCurrency(p.capitalInvested)}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-sm">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2.5 py-1 rounded-md font-bold text-xs bg-blue-50 text-blue-700">
                            {p.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedPartnerId(isExpanded ? null : p.partnerId);
                            }}
                            className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                              isExpanded
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                    <td className="py-3 px-3">TOTAL PORTFOLIO EXPENDITURE</td>
                    <td className="py-3 px-3 text-right font-mono">₹1,30,00,000</td>
                    <td className="py-3 px-3 text-right font-mono text-blue-600 text-sm">₹1,25,00,000</td>
                    <td className="py-3 px-3 text-center">100%</td>
                    <td className="py-3 px-3 text-center text-slate-400 font-normal text-[11px]">3 Partners</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* EXPANDED PARTNER EXPENSE BREAKDOWN ACCORDION */}
          {expandedPartnerId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span>Itemized Breakdown for Partner {expandedPartnerId}</span>
                </h4>
                <div className="flex items-center space-x-2">
                  {PARTNER_COST_DISTRIBUTION.map(p => (
                    <button
                      key={p.partnerId}
                      onClick={() => setExpandedPartnerId(p.partnerId)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        expandedPartnerId === p.partnerId
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p.partnerName.split(' ')[0]} ({p.partnerId})
                    </button>
                  ))}
                </div>
              </div>

              <PartnerExpenseBreakdown 
                partnerId={expandedPartnerId} 
                showTitle={true}
                allowDrillDown={true}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
