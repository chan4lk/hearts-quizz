import axios from 'axios';

// Get API URL from environment variables
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const API_VERSION = 'v1';
const BASE_URL = `${API_URL}/api/${API_VERSION}`;

// Create axios instance with common configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Unauthorized - redirect to login
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getProfile: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout'),
};

// Quiz API
export const quizAPI = {
  getAll: () => apiClient.get('/quizzes'),
  getById: (id) => apiClient.get(`/quizzes/${id}`),
  getByPin: (pin) => apiClient.get(`/quizzes/pin/${pin}`),
  create: (quizData) => apiClient.post('/quizzes', quizData),
  update: (id, quizData) => apiClient.put(`/quizzes/${id}`, quizData),
  updateQuestions: (id, questions) => apiClient.put(`/quizzes/${id}/questions`, { questions }),
  delete: (id) => apiClient.delete(`/quizzes/${id}`),
};

export default {
  auth: authAPI,
  quiz: quizAPI,
};
