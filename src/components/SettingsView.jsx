import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Key, 
  Users, 
  Database, 
  FileCheck, 
  CheckCircle2, 
  Lock, 
  Bell, 
  Sliders,
  RefreshCw,
  Plus,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  ShieldAlert
} from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import { MODULE_DESCRIPTIONS } from '../data/moduleDescriptions';
import { api } from '../services/api';

export default function SettingsView({ currentUser }) {
  const [activeSubTab, setActiveSubTab] = useState(currentUser?.role === 'ADMIN' ? 'users' : 'account');
  const [usersList, setUsersList] = useState([]);
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Password Change Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Create User Modal State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'PARTNER',
    phone: '',
    partnerId: 'P1',
    clientId: 'CL-01',
    assignedProject: 'PRJ-001'
  });

  // Reset Password Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  const moduleInfo = MODULE_DESCRIPTIONS.settings;

  const showToastMsg = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (currentUser?.role === 'ADMIN') {
        const users = await api.getUsers();
        setUsersList(users);
        const logs = await api.getAuditLogs();
        setAuditLogsList(logs);
      }
    } catch (e) {
      console.warn('Settings data load error:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToastMsg('New password and confirmation do not match.', true);
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      showToastMsg('New password must be at least 8 characters.', true);
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      showToastMsg('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showToastMsg(err.message || 'Failed to update password.', true);
    }
    setPasswordLoading(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.createUser(newUserForm);
      showToastMsg(`User ${newUserForm.name} created successfully!`);
      setShowCreateUserModal(false);
      setNewUserForm({
        name: '',
        email: '',
        password: '',
        role: 'PARTNER',
        phone: '',
        partnerId: 'P1',
        clientId: 'CL-01',
        assignedProject: 'PRJ-001'
      });
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Failed to create user.', true);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.toggleUserStatus(user.id, nextStatus);
      showToastMsg(`User ${user.name} is now ${nextStatus}.`);
      loadData();
    } catch (err) {
      showToastMsg(err.message || 'Failed to update status.', true);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetNewPassword || resetNewPassword.length < 8) {
      showToastMsg('Password must be at least 8 characters long.', true);
      return;
    }
    try {
      await api.resetUserPassword(resetModalUser.id, resetNewPassword);
      showToastMsg(`Password reset for ${resetModalUser.email}!`);
      setResetModalUser(null);
      setResetNewPassword('');
    } catch (err) {
      showToastMsg(err.message || 'Failed to reset password.', true);
    }
  };

  // Filter users list
  const filteredUsers = usersList.filter(u => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesQuery = !searchQuery || 
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    return matchesRole && matchesQuery;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Module Header with Feature 3 Description & Tooltip */}
      <ModuleHeader
        icon={SettingsIcon}
        title={moduleInfo.title}
        subtitle={moduleInfo.shortDescription}
        fullDescription={moduleInfo.fullDescription}
        badge={currentUser?.role === 'ADMIN' ? 'Chief Admin Panel' : 'User Security'}
      />

      {toast && (
        <div className={`p-4 rounded-xl flex items-center space-x-2.5 text-xs font-semibold ${
          toast.isError ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        } animate-in fade-in duration-200`}>
          {toast.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeSubTab === 'users'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin User Management</span>
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('account')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
            activeSubTab === 'account'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>My Profile & Password</span>
        </button>
        {currentUser?.role === 'ADMIN' && (
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
              activeSubTab === 'audit'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Security & Audit Trail</span>
          </button>
        )}
        <button
          onClick={() => setActiveSubTab('config')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center space-x-1.5 shrink-0 ${
            activeSubTab === 'config'
              ? 'bg-[#2563EB] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>System Configuration</span>
        </button>
      </div>

      {/* TAB: ADMIN USER MANAGEMENT (Phase 5) */}
      {activeSubTab === 'users' && currentUser?.role === 'ADMIN' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs w-64 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Role Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs">
                {['ALL', 'ADMIN', 'PARTNER', 'CLIENT', 'WORKER'].map(r => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                      roleFilter === r ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowCreateUserModal(true)}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New User</span>
            </button>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="overflow-x-auto">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>User / Name</th>
                    <th>Email Address</th>
                    <th>Role</th>
                    <th>Assigned Scope</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div>
                          <span className="font-bold text-slate-900 block text-xs">{u.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{u.id}</span>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-slate-700">{u.email}</td>
                      <td>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'PARTNER' ? 'bg-blue-100 text-blue-700' :
                          u.role === 'CLIENT' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="text-xs text-slate-600">
                        {u.role === 'PARTNER' && <span>Partner {u.partnerId || 'P1'}</span>}
                        {u.role === 'CLIENT' && <span>Client {u.clientId || 'CL-01'}</span>}
                        {u.role === 'WORKER' && <span>{u.driverVehicleNo || u.assignedProject || 'Site Logistics'}</span>}
                        {u.role === 'ADMIN' && <span className="text-slate-400">All Modules</span>}
                      </td>
                      <td>
                        <span className={`badge ${u.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'} text-[10px]`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="text-[11px] text-slate-500">
                        {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : 'Never'}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg text-xs font-semibold ${
                              u.status === 'ACTIVE'
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={u.status === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setResetNewPassword('');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Reset Pwd
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MY PROFILE & PASSWORD */}
      {activeSubTab === 'account' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* User Profile Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#2563EB]" />
              <span>Current Session Profile</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Full Name</span>
                <span className="font-semibold text-slate-800">{currentUser?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Corporate Email</span>
                <span className="font-semibold text-slate-800 font-mono">{currentUser?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Assigned ERP Role</span>
                <span className="badge badge-info">{currentUser?.role || 'PARTNER'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Allocated Partner ID</span>
                <span className="font-semibold text-slate-800">{currentUser?.partnerId || 'System Wide (Admin)'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Primary Office Location</span>
                <span className="font-semibold text-slate-800">{currentUser?.location || 'Pune Head Office'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Authentication Protocol</span>
                <span className="text-emerald-600 font-semibold flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>256-bit JWT (Bcrypt Verified)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-[#2563EB]" />
              <span>Change Account Password</span>
            </h3>

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new strong password"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Repeat new password"
                  className="form-input"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-blue-300 text-white py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-xs"
              >
                {passwordLoading ? 'Updating Hash...' : 'Update & Hash Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB: SECURITY & AUDIT TRAIL (Phase 9) */}
      {activeSubTab === 'audit' && currentUser?.role === 'ADMIN' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#2563EB]" />
              <h3 className="text-sm font-bold text-slate-900">Security Audit Trail (Real-Time Ledger)</h3>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User / Operator</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Event Details</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {auditLogsList.map((log) => (
                  <tr key={log.id}>
                    <td className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="font-semibold text-slate-900 text-xs">{log.userName}</td>
                    <td>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                        {log.userRole}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs font-bold text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="text-xs text-slate-600 font-medium">{log.module}</td>
                    <td className="text-xs text-slate-700">{log.details}</td>
                    <td className="font-mono text-[11px] text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: SYSTEM CONFIGURATION */}
      {activeSubTab === 'config' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#2563EB]" />
            <span>Shivshakti ERP Engine Status & Security Infrastructure</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Authoritative Database</span>
              <p className="text-sm font-bold text-slate-900">PostgreSQL (Prisma Enabled)</p>
              <p className="text-[11px] text-slate-500">Atomic transactions & data consistency</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Authentication Engine</span>
              <p className="text-sm font-bold text-slate-900">Bcrypt Salt Rounds 10 + 256-bit JWT</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Strictly zero plaintext credentials</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Role-Based Access Control</span>
              <p className="text-sm font-bold text-slate-900">ADMIN, PARTNER, CLIENT, WORKER</p>
              <p className="text-[11px] text-slate-500">Project-based backend data isolation</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE USER */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Plus className="w-5 h-5 text-[#2563EB]" />
                <span>Create New ERP User</span>
              </h3>
              <button onClick={() => setShowCreateUserModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. ramesh@shivshakti.com"
                  className="form-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Enter temporary password"
                  className="form-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="form-select"
                  >
                    <option value="PARTNER">PARTNER</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="WORKER">WORKER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    placeholder="+91 98220..."
                    className="form-input"
                  />
                </div>
              </div>

              {newUserForm.role === 'PARTNER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Partner Entity Allocation</label>
                  <select
                    value={newUserForm.partnerId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, partnerId: e.target.value })}
                    className="form-select"
                  >
                    <option value="P1">P1 - Rajesh Patel (Pune / Kolhapur)</option>
                    <option value="P2">P2 - Suresh Sharma (Mumbai)</option>
                    <option value="P3">P3 - Vikram Deshmukh (Nagpur)</option>
                  </select>
                </div>
              )}

              {newUserForm.role === 'CLIENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Client Entity Allocation</label>
                  <select
                    value={newUserForm.clientId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, clientId: e.target.value })}
                    className="form-select"
                  >
                    <option value="CL-01">CL-01 - Apex Infrastructures Ltd</option>
                    <option value="CL-02">CL-02 - Metro Realty Developers</option>
                    <option value="CL-03">CL-03 - Vidarbha Infra Corp</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESET PASSWORD */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Reset Password: {resetModalUser.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Account: {resetModalUser.email}
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Secure Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
