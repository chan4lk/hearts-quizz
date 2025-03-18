import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, loginForm);
      const { token } = response.data;
      localStorage.setItem('token', token);
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 transform transition-all duration-300 hover:shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <button className="text-gray-600" onClick={handleBack}>
            <ArrowBackIcon />
          </button>
          
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-800">Welcome Back Admin Login</h1>
        <p className="text-gray-600 text-center mb-8">Sign in to your admin account</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            Login
          </button>
        </form>
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLoginPage;