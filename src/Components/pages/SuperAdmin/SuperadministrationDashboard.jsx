/**
 * Portal Dashboard
 * Main dashboard for portal
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut,
  Menu,
  X,
  Users,
  Settings,
  UploadCloud,
  FileSpreadsheet,
  BarChart3,
  Shield,
  AlertCircle,
  Home,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { BACKEND_API_URL, checkSuperadminAuth } from '../../../utils/assets.js';

const SuperadministrationDashboard = ({ isDark }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [portalStatus, setPortalStatus] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    std: '',
    subject: '',
    sem: '',
    board: '',
    chapterNumber: '',
    chapterTitle: '',
  });
  const [uploadFile, setUploadFile] = useState(null);
  const [lastUploadResult, setLastUploadResult] = useState(null);

  const uploadGuidelines = [
    {
      title: 'Single upload, multi-delivery',
      description: 'One PDF instantly appears inside every admin’s chapter suggestions list.',
    },
    {
      title: 'Preserve naming clarity',
      description: 'Use meaningful chapter numbers and titles so admins instantly recognize the content.',
    },
    {
      title: 'Supported formats',
      description: 'Only PDF files up to 15 MB are supported for now. Larger files should be compressed first.',
    },
  ];

  useEffect(() => {
    checkPortalStatus();
  }, []);

  const checkPortalStatus = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (!token) {
        navigate('/');
        return;
      }

      // Check if user is actually a superadmin

      if (!checkSuperadminAuth()) {
        toast.error('Unauthorized access. Only superadmins can access this portal.');
        navigate('/');
        return;
      }

      const response = await fetch(`${BACKEND_API_URL}/superadministration/portal/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Portal status parse error:', parseError);
        toast.error('Invalid response from server while loading portal status');
        return;
      }
      if (data.status) {
        setPortalStatus(data.data);
      } else {
        toast.error('Failed to load portal status');
      }
    } catch (error) {
      console.error('Portal status error:', error);
      toast.error('Failed to load portal status');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('superadmin_token');
      if (token) {
        await fetch(`${BACKEND_API_URL}/superadministration/portal/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      toast.success('Logged out successfully');
      navigate('/superadministration/login');
    }
  };

  const handleUploadFormChange = (field) => (event) => {
    const value = event.target.value;
    setUploadForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setUploadFile(file);
  };

  const handleGlobalUpload = async (event) => {
    event.preventDefault();

    if (!uploadForm.std || !uploadForm.subject || !uploadForm.chapterNumber) {
      toast.error('Standard, Subject, and Chapter Number are required.');
      return;
    }

    if (!uploadFile) {
      toast.error('Please select a PDF file.');
      return;
    }

    const token = localStorage.getItem('superadmin_token');
    if (!token) {
      toast.error('Session expired. Please log in again.');
      navigate('/superadministration/login');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('std', uploadForm.std);
      formData.append('subject', uploadForm.subject);
      formData.append('chapter_number', uploadForm.chapterNumber);
      formData.append('sem', uploadForm.sem);
      formData.append('board', uploadForm.board);
      if (uploadForm.chapterTitle) {
        formData.append('chapter_title', uploadForm.chapterTitle);
      }
      formData.append('pdf_file', uploadFile);

      const response = await fetch(`${BACKEND_API_URL}/superadministration/portal/upload-chapter`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Global upload parse error:', parseError);
        throw new Error('Invalid response from server while uploading PDF');
      }
      if (!data.status) {
        throw new Error(data.message || 'Upload failed');
      }

      toast.success('Chapter PDF uploaded for all admins!');
      setLastUploadResult({
        createdRecords: data?.data?.created_records ?? 0,
        failures: data?.data?.failures ?? [],
      });
      setUploadForm({
        std: '',
        subject: '',
        sem: '',
        board: '',
        chapterNumber: '',
        chapterTitle: '',
      });
      setUploadFile(null);
      event.target.reset();
    } catch (error) {
      console.error('Global upload error:', error);
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setUploading(false);
    }
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Dashboard',
      onClick: () => navigate('/superadministration/dashboard'),
    },
  ];

  const dashboardCards = [
    {
      title: 'Total Users',
      value: '2,547',
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Active Sessions',
      value: '342',
      icon: Shield,
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'System Health',
      value: '99.8%',
      icon: BarChart3,
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Pending Actions',
      value: '12',
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
    },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-zinc-950' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDark ? 'bg-zinc-950' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: sidebarOpen ? 0 : -250 }}
        transition={{ duration: 0.3 }}
        className={`fixed left-0 top-0 h-screen w-64 border-r z-40 transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
      >
        <div className={`p-6 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Superadmin
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Portal v2.0</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item, index) => (
            <motion.button
              key={index}
              whileHover={{ x: 4 }}
              onClick={item.onClick}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isDark
                ? 'text-gray-400 hover:text-white hover:bg-zinc-800'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border font-medium transition-colors ${isDark
              ? 'bg-zinc-800 border-zinc-700 text-gray-300 hover:bg-zinc-700 hover:text-white'
              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col min-h-0 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300`}>
        {/* Top Bar */}
        <div className={`border-b p-4 flex items-center justify-between transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-white' : 'hover:bg-gray-100 text-gray-900'}`}
          >
            {sidebarOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Dashboard
          </h2>
          <div className="w-10"></div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 overflow-auto flex-1">
          {/* Status Alert */}
          {portalStatus && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3"
            >
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-green-400 text-sm">
                {portalStatus.portal_name} is operational
              </p>
            </motion.div>
          )}

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {dashboardCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-6 rounded-2xl border shadow-xs hover:shadow-lg transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {card.title}
                    </p>
                    <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {card.value}
                    </p>
                  </div>
                  <div className={`bg-gradient-to-br ${card.color} p-3 rounded-lg shadow-md`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={`p-6 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}
          >
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ActionButton
                onClick={() => navigate('/superadministration/users')}
                label="Manage Users"
                isDark={isDark}
              />
              <ActionButton
                onClick={() => navigate('/superadministration/security')}
                label="Security Settings"
                isDark={isDark}
              />
              <ActionButton
                onClick={() => navigate('/superadministration/analytics')}
                label="View Analytics"
                isDark={isDark}
              />
            </div>
          </motion.div>

          {/* Global Chapter Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-[0.3em] font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Superadmin exclusive
                </p>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Distribute a chapter PDF globally
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  One upload updates every admin’s chapter suggestions instantly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
              <div className={`rounded-2xl border p-6 shadow-lg ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <form className="space-y-6" onSubmit={handleGlobalUpload}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Standard"
                      hint="e.g., Class 8"
                      required
                      value={uploadForm.std}
                      onChange={handleUploadFormChange('std')}
                      isDark={isDark}
                    />
                    <FormField
                      label="Subject"
                      hint="e.g., Science"
                      required
                      value={uploadForm.subject}
                      onChange={handleUploadFormChange('subject')}
                      isDark={isDark}
                    />
                    <FormField
                      label="Chapter Number"
                      hint="e.g., Chapter 5"
                      required
                      value={uploadForm.chapterNumber}
                      onChange={handleUploadFormChange('chapterNumber')}
                      isDark={isDark}
                    />
                    <FormField
                      label="Chapter Title"
                      hint="Optional display title"
                      value={uploadForm.chapterTitle}
                      onChange={handleUploadFormChange('chapterTitle')}
                      isDark={isDark}
                    />
                    <FormField
                      label="Semester"
                      hint="Optional"
                      value={uploadForm.sem}
                      onChange={handleUploadFormChange('sem')}
                      isDark={isDark}
                    />
                    <FormField
                      label="Board"
                      hint="Optional"
                      value={uploadForm.board}
                      onChange={handleUploadFormChange('board')}
                      isDark={isDark}
                    />
                  </div>

                  <div>
                    <label className={`text-sm mb-2 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Chapter PDF *</label>
                    <label className={`relative flex flex-col items-center justify-center w-full min-h-[9rem] border border-dashed rounded-2xl cursor-pointer transition-all ${isDark
                      ? 'border-zinc-700 hover:border-purple-500/70 bg-zinc-800/50'
                      : 'border-gray-300 hover:border-purple-500/70 bg-gray-50'
                      }`}>
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <UploadCloud className="w-8 h-8 text-purple-400 mb-2" />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {uploadFile ? uploadFile.name : 'Click or drag PDF here'}
                      </span>
                      <span className={`text-[11px] uppercase tracking-[0.3em] mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        PDF up to 15MB
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:transform active:scale-[0.98] transition-all shadow-lg hover:shadow-purple-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    {uploading ? 'Uploading...' : 'Upload PDF for All Admins'}
                  </button>
                </form>
              </div>

              <div className="flex flex-col gap-6">
                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="bg-green-500/10 text-green-400 rounded-full w-10 h-10 flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs uppercase tracking-[0.3em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        Last Broadcast
                      </p>
                      <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {lastUploadResult ? 'Completed' : 'Not yet run'}
                      </p>
                    </div>
                  </div>

                  {lastUploadResult ? (
                    <>
                      <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lastUploadResult.createdRecords} admin accounts received this chapter.
                      </p>
                      {lastUploadResult.failures?.length > 0 ? (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-sm text-red-400 max-h-36 overflow-auto custom-scrollbar">
                          <p className="font-semibold mb-2">
                            Failed for {lastUploadResult.failures.length} admin(s):
                          </p>
                          <ul className="space-y-1">
                            {lastUploadResult.failures.map((failure, idx) => (
                              <li key={`${failure.admin_id}-${idx}`}>
                                Admin #{failure.admin_id}: {failure.error}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 text-sm text-green-400">
                          Distributed to every admin without issues.
                        </div>
                      )}
                    </>
                  ) : (
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Once you upload your first PDF, distribution stats will appear here.
                    </p>
                  )}
                </div>

                <div className={`p-5 rounded-2xl border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                  <p className={`text-xs uppercase tracking-[0.3em] mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Upload Blueprint
                  </p>
                  <ul className="space-y-3">
                    {uploadGuidelines.map((tip) => (
                      <li key={tip.title} className="flex gap-3">
                        <div className="w-2 h-2 rounded-full bg-purple-400 mt-2.5 shrink-0"></div>
                        <div>
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{tip.title}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{tip.description}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const ActionButton = ({ onClick, label, isDark }) => (
  <button
    onClick={onClick}
    className={`w-full py-2.5 px-4 rounded-xl border font-medium transition-colors ${isDark
      ? 'bg-zinc-800 border-zinc-700 text-gray-200 hover:bg-zinc-700 hover:text-white'
      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
      }`}
  >
    {label}
  </button>
);

const FormField = ({ label, hint, value, onChange, required = false, isDark }) => (
  <div>
    <label className={`text-sm mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    <input
      type="text"
      className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all duration-200 
        ${isDark
          ? 'bg-zinc-800 border-zinc-700 text-white placeholder-gray-500 focus:border-purple-500'
          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-purple-500'
        }`}
      placeholder={hint}
      value={value}
      onChange={onChange}
    />
  </div>
);

export default SuperadministrationDashboard;
