const API_BASE_URL = require('../utils/apiBase').getApiBase();

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token management
const tokenManager = {
  getToken: () => {
    if (typeof window === 'undefined') return null;
    try {
      // App historically used both `authToken` and `token`.
      // Prefer `authToken` (used by login + most pages), fallback to `token`.
      return localStorage.getItem('authToken') || localStorage.getItem('token');
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  },

  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      // Optional: Clear any other auth-related data
      localStorage.removeItem('user');
    }
  },

  redirectToLogin: () => {
    if (typeof window !== 'undefined') {
      // Store the current URL to redirect back after login
      const currentPath = window.location.pathname + window.location.search;
      if (!currentPath.includes('/login')) {
        localStorage.setItem('redirectAfterLogin', currentPath);
      }
      window.location.href = '/login';
    }
  }
};

export async function apiRequest(endpoint, options = {}) {
  const token = tokenManager.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;

  if (process.env.NODE_ENV === 'development') {
    console.log(`🌐 API Request: ${endpoint}`, {
      method: options.method || 'GET',
      hasToken: !!token
    });
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized - token expired
    if (response.status === 401) {
      console.error('❌ 401 Unauthorized - Token expired or invalid');
      const { forceLogout } = require('@/utils/auth');
      forceLogout('Your session has expired. Please login again.');
      throw new ApiError('Session expired. Please login again.', 401);
    }


    // Handle other error statuses
    if (response.status === 403) {
      console.warn('🚫 403 Forbidden - Access denied to this resource');
      throw new ApiError('Access denied. You do not have permission for this action.', 403);
    }

    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMessage = data.error || data.message || `HTTP ${response.status}: ${response.statusText}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network errors
    if (error.name === 'TypeError' || error.message.includes('fetch') || error.message.includes('network')) {
      throw new ApiError('Network error. Please check your connection and server status.', 0);
    }

    throw new ApiError(error.message || 'Unknown error occurred', 0, null);
  }
}

// Test API connection
export const testApi = async () => {
  try {
    console.log('🔍 Testing API connection...');
    const response = await apiRequest('/api/health');
    console.log('✅ API connection successful:', response);
    return response;
  } catch (error) {
    console.error('❌ API connection failed:', error);
    throw error;
  }
};

// Test authentication
export const testAuth = async () => {
  try {
    console.log('🔍 Testing authentication...');
    const response = await apiRequest('/api/test-protected');
    console.log('✅ Authentication successful:', response);
    return response;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
};

// HRMS-specific API functions
export const hrmsApi = {
  // Test connection first
  testConnection: testApi,
  testAuth: testAuth,

  // Employee endpoints
  // Backend routes are under `/api/hrms/staff` (employees = staff).
  getEmployees: () => apiRequest('/api/hrms/staff'),
  getEmployee: (id) => apiRequest(`/api/hrms/staff/${id}`),
  getNextEmployeeId: () => apiRequest('/api/hrms/staff/next-id'),
  checkAvailability: (username, email) => apiRequest('/api/hrms/staff/check-availability', {
    method: 'POST',
    body: JSON.stringify({ username, email }),
  }),
  createEmployee: (data) => apiRequest('/api/hrms/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateEmployee: (id, data) => apiRequest(`/api/hrms/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteEmployee: (id) => apiRequest(`/api/hrms/staff/${id}`, {
    method: 'DELETE',
  }),
  changeEmployeePassword: (id, newPassword) => apiRequest(`/api/hrms/staff/${id}/change-password`, {
    method: 'POST',
    body: JSON.stringify({ newPassword }),
  }),
  updateEmployeeStatus: (id, status) => apiRequest(`/api/hrms/staff/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),

  // Attendance endpoints
  getDailyAttendance: (date) => apiRequest(`/api/hrms/attendance?date=${encodeURIComponent(date)}`),
  getAttendanceRange: (from, to) =>
    apiRequest(`/api/hrms/attendance/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),
  // Admin-only: fetch/update a single employee attendance record by date.
  getAttendanceRecord: (emp_id, date) =>
    apiRequest(`/api/hrms/attendance/record?emp_id=${encodeURIComponent(emp_id)}&date=${encodeURIComponent(date)}`),
  updateAttendanceRecord: (data) => apiRequest('/api/hrms/attendance/record', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  // Back-compat alias
  getAttendance: (date) => apiRequest(`/api/hrms/attendance?date=${encodeURIComponent(date)}`),
  markAttendance: (emp_id, type, note = '') => apiRequest('/api/hrms/attendance/mark', {
    method: 'POST',
    body: JSON.stringify({ emp_id, type, note }),
  }),
  updateAttendance: (record_id, data) => apiRequest(`/api/hrms/attendance/${record_id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Payroll endpoints
  // Backend routes are under `/api/hrms/payroll/list?month=YYYY-MM`.
  getPayrolls: (month) => apiRequest(`/api/hrms/payroll/list?month=${encodeURIComponent(month)}`),
  // Not implemented in backend; kept for compatibility if added later.
  getUncalculatedEmployees: (month) => apiRequest(`/api/hrms/payroll/uncalculated?month=${encodeURIComponent(month)}`),
  getPayrollById: (id) => apiRequest(`/api/hrms/payroll/${id}`),
  calculatePayroll: (emp_id, month) => apiRequest('/api/hrms/payroll/calculate', {
    method: 'POST',
    body: JSON.stringify({ emp_id, month }),
  }),
  updatePayroll: (id, data) => apiRequest(`/api/hrms/payroll/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Leave requests
  getLeaveRequests: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      qs.set(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/api/hrms/leave-requests${suffix}`);
  },
  createLeaveRequest: (data) => apiRequest('/api/hrms/leave-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateLeaveRequestStatus: (id, status, decisionNote = '') => apiRequest(`/api/hrms/leave-requests/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, decisionNote }),
  }),
  updateLeaveRequest: (id, data) => apiRequest(`/api/hrms/leave-requests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Department endpoints
  getDepartments: () => apiRequest('/api/hrms/departments'),
  createDepartment: (data) => apiRequest('/api/hrms/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDepartment: (id, data) => apiRequest(`/api/hrms/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteDepartment: (id) => apiRequest(`/api/hrms/departments/${id}`, {
    method: 'DELETE',
  }),
};

// Activity Logs API
export const logsApi = {
  getLogs: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      qs.set(k, String(v));
    });
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return apiRequest(`/api/logs${suffix}`);
  },
  getLogById: (id) => apiRequest(`/api/logs/${id}`),
};

// Roles & Permissions API
export const rolesApi = {
  getPermissions: () => apiRequest('/api/roles/permissions'),
  updatePermissions: (permissions) => apiRequest('/api/roles/permissions', {
    method: 'PUT',
    body: JSON.stringify({ permissions }),
  }),

  getDesignations: () => apiRequest('/api/roles/permissions/designations'),
  deleteDesignation: (role) => apiRequest('/api/roles/permissions/designation', {
    method: 'DELETE',
    body: JSON.stringify({ role }),
  }),
};
