import React from 'react';
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  CreditCard, 
  Truck, 
  ShoppingCart, 
  FileText, 
  Receipt, 
  HardHat, 
  Wrench, 
  DollarSign, 
  Briefcase, 
  BarChart3,
  MapPin,
  Settings,
  ShieldCheck,
  Award
} from 'lucide-react';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';

export default function Sidebar({ activeTab, setActiveTab, counts = {}, currentUser = null }) {
  const isAdmin = currentUser?.role === 'ADMIN';

  const menuItems = [
    { 
      id: 'dashboard', 
      label: isAdmin ? 'Executive Admin Dashboard' : 'Partner Dashboard', 
      icon: LayoutDashboard, 
      category: 'OVERVIEW' 
    },
    { 
      id: 'deliveryTracker', 
      label: 'Driver & Delivery Tracker', 
      icon: Truck, 
      category: 'LIVE TRACKING', 
      highlight: true, 
      count: counts.pendingDeliveries 
    },

    ...(isAdmin ? [
      { id: 'users', label: 'Users & Roles', icon: ShieldCheck, category: 'ADMINISTRATION' },
      { id: 'partners', label: 'Partners & Capital', icon: Award, category: 'ADMINISTRATION' },
      { id: 'auditLogs', label: 'Audit Trails & Logs', icon: FileText, category: 'ADMINISTRATION' },
    ] : []),
    
    { id: 'projects', label: 'Projects & Sites', icon: Building, category: 'PROJECT MANAGEMENT', count: counts.projects },
    { id: 'clients', label: 'Client Directory', icon: Users, category: 'PROJECT MANAGEMENT' },
    { id: 'clientPayments', label: 'Client Payments', icon: CreditCard, category: 'PROJECT MANAGEMENT' },
    
    { id: 'suppliers', label: 'Suppliers Directory', icon: Briefcase, category: 'PURCHASE & MATERIALS' },
    { id: 'purchaseOrders', label: 'Purchase Orders (PO)', icon: ShoppingCart, category: 'PURCHASE & MATERIALS', count: counts.purchaseOrders },
    { id: 'purchaseBills', label: 'Purchase Bills (PB)', icon: FileText, category: 'PURCHASE & MATERIALS' },
    { id: 'purchasePayments', label: 'Purchase Payments', icon: Receipt, category: 'PURCHASE & MATERIALS' },
    
    { id: 'labourWages', label: 'Labour Wages & Muster', icon: HardHat, category: 'SITE OPERATIONS' },
    { id: 'assets', label: 'Assets & Deposits', icon: Wrench, category: 'SITE OPERATIONS' },
    { id: 'subcontractors', label: 'Subcontractors Ledger', icon: Users, category: 'SITE OPERATIONS' },
    { id: 'otherExpenses', label: 'Other Site Expenses', icon: DollarSign, category: 'SITE OPERATIONS' },
    
    { id: 'reports', label: 'Reports & Excel Hub', icon: BarChart3, category: 'FINANCE & REPORTS' },
    { id: 'settings', label: 'System Settings', icon: Settings, category: 'SYSTEM CONFIG' },
  ];

  // Group items by category maintaining logical order
  const categoryOrder = [
    'OVERVIEW',
    'LIVE TRACKING',
    ...(isAdmin ? ['ADMINISTRATION'] : []),
    'PROJECT MANAGEMENT',
    'PURCHASE & MATERIALS',
    'SITE OPERATIONS',
    'FINANCE & REPORTS',
    'SYSTEM CONFIG'
  ];

  const categories = categoryOrder.filter(cat => menuItems.some(item => item.category === cat));

  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] flex flex-col shrink-0 min-h-[calc(100vh-57px)] select-none">
      <div className="p-3 flex-1 overflow-y-auto space-y-4">
        {categories.map((category) => (
          <div key={category} className="space-y-0.5">
            <h3 className="px-3 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {category}
            </h3>
            <div className="space-y-0.5">
              {menuItems
                .filter(item => item.category === category)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      title={MODULE_DESCRIPTIONS[item.id]?.fullDescription || item.label}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-[#2563EB] font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#2563EB]' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && item.count > 0 && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 border-t border-[#E5E7EB]/80 flex items-center justify-between">
        <p className="text-[11px] text-slate-400 font-normal">Head Office: Pune, MH</p>
        {isAdmin && (
          <span className="badge badge-info text-[9px] font-mono uppercase tracking-wider py-0.5">
            Admin Mode
          </span>
        )}
      </div>
    </aside>
  );
}
