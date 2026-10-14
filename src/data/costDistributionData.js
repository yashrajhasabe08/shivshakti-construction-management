// Cost Distribution Dataset & Calculations for Shivshakti Construction ERP (₹1.25 Crore Total Project Cost, All Sites <= ₹50 Lakh)

export const TOTAL_PROJECT_COST = 12500000; // ₹1,25,00,000 (1.25 Cr Portfolio Total)

// 1. Distribution by Site (PRJ-001, PRJ-002, PRJ-003 - Each <= ₹50,00,000)
export const SITE_COST_DISTRIBUTION = [
  {
    projectId: 'PRJ-001',
    projectName: 'Shivshakti Commercial Tower',
    district: 'Pune',
    division: 'Haveli',
    amount: 4500000, // ₹45,00,000
    percentage: 36,
    color: '#2563EB',
    partnerName: 'Rajesh Patel (P1)'
  },
  {
    projectId: 'PRJ-002',
    projectName: 'Marine Drive Residency',
    district: 'Mumbai',
    division: 'Worli',
    amount: 4800000, // ₹48,00,000
    percentage: 38.4,
    color: '#3B82F6',
    partnerName: 'Suresh Sharma (P2)'
  },
  {
    projectId: 'PRJ-003',
    projectName: 'Nagpur Logistics Hub',
    district: 'Nagpur',
    division: 'Hingna',
    amount: 3200000, // ₹32,00,000
    percentage: 25.6,
    color: '#60A5FA',
    partnerName: 'Vikram Deshmukh (P3)'
  }
];

// 2. Distribution by Material Category (Consolidated 6 Main Categories totaling ₹1,25,00,000)
export const MATERIAL_COST_DISTRIBUTION = [
  {
    category: 'Cement & Concrete',
    amount: 1800000, // ₹18,00,000
    percentage: 14.4,
    color: '#0284C7',
    description: 'OPC/PPC bagged cement, ready-mix transit concrete & pre-cast columns'
  },
  {
    category: 'Steel & TMT Bars',
    amount: 3400000, // ₹34,00,000
    percentage: 27.2,
    color: '#2563EB',
    description: 'Fe550D primary TMT reinforcement bars, binding wires & structural steel'
  },
  {
    category: 'Sand & Aggregates',
    amount: 900000, // ₹9,00,000
    percentage: 7.2,
    color: '#F59E0B',
    description: 'Washed river sand, M-sand, crushed 10mm/20mm gravel & metal aggregates'
  },
  {
    category: 'Labour & Wages',
    amount: 3800000, // ₹38,00,000
    percentage: 30.4,
    color: '#10B981',
    description: 'Daily & weekly wage payouts for skilled masons, helpers & site supervisors'
  },
  {
    category: 'Subcontractor Bills',
    amount: 1800000, // ₹18,00,000
    percentage: 14.4,
    color: '#8B5CF6',
    description: 'Turnkey electrical cabling, HVAC ducting, plumbing & fabrication works'
  },
  {
    category: 'Miscellaneous & Utilities',
    amount: 800000, // ₹8,00,000
    percentage: 6.4,
    color: '#64748B',
    description: 'Diesel fuel logs, municipal NOC permits & site petty cash vouchers'
  }
];

// 3. Distribution by Partner Share (Total: ₹1.25 Cr Portfolio, Each <= ₹50 Lakh)
export const PARTNER_COST_DISTRIBUTION = [
  {
    partnerId: 'P1',
    partnerName: 'Rajesh Patel',
    role: 'Managing Partner - Commercial & Kolhapur',
    location: 'Pune',
    amount: 4500000, // ₹45,00,000
    percentage: 36,
    color: '#2563EB',
    capitalInvested: 4500000
  },
  {
    partnerId: 'P2',
    partnerName: 'Suresh Sharma',
    role: 'Partner - Residential & High-Rise',
    location: 'Mumbai',
    amount: 4800000, // ₹48,00,000
    percentage: 38.4,
    color: '#0EA5E9',
    capitalInvested: 5000000
  },
  {
    partnerId: 'P3',
    partnerName: 'Vikram Deshmukh',
    role: 'Partner - Infrastructure & Heavy Earthwork',
    location: 'Nagpur',
    amount: 3200000, // ₹32,00,000
    percentage: 25.6,
    color: '#10B981',
    capitalInvested: 3500000
  }
];

