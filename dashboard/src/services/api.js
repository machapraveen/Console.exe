// src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://api.console-ext.com';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add authorization header for authenticated requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication APIs
export const register = async (userData) => {
  const response = await api.post('/api/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/api/auth/login', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/api/auth/profile');
  return response.data.user;
};

// Notification APIs
export const getNotifications = async () => {
  const response = await api.get('/api/notifications');
  return response.data;
};

// Application APIs
export const getApplications = async () => {
  const response = await api.get('/api/applications');
  return response.data;
};

export const createApplication = async (applicationData) => {
  const response = await api.post('/api/applications', applicationData);
  return response.data;
};

export const updateApplication = async (id, applicationData) => {
  const response = await api.put(`/api/applications/${id}`, applicationData);
  return response.data;
};

export const addRecipient = async (applicationId, recipientData) => {
  const response = await api.post(`/api/applications/${applicationId}/recipients`, recipientData);
  return response.data;
};
