import { initialData } from '../data/mockData';

const STORAGE_KEY = 'shivshakti_construction_db_v3';
const TOKEN_KEY = 'shivshakti_jwt_token';
const USER_KEY = 'shivshakti_auth_user';

export const getStoredData = () => {
  const dataStr = localStorage.getItem(STORAGE_KEY);
  if (!dataStr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  try {
    return JSON.parse(dataStr);
  } catch (e) {
    console.error("Error parsing stored data:", e);
    return initialData;
  }
};

export const saveStoredData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const resetToInitialData = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getAuthUser = () => {
  try {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

// Base API URL configuration for production deployment (e.g. Render backend)
// When VITE_API_URL is unset or empty, it defaults to '' preserving local Vite proxying
const RAW_API_BASE = (import.meta.env.VITE_API_URL || '').trim();
const API_BASE = RAW_API_BASE.replace(/\/+$/, '');

export const apiUrl = (endpoint) => {
  if (!API_BASE) {
    return endpoint;
  }
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // Avoid duplicating /api if VITE_API_URL already contains /api
  if (API_BASE.endsWith('/api') && path.startsWith('/api/')) {
    path = path.slice(4);
  }
  return `${API_BASE}${path}`;
};

const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// API Services
export const api = {
  getAuthUser,
  getAuthToken,

  async login(email, password) {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }

    // Store real JWT token and user profile
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));

    return data;
  },

  async logout() {
    try {
      await fetch(apiUrl('/api/auth/logout'), { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {
      // offline logout fallback
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async verifySession() {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch(apiUrl('/api/auth/me'), { headers: getAuthHeaders() });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        return user;
      }
      // If token expired or invalid, clear session
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    } catch (e) {
      return getAuthUser();
    }
  },

  async changePassword(currentPassword, newPassword) {
    const res = await fetch(apiUrl('/api/auth/change-password'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password.');
    return data;
  },

  // Admin User Management Services
  async getUsers(filters = {}) {
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await fetch(apiUrl(`/api/admin/users?${params}`), { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch admin users from server:', e);
    }
    const current = getStoredData();
    return current.users || [];
  },

  async createUser(userData) {
    const res = await fetch(apiUrl('/api/admin/users'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user.');
    return data;
  },

  async updateUser(userId, userData) {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user.');
    return data;
  },

  async toggleUserStatus(userId, status) {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/status`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change status.');
    return data;
  },

  async resetUserPassword(userId, newPassword) {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}/reset-password`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
    return data;
  },

  async deleteUser(userId) {
    const res = await fetch(apiUrl(`/api/admin/users/${userId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user.');
    return data;
  },

  async getAuditLogs() {
    try {
      const res = await fetch(apiUrl('/api/admin/audit-logs'), { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Failed to fetch audit logs from backend:', e);
    }
    const current = getStoredData();
    return current.auditLogs || [];
  },

  // Client Portal Services
  async getClientPortalData() {
    try {
      const res = await fetch(apiUrl('/api/client/portal-data'), { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using client fallback for portal data:', e);
    }
    return null;
  },

  async submitClientQuery(queryData) {
    const res = await fetch(apiUrl('/api/client/query'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(queryData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit query.');
    return data;
  },

  async notifyClientPayment(paymentData) {
    const res = await fetch(apiUrl('/api/client/notify-payment'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(paymentData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to notify payment.');
    return data;
  },

  // Worker Portal Services
  async getWorkerPortalData() {
    try {
      const res = await fetch(apiUrl('/api/worker/portal-data'), { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('Using worker fallback for portal data:', e);
    }
    return null;
  },

  async updateWorkerTaskStatus(taskId, status) {
    const res = await fetch(apiUrl(`/api/worker/tasks/${taskId}/status`), {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update task.');
    return data;
  },

  async punchWorkerAttendance() {
    const res = await fetch(apiUrl('/api/worker/attendance'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to punch in.');
    return data;
  },

  async submitWorkerSiteUpdate(updateData) {
    const res = await fetch(apiUrl('/api/worker/site-update'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit site update.');
    return data;
  },

  async updateWorkerDeliveryStatus(poId, status, notes) {
    const res = await fetch(apiUrl('/api/worker/delivery-status'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ poId, status, notes }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update delivery status.');
    return data;
  },

  // Notification Services
  async getNotifications() {
    try {
      const res = await fetch(apiUrl('/api/notifications'), { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      // fallback
    }
    return [];
  },

  async markNotificationRead(id) {
    try {
      await fetch(apiUrl(`/api/notifications/${id}/read`), {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      // offline fallback
    }
  },

  async checkDataIntegrity() {
    try {
      const res = await fetch(apiUrl('/api/validation/check'), { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Validation endpoint error:", e);
    }
    return { status: 'UNKNOWN' };
  },

  async getData() {
    try {
      const res = await fetch(apiUrl('/api/data'), { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        saveStoredData(data);
        return data;
      }
    } catch (err) {
      console.warn("Backend API not reachable, using local client DB", err);
    }
    return getStoredData();
  },

  async updateItem(moduleName, item) {
    const res = await fetch(apiUrl(`/api/${moduleName}`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(item),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to save to database.');
    }
    const result = await res.json();
    const savedItem = result.item || item;

    const currentData = getStoredData();
    const list = currentData[moduleName] || [];
    const index = list.findIndex((i) => i.id === item.id);
    let updatedList;
    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = savedItem;
    } else {
      updatedList = [savedItem, ...list];
    }

    const newData = { ...currentData, [moduleName]: updatedList };
    saveStoredData(newData);
    return newData;
  },

  async deleteItem(moduleName, itemId) {
    const res = await fetch(apiUrl(`/api/${moduleName}/${itemId}`), {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete on database.');
    }

    const currentData = getStoredData();
    const list = currentData[moduleName] || [];
    const updatedList = list.filter((i) => i.id !== itemId);

    const newData = { ...currentData, [moduleName]: updatedList };
    saveStoredData(newData);
    return newData;
  },

  async updateDeliveryStatus(poId, status, notes) {
    const currentData = getStoredData();
    const poList = currentData.purchaseOrders || [];
    const updatedPOs = poList.map((po) => {
      if (po.id === poId || po.poNumber === poId) {
        return {
          ...po,
          deliveryStatus: status,
          dispatchNotes: notes || po.dispatchNotes,
        };
      }
      return po;
    });

    const newData = { ...currentData, purchaseOrders: updatedPOs };
    saveStoredData(newData);

    try {
      await fetch(apiUrl(`/api/purchaseOrders/${poId}`), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deliveryStatus: status, dispatchNotes: notes }),
      });
    } catch (e) {
      // client fallback
    }

    return newData;
  },
};