// 4. Partner-Wise Expense Breakdown (All 7 Categories)
export const PARTNER_EXPENSE_BREAKDOWNS = {
  P1: {
    partnerId: 'P1',
    partnerName: 'Rajesh Patel',
    location: 'Pune',
    totalSpent: 4500000, // ₹45,00,000
    capitalInvested: 4500000,
    breakdown: [
      { category: 'Cement (OPC / PPC)', amount: 600000, percentage: 13.3, color: '#0284C7' },
      { category: 'Steel (TMT Bars & Rods)', amount: 1200000, percentage: 26.7, color: '#2563EB' },
      { category: 'Sand & Aggregates', amount: 350000, percentage: 7.8, color: '#F59E0B' },
      { category: 'Concrete (Ready Mix & Precast)', amount: 850000, percentage: 18.9, color: '#06B6D4' },
      { category: 'Labour & Wages', amount: 1000000, percentage: 22.2, color: '#10B981' },
      { category: 'Subcontractors', amount: 400000, percentage: 8.9, color: '#8B5CF6' },
      { category: 'Site Petty & Utilities', amount: 100000, percentage: 2.2, color: '#64748B' }
    ],
    sampleTransactions: [
      { date: '2026-09-01', category: 'Cement (OPC / PPC)', description: 'OPC 53 Grade Cement - 400 bags', amount: 200000, project: 'Shivshakti Commercial Tower (PRJ-001)' },
      { date: '2026-09-02', category: 'Steel (TMT Bars & Rods)', description: 'TMT Steel Bars 8mm & 10mm (5 MT)', amount: 300000, project: 'Shivshakti Commercial Tower (PRJ-001)' },
      { date: '2026-09-05', category: 'Sand & Aggregates', description: 'River Sand & 20mm Aggregates (150 cum)', amount: 150000, project: 'Shivshakti Commercial Tower (PRJ-001)' },
      { date: '2026-09-10', category: 'Concrete (Ready Mix & Precast)', description: 'M20 Grade Ready-Mix Concrete', amount: 127500, project: 'Shivshakti Commercial Tower (PRJ-001)' },
      { date: '2026-09-12', category: 'Labour & Wages', description: 'Weekly muster wages (15 masons, 30 helpers)', amount: 185000, project: 'Karveer Commercial Complex (PRJ-KOL-02)' },
      { date: '2026-09-15', category: 'Subcontractors', description: 'HVAC Ducting & Electrical Conduits Stage 2', amount: 250000, project: 'Shivshakti Commercial Tower (PRJ-001)' },
      { date: '2026-09-18', category: 'Site Petty & Utilities', description: 'Diesel for batching plant & municipal fee', amount: 35000, project: 'Pune Highway Expansion (PRJ-004)' }
    ]
  },
  P2: {
    partnerId: 'P2',
    partnerName: 'Suresh Sharma',
    location: 'Mumbai',
    totalSpent: 4800000, // ₹48,00,000
    capitalInvested: 5000000,
    breakdown: [
      { category: 'Cement (OPC / PPC)', amount: 650000, percentage: 13.5, color: '#0284C7' },
      { category: 'Steel (TMT Bars & Rods)', amount: 1300000, percentage: 27.1, color: '#2563EB' },
      { category: 'Sand & Aggregates', amount: 400000, percentage: 8.3, color: '#F59E0B' },
      { category: 'Concrete (Ready Mix & Precast)', amount: 950000, percentage: 19.8, color: '#06B6D4' },
      { category: 'Labour & Wages', amount: 1050000, percentage: 21.9, color: '#10B981' },
      { category: 'Subcontractors', amount: 350000, percentage: 7.3, color: '#8B5CF6' },
      { category: 'Site Petty & Utilities', amount: 100000, percentage: 2.1, color: '#64748B' }
    ],
    sampleTransactions: [
      { date: '2026-09-03', category: 'Steel (TMT Bars & Rods)', description: 'TMT Steel Bars 16mm Fe550D (4 Tons)', amount: 232000, project: 'Marine Drive Residency (PRJ-002)' },
      { date: '2026-09-04', category: 'Cement (OPC / PPC)', description: 'UltraTech OPC 53 Grade - 450 bags', amount: 225000, project: 'Marine Drive Residency (PRJ-002)' },
      { date: '2026-09-08', category: 'Concrete (Ready Mix & Precast)', description: 'RMC Grade M35 High-Rise Pumping', amount: 280000, project: 'Marine Drive Residency (PRJ-002)' },
      { date: '2026-09-14', category: 'Labour & Wages', description: 'Muster roll high-rise formwork crew', amount: 210000, project: 'Marine Drive Residency (PRJ-002)' },
      { date: '2026-09-16', category: 'Subcontractors', description: 'Curtain wall glazing & aluminum facade', amount: 250000, project: 'Marine Drive Residency (PRJ-002)' }
    ]
  },
  P3: {
    partnerId: 'P3',
    partnerName: 'Vikram Deshmukh',
    location: 'Nagpur',
    totalSpent: 3200000, // ₹32,00,000
    capitalInvested: 3500000,
    breakdown: [
      { category: 'Cement (OPC / PPC)', amount: 420000, percentage: 13.1, color: '#0284C7' },
      { category: 'Steel (TMT Bars & Rods)', amount: 850000, percentage: 26.6, color: '#2563EB' },
      { category: 'Sand & Aggregates', amount: 260000, percentage: 8.1, color: '#F59E0B' },
      { category: 'Concrete (Ready Mix & Precast)', amount: 640000, percentage: 20.0, color: '#06B6D4' },
      { category: 'Labour & Wages', amount: 720000, percentage: 22.5, color: '#10B981' },
      { category: 'Subcontractors', amount: 250000, percentage: 7.8, color: '#8B5CF6' },
      { category: 'Site Petty & Utilities', amount: 60000, percentage: 1.9, color: '#64748B' }
    ],
    sampleTransactions: [
      { date: '2026-09-06', category: 'Concrete (Ready Mix & Precast)', description: 'RMC Grade M30 Warehouse Flooring', amount: 189000, project: 'Nagpur Logistics Hub (PRJ-003)' },
      { date: '2026-09-07', category: 'Steel (TMT Bars & Rods)', description: 'PEB Warehouse Structural Columns', amount: 350000, project: 'Nagpur Logistics Hub (PRJ-003)' },
      { date: '2026-09-11', category: 'Labour & Wages', description: 'Earthwork excavators & operators muster', amount: 145000, project: 'Nagpur Logistics Hub (PRJ-003)' },
      { date: '2026-09-15', category: 'Subcontractors', description: 'Industrial PU flooring & epoxy coat', amount: 220000, project: 'Nagpur Logistics Hub (PRJ-003)' }
    ]
  }
};
