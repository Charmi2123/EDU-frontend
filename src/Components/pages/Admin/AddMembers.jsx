import React, { useState, useRef, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar";
import { ArrowLeft, ChevronDown, Eye, EyeClosed, EyeOff } from "lucide-react";
import Header from "../../Tools/Header";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { handlesuccess, handleerror, BACKEND_API_URL } from "../../../utils/assets.js";

// ✅ Custom Dropdown Component
const Dropdown = ({ label, placeholder, options, isDark, value, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    if (typeof onSelect === 'function') {
      onSelect(option);
    }
    setIsOpen(false);
  };

  return (
    <div className="w-full space-y-2 relative" ref={dropdownRef}>
      <label className={`block text-sm transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>{label}</label>
      <div className="relative">
        {/* Header */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`${isDark ? 'bg-[#FFFFFF0D] border-zinc-700 hover:bg-zinc-800' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200'} border rounded-md flex justify-between items-center px-3 py-2 cursor-pointer transition-colors duration-300`}
        >
          <span className={`text-sm transition-colors duration-300 ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>
            {value || placeholder}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${isDark ? 'text-gray-400' : 'text-zinc-500'} ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>

        {/* Dropdown Options - Absolutely Positioned */}
        {isOpen && (
          <div className={`absolute top-full left-0 right-0 mt-1 rounded-md border overflow-hidden z-50 shadow-lg ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
            <div className={`max-h-60 overflow-y-auto ${isDark ? 'divide-zinc-800' : 'divide-zinc-200'} divide-y transition-colors duration-300`}>
              {options.map((opt, i) => (
                <div
                  key={i}
                  onClick={() => handleSelect(opt)}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors duration-200 ${isDark ? 'hover:bg-zinc-800 text-gray-200' : 'hover:bg-zinc-50 text-zinc-800'} ${value === opt ? (isDark ? 'bg-zinc-800' : 'bg-zinc-100') : ''}`}
                >
                  {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ✅ Main Component
function AddMembers({ theme, isDark, toggleTheme, sidebardata }) {
  const navigate = useNavigate();
  const location = useLocation();

  const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark';
  const [adminId, setAdminId] = useState(localStorage.getItem('admin_id'));
  const [form, setForm] = useState({
    name: '',
    designation: '',
    work_type: '',
    phone_number: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const editState = location.state || {};
  const isEdit = Boolean(editState && editState.id);

  const toSnake = (s = '') => s.toString().trim().toLowerCase().replace(/\s+/g, '_');
  const toTitle = (s = '') => s
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    if (name === 'phone_number') {
      const numeric = value.replace(/\D/g, '').slice(0, 11);
      setForm((prev) => ({ ...prev, phone_number: numeric }));
      return;
    }
    if (name === 'email') {
      // Force lowercase and remove invalid characters
      const formatted = value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
      setForm((prev) => ({ ...prev, email: formatted }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (key) => (option) => {
    setForm((prev) => ({ ...prev, [key]: option }));
  };

  const resetForm = () => {
    setForm({
      name: '',
      designation: '',
      work_type: '',
      phone_number: '',
      email: '',
      password: '',
    });
  };

  useEffect(() => {
    const loadForEdit = async () => {
      if (!isEdit || !editState.id) {
        resetForm();
        return;
      }
      setIsFetching(true);
      try {
        const res = await axios.get(`${BACKEND_API_URL}/admin-portal/members/${encodeURIComponent(editState.id)}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        const d = res.data?.data?.member || {};
        setForm({
          name: d.name || '',
          designation: d.designation || '',
          work_type: d.work_type ? toTitle(d.work_type) : '',
          phone_number: d.phone_number || '',
          email: d.email || '',
          password: '',
        });
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Failed to fetch member details';
        handleerror(msg);
      } finally {
        setIsFetching(false);
      }
    };
    loadForEdit();
  }, [isEdit, editState?.id]);

  const handleSubmit = async () => {
    if (!form.name) {
      handleerror('Please enter Name of Person.');
      return;
    }
    if (!form.designation) {
      handleerror('Please enter Designation.');
      return;
    }
    if (!form.work_type) {
      handleerror('Please select Work Type.');
      return;
    }
    if (!form.phone_number) {
      handleerror('Please enter Phone Number.');
      return;
    }
    if (form.phone_number.length < 10 || form.phone_number.length > 11) {
      handleerror('Phone Number must be 10 or 11 digits.');
      return;
    }
    if (!form.email) {
      handleerror('Please enter Email.');
      return;
    }
    if (!form.email.endsWith('@gmail.com')) {
      handleerror('Please enter a valid Gmail address (example: username@gmail.com).');
      return;
    }
    if (!isEdit && !form.password) {
      handleerror('Please enter Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: (form.name || '').trim(),
        designation: (form.designation || '').trim(),
        work_type: (() => {
          const t = (form.work_type || '').toLowerCase();
          if (t.includes('lecture')) return 'lecture';
          if (t.includes('student')) return 'student';
          if (t.includes('chapter')) return 'chapter';
          return toSnake(form.work_type || '');
        })(),
        phone_number: (form.phone_number || '').trim(),
        email: (form.email || '').trim(),
      };
      // if (!isEdit && form.password) payload.password = form.password;
      if (form.password) payload.password = form.password;
      const token = localStorage.getItem('access_token') || '';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (isEdit) {
        const url = `${BACKEND_API_URL}/admin-portal/members/${encodeURIComponent(adminId)}/${encodeURIComponent(editState.id)}`;
        const response = await axios.put(url, payload, { headers });
        if (response.status >= 200 && response.status < 300) {
          handlesuccess(response.data?.message || 'Member updated successfully');
          navigate('/Admin/Managementlist');
        }
      } else {
        const url = `${BACKEND_API_URL}/admin-portal/members`;
        const response = await axios.post(url, payload, { headers });
        if (response.status === 200 || response.status === 201) {
          handlesuccess(response.data?.message || 'Member added successfully');
          navigate('/Admin/Managementlist');
          resetForm();
        }
      }
    } catch (error) {
      const message = error.response?.data?.detail?.[0]?.msg || error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to save member';
      handleerror(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex ${resolvedDark ? 'bg-zinc-950 text-gray-100' : 'bg-[#F5F5F9] text-zinc-900'} h-screen overflow-hidden transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={resolvedDark} sidebardata={sidebardata} />

      {/* ===== Main Section (offset for fixed sidebar) ===== */}
      <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
        {/* ===== Sticky Header inside scroll context ===== */}
        <div className="sticky top-0 z-20">
          <Header title={isEdit ? "Edit Member" : "Add Member"} isDark={resolvedDark} toggleTheme={toggleTheme} />
        </div>

        {/* ===== Scrollable Main Content ===== */}
        <main className={`mt-6 gap-6 flex-1 overflow-y-auto no-scrollbar transition-colors duration-300 ${resolvedDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>
          <div className={`w-full rounded-lg shadow-lg p-6 space-y-6 transition-colors duration-300 ${resolvedDark ? 'bg-zinc-900 text-gray-200 border border-zinc-800' : 'bg-white text-zinc-800 border border-zinc-200'}`}>
            {/* Header */}
            <div className={`flex justify-between items-center pb-3 transition-colors duration-300 ${resolvedDark ? 'border-b border-zinc-800' : 'border-b border-zinc-200'}`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
                <button
                  onClick={() => navigate("/Admin/Managementlist")}
                  className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className={`text-md font-semibold transition-colors duration-300 ${resolvedDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                  Member Information
                </h2>
              </div>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`px-4 py-1 cursor-pointer rounded transition-colors duration-300 ${resolvedDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-4 py-1 rounded cursor-pointer transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed ${resolvedDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]'}`}
                >
                  {isSubmitting ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update' : 'Save')}
                </button>
              </div>
            </div>

            {/* Name & Designation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm mb-2 transition-colors duration-300 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Name Of Person</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Enter name"
                  value={form.name}
                  onChange={handleInputChange}
                  className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${resolvedDark ? 'bg-[#FFFFFF0D] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-300'} border`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 transition-colors duration-300 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Designation</label>
                <input
                  name="designation"
                  type="text"
                  placeholder="Your Designation"
                  value={form.designation}
                  onChange={handleInputChange}
                  className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${resolvedDark ? 'bg-[#FFFFFF0D] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-300'} border`}
                />
              </div>
              {/* Work Type */}
              <Dropdown
                label="Academic Roles"
                placeholder="Select Your Role"
                isDark={resolvedDark}
                value={form.work_type}
                onSelect={handleDropdownChange('work_type')}
                options={[
                  "Chapter Management",
                  "Student Management",
                  "Lecture Management",
                ]}
              />
              <div>
                <label className={`block text-sm mb-2 transition-colors duration-300 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Phone Number</label>
                <input
                  name="phone_number"
                  type="tel"
                  placeholder="Enter phone number"
                  value={form.phone_number}
                  onChange={handleInputChange}
                  pattern="[0-9]{10,11}"
                  inputMode="numeric"
                  minLength={10}
                  maxLength={11}
                  className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${resolvedDark ? 'bg-[#FFFFFF0D] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-300'} border`}
                />
              </div>
              <div>
                <label className={`block text-sm mb-2 transition-colors duration-300 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={form.email}
                  onChange={handleInputChange}
                  required
                  className={`w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${resolvedDark ? 'bg-[#FFFFFF0D] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-300'} border`}
                />
              </div>
              {/* {!isEdit && ( */}
              <div>
                <label className={`block text-sm mb-2 transition-colors duration-300 ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={form.password}
                    onChange={handleInputChange}
                    className={`w-full rounded px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-1 transition-colors duration-300 ${resolvedDark ? 'bg-[#FFFFFF0D] border-zinc-700 text-gray-200 placeholder:text-gray-400 focus:ring-zinc-600' : 'bg-zinc-100 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-300'} border`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className={`absolute cursor-pointer inset-y-0 right-0 flex items-center pr-3 text-sm ${resolvedDark ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-500 hover:text-zinc-700'} transition-colors`}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
              {/* )} */}
            </div>


            {/* Contact Details
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            </div> */}

            {/* Password */}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AddMembers;
