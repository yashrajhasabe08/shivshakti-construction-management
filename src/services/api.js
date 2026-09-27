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
    try {
      const res = await fetch('/api/auth/login', {
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
    } catch (err) {
      throw err;
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', headers: getAuthHeaders() });
    } catch (e) {
      // offline logout
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async verifySession() {
    const token = getAuthToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', { headers: getAuthHeaders() });
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

  async checkDataIntegrity() {
    try {
      const res = await fetch('/api/validation/check', { headers: getAuthHeaders() });
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Validation endpoint error:", e);
    }
    return { status: 'UNKNOWN' };
  },

  async getData() {
    try {
      const res = await fetch('/api/data', { headers: getAuthHeaders() });
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
    const currentData = getStoredData();
    const list = currentData[moduleName] || [];
    
    const index = list.findIndex((i) => i.id === item.id);
    let updatedList;
    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = item;
    } else {
      updatedList = [item, ...list];
    }

    const newData = { ...currentData, [moduleName]: updatedList };
    saveStoredData(newData);

    try {
      await fetch(`/api/${moduleName}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(item),
      });
    } catch (e) {
      // client-side update handles fallback
    }
    return newData;
  },

  async deleteItem(moduleName, itemId) {
    const currentData = getStoredData();
    const list = currentData[moduleName] || [];
    const updatedList = list.filter((i) => i.id !== itemId);

    const newData = { ...currentData, [moduleName]: updatedList };
    saveStoredData(newData);

    try {
      await fetch(`/api/${moduleName}/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
    } catch (e) {
      // client fallback
    }
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
      await fetch(`/api/purchaseOrders/${poId}`, {
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
