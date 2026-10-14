import React, { useState } from 'react';
import { 
  PieChart as PieIcon, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Building,
  CheckCircle2,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { PARTNER_EXPENSE_BREAKDOWNS } from '../data/costDistributionData';

const COLORS = [
  '#0284C7', // Cement - Sky Blue
  '#2563EB', // Steel - Royal Blue
  '#F59E0B', // Sand - Amber
  '#06B6D4', // Concrete - Cyan
  '#10B981', // Labour - Emerald
  '#8B5CF6', // Subcontractors - Purple
  '#64748B'  // Petty & Utilities - Slate
];

export default function PartnerExpenseBreakdown({ 
  partnerId = 'P1', 
  partnerName, 
  totalSpent, 
  customBreakdown = null,
  showTitle = true,
  allowDrillDown = true
}) {
  const defaultData = PARTNER_EXPENSE_BREAKDOWNS[partnerId] || PARTNER_EXPENSE_BREAKDOWNS.P1;
  const name = partnerName || defaultData.partnerName;
  const total = totalSpent || defaultData.totalSpent;
  const breakdown = customBreakdown || defaultData.breakdown;
  const sampleTransactions = defaultData.sampleTransactions || [];

  const [selectedCategory, setSelectedCategory] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const chartData = breakdown.map((item, idx) => ({
    name: item.category,
    value: item.amount,
    percentage: item.percentage,
    color: item.color || COLORS[idx % COLORS.length]
  }));

  // Filter transactions for drill-down
  const filteredTransactions = selectedCategory
    ? sampleTransactions.filter(t => t.category.toLowerCase().includes(selectedCategory.toLowerCase()) || selectedCategory.toLowerCase().includes(t.category.toLowerCase()))
    : sampleTransactions;

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6 animate-in fade-in duration-200">
      {/* Title & Header */}
      {showTitle && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="badge badge-info font-mono">{partnerId}</span>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {name} &bull; Expense Breakdown
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Itemized allocation of {formatCurrency(total)} across all 7 construction cost categories.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block font-medium uppercase tracking-wider">Total Spent</span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {formatCurrency(total)}
            </span>
          </div>
        </div>
      )}

      {/* Grid: Breakdown Table & Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Table & Progress Bars (7 Cols) */}
        <div className="lg:col-span-7 space-y-3.5">
          <div className="overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/30">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-100/70 text-slate-600 font-semibold text-left">
                  <th className="py-2.5 px-3">Material Category</th>
                  <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                  <th className="py-2.5 px-3 text-center">Share</th>
                  <th className="py-2.5 px-3">Distribution Bar</th>
                  {allowDrillDown && <th className="py-2.5 px-2 text-center">Drill-Down</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {breakdown.map((item, idx) => {
                  const color = item.color || COLORS[idx % COLORS.length];
                  const isSelected = selectedCategory === item.category;

                  return (
                    <tr 
                      key={item.category} 
                      className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center space-x-2">
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0" 
                          style={{ backgroundColor: color }} 
                        />
                        <span>{item.category}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-900 font-mono">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-700">
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 min-w-[120px]">
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(100, item.percentage * 3.5)}%`, 
                              backgroundColor: color 
                            }} 
                          />
                        </div>
                      </td>
                      {allowDrillDown && (
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(isSelected ? null : item.category)}
                            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {isSelected ? 'Viewing' : 'Details'}
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td className="py-2.5 px-3 uppercase tracking-wider text-[11px]">TOTAL EXPENDITURE</td>
                  <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(total)}</td>
                  <td className="py-2.5 px-3 text-center">100%</td>
                  <td colSpan={allowDrillDown ? 2 : 1} className="py-2.5 px-3 text-right text-[11px] text-slate-500 font-normal">
                    Fully Categorized
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Pie Chart Visual (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-slate-50/50 rounded-xl border border-slate-100">
          <div className="w-full text-center mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {name} &bull; % Split Visual
            </span>
          </div>
          
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => [
                    `${formatCurrency(value)} (${props.payload.percentage}%)`,
                    props.payload.name
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    border: 'none'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Legend Tags */}
          <div className="flex flex-wrap justify-center gap-1.5 mt-2 max-w-sm">
            {chartData.map((entry) => (
              <span 
                key={entry.name}
                className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium bg-white border border-slate-200 text-slate-700"
              >
                <span 
                  className="w-2 h-2 rounded-full mr-1.5 shrink-0" 
                  style={{ backgroundColor: entry.color }} 
                />
                {entry.name.split(' ')[0]}: {entry.percentage}%
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-Down Section (Optional Drill-Down as specified in Step 3 of prompt) */}
      {allowDrillDown && selectedCategory && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50/40 border border-blue-200/80 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h4 className="text-xs font-bold text-slate-900">
                Drill-Down: {selectedCategory} Expenses &bull; Partner {partnerId} ({name})
              </h4>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1"
            >
              ✕ Close Drill-Down
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-blue-100 bg-white">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-left font-semibold">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Description</th>
                  <th className="py-2 px-3">Project Site</th>
                  <th className="py-2 px-3 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-4 text-xs text-slate-400">
                      No specific micro-vouchers recorded for this category yet.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">{tx.date}</td>
                      <td className="py-2 px-3 font-medium text-slate-900">{tx.description}</td>
                      <td className="py-2 px-3 text-slate-600">{tx.project}</td>
                      <td className="py-2 px-3 text-right font-semibold text-slate-900 font-mono">
                        {formatCurrency(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
