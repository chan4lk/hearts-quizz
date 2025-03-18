import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';

import { 
  ArrowBack, 
  Person, 
  Lock, 
  Visibility, 
  VisibilityOff, 
  AdminPanelSettings,
  Error
} from '@mui/icons-material';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, loginForm);
      const { token } = response.data;
      localStorage.setItem('token', token);
      navigate('/admin');
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 flex flex-col">
      <Header />
      <div className="flex-grow flex justify-center items-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <button 
              className="text-gray-600 hover:text-blue-600 transition-colors p-2 rounded-full hover:bg-gray-100" 
              onClick={handleBack}
              aria-label="Go back"
            >
              <ArrowBack />
            </button>
            <div className="text-blue-600">
              <AdminPanelSettings fontSize="large" />
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Admin Portal</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <Person />
                </span>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>
            
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                  <Lock />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-blue-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-middle">
                  <span className="visually-hidden">Loading...</span>
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
              <div className="flex items-center">
                <Error className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-500">
            Need help? <a href="#" className="font-medium text-blue-600 hover:text-blue-500">Contact support</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;