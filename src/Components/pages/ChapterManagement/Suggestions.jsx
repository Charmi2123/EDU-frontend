import React, { useMemo, useState, useEffect, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets";
import { ArrowLeft } from "lucide-react";



function Suggestions({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]); // ids of selected chapters
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get form data from location state
  const formData = location.state?.form || {};
  const lastSuggestionKey = useRef(null);

  // Initialize selectedIds from location state
  useEffect(() => {
    if (location.state?.selectedIds) {
      setSelectedIds(location.state.selectedIds);
    }
  }, [location.state?.selectedIds]);

  // Static suggestions matching the Chapter Suggestions card design
  const temp = useMemo(
    () =>
      Array.from({ length: 10 }).map((_, i) => ({
        id: i + 1,
        classLabel: "Class 10",
        subjectLabel: "Subject Physics",
        title: "Design Patterns: Elements of Reusable Object-Oriented Software",
        tag: "Software Engineering",
      })),
    []
  );
  // Fetch chapter materials from API
  useEffect(() => {
    const fetchMaterials = async () => {
      const key = JSON.stringify({
        class_name: formData.class_name,
        subject: formData.subject_name,
      });
      if (lastSuggestionKey.current === key) {
        setLoading(false);
        return;
      }
      lastSuggestionKey.current = key;

      try {
        setLoading(true);
        const token = localStorage.getItem("access_token") || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcl90eXBlIjoibWVtYmVyIiwicm9sZSI6Im1lbWJlciIsImlkIjoxLCJzZXNzaW9uX2lkIjoibWVtYmVyXzFfMTc2NDA0OTc0NCIsImFkbWluX2lkIjoiMSIsIndvcmtfdHlwZSI6ImNoYXB0ZXIiLCJleHAiOjE3OTU1ODU3NDQsInR5cGUiOiJhY2Nlc3MifQ.wjo2MNuWhMeC_8i1AxJbRqBMRpl5q_NLm5ZQJN96m9E";

        const requestBody = {
          std: formData.class_name,
          subject: formData.subject_name
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
      } catch (err) {
        const errorMessage = err?.response?.data?.message || err.message || "Failed to load chapter materials";
        setError(errorMessage);
        if (typeof handleerror === "function") {
          handleerror(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if we have form data
    if (formData.class_name || formData.subject_name) {
      fetchMaterials();
    } else {
      setLoading(false);
    }
  }, [formData.class_name, formData.subject_name]);

  // Show suggestions from API without filtering, limit to 2
  const filteredSuggestions = useMemo(() => {
    if (!formData.class_name && !formData.subject_name) return suggestions;

    return suggestions.filter((item) => {
      const classMatch = !formData.class_name || item.classLabel.toLowerCase().includes(formData.class_name.toLowerCase().trim());
      const subjectMatch = !formData.subject_name || item.subjectLabel.toLowerCase().includes(formData.subject_name.toLowerCase().trim());
      return classMatch && subjectMatch;
    });
  }, [suggestions, formData]);

  return (
    <div
      className={`flex ${isDark
        ? "bg-black text-gray-100"
        : "bg-[#f5f5ff] text-zinc-900"
        } h-screen overflow-hidden transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Add Chapter" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="w-full mx-auto space-y-4">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent sticky top-0 z-30 rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>
                <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
                  <button
                    onClick={() => navigate(-1)}
                    className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className={`text-lg font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                    Add Chapter Management
                  </h2>
                </div>
              </div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <button
                  onClick={() => setSelectedIds([])}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => navigate("/chapter/UploadBook", {
                    state: {
                      suggestion: selectedIds.length > 0 ? true : false,
                      selectedIds: selectedIds,
                      form: formData
                    },
                  })}
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}>
                  Next
                </button>
              </div>
            </div>

            {/* Suggestions panel */}
            <div
              className={`rounded-2xl px-5 sm:px-7 py-5 sm:py-6 transition-colors duration-300 border border-transparent ${isDark ? "bg-[#111111]" : "bg-white"
                }`}
            >
              {/* Heading */}
              <div className="space-y-1 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Chapter Suggestions</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Recommended Chapters Based On Popular Topics
                </p>
                {(formData.class_name || formData.subject_name) && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.class_name && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-zinc-100 text-zinc-700'}`}>
                        Class: {formData.class_name}
                      </span>
                    )}
                    {formData.subject_name && (
                      <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-zinc-100 text-zinc-700'}`}>
                        Subject: {formData.subject_name}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Scrollable grid wrapper */}
              <div className="max-h-[60vh] overflow-y-auto no-scrollbar pr-1">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="text-center py-12">
                    <div className="text-red-500 text-sm">{error}</div>
                  </div>
                ) : filteredSuggestions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 text-sm">
                      {suggestions.length === 0 ? "No chapter materials found." : "No suggestions match your criteria."}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {filteredSuggestions.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          // optional: card click could also toggle selection in future
                        }}
                        className={`${isDark
                          ? "bg-[#181818] text-gray-100"
                          : "bg-[#F5F5F9] text-zinc-900"
                          } border border-transparent rounded-3xl px-5 sm:px-6 py-4 sm:py-5 flex flex-col justify-between`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
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
                              ? "bg-emerald-500 text-black hover:bg-emerald-400"
                              : "bg-white text-black hover:bg-zinc-200"
                            : selectedIds.includes(item.id)
                              ? "bg-emerald-500 text-white hover:bg-emerald-400"
                              : "bg-[#696CFF] text-white hover:bg-[#696CFF]/70"
                            } cursor-pointer inline-flex items-center justify-center px-5 py-2 rounded-md text-xs sm:text-sm font-medium self-start`}
                        >
                          {selectedIds.includes(item.id) ? "Selected" : "Add Chapter  +"}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Suggestions;
