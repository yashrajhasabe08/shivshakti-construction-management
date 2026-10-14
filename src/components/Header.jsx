import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Building2, 
  Download, 
  Truck, 
  Search, 
  User, 
  Shield, 
  HardHat, 
  Briefcase,
  LogOut, 
  X, 
  Building, 
  Users, 
  FileText,
  ChevronRight,
  Bell
} from 'lucide-react';
import { exportMasterWorkbook } from '../utils/excelExport';

export default function Header({ 
  user,
  onLogout,
  selectedPartner, 
  setSelectedPartner, 
  data, 
  onOpenDeliveryTracker,
  searchTerm,
  setSearchTerm,
  onNavigateTo
}) {
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchContainerRef = useRef(null);
  const notifContainerRef = useRef(null);

  const pendingDeliveriesCount = data?.purchaseOrders?.filter(
    po => po.deliveryStatus === 'In-Transit' || po.deliveryStatus === 'Dispatched'
  ).length || 0;

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifContainerRef.current && !notifContainerRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live search results across Projects, Suppliers, and Purchase Orders
  const searchResults = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    if (!term) return { projects: [], suppliers: [], orders: [], total: 0 };

    const matchingProjects = (data?.projects || []).filter(p => 
      p.name?.toLowerCase().includes(term) ||
      p.district?.toLowerCase().includes(term) ||
      p.division?.toLowerCase().includes(term) ||
      p.location?.toLowerCase().includes(term) ||
      p.clientName?.toLowerCase().includes(term)
    ).slice(0, 4);

    const matchingSuppliers = (data?.suppliers || []).filter(s =>
      s.name?.toLowerCase().includes(term) ||
      s.materialCategory?.toLowerCase().includes(term) ||
      s.contactPerson?.toLowerCase().includes(term)
    ).slice(0, 4);

    const matchingOrders = (data?.purchaseOrders || []).filter(po =>
      po.poNumber?.toLowerCase().includes(term) ||
      po.supplierName?.toLowerCase().includes(term) ||
      po.projectName?.toLowerCase().includes(term) ||
      po.vehicleNumber?.toLowerCase().includes(term) ||
      po.driverName?.toLowerCase().includes(term)
    ).slice(0, 4);

    const total = matchingProjects.length + matchingSuppliers.length + matchingOrders.length;
    return { projects: matchingProjects, suppliers: matchingSuppliers, orders: matchingOrders, total };
  }, [searchTerm, data]);

  const handleSelectSearchResult = (tab, termToKeep = '') => {
    if (onNavigateTo) {
      onNavigateTo(tab);
    }
    setShowSearchDropdown(false);
  };

  const isPartnerOrAdmin = user?.role === 'ADMIN' || user?.role === 'PARTNER';

  return (
    <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30 px-6 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-4">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB]">
          <Building2 className="w-4 h-4 text-[#2563EB]" />
        </div>
        <div>
          <h1 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight">Shivshakti Construction</h1>
          <p className="text-[11px] text-gray-500">Enterprise ERP & Multi-Site Operations</p>
        </div>
      </div>

      {/* Center: Live Search & Partner Switcher */}
      {isPartnerOrAdmin && (
        <div className="flex items-center space-x-2.5 flex-1 max-w-xl">
          <div ref={searchContainerRef} className="relative w-full">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects, vendors, or purchase orders..."
              value={searchTerm}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSearchDropdown(true);
              }}
              className="w-full bg-[#F8FAFC] hover:bg-white focus:bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-8 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setShowSearchDropdown(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 rounded-md hover:bg-gray-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Floating Live Search Results Dropdown */}
            {showSearchDropdown && searchTerm.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl border border-[#E5E7EB] shadow-xl z-50 overflow-hidden max-h-[380px] overflow-y-auto divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150">
                {searchResults.total === 0 ? (
                  <div className="p-4 text-center text-xs text-gray-500">
                    No matching projects, vendors or orders found for <strong className="text-gray-900">"{searchTerm}"</strong>.
                  </div>
                ) : (
                  <>
                    {/* Projects Matches */}
                    {searchResults.projects.length > 0 && (
                      <div className="p-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 block mb-1.5 flex items-center justify-between">
                          <span>Projects & Sites ({searchResults.projects.length})</span>
                          <span className="text-blue-600 font-semibold text-[10px]">Click to view</span>
                        </span>
                        <div className="space-y-1">
                          {searchResults.projects.map((p) => (
                            <div
                              key={p.id}
                              onClick={() => handleSelectSearchResult('projects', p.name)}
                              className="px-2.5 py-2 rounded-lg hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                  <Building className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 block leading-tight">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {p.district} &bull; {p.division} &bull; {p.clientName}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suppliers / Vendors Matches */}
                    {searchResults.suppliers.length > 0 && (
                      <div className="p-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 block mb-1.5 flex items-center justify-between">
                          <span>Suppliers & Vendors ({searchResults.suppliers.length})</span>
                          <span className="text-blue-600 font-semibold text-[10px]">Click to view</span>
                        </span>
                        <div className="space-y-1">
                          {searchResults.suppliers.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => handleSelectSearchResult('suppliers', s.name)}
                              className="px-2.5 py-2 rounded-lg hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Users className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-900 group-hover:text-emerald-600 block leading-tight">
                                    {s.name}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    {s.materialCategory} &bull; Contact: {s.contactPerson}
                                  </span>
                                </div>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-600" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Purchase Orders Matches */}
                    {searchResults.orders.length > 0 && (
                      <div className="p-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2.5 block mb-1.5 flex items-center justify-between">
                          <span>Purchase Orders ({searchResults.orders.length})</span>
                          <span className="text-blue-600 font-semibold text-[10px]">Click to view</span>
                        </span>
                        <div className="space-y-1">
                          {searchResults.orders.map((po) => (
                            <div
                              key={po.id}
                              onClick={() => handleSelectSearchResult('purchaseOrders', po.poNumber)}
                              className="px-2.5 py-2 rounded-lg hover:bg-amber-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center space-x-2.5">
                                <div className="w-7 h-7 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-xs font-semibold text-gray-900 group-hover:text-amber-600 block leading-tight">
                                    {po.poNumber} &bull; {po.supplierName}
                                  </span>
                                  <span className="text-[10px] text-gray-500">
                                    Site: {po.projectName} &bull; Vehicle: {po.vehicleNumber || 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <span className="badge badge-info text-[10px]">{po.deliveryStatus}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Partner Scope Filter */}
          {(user?.role === 'ADMIN' || user?.partnerId === 'P1') && (
            <div className="relative min-w-[170px]">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 w-full cursor-pointer transition-all"
              >
                <option value="ALL">All 3 Remote Sites</option>
                <option value="P1">Pune & Kolhapur - Rajesh Patel</option>
                <option value="P2">Mumbai - Suresh Sharma</option>
                <option value="P3">Nagpur - Vikram Deshmukh</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Right Action Controls */}
      <div className="flex items-center space-x-2">
        {isPartnerOrAdmin && (
          <>
            <button
              onClick={onOpenDeliveryTracker}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Truck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Material Tracking</span>
              {pendingDeliveriesCount > 0 && (
                <span className="bg-blue-600 text-white font-semibold text-[10px] px-1.5 py-0.2 rounded-full">
                  {pendingDeliveriesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => exportMasterWorkbook(data)}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Master Excel</span>
            </button>
          </>
        )}

        {/* Phase 12: Role-Relevant Notifications Bell */}
        <div className="relative" ref={notifContainerRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors relative"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/90 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900">Notifications ({notifications.length})</span>
                <span className="text-[10px] text-slate-400">Role: {user?.role}</span>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">{n.title}</span>
                        <span className="text-[9px] text-slate-400">{n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}</span>
                      </div>
                      <p className="text-[11px] text-slate-600">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Authenticated User Profile Pill & Logout Button */}
        <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200/80 rounded-xl pl-2.5 pr-1.5 py-1">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-[11px]">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="text-left leading-none hidden lg:block">
              <span className="text-xs font-bold text-slate-900 block leading-tight">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {user?.title || user?.role}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Log out of session"
            className="flex items-center space-x-1 ml-1 px-2 py-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

