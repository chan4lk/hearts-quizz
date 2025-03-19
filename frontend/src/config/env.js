// Environment configuration for the application
export const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_URL;
