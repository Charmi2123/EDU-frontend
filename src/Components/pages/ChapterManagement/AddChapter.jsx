import React, { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets";
import { ArrowLeft } from "lucide-react";

function AddChapter({ theme = 'dark', isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter" }) {
  const isDark = typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark';

  const [form, setForm] = useState({
    class_name: "",
    subject_name: "",
    chapter_name: "",
  });

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const cardCls = `${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-4 sm:p-5`;
  const labelCls = `${isDark ? 'text-white' : 'text-gray-900'} text-base sm:text-lg font-semibold mb-2 flex items-center gap-2`;
  const sublabelCls = `${isDark ? 'text-gray-400' : 'text-gray-600'} text-xs mb-2`;
  const inputCls = `${isDark ? 'bg-zinc-800 text-gray-200 placeholder-gray-400 focus:ring-1 focus:ring-zinc-600' : 'bg-gray-100 text-gray-900 placeholder-gray-500 focus:ring-1 focus:ring-gray-400'} h-11 w-full rounded-lg px-3 outline-none transition`;

  const [selectedIds, setSelectedIds] = useState([]); // selected chapter suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const lastSuggestionKey = useRef(null);

  // Fetch chapter suggestions from API
  const fetchSuggestions = async () => {
    const key = JSON.stringify({
      class_name: form.class_name,
      subject: form.subject_name,
      chapter: form.chapter_name,
    });
    if (lastSuggestionKey.current === key) {
      setShowSuggestions(true);
      return;
    }
    lastSuggestionKey.current = key;

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcl90eXBlIjoibWVtYmVyIiwicm9sZSI6Im1lbWJlciIsImlkIjoxLCJzZXNzaW9uX2lkIjoibWVtYmVyXzFfMTc2NDA2NTA5NSIsImFkbWluX2lkIjoiMSIsIndvcmtfdHlwZSI6ImNoYXB0ZXIiLCJleHAiOjE3OTU2MDEwOTUsInR5cGUiOiJhY2Nlc3MifQ.5AHNqoTvwEmSWjdpYxDmFOj_R2zwTp3gEJaYoyJKh6c";

      const requestBody = {
        std: form.class_name,
        subject: form.subject_name
      };

      const response = await axios.post(`${BACKEND_API_URL}/chapter-materials/chapter-suggestion`, requestBody, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const materials = response?.data?.data?.materials || [];

      if (response.status === 200) {
        handlesuccess(response?.data?.message || "Chapter suggestions fetched Successfully")
      }

      // Map API data to UI structure
      const mappedSuggestions = materials.map((item) => {
        // Extract chapter name from file_name
        const fileName = item.file_name || "Chapter Material";
        let chapterName = fileName;

        // Remove file extension and clean up the name
        if (fileName.includes('.')) {
          chapterName = fileName.split('.').slice(0, -1).join('.');
        }

        // Remove common prefixes like "chapter-", "chapter_", etc.
        chapterName = chapterName.replace(/^chapter[-_\s]?/i, '');
        chapterName = chapterName.replace(/^unit[-_\s]?/i, '');

        return {
          id: item.id,
          classLabel: `Class ${item.std || "—"}`,
          subjectLabel: item.subject || "—",
          title: chapterName || "Chapter Material",
          tag: item.board || "—",
          fileSize: item.file_size,
          chapterNumber: item.chapter_number,
          sem: item.sem || "—"
        };
      });

      setSuggestions(mappedSuggestions);
      setShowSuggestions(true);
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || "Failed to load chapter suggestions";
      setError(errorMessage);
      if (typeof handleerror === "function") {
        handleerror(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show all suggestions from API without filtering
  const filteredSuggestions = useMemo(() => {
    if (!showSuggestions) return [];

    // Return maximum 2 suggestions from API
    return suggestions.slice(0, 2);
  }, [suggestions, showSuggestions]);
  return (
    <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-[#F5F5F9] text-zinc-900'} h-screen overflow-hidden transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300`}>
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="w-full mx-auto space-y-4">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} sticky top-0 z-30 border border-transparent rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>
                <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
                  <button
                    onClick={() => navigate("/chapter/Home")}
                    className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                    Add Chapter Management
                  </h2>
                </div>

              </div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <button
                  onClick={() => {
                    setForm({
                      class_name: "",
                      subject_name: "",
                      chapter_name: "",
                    });
                    setSelectedIds([]);
                    setShowSuggestions(false);
                    setSuggestions([]);
                  }}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  disabled={!form.class_name || !form.subject_name || !form.chapter_name}
                  onClick={() => navigate("/chapter/UploadBook", {
                    state: {
                      suggestion: selectedIds.length > 0 ? true : false,
                      selectedIds: selectedIds,
                      form: form
                    }
                  })}
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}>
                  Next
                </button>
              </div>
            </div>

            {/* Add Class */}
            <div className={cardCls}>
              <div className={labelCls}>🟦 Class</div>
              {/* <div className={sublabelCls}>Class</div> */}
              <input
                type="text"
                name="class_name"
                value={form.class_name}
                onChange={handleChange}
                placeholder="Enter Class"
                className={inputCls}
              />
            </div>

            {/* Add Subject */}
            <div className={cardCls}>
              <div className={labelCls}>📚 Subject</div>
              {/* <div className={sublabelCls}>Subject Name</div> */}
              <input
                type="text"
                name="subject_name"
                value={form.subject_name}
                onChange={handleChange}
                placeholder="Enter Subject Name"
                className={inputCls}
              />
            </div>

            {/* Chapter Name */}
            <div className={cardCls}>
              <div className={labelCls}>📘 Chapter Name</div>
              {/* <div className={sublabelCls}>Chapter</div> */}
              <input
                type="text"
                name="chapter_name"
                value={form.chapter_name}
                onChange={handleChange}
                placeholder="Enter Chapter Name"
                className={inputCls}
              />
            </div>

            {/* Get Suggestions Button */}
            <div>
              <button
                onClick={fetchSuggestions}
                disabled={!form.class_name || !form.subject_name || !form.chapter_name || loading}
                className={`${isDark
                  ? 'bg-white text-black hover:bg-zinc-100 disabled:bg-zinc-800 disabled:text-zinc-600'
                  : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90 disabled:bg-zinc-300 disabled:text-zinc-500'
                  } w-full cursor-pointer px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed`}
              >
                {loading ? 'Loading Suggestions...' : 'Get Chapter Suggestions'}
              </button>
              {!form.class_name || !form.subject_name || !form.chapter_name ? (
                <div className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Please fill all fields above to get suggestions
                </div>
              ) : null}
            </div>

            {/* Chapter Suggestions */}
            {showSuggestions && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-base sm:text-lg font-semibold`}>Chapter Suggestions</div>
                  <button
                    onClick={() =>
                      navigate("/chapter/UploadBook", {
                        state: {
                          suggestion: false,
                          selectedIds: [],
                          form: form
                        },
                      })
                    }
                    className={`cursor-pointer text-sm font-medium ${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} rounded-md cursor-pointer px-4 py-1.5 flex items-center justify-center`}
                  >
                    Skip
                  </button>
                </div>
                <div className={sublabelCls}>Recommended Chapters Based On Popular Topics</div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  {loading ? (
                    <div className="col-span-2 flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  ) : error ? (
                    <div className="col-span-2 text-center py-12">
                      <div className="text-red-500 text-sm">{error}</div>
                    </div>
                  ) : filteredSuggestions.length === 0 ? (
                    <div className="col-span-2 text-center py-12">
                      <div className="text-gray-400 text-sm">
                        {suggestions.length === 0 ? "No chapter suggestions found." : "No suggestions match your criteria."}
                      </div>
                    </div>
                  ) : (
                    filteredSuggestions.map((item) => (
                      <div
                        key={item.id}
                        className={`${isDark
                          ? 'bg-[#18181b] text-gray-100'
                          : 'bg-zinc-900/5 text-zinc-900'
                          } rounded-3xl px-6 py-5 sm:px-7 sm:py-6 flex flex-col justify-between`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="space-y-1">
                            <div className="text-sm sm:text-base font-semibold">
                              {item.classLabel}
                            </div>
                            <div className="text-xs sm:text-sm opacity-75">
                              {item.subjectLabel}
                            </div>
                            <div className="mt-3 text-xs sm:text-sm max-w-xs leading-snug opacity-90">
                              {item.title}
                            </div>
                            <div className="text-xs opacity-60">
                              Chapter {item.chapterNumber} {item.sem !== "—" && `• Sem ${item.sem}`}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedIds((prev) =>
                              prev.includes(item.id)
                                ? prev.filter((id) => id !== item.id)
                                : [...prev, item.id]
                            );
                          }}
                          className={`${isDark
                            ? selectedIds.includes(item.id)
                              ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                              : 'bg-white text-black hover:bg-zinc-200'
                            : selectedIds.includes(item.id)
                              ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                              : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/70'
                            } cursor-pointer inline-flex items-center justify-center px-5 py-2 rounded-md text-xs sm:text-sm font-medium self-start`}
                        >
                          {selectedIds.includes(item.id) ? 'Selected' : 'Add Chapter  +'}
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {filteredSuggestions.length !== 0 && (
                  <div className="mt-3 mx-2 mb-3 md:mb-0">
                    <button
                      onClick={() => navigate("/chapter/Suggestions", {
                        state: {
                          selectedIds: selectedIds,
                          suggestion: true,
                          form: form
                        }
                      })}
                      className="cursor-pointer text-red-500 hover:text-red-400 text-xs font-medium"
                    >
                      See All Suggestion
                    </button>
                  </div>
                )}

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AddChapter;
