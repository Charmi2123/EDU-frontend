import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Book, Layers, Sparkles, ArrowLeft } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL } from "../../../utils/assets";
import MathText from "../../Tools/MathText";

function AllChapters({ theme = "light", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter" }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};
  const lectureId = navState.lectureId || null;

  // Chapters data derived from merged-topics API
  const [chaptersData, setChaptersData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // State for expanding/collapsing
  const [expandedMaterials, setExpandedMaterials] = useState({});
  const [expandedTopics, setExpandedTopics] = useState({});
  const lastFetchedLectureId = useRef(null);

  const themeClasses = {
    shell: isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900",
    panel: isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white/80 border-zinc-200",
    headerCard: isDark ? "bg-zinc-900/80 border-zinc-800" : "bg-white/80 border-zinc-200",
    subText: isDark ? "text-gray-400" : "text-gray-500",
    card: isDark ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200 hover:border-zinc-300",
    cardActive: isDark ? "border-zinc-700" : "bg-[#F5F5F9]/50 border-indigo-200",
    badge: isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600",
    accentText: isDark ? "text-indigo-400" : "text-[#696CFF]",
    divider: isDark ? "border-zinc-800" : "border-zinc-200",
  };

  // Fetch merged topics based on lectureId from navigation state
  useEffect(() => {
    const fetchMergedTopics = async () => {
      if (!lectureId) return;

      if (lastFetchedLectureId.current === lectureId) return;
      lastFetchedLectureId.current = lectureId;
      setIsLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const response = await axios.get(
          `${BACKEND_API_URL}/chapter-materials/merged-topics/${lectureId}`,
          {
            headers: {
              Accept: "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const apiData = response?.data?.data;
        if (!apiData || !Array.isArray(apiData.merged_topics)) {
          setChaptersData([]);
          return;
        }

        // Map merged_topics into books/chapters structure used by the UI
        const mappedBooks = apiData.merged_topics.map((mt, idx) => {
          const materialLabel = apiData?.chapter_title || `Material ${mt.material_id}`;
          const topics = Array.isArray(mt.topics) ? mt.topics : [];

          const chapters = topics.map((t, i) => {
            const subtopics = Array.isArray(t.subtopics) ? t.subtopics : [];

            const structuredSubtopics = subtopics.map((sub, sIdx) => ({
              id: sub.subtopic_id || `${t.topic_id || `${mt.material_id}-${i + 1}`}-sub-${sIdx + 1}`,
              index: sIdx + 1,
              title: sub.title || "",
              narration: sub.narration || "",
            }));

            return {
              id: `${mt.material_id}-${t.topic_id || i + 1}`,
              title: t.title || `Topic ${i + 1}`,
              subtopics: structuredSubtopics,
            };
          });

          return {
            id: mt.material_id || idx + 1,
            title: materialLabel,
            author: `${topics.length} topics`,
            chapters,
          };
        });

        setChaptersData(mappedBooks);
      } catch (error) {
        console.error("Error fetching merged topics:", error);
        setChaptersData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMergedTopics();
  }, [lectureId]);

  // Initialize expanded states when data loads - Only open the first material
  useEffect(() => {
    if (chaptersData.length > 0) {
      setExpandedMaterials({ [chaptersData[0].id]: true });
    }
  }, [chaptersData]);

  // Single expand for Materials
  const toggleMaterial = (id) => {
    setExpandedMaterials((prev) => {
      // If currently open, close it (return empty). If closed, open it (and implicitly close others by returning new object)
      return prev[id] ? {} : { [id]: true };
    });
  };

  // Single expand for Topics
  const toggleTopic = (id) => {
    setExpandedTopics((prev) => {
      return prev[id] ? {} : { [id]: true };
    });
  };

  return (
    <div className={`flex ${themeClasses.shell} h-screen overflow-hidden transition-colors duration-300 font-sans`}>
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300 relative">
        {/* Background Gradients for Premium Feel */}
        <div className={`absolute top-0 left-0 w-full h-64 opacity-20 pointer-events-none ${isDark ? 'bg-linear-to-b from-indigo-900/20 to-transparent' : 'bg-linear-to-b from-indigo-100 to-transparent'}`} />

        <div className="sticky top-0 z-20">
          <Header title="Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        <main className="mt-4 sm:mt-6 flex-1 flex flex-col min-h-0 z-10">
          {/* Toolbar */}
          <div
            className={`${themeClasses.headerCard} sticky top-0 z-30 border rounded-xl px-4 py-3 flex items-center justify-between backdrop-blur-md mb-6 transition-all duration-300`}
          >
            <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
              <button
                onClick={() => navigate(-1)}
                className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
              >
                <ArrowLeft size={20} />
              </button>
              <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                Merged Content
              </h2>
            </div>

            <div className="flex gap-3">
              {/* <button
                onClick={() => navigate(backto)}
                className={`px-4 py-2 rounded-xl cursor-pointer border text-sm font-medium transition-all duration-200 ${isDark
                  ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border-zinc-500"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-zinc-500"
                  }`}
              >
                Cancel
              </button> */}
              <button
                onClick={() => navigate("/chapter/SetChapter", { state: { lectureId } })}
                className={`px-5 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2 ${isDark
                  ? "bg-white text-black hover:bg-zinc-100"
                  : "bg-[#696CFF] text-white hover:bg-[#585BDF]"
                  }`}
              >
                <span>Next</span>
              </button>
            </div>
          </div>

          {/* Content Area - Hidden Scrollbar */}
          <div className={`flex-1 overflow-y-auto max-h-fit pr-2 pb-6 ${themeClasses.panel} rounded-xl border p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']`}>
            <div className="p-4 sm:p-6 space-y-8">

              {isLoading && (
                <div className="flex flex-col items-center justify-center h-64 space-y-4 animate-pulse">
                  <div className={`w-12 h-12 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                  <div className={`h-4 w-48 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                </div>
              )}

              {!isLoading && chaptersData.length === 0 && (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
                  <div className={`p-4 rounded-full ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-100'}`}>
                    <Book className={`w-8 h-8 ${themeClasses.subText}`} />
                  </div>
                  <p className={`text-sm ${themeClasses.subText}`}>No chapters found for this lecture.</p>
                </div>
              )}

              {chaptersData.map((book) => (
                <div key={book.id} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {/* Material Header */}
                  <div
                    onClick={() => toggleMaterial(book.id)}
                    className="flex items-center justify-between group cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-1 rounded-full ${isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF]'}`}></div>
                      <h2 className={`text-lg font-bold tracking-tight ${isDark ? 'text-zinc-100' : 'text-zinc-800'}`}>
                        {book.title}
                      </h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${themeClasses.badge}`}>
                        {book.chapters.length} Topics
                      </span>
                    </div>
                    <div className={`p-1.5 rounded-full transition-colors ${isDark ? 'group-hover:bg-zinc-800' : 'group-hover:bg-zinc-100'}`}>
                      {expandedMaterials[book.id] ? (
                        <ChevronUp className={`w-5 h-5 ${themeClasses.subText}`} />
                      ) : (
                        <ChevronDown className={`w-5 h-5 ${themeClasses.subText}`} />
                      )}
                    </div>
                  </div>

                  {/* Topics List */}
                  {expandedMaterials[book.id] && (
                    <div className="grid grid-cols-1 gap-3 pl-0 sm:pl-4">
                      {book.chapters.map((chapter, index) => {
                        const isExpanded = expandedTopics[chapter.id];
                        const hasSubtopics = chapter.subtopics && chapter.subtopics.length > 0;

                        return (
                          <div
                            key={chapter.id}
                            className={`group rounded-xl border transition-all duration-300 overflow-hidden ${isExpanded ? themeClasses.cardActive : themeClasses.card
                              }`}
                          >
                            {/* Topic Header (Clickable) */}
                            <div
                              onClick={() => toggleTopic(chapter.id)}
                              className={`px-5 py-4 flex items-center gap-4 cursor-pointer select-none ${!hasSubtopics && 'cursor-default'}`}
                            >
                              <div
                                className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors ${isExpanded
                                  ? (isDark ? "bg-[#696CFF] text-white" : "bg-[#696CFF] text-white")
                                  : (isDark ? "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700" : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200")
                                  }`}
                              >
                                {index + 1}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h3 className={`text-sm sm:text-base font-semibold truncate whitespace-pre-wrap ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                  <MathText>{chapter.title}</MathText>
                                </h3>
                                <p className={`text-xs mt-0.5 ${themeClasses.subText}`}>
                                  {hasSubtopics ? `${chapter.subtopics.length} Subtopics` : 'No subtopics'}
                                </p>
                              </div>

                              {hasSubtopics && (
                                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                  <ChevronDown className={`w-5 h-5 ${themeClasses.subText}`} />
                                </div>
                              )}
                            </div>

                            {/* Subtopics Dropdown */}
                            <div
                              className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                }`}
                            >
                              <div className="overflow-hidden">
                                <div className={`px-5 pb-5 pt-0 space-y-3`}>
                                  <div className={`h-px w-full mb-4 ${themeClasses.divider}`}></div>

                                  {chapter.subtopics.map((sub, index) => (
                                    <div
                                      key={sub.id + "_" + index}
                                      className={`relative pl-4 border-l-2 transition-colors ${isDark
                                        ? "border-zinc-800 hover:border-[#696CFF]/50"
                                        : "border-zinc-200 hover:border-indigo-300"
                                        }`}
                                    >
                                      <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-xs font-medium ${themeClasses.accentText}`}>
                                            {sub.index.toString().padStart(2, '0')}
                                          </span>
                                          <h4 className={`text-sm font-medium whitespace-pre-wrap ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                            <MathText>{sub.title}</MathText>
                                          </h4>
                                        </div>

                                        {sub.narration ? (
                                          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${themeClasses.subText} line-clamp-2 hover:line-clamp-none transition-all`}>
                                            <MathText>{sub.narration}</MathText>
                                          </p>
                                        ) : (
                                          <p className={`text-[10px] italic opacity-50 ${themeClasses.subText}`}>
                                            No description available
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AllChapters;
