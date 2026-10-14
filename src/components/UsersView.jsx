import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Shield, 
  CheckCircle2, 
  XCircle, 
  Key, 
  UserCheck, 
  UserX, 
  Phone, 
  Building, 
  Mail,
  Edit3,
  Trash2,
  RefreshCw
} from 'lucide-react';
import ModuleHeader from './ModuleHeader';
import DataTable from './DataTable';
import ConfirmModal from './ConfirmModal';
import { api } from '../services/api';

export default function UsersView({ currentUser, data, onShowToast }) {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Create User Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit User Modal
  const [editUser, setEditUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({});

  // Reset Password Modal
  const [resetTargetUser, setResetTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const list = await api.getUsers();
      setUsers(list || []);
    } catch (e) {
      console.error('Failed to load users:', e);
      if (onShowToast) onShowToast('Failed to load users from PostgreSQL.', true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
      alert('Please fill in all required fields.');
      return;
    }
    if (newUserForm.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createUser(newUserForm);
      if (onShowToast) onShowToast(`User account created for ${newUserForm.email}`);
      setShowCreateModal(false);
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
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    }
    setIsSubmitting(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      await api.updateUser(editUser.id, editUserForm);
      if (onShowToast) onShowToast(`User profile updated for ${editUser.email}`);
      setEditUser(null);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to update user.');
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.toggleUserStatus(user.id, nextStatus);
      if (onShowToast) onShowToast(`Account status set to ${nextStatus} for ${user.email}`);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to toggle status.');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    try {
      await api.resetUserPassword(resetTargetUser.id, newPassword);
      if (onShowToast) onShowToast(`Password reset successfully for ${resetTargetUser.email}`);
      setResetTargetUser(null);
      setNewPassword('');
    } catch (err) {
      alert(err.message || 'Failed to reset password.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteUser(deleteTarget.id);
      if (onShowToast) onShowToast(`User ${deleteTarget.email} deleted from PostgreSQL`);
      setDeleteTarget(null);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User Name & Email',
      render: (val, row) => (
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-100/80 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
            {row.name ? row.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <span className="font-bold text-slate-900 block">{row.name}</span>
            <span className="text-[11px] text-slate-400 font-mono flex items-center space-x-1">
              <Mail className="w-3 h-3 text-slate-400 inline" />
              <span>{row.email}</span>
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Assigned Role',
      render: (val) => {
        let badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
        if (val === 'ADMIN') badgeStyle = 'bg-purple-50 text-purple-700 border-purple-200';
        if (val === 'CLIENT') badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        if (val === 'WORKER') badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';

        return (
          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
            {val}
          </span>
        );
      }
    },
    {
      key: 'scope',
      header: 'Linked Entity Scope',
      render: (val, row) => {
        if (row.role === 'PARTNER') {
          return <span className="font-semibold text-slate-700 text-xs">Partner {row.partnerId || 'P1'}</span>;
        }
        if (row.role === 'CLIENT') {
          return <span className="font-semibold text-slate-700 text-xs">Client {row.clientId || 'CL-01'}</span>;
        }
        if (row.role === 'WORKER') {
          return <span className="text-slate-600 text-xs">{row.driverVehicleNo || row.assignedProject || 'Field Operative'}</span>;
        }
        return <span className="text-slate-400 text-xs italic">System Administrator</span>;
      }
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (val) => (
        <span className="text-slate-600 text-xs font-mono">
          {val || '—'}
        </span>
      )
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (val, row) => {
        const isActive = val === 'ACTIVE';
        return (
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            disabled={row.id === currentUser?.id}
            title={row.id === currentUser?.id ? "Cannot deactivate yourself" : "Click to toggle account status"}
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
              isActive 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isActive ? <UserCheck className="w-3 h-3 text-emerald-600" /> : <UserX className="w-3 h-3 text-slate-400" />}
            <span>{val}</span>
          </button>
        );
      }
    },
    {
      key: 'actions',
      header: 'Security Actions',
      align: 'center',
      sortable: false,
      render: (val, row) => (
        <div className="inline-flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => {
              setResetTargetUser(row);
              setNewPassword('');
            }}
            title="Reset Password"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setEditUser(row);
              setEditUserForm({
                name: row.name,
                role: row.role,
                phone: row.phone || '',
                partnerId: row.partnerId || 'P1',
                clientId: row.clientId || 'CL-01',
                assignedProject: row.assignedProject || '',
                status: row.status
              });
            }}
            title="Edit User Profile"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          {row.id !== currentUser?.id && (
            <button
              type="button"
              onClick={() => setDeleteTarget(row)}
              title="Delete User"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  const filterOptions = [
    {
      key: 'role',
      label: 'Role',
      options: [
        { value: 'ALL', label: 'All Roles' },
        { value: 'ADMIN', label: 'ADMIN' },
        { value: 'PARTNER', label: 'PARTNER' },
        { value: 'CLIENT', label: 'CLIENT' },
        { value: 'WORKER', label: 'WORKER' }
      ]
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'ALL', label: 'All Statuses' },
        { value: 'ACTIVE', label: 'Active Accounts' },
        { value: 'INACTIVE', label: 'Inactive Accounts' }
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      <ModuleHeader
        icon={Users}
        title="Users & Role-Based Access Control"
        subtitle="Manage ERP user credentials, system roles, partner/client scoping, and status."
        fullDescription="Administrators can grant or revoke role permissions, reset passwords with bcrypt hashing, assign partner/client scopes, and manage active logins."
        badge={`Active Users: ${users.length}`}
        actions={
          <div className="flex items-center space-x-2">
            <button
              onClick={loadUsers}
              className="btn-secondary flex items-center space-x-1.5 text-xs font-semibold"
              title="Refresh users from PostgreSQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-1.5 text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create New User</span>
            </button>
          </div>
        }
      />

      <DataTable
        data={users}
        columns={columns}
        searchKeys={['name', 'email', 'phone', 'role', 'status']}
        searchPlaceholder="Search users by name, email, phone, role..."
        filters={filterOptions}
        isLoading={isLoading}
        onAddNew={() => setShowCreateModal(true)}
        addNewLabel="Create New User"
        exportFilename="Shivshakti_Users_Directory.xlsx"
        exportSheetName="Users"
      />

      {/* CREATE USER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span>Create New ERP User</span>
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Yashraj Patil"
                  className="form-input text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="e.g. yashraj@shivshakti.com"
                  className="form-input text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Initial Password</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    placeholder="Min 8 chars"
                    className="form-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="form-select text-xs"
                  >
                    <option value="PARTNER">PARTNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="WORKER">WORKER</option>
                  </select>
                </div>
              </div>

              {newUserForm.role === 'PARTNER' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Partner Entity Scope</label>
                  <select
                    value={newUserForm.partnerId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, partnerId: e.target.value })}
                    className="form-select text-xs"
                  >
                    <option value="P1">P1 - Rajesh Patel (Pune / Kolhapur)</option>
                    <option value="P2">P2 - Suresh Sharma (Mumbai)</option>
                    <option value="P3">P3 - Vikram Deshmukh (Nagpur)</option>
                  </select>
                </div>
              )}

              {newUserForm.role === 'CLIENT' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Linked Client Profile</label>
                  <select
                    value={newUserForm.clientId}
                    onChange={(e) => setNewUserForm({ ...newUserForm, clientId: e.target.value })}
                    className="form-select text-xs"
                  >
                    {(data.clients || []).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.id})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs"
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Edit3 className="w-5 h-5 text-amber-600" />
              <span>Edit User: {editUser.email}</span>
            </h3>
            <form onSubmit={handleUpdateUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input
                  required
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                    disabled={editUser.id === currentUser?.id}
                    className="form-select text-xs"
                  >
                    <option value="PARTNER">PARTNER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="CLIENT">CLIENT</option>
                    <option value="WORKER">WORKER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    value={editUserForm.phone || ''}
                    onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Key className="w-5 h-5 text-amber-600" />
              <span>Reset User Password</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter a new secure password for <strong>{resetTargetUser.email}</strong>.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="form-input text-xs"
                />
              </div>
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs"
                >
                  Apply Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete user account ${deleteTarget?.email} (${deleteTarget?.name}) from PostgreSQL? This action cannot be reversed.`}
        confirmLabel="Confirm Delete User"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
