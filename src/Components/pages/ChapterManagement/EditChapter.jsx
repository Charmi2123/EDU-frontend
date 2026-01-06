import React, { useMemo, useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets";

function EditChapter({ theme = 'dark', isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter" }) {
  const isDark = typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark';
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  const [form, setForm] = useState({
    duration_min: "",
    resolution: "",
    chapter_name: "",
    topic_name: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!navState?.id) {
      navigate(backto, { replace: true });
      return;
    }

    setForm((prev) => ({
      ...prev,
      duration_min: navState.video_duration_minutes?.toString() || "",
      resolution: navState.video_resolution || prev.resolution,
      chapter_name: navState.chapter_title_override || "",
      topic_name: navState.topic_title_override || "",
    }));
  }, [navState, navigate, backto]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Only numbers allowed for duration_min
    const nextValue = name === "duration_min"
      ? value.replace(/[^0-9]/g, "")
      : value;

    setForm(prev => ({ ...prev, [name]: nextValue }));
  };

  const cardCls = `${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border rounded-2xl p-4 sm:p-5 shadow-sm`;
  const labelCls = `${isDark ? 'text-white' : 'text-gray-900'} text-lg font-semibold mb-2 flex items-center gap-2`;
  const sublabelCls = `${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs mb-2`;
  const inputCls = `${isDark ? 'bg-zinc-800 text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-zinc-600' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400'} h-11 w-full rounded-lg px-3 outline-none transition`;

  const handleSubmit = async () => {
    if (isSaving) return;
    if (!navState?.id) {
      handleerror?.("Missing chapter reference. Please reopen Edit.");
      navigate(backto, { replace: true });
      return;
    }

    const payload = {
      video_duration_minutes: form.duration_min ? Number(form.duration_min) : undefined,
      video_resolution: form.resolution || undefined,
      chapter_title_override: form.chapter_name || undefined,
      topic_title_override: form.topic_name || undefined,
    };

    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      await axios.patch(
        `${BACKEND_API_URL}/chapter-materials/${navState.id}/edit`,
        payload,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {}),
          },
        }
      );

      handlesuccess?.('Chapter material metadata updated successfully');
      navigate(backto, { replace: true });
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to update chapter metadata';
      handleerror?.(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-zinc-50 text-zinc-900'} h-screen overflow-hidden transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300`}>
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Edit Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="w-full mx-auto space-y-4 px-0 sm:px-0">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} sticky top-0 z-30 border rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90 shadow-sm`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>Edit Chapter Management</div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <NavLink
                  to={backto}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </NavLink>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed`}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Edit Video */}
            <div className={cardCls}>
              <div className={labelCls}>✏️ Edit Video</div>
              <div className={sublabelCls}>Change Duration</div>
              <input
                type="text"
                inputMode="numeric"
                pattern="^[0-9]*$"
                name="duration_min"
                value={form.duration_min}
                onChange={handleChange}
                placeholder="Enter Duration In Minutes"
                className={inputCls}
              />
            </div>

            {/* Resolution Options */}
            <div className={cardCls}>
              <div className={labelCls}>📺 Resolution Options</div>
              <div className={sublabelCls}>Resolution Option</div>
              <select
                name="resolution"
                value={form.resolution}
                onChange={handleChange}
                className={`${inputCls} h-11`}
              >
                <option value="">Resolution Option</option>
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="hd">HD Output</option>
                <option value="4k">4K Output</option>
              </select>
            </div>

            {/* Change Chapter Name */}
            <div className={cardCls}>
              <div className={labelCls}>✏️ Change Chapter Name</div>
              <div className={sublabelCls}>New Chapter Name</div>
              <input
                type="text"
                name="chapter_name"
                value={form.chapter_name}
                onChange={handleChange}
                placeholder="Enter New Chapter Name"
                className={inputCls}
              />
            </div>

            {/* Change Topic Name */}
            <div className={cardCls}>
              <div className={labelCls}><span className={""}>✏️</span> Change Topic Name</div>
              <div className={sublabelCls}>New Topic Name</div>
              <input
                type="text"
                name="topic_name"
                value={form.topic_name}
                onChange={handleChange}
                placeholder="Enter New Topic Name"
                className={inputCls}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default EditChapter;
