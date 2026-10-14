import React, { useMemo, useState } from 'react';
import { 
  Building, 
  MapPin, 
  Download, 
  User, 
  Calendar, 
  ChevronRight, 
  ArrowLeft, 
  Plus, 
  Receipt, 
  DollarSign, 
  Users, 
  HardHat, 
  CheckCircle2, 
  Layers, 
  Search,
  FileSpreadsheet,
  Building2,
  FolderTree,
  HelpCircle,
  Info,
  Edit3,
  Trash2,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { exportToExcel } from '../utils/excelExport';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';

const inputClasses = 'w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all';
const selectClasses = 'w-full bg-white border border-[#E5E7EB] rounded-[10px] px-3.5 py-2.5 text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer';

export default function ProjectsView({ 
  data, 
  selectedPartner, 
  onSaveProject, 
  onEditProject,
  onDeleteProject,
  onSaveExpense,
  onDeleteExpense
}) {
  // Navigation drill-down state: 'districts' -> 'divisions' -> 'sites' -> 'siteDetail'
  const [displayMode, setDisplayMode] = useState('hierarchy'); // 'hierarchy' | 'table'
  const [deleteProjectTarget, setDeleteProjectTarget] = useState(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState(null);
  const [viewLevel, setViewLevel] = useState('districts');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState(null);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState('ALL');
  const [expenseSearch, setExpenseSearch] = useState('');

  const [siteExpenseForm, setSiteExpenseForm] = useState({
    category: 'Diesel & Machinery Fuel',
    expenseTitle: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    paidBy: '',
    receiptNo: ''
  });

  const [formState, setFormState] = useState({
    name: '',
    district: 'Kolhapur',
    division: 'Karveer',
    location: '',
    clientName: '',
    startDate: '',
    targetEndDate: '',
    budget: '',
    status: 'In Progress',
    partnerName: 'Rajesh Patel',
    actualCost: '',
    completionPercent: '',
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // Filter projects by partner if partner filter is active
  const filteredProjects = useMemo(() => {
    return (data.projects || []).filter((p) => {
      if (selectedPartner === 'ALL') return true;
      return p.partnerId === selectedPartner;
    });
  }, [data.projects, selectedPartner]);

  // Build hierarchy tree: District -> Division -> Sites
  const hierarchy = useMemo(() => {
    const tree = {};
    filteredProjects.forEach((p) => {
      const dist = p.district || (p.location?.includes('Kolhapur') ? 'Kolhapur' : p.location?.includes('Pune') ? 'Pune' : p.location?.includes('Mumbai') ? 'Mumbai' : p.location?.includes('Nagpur') ? 'Nagpur' : 'Other Districts');
      const div = p.division || 'Main Division';

      if (!tree[dist]) {
        tree[dist] = {
          name: dist,
          divisions: {},
          totalBudget: 0,
          totalActualCost: 0,
          sitesCount: 0
        };
      }

      if (!tree[dist].divisions[div]) {
        tree[dist].divisions[div] = {
          name: div,
          district: dist,
          sites: [],
          totalBudget: 0,
          totalActualCost: 0,
          sitesCount: 0
        };
      }

      tree[dist].divisions[div].sites.push(p);
      tree[dist].divisions[div].totalBudget += (p.budget || 0);
      tree[dist].divisions[div].totalActualCost += (p.actualCost || 0);
      tree[dist].divisions[div].sitesCount += 1;

      tree[dist].totalBudget += (p.budget || 0);
      tree[dist].totalActualCost += (p.actualCost || 0);
      tree[dist].sitesCount += 1;
    });

    return tree;
  }, [filteredProjects]);

  const projectDistricts = useMemo(() => {
    const set = new Set((filteredProjects || []).map(p => p.district).filter(Boolean));
    return Array.from(set);
  }, [filteredProjects]);

  const projectColumns = [
    {
      key: 'name',
      header: 'Site Name & ID',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-[#2563EB] font-bold flex items-center justify-center text-xs shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs">{val}</span>
            <span className="text-[10px] text-slate-400 font-mono">{row.id}</span>
          </div>
        </div>
      )
    },
    {
      key: 'district',
      header: 'District / Division',
      render: (val, row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800 block">{val || 'Other'}</span>
          <span className="text-[11px] text-slate-400 font-medium">{row.division || 'Main'}</span>
        </div>
      )
    },
    {
      key: 'clientName',
      header: 'Client / Authority',
      render: (val) => (
        <span className="text-xs text-slate-700 font-medium">{val || 'Private'}</span>
      )
    },
    {
      key: 'partnerName',
      header: 'Partner In-Charge',
      render: (val) => (
        <span className="badge badge-info text-[11px] font-medium">{val}</span>
      )
    },
    {
      key: 'budget',
      header: 'Approved Budget',
      align: 'right',
      render: (val) => (
        <span className="font-bold text-slate-900 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'actualCost',
      header: 'Actual Spent',
      align: 'right',
      render: (val) => (
        <span className="font-medium text-slate-700 font-mono text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      key: 'completionPercent',
      header: 'Completion %',
      render: (val) => {
        const pct = val || 0;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-[#2563EB]'}`} 
                style={{ width: `${Math.min(pct, 100)}%` }} 
              />
            </div>
            <span className="text-xs font-semibold text-slate-700 font-mono">{pct}%</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (val) => (
        <span className={`badge ${val === 'Completed' ? 'badge-success' : 'badge-info'}`}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            type="button"
            onClick={() => {
              setSelectedSiteId(row.id);
              setViewLevel('siteDetail');
              setDisplayMode('hierarchy');
            }}
            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#2563EB] rounded-lg text-xs font-medium transition-colors"
            title="Open Site Explorer & Expenses"
          >
            Site Details &rarr;
          </button>
          <button
            type="button"
            onClick={() => onEditProject ? onEditProject(row) : null}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Project"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteProjectTarget(row)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Project"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const selectedSite = useMemo(() => {
    return (data.projects || []).find((p) => p.id === selectedSiteId) || null;
  }, [data.projects, selectedSiteId]);

  // Aggregate ALL expenses (major & minor) for a particular site (Requirement 3)
  const siteExpenses = useMemo(() => {
    if (!selectedSite) return [];

    const pId = selectedSite.id;
    const pName = selectedSite.name?.toLowerCase().trim();
    const list = [];

    // 1. Purchase Bills (Material Bills)
    const projectPOs = (data.purchaseOrders || []).filter(
      po => po.projectId === pId || po.projectName?.toLowerCase().includes(pName) || pName.includes(po.projectName?.toLowerCase() || '')
    );
    const poRefMap = new Map();
    projectPOs.forEach(po => poRefMap.set(po.poNumber, po));

    (data.purchaseBills || []).forEach(pb => {
      const matchedPO = poRefMap.get(pb.poRef);
      if (matchedPO || pb.projectId === pId || pb.projectName?.toLowerCase().includes(pName)) {
        list.push({
          id: pb.id,
          source: 'purchaseBills',
          date: pb.billDate,
          type: 'Material Purchase Bill',
          categoryKey: 'materials',
          categoryLabel: 'Materials & Supplies',
          title: pb.supplierName,
          reference: `${pb.billNumber} (PO: ${pb.poRef || 'Direct'})`,
          payee: pb.supplierName,
          amount: pb.totalBillAmount || (pb.baseAmount + (pb.gstAmount || 0)),
          status: pb.paymentStatus || 'Approved',
          statusColor: pb.paymentStatus === 'Paid' ? 'badge-success' : pb.paymentStatus === 'Partially Paid' ? 'badge-warning' : 'badge-neutral'
        });
      }
    });

    // 2. Subcontractors (Contracts & Billed amounts)
    (data.subcontractors || []).forEach(sub => {
      if (sub.projectId === pId || sub.projectName?.toLowerCase().includes(pName) || pName.includes(sub.projectName?.toLowerCase() || '')) {
        list.push({
          id: sub.id,
          source: 'subcontractors',
          date: 'Contract Active',
          type: 'Subcontractor Billing',
          categoryKey: 'subcontractors',
          categoryLabel: 'Subcontracting',
          title: `${sub.name} (${sub.workType})`,
          reference: `Contract Ref: ${sub.id}`,
          payee: sub.name,
          amount: sub.totalBilled || sub.contractValue,
          status: sub.pendingBalance === 0 ? 'Fully Paid' : `Due: ${formatCurrency(sub.pendingBalance)}`,
          statusColor: sub.pendingBalance === 0 ? 'badge-success' : 'badge-warning'
        });
      }
    });

    // 3. Labour Wages Muster
    (data.labourWages || []).forEach(lw => {
      if (lw.projectId === pId || lw.projectName?.toLowerCase().includes(pName) || pName.includes(lw.projectName?.toLowerCase() || '')) {
        list.push({
          id: lw.id,
          source: 'labourWages',
          date: lw.weekEndingDate,
          type: 'Labour Wage Muster',
          categoryKey: 'labour',
          categoryLabel: 'Labour Wages',
          title: `Weekly Muster (${lw.masonCount} Masons, ${lw.helperCount} Helpers - ${lw.daysWorked} Days)`,
          reference: lw.id,
          payee: 'Site Labour Muster Gang',
          amount: lw.totalWeeklyWage,
          status: lw.status || 'Paid',
          statusColor: lw.status === 'Paid' ? 'badge-success' : 'badge-info'
        });
      }
    });

    // 4. Other Expenses / Site Petty Cash, Fuel, Permits
    (data.otherExpenses || []).forEach(exp => {
      if (exp.projectId === pId || exp.projectName?.toLowerCase().includes(pName) || pName.includes(exp.projectName?.toLowerCase() || '')) {
        list.push({
          id: exp.id,
          source: 'otherExpenses',
          date: exp.date,
          type: 'Site Petty Cash & Operations',
          categoryKey: 'petty',
          categoryLabel: exp.category || 'Petty Cash',
          title: exp.expenseTitle || exp.name,
          reference: exp.receiptNo ? `Voucher: ${exp.receiptNo}` : exp.id,
          payee: exp.paidBy || 'Site Imprest',
          amount: exp.amount,
          status: 'Paid / Reimbursed',
          statusColor: 'badge-success'
        });
      }
    });

    return list;
  }, [selectedSite, data]);

  // Filtered site expenses for display
  const filteredSiteExpenses = useMemo(() => {
    return siteExpenses.filter(e => {
      const matchesCategory = expenseFilter === 'ALL' || e.categoryKey === expenseFilter;
      const matchesSearch = !expenseSearch || 
        e.title?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        e.payee?.toLowerCase().includes(expenseSearch.toLowerCase()) ||
        e.reference?.toLowerCase().includes(expenseSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [siteExpenses, expenseFilter, expenseSearch]);

  // Calculate expense category totals for site
  const siteExpenseMetrics = useMemo(() => {
    let materials = 0;
    let subcontractors = 0;
    let labour = 0;
    let petty = 0;

    siteExpenses.forEach(e => {
      if (e.categoryKey === 'materials') materials += (e.amount || 0);
      else if (e.categoryKey === 'subcontractors') subcontractors += (e.amount || 0);
      else if (e.categoryKey === 'labour') labour += (e.amount || 0);
      else if (e.categoryKey === 'petty') petty += (e.amount || 0);
    });

    const total = materials + subcontractors + labour + petty;
    return { materials, subcontractors, labour, petty, total };
  }, [siteExpenses]);

  // Master Excel Export for Projects
  const handleExport = () => {
    const exportData = filteredProjects.map((p) => ({
      'Project ID': p.id,
      'District': p.district || 'N/A',
      'Division / Taluka': p.division || 'N/A',
      'Site Name': p.name,
      'Location': p.location,
      'Partner In-Charge': p.partnerName,
      'Client Name': p.clientName,
      'Budget (INR)': p.budget,
      'Actual Cost Spent (INR)': p.actualCost,
      'Start Date': p.startDate,
      'Target End Date': p.targetEndDate,
      'Status': p.status,
      'Completion %': `${p.completionPercent}%`,
    }));
    exportToExcel(exportData, 'Shivshakti_District_Sites_Ledger.xlsx', 'Sites Hierarchy');
  };

  // Export specific site combined expenses
  const handleExportSiteExpenses = () => {
    if (!selectedSite) return;
    const rows = siteExpenses.map(e => ({
      'Site Name': selectedSite.name,
      'District': selectedSite.district,
      'Division': selectedSite.division,
      'Date': e.date,
      'Expense Type': e.type,
      'Category': e.categoryLabel,
      'Description': e.title,
      'Reference / Voucher': e.reference,
      'Payee / Party': e.payee,
      'Amount (INR)': e.amount,
      'Status': e.status
    }));
    exportToExcel(rows, `${selectedSite.name.replace(/\s+/g, '_')}_Complete_Expenses.xlsx`, 'Site Expenses');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.clientName) return;

    const budgetVal = Number(formState.budget) || 0;
    if (budgetVal <= 0) {
      alert('Project budget must be greater than ₹0.');
      return;
    }
    if (budgetVal > 5000000) {
      alert('Project budget cannot exceed ₹50,00,000 (50 Lakhs) as per ERP policy limit.');
      return;
    }

    const newProject = {
      id: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      name: formState.name,
      district: formState.district || 'Kolhapur',
      division: formState.division || 'Karveer',
      location: formState.location || `${formState.division}, ${formState.district}`,
      partnerId: formState.partnerName === 'Rajesh Patel' ? 'P1' : formState.partnerName === 'Suresh Sharma' ? 'P2' : 'P3',
      partnerName: formState.partnerName,
      clientName: formState.clientName,
      budget: budgetVal,
      actualCost: Number(formState.actualCost) || 0,
      startDate: formState.startDate || new Date().toISOString().slice(0, 10),
      targetEndDate: formState.targetEndDate,
      status: formState.status,
      completionPercent: Number(formState.completionPercent) || 0,
      description: 'New site record added to district hierarchy.',
    };

    onSaveProject(newProject);
    setShowAddForm(false);
    setFormState({
      name: '',
      district: 'Kolhapur',
      division: 'Karveer',
      location: '',
      clientName: '',
      startDate: '',
      targetEndDate: '',
      budget: '',
      status: 'In Progress',
      partnerName: 'Rajesh Patel',
      actualCost: '',
      completionPercent: '',
    });
  };

  // Navigation Drill-Down Handlers
  const handleSelectDistrict = (distName) => {
    setSelectedDistrict(distName);
    setSelectedDivision(null);
    setSelectedSiteId(null);
    setViewLevel('divisions');
  };

  const handleSelectDivision = (divName) => {
    setSelectedDivision(divName);
    setSelectedSiteId(null);
    setViewLevel('sites');
  };

  const handleSelectSite = (siteId) => {
    setSelectedSiteId(siteId);
    setViewLevel('siteDetail');
  };

  const handleGoBack = () => {
    if (viewLevel === 'siteDetail') {
      setViewLevel('sites');
      setSelectedSiteId(null);
    } else if (viewLevel === 'sites') {
      setViewLevel('divisions');
      setSelectedDivision(null);
    } else if (viewLevel === 'divisions') {
      setViewLevel('districts');
      setSelectedDistrict(null);
    }
  };

  // Rollup numbers for whole active filtered view
  const globalTotalBudget = filteredProjects.reduce((s, p) => s + (p.budget || 0), 0);
  const globalTotalSpent = filteredProjects.reduce((s, p) => s + (p.actualCost || 0), 0);

  return (
    <div className="space-y-6 pb-8 font-sans">
      {/* Top Header & Breadcrumb Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-semibold text-slate-900 tracking-tight">
                    {MODULE_DESCRIPTIONS.projects.title}
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
                            <p className="font-semibold text-slate-100 mb-1">{MODULE_DESCRIPTIONS.projects.title}</p>
                            <p className="text-slate-300 text-[11px]">{MODULE_DESCRIPTIONS.projects.fullDescription}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {MODULE_DESCRIPTIONS.projects.shortDescription}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-xs mr-1">
              <button
                type="button"
                onClick={() => setDisplayMode('hierarchy')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  displayMode === 'hierarchy' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Hierarchy Drill-Down Explorer"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hierarchy Tree</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium transition-colors flex items-center space-x-1.5 ${
                  displayMode === 'table' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Master Projects Table"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All Projects Table</span>
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(prev => !prev)}
              className="btn-primary flex items-center space-x-2 text-xs font-medium"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : 'Add New Site'}</span>
            </button>
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center space-x-2 text-xs font-medium"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Interactive Breadcrumb Navigation Strip */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-100 text-xs">
          {viewLevel !== 'districts' && (
            <button
              onClick={handleGoBack}
              className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="inline-flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setViewLevel('districts'); setSelectedDistrict(null); setSelectedDivision(null); setSelectedSiteId(null); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${viewLevel === 'districts' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
            >
              All Districts ({Object.keys(hierarchy).length})
            </button>

            {selectedDistrict && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => { setViewLevel('divisions'); setSelectedDivision(null); setSelectedSiteId(null); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${viewLevel === 'divisions' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {selectedDistrict} District
                </button>
              </>
            )}

            {selectedDivision && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => { setViewLevel('sites'); setSelectedSiteId(null); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${viewLevel === 'sites' ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                  {selectedDivision} Division
                </button>
              </>
            )}

            {selectedSite && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="badge badge-info text-xs">
                  {selectedSite.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Add New Site Form */}
      {showAddForm && (
        <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Plus className="w-4 h-4 text-[#2563EB]" />
                <span>Register New Construction Site</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Assign directly to District and Taluka/Division for instant rolled-up reporting.</p>
            </div>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-gray-400 hover:text-gray-600 text-xs font-semibold px-2 py-1 rounded"
            >
              ✕ Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Site / Project Name</label>
                <input
                  required
                  name="name"
                  value={formState.name}
                  onChange={handleChange}
                  placeholder="e.g. Karveer Commercial Plaza"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <select
                  name="district"
                  value={formState.district}
                  onChange={handleChange}
                  className={selectClasses}
                >
                  <option value="Kolhapur">Kolhapur</option>
                  <option value="Pune">Pune</option>
                  <option value="Mumbai">Mumbai</option>
                  <option value="Nagpur">Nagpur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Taluka / Division</label>
                <input
                  required
                  name="division"
                  value={formState.division}
                  onChange={handleChange}
                  placeholder="e.g. Karveer, Ichalkaranji"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Specific Site Landmark</label>
                <input
                  name="location"
                  value={formState.location}
                  onChange={handleChange}
                  placeholder="e.g. Near Bus Stand, Karveer"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Client Name</label>
                <input
                  required
                  name="clientName"
                  value={formState.clientName}
                  onChange={handleChange}
                  placeholder="Client Organization"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Partner In-Charge</label>
                <select
                  name="partnerName"
                  value={formState.partnerName}
                  onChange={handleChange}
                  className={selectClasses}
                >
                  <option value="Rajesh Patel">Rajesh Patel (Pune/Kolhapur)</option>
                  <option value="Suresh Sharma">Suresh Sharma (Mumbai)</option>
                  <option value="Vikram Deshmukh">Vikram Deshmukh (Nagpur)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sanctioned Budget (INR - Max ₹50L)</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="5000000"
                  name="budget"
                  value={formState.budget}
                  onChange={handleChange}
                  placeholder="e.g. 4500000 (Max ₹50 Lakh)"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Actual Spent (INR)</label>
                <input
                  type="number"
                  name="actualCost"
                  value={formState.actualCost}
                  onChange={handleChange}
                  placeholder="25000000"
                  className={inputClasses}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Completion %</label>
                <input
                  type="number"
                  name="completionPercent"
                  value={formState.completionPercent}
                  onChange={handleChange}
                  placeholder="50"
                  className={inputClasses}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#E5E7EB]">
              <button
                type="submit"
                className="btn-primary px-5 py-2 text-xs font-medium"
              >
                Save Site Record
              </button>
            </div>
          </form>
        </section>
      )}

      {displayMode === 'table' ? (
        <DataTable
          columns={projectColumns}
          data={filteredProjects}
          searchPlaceholder="Search projects by name, location, district, client, partner..."
          filterKey="district"
          filterOptions={projectDistricts}
          filterLabel="All Districts"
          pageSize={10}
          exportFileName="Shivshakti_Projects_Master_List.xlsx"
        />
      ) : (
        <>
          {/* =========================================================
              LEVEL 0: ALL DISTRICTS VIEW
              ========================================================= */}
          {viewLevel === 'districts' && (
        <div className="space-y-6">
          {/* Global Rollup KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Districts</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{Object.keys(hierarchy).length}</p>
              <p className="text-xs text-slate-500">Covering Kolhapur, Pune, Mumbai, Nagpur</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Sites Registered</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{filteredProjects.length}</p>
              <p className="text-xs text-emerald-600 font-medium">All active operational sites</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Sanctioned Budgets</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(globalTotalBudget)}</p>
              <p className="text-xs text-slate-500">Total contract sanction</p>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Incurred Cost</span>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{formatCurrency(globalTotalSpent)}</p>
              <p className="text-xs text-slate-500">{globalTotalBudget > 0 ? Math.round((globalTotalSpent / globalTotalBudget) * 100) : 0}% of budget spent</p>
            </div>
          </div>

          {/* District Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#2563EB]" />
                <span>Select a District to Drill-Down:</span>
              </h3>
              <span className="text-xs text-slate-400">Click any district card to see divisions</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
              {Object.values(hierarchy).map((dist) => {
                const consumedPercent = dist.totalBudget > 0 ? Math.min(100, Math.round((dist.totalActualCost / dist.totalBudget) * 100)) : 0;
                const divisionNames = Object.keys(dist.divisions);

                return (
                  <div
                    key={dist.name}
                    onClick={() => handleSelectDistrict(dist.name)}
                    className="bg-white border border-slate-200/80 hover:border-blue-300 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <span className="badge badge-info">{dist.sitesCount} Sites</span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {dist.name} District
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {divisionNames.length} Talukas/Divisions ({divisionNames.join(', ')})
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Sanctioned Budget:</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(dist.totalBudget)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Total Spent:</span>
                          <span className="font-medium text-slate-700">{formatCurrency(dist.totalActualCost)}</span>
                        </div>

                        <div className="space-y-1.5 pt-1.5">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Budget Consumed</span>
                            <span className="font-semibold text-slate-600">{consumedPercent}%</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${consumedPercent}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                      <span>Explore Divisions &rarr;</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          LEVEL 1: DIVISIONS VIEW (Under Selected District)
          ========================================================= */}
      {viewLevel === 'divisions' && selectedDistrict && hierarchy[selectedDistrict] && (
        <div className="space-y-6">
          {/* District Summary Banner */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="badge badge-info uppercase tracking-wider text-[10px]">
                  District Rollup
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDistrict} District</h3>
                <p className="text-xs text-slate-500">
                  {hierarchy[selectedDistrict].sitesCount} Active Sites across {Object.keys(hierarchy[selectedDistrict].divisions).length} Divisions/Talukas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">District Budget:</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(hierarchy[selectedDistrict].totalBudget)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">District Spent:</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(hierarchy[selectedDistrict].totalActualCost)}</span>
              </div>
            </div>
          </div>

          {/* Division Cards Grid */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <span>Divisions / Talukas in {selectedDistrict}:</span>
              </h4>
              <span className="text-xs text-slate-400">Click any division to view sites</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {Object.values(hierarchy[selectedDistrict].divisions).map((div) => {
                const divConsumedPercent = div.totalBudget > 0 ? Math.min(100, Math.round((div.totalActualCost / div.totalBudget) * 100)) : 0;

                return (
                  <div
                    key={div.name}
                    onClick={() => handleSelectDivision(div.name)}
                    className="bg-white border border-slate-200/80 hover:border-blue-300 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-5 group"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white transition-colors">
                          <Building className="w-4 h-4" />
                        </div>
                        <span className="badge badge-info">{div.sitesCount} Sites</span>
                      </div>

                      <div>
                        <h5 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {div.name} Division
                        </h5>
                        <p className="text-xs text-slate-500 mt-1">
                          Sites: {div.sites.map(s => s.name).join(', ')}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Division Budget:</span>
                          <span className="font-semibold text-slate-900">{formatCurrency(div.totalBudget)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Division Spent:</span>
                          <span className="font-medium text-slate-700">{formatCurrency(div.totalActualCost)}</span>
                        </div>

                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                          <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${divConsumedPercent}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#2563EB]">
                      <span>View Sites &rarr;</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          LEVEL 2: SITES LIST (Under Selected Division)
          ========================================================= */}
      {viewLevel === 'sites' && selectedDistrict && selectedDivision && hierarchy[selectedDistrict]?.divisions[selectedDivision] && (
        <div className="space-y-6">
          {/* Division Summary Banner */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <span className="badge badge-info uppercase tracking-wider text-[10px]">
                  {selectedDistrict} &bull; Division Rollup
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedDivision} Division Sites</h3>
                <p className="text-xs text-slate-500">
                  {hierarchy[selectedDistrict].divisions[selectedDivision].sitesCount} Construction Sites in this division.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Division Budget:</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(hierarchy[selectedDistrict].divisions[selectedDivision].totalBudget)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Division Spent:</span>
                <span className="text-base font-bold text-slate-900">
                  {formatCurrency(hierarchy[selectedDistrict].divisions[selectedDivision].totalActualCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Sites Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {hierarchy[selectedDistrict].divisions[selectedDivision].sites.map((site) => (
              <div
                key={site.id}
                className="bg-white border border-slate-200/80 hover:border-blue-200 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md space-y-5 flex flex-col justify-between transition-all"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-medium text-slate-400">{site.id}</span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{site.name}</h4>
                    </div>
                    <span className="badge badge-info">{site.status}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs text-slate-500 pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-medium text-slate-400 block">Location</span>
                      <span className="font-medium text-slate-800">{site.location}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-medium text-slate-400 block">Client</span>
                      <span className="font-medium text-slate-800">{site.clientName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-medium text-slate-400 block">Partner</span>
                      <span className="font-medium text-slate-800">{site.partnerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-medium text-slate-400 block">Target Date</span>
                      <span className="font-medium text-slate-800">{site.targetEndDate || 'Ongoing'}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sanctioned Budget:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(site.budget)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Actual Cost Spent:</span>
                      <span className="font-medium text-slate-700">{formatCurrency(site.actualCost)}</span>
                    </div>

                    <div className="space-y-1 pt-1.5">
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Site Completion</span>
                        <span className="font-semibold text-slate-600">{site.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#2563EB] h-full rounded-full" style={{ width: `${site.completionPercent}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => handleSelectSite(site.id)}
                    className="btn-primary flex-1 py-2 text-xs font-medium flex items-center justify-center space-x-1.5"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Open Site Details &rarr;</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditProject ? onEditProject(site) : null}
                    className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 text-xs font-medium transition-colors"
                    title="Edit Site Record"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteProjectTarget(site)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                    title="Delete Site Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          LEVEL 3: SITE DETAIL & COMBINED EXPENSE BREAKDOWN (Requirement 3)
          ========================================================= */}
      {viewLevel === 'siteDetail' && selectedSite && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Site Overview Profile Card */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="badge badge-info">
                    {selectedSite.id}
                  </span>
                  <span className="text-xs text-slate-500">
                    {selectedSite.district} District &bull; {selectedSite.division} Division
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedSite.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>{selectedSite.location} &bull; Client: <strong className="text-slate-800 font-medium">{selectedSite.clientName}</strong> &bull; Partner In-Charge: <strong className="text-slate-800 font-medium">{selectedSite.partnerName}</strong></span>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="badge badge-info">{selectedSite.status}</span>
                <button
                  type="button"
                  onClick={() => onEditProject ? onEditProject(selectedSite) : null}
                  className="btn-secondary flex items-center space-x-1.5 text-xs font-medium"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Site</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteProjectTarget(selectedSite)}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors"
                  title="Delete Site Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setSiteExpenseForm({
                      category: 'Diesel & Machinery Fuel',
                      expenseTitle: '',
                      amount: '',
                      date: new Date().toISOString().slice(0, 10),
                      paidBy: selectedSite.partnerName || 'Rajesh Patel',
                      receiptNo: `VCH-${Date.now().toString().slice(-4)}`
                    });
                    setShowAddExpenseModal(true);
                  }}
                  className="btn-primary flex items-center space-x-2 text-xs font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Record Site Expense</span>
                </button>
                <button
                  onClick={handleExportSiteExpenses}
                  className="btn-secondary flex items-center space-x-2 text-xs font-medium"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Export (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Site Financials & Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sanctioned Budget</span>
                <p className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(selectedSite.budget)}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Consolidated Expenses</span>
                <p className="text-xl font-bold text-slate-900 tracking-tight">{formatCurrency(siteExpenseMetrics.total || selectedSite.actualCost)}</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Physical Site Completion</span>
                <p className="text-xl font-bold text-[#2563EB] tracking-tight">{selectedSite.completionPercent}%</p>
              </div>

              <div className="bg-slate-50/70 border border-slate-100 p-4 rounded-xl space-y-1">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Target Timeline</span>
                <p className="text-sm font-semibold text-slate-900">{selectedSite.startDate} &rarr; {selectedSite.targetEndDate || 'Ongoing'}</p>
              </div>
            </div>
          </div>

          {/* COMBINED ALL-EXPENSES SECTION (Requirement 3) */}
          <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5 p-6">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center space-x-2">
                    <Receipt className="w-5 h-5 text-[#2563EB]" />
                    <span>Combined Site Expense Breakdown</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified ledger of all major expenses (materials, subcontractors, labour wages) and petty/minor expenses for this site.
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs font-medium">
                  <span className="text-slate-400">Total Entries:</span>
                  <span className="badge badge-info">
                    {siteExpenses.length} Records
                  </span>
                </div>
              </div>

              {/* Expense Category Quick Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
                <div 
                  onClick={() => setExpenseFilter('materials')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${expenseFilter === 'materials' ? 'bg-blue-50/50 border-blue-300 shadow-xs' : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className="text-[11px] text-slate-400 font-medium block">Materials & Purchase Bills</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(siteExpenseMetrics.materials)}</span>
                </div>

                <div 
                  onClick={() => setExpenseFilter('subcontractors')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${expenseFilter === 'subcontractors' ? 'bg-blue-50/50 border-blue-300 shadow-xs' : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className="text-[11px] text-slate-400 font-medium block">Subcontractor Works</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(siteExpenseMetrics.subcontractors)}</span>
                </div>

                <div 
                  onClick={() => setExpenseFilter('labour')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${expenseFilter === 'labour' ? 'bg-blue-50/50 border-blue-300 shadow-xs' : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className="text-[11px] text-slate-400 font-medium block">Labour Wages Muster</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(siteExpenseMetrics.labour)}</span>
                </div>

                <div 
                  onClick={() => setExpenseFilter('petty')}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${expenseFilter === 'petty' ? 'bg-blue-50/50 border-blue-300 shadow-xs' : 'bg-slate-50/70 border-slate-100 hover:bg-slate-50'}`}
                >
                  <span className="text-[11px] text-slate-400 font-medium block">Site Petty Cash & Fuel</span>
                  <span className="text-base font-bold text-slate-900 mt-0.5 block">{formatCurrency(siteExpenseMetrics.petty)}</span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="inline-flex flex-wrap items-center p-1 bg-slate-100/80 rounded-xl gap-1 text-xs">
                <button
                  onClick={() => setExpenseFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${expenseFilter === 'ALL' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  All Combined ({siteExpenses.length})
                </button>
                <button
                  onClick={() => setExpenseFilter('materials')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${expenseFilter === 'materials' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Materials & Bills
                </button>
                <button
                  onClick={() => setExpenseFilter('subcontractors')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${expenseFilter === 'subcontractors' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Subcontractors
                </button>
                <button
                  onClick={() => setExpenseFilter('labour')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${expenseFilter === 'labour' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Labour Wages
                </button>
                <button
                  onClick={() => setExpenseFilter('petty')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${expenseFilter === 'petty' ? 'bg-white text-blue-600 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Petty Cash & Fuel
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Filter expenses by payee, ref..."
                  className="w-full bg-slate-50 border border-slate-200/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Unified Combined Expenses Table */}
            <div className="overflow-x-auto rounded-lg border border-[#E5E7EB]">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Source & Category</th>
                    <th>Description & Scope</th>
                    <th>Ref / Voucher</th>
                    <th>Vendor / Payee</th>
                    <th>Amount (INR)</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSiteExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500 text-xs">
                        No expense records found matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSiteExpenses.map((exp, idx) => (
                      <tr key={`${exp.id}-${idx}`}>
                        <td className="text-gray-700 font-mono text-xs">{exp.date}</td>
                        <td>
                          <div>
                            <span className="font-semibold text-[#111827] text-xs block">{exp.type}</span>
                            <span className="text-[10px] text-gray-500">{exp.categoryLabel}</span>
                          </div>
                        </td>
                        <td className="font-medium text-[#111827] text-xs max-w-xs">{exp.title}</td>
                        <td>
                          <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {exp.reference}
                          </span>
                        </td>
                        <td className="text-gray-700 font-medium text-xs">{exp.payee}</td>
                        <td className="font-bold text-[#111827] text-xs">{formatCurrency(exp.amount)}</td>
                        <td>
                          <span className={`badge ${exp.statusColor || 'badge-neutral'}`}>
                            {exp.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => setDeleteExpenseTarget(exp)}
                            className="rounded-[6px] bg-rose-50 border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-100 transition-colors"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {/* =========================================================
          MODAL: RECORD SITE EXPENSE (Requirement 2)
          ========================================================= */}
      {showAddExpenseModal && selectedSite && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-3.5">
              <div>
                <h3 className="text-base font-semibold text-[#111827] flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-[#2563EB]" />
                  <span>Record Site Expense</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Adding directly to: <strong className="text-[#2563EB]">{selectedSite.name}</strong> ({selectedSite.division || selectedSite.district})
                </p>
              </div>
              <button 
                onClick={() => setShowAddExpenseModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const newExp = {
                  id: `EXP-${Date.now().toString().slice(-4)}`,
                  projectId: selectedSite.id,
                  projectName: selectedSite.name,
                  date: siteExpenseForm.date,
                  category: siteExpenseForm.category,
                  expenseTitle: siteExpenseForm.expenseTitle,
                  amount: parseFloat(siteExpenseForm.amount) || 0,
                  paidBy: siteExpenseForm.paidBy || selectedSite.partnerName || 'Rajesh Patel',
                  receiptNo: siteExpenseForm.receiptNo
                };
                if (onSaveExpense) {
                  onSaveExpense(newExp);
                }
                setShowAddExpenseModal(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Category</label>
                <select
                  required
                  value={siteExpenseForm.category}
                  onChange={(e) => setSiteExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className={selectClasses}
                >
                  <option value="Diesel & Machinery Fuel">Diesel & Machinery Fuel</option>
                  <option value="Municipal & Police NOC">Municipal & Police NOC</option>
                  <option value="Site Petty Cash & Sundry">Site Petty Cash & Sundry</option>
                  <option value="Worker Refreshments & Tea">Worker Refreshments & Tea</option>
                  <option value="Material Testing & Lab Fees">Material Testing & Lab Fees</option>
                  <option value="Crane & Machinery Transport">Crane & Machinery Transport</option>
                  <option value="Site Safety & PPE">Site Safety & PPE</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Description / Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bulk Diesel 350L for Genset & Excavator"
                  value={siteExpenseForm.expenseTitle}
                  onChange={(e) => setSiteExpenseForm(prev => ({ ...prev, expenseTitle: e.target.value }))}
                  className={inputClasses}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (INR)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="35000"
                    value={siteExpenseForm.amount}
                    onChange={(e) => setSiteExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    className={inputClasses}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Expense Date</label>
                  <input
                    required
                    type="date"
                    value={siteExpenseForm.date}
                    onChange={(e) => setSiteExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Paid By (Partner / Site)</label>
                  <select
                    value={siteExpenseForm.paidBy}
                    onChange={(e) => setSiteExpenseForm(prev => ({ ...prev, paidBy: e.target.value }))}
                    className={selectClasses}
                  >
                    <option value={selectedSite.partnerName}>{selectedSite.partnerName} (Partner In-Charge)</option>
                    <option value="Rajesh Patel">Rajesh Patel</option>
                    <option value="Suresh Sharma">Suresh Sharma</option>
                    <option value="Vikram Deshmukh">Vikram Deshmukh</option>
                    <option value="Site Supervisor Cash Box">Site Supervisor Cash Box</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">Voucher / Receipt No</label>
                  <input
                    type="text"
                    placeholder="e.g. VCH-KOL-102"
                    value={siteExpenseForm.receiptNo}
                    onChange={(e) => setSiteExpenseForm(prev => ({ ...prev, receiptNo: e.target.value }))}
                    className={inputClasses}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="btn-secondary px-4 py-2 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-5 py-2 text-xs font-medium shadow-sm"
                >
                  Save Site Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Deletion Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteProjectTarget)}
        title="Delete Construction Project Site"
        message={`Are you sure you want to permanently delete site "${deleteProjectTarget?.name}" (${deleteProjectTarget?.id})? All linked site expenses, purchase orders, material deliveries, and accounting history for this project will be deleted.`}
        confirmLabel="Yes, Delete Project Site"
        isDestructive={true}
        onConfirm={() => {
          if (deleteProjectTarget) {
            onDeleteProject(deleteProjectTarget.id);
            setDeleteProjectTarget(null);
            if (selectedSiteId === deleteProjectTarget.id) {
              setViewLevel('districts');
              setSelectedSiteId(null);
            }
          }
        }}
        onCancel={() => setDeleteProjectTarget(null)}
      />

      {/* Expense Record Deletion Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteExpenseTarget)}
        title="Delete Site Expense Record"
        message={`Are you sure you want to delete this ${deleteExpenseTarget?.categoryLabel || 'site'} expense (${deleteExpenseTarget?.title || deleteExpenseTarget?.reference || deleteExpenseTarget?.id}) for ₹${deleteExpenseTarget?.amount ? Number(deleteExpenseTarget.amount).toLocaleString('en-IN') : 0}?`}
        confirmLabel="Yes, Delete Record"
        isDestructive={true}
        onConfirm={() => {
          if (deleteExpenseTarget && onDeleteExpense) {
            onDeleteExpense(deleteExpenseTarget.source || 'otherExpenses', deleteExpenseTarget.id);
            setDeleteExpenseTarget(null);
          }
        }}
        onCancel={() => setDeleteExpenseTarget(null)}
      />
    </div>
  );
}

