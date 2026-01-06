/**
 * Superadministration Portal Login Page
 * Dedicated login page for superadministration portal
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { BACKEND_API_URL } from '../../../utils/assets';
const SuperadministrationLogin = ({ isDark }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });

  const handleInputChange = (field) => (e) => {
    setCredentials(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!credentials.email || !credentials.password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_API_URL}/superadministration/portal/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        const message = 'Invalid response from server. Please try again later.';
        setError(message);
        toast.error(message);
        return;
      }

      if (!response.ok || !data.status) {
        const message = data.detail || data.message || 'Login failed';
        setError(message);
        toast.error(message);
        return;
      }

      const { token, access_token: accessToken, refresh_token: refreshToken } = data.data || {};
      const resolvedAccessToken = accessToken || token;

      if (!resolvedAccessToken) {
        const message = 'Unable to retrieve access token. Please try again.';
        setError(message);
        toast.error(message);
        return;
      }

      localStorage.setItem('superadmin_token', resolvedAccessToken);
      if (refreshToken) {
        localStorage.setItem('superadmin_refresh_token', refreshToken);
      }
      localStorage.setItem('superadmin_user', JSON.stringify({
        role: 'superadmin',
        user_type: 'superadmin',
      }));

      toast.success('Superadministration portal login successful!');
      navigate('/superadministration/dashboard');
    } catch (err) {
      const errorMsg = err.message || 'An error occurred during login';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-zinc-950' : 'bg-gray-100'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className={`p-8 shadow-2xl rounded-2xl border transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-linear-to-br from-purple-500 to-pink-500 p-4 rounded-lg shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Superadministration Portal
            </h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Secure access to system administration
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={handleInputChange('email')}
                disabled={loading}
                required
                className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 
                  ${isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleInputChange('password')}
                disabled={loading}
                required
                className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 
                  ${isDark
                    ? 'bg-zinc-800 border-zinc-700 text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-purple-500/25
                ${loading
                  ? 'bg-purple-500/70 cursor-wait'
                  : 'bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:transform active:scale-[0.98]'
                }`}
            >
              {loading ? 'Logging in...' : 'Login to Portal'}
            </button>
          </form>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
            <p className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              This portal is restricted to authorized superadministrators only.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperadministrationLogin;
