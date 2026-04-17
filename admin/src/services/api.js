import axios from 'axios';

// Base API URL - adjust based on your backend
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  // Login
  login: async (email, password, captchaToken) => {
    try {
      const response = await api.post('/auth/login', { email, password, captchaToken });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Login failed' };
    }
  },

  // Register
  register: async (name, email, password, role) => {
    try {
      const response = await api.post('/auth/register', { 
        name, 
        email, 
        password, 
        role 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Registration failed' };
    }
  },

  // Get current admin
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get admin data' };
    }
  },
};

// Admin API calls
export const adminAPI = {
  // Get all admins
  getAllAdmins: async () => {
    try {
      const response = await api.get('/admin');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get admins' };
    }
  },

  // Get single admin
  getAdmin: async (id) => {
    try {
      const response = await api.get(`/admin/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to get admin' };
    }
  },

  // Update admin
  updateAdmin: async (id, data) => {
    try {
      const response = await api.put(`/admin/${id}`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to update admin' };
    }
  },

  // Change password
  changePassword: async (id, currentPassword, newPassword) => {
    try {
      const response = await api.put(`/admin/${id}/password`, {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to change password' };
    }
  },

  // Delete admin
  deleteAdmin: async (id) => {
    try {
      const response = await api.delete(`/admin/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to delete admin' };
    }
  },
};

export default api;