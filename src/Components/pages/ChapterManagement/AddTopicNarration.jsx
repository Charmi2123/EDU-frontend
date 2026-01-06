import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Send, RotateCcw, Sparkles, ArrowLeft } from "lucide-react";

import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets";
import MathText from "../../Tools/MathText";

export default function AddTopicNarration({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter/UploadBook" }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};

  // State for topics and extraction
  const [chapterTitle, setChapterTitle] = useState("");
  const [topics, setTopics] = useState([]); // Array of { title, summary, subtopics: [{title, narration}] }
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [expandedTopicIndex, setExpandedTopicIndex] = useState(null); // Index of currently expanded topic
  const [materialsTopics, setMaterialsTopics] = useState([]); // All materials returned by extract-topics
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(0); // Which material's topics are being viewed

  // Assistant State
  const [assistantExpanded, setAssistantExpanded] = useState(false);
  const [assistantVisible, setAssistantVisible] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [assistantLoading, setAssistantLoading] = useState(false);
  const chatListRef = useRef(null);
  const lastFetchedMaterialKey = useRef(null);

  // Suggestions state
  const [suggestions, setSuggestions] = useState([
    {
      id: 1,
      title: "Self - Application And Evolution",
      description: "The ability of living organism to replicate themselves and evolve over time is a key characteristics of life",
      subtitle: "Self - Application And Evolution Interactive System",
      added: false,
    },
    {
      id: 2,
      title: "Self - Application And Evolution",
      description: "The ability of living organism to replicate themselves and evolve over time is a key characteristics of life",
      subtitle: "Self - Application And Evolution Interactive System",
      added: false,
    },
  ]);

  // Track which assistant suggestions the user has chosen to add (grouped by material_id)
  // shape: { [materialId]: [suggestionId, ...] }
  const [selectedSuggestionByMaterial, setSelectedSuggestionByMaterial] = useState({});

  // Fetch topics on mount if materialIds are present 
  useEffect(() => {
    const materialIds = navState.materialIds || navState.selectedIds || [];
    const form = navState.form || {};

    if (form.chapter_name) {
      setChapterTitle(form.chapter_name);
    }

    if (!Array.isArray(materialIds) || materialIds.length === 0) return;

    const key = materialIds.join("|");
    if (lastFetchedMaterialKey.current === key) return;

    lastFetchedMaterialKey.current = key;
    fetchExtractedTopics(materialIds);
  }, [navState]);

  const fetchExtractedTopics = async (materialIds) => {
    setIsLoadingTopics(true);
    setLoadingProgress(0);

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev < 30) return prev + 3;
        if (prev < 60) return prev + 2;
        if (prev < 85) return prev + 1;
        if (prev < 90) return prev + 0.5;
        if (prev < 92) return prev + 0.2;
        if (prev < 95) return prev + 0.1;
        return prev; // Stop at 90% until API responds
      });
    }, 2000);

    try {
      const token = localStorage.getItem('access_token');
      console.log('Fetching extracted topics for material IDs:', materialIds);

      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/extract-topics`,
        { material_ids: materialIds },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.status && response.data.data) {
        const topicsList = response.data.data.topics;

        if (Array.isArray(topicsList) && topicsList.length > 0) {
          // API responded successfully - complete the progress bar
          setLoadingProgress(100);

          // Normalize all materials from API
          const normalizedMaterials = topicsList.map((material) => {
            const topicsArray = material.topics || [];
            const mappedTopics = topicsArray.map((t) => ({
              title: t.title || "",
              summary: t.summary || "",
              subtopics: Array.isArray(t.subtopics)
                ? t.subtopics.map((st) => ({
                  title: st.title || "",
                  narration: st.narration || "",
                }))
                : [],
            }));

            return {
              material_id: material.material_id,
              chapter_title: material.chapter_title || "",
              topics: mappedTopics,
            };
          });

          setMaterialsTopics(normalizedMaterials);

          // Choose which material to show first (prefer the first selected ID if present)
          let startIndex = 0;
          if (Array.isArray(materialIds) && materialIds.length > 0) {
            const requestedId = Number(materialIds[0]);
            const foundIndex = normalizedMaterials.findIndex(
              (m) => Number(m.material_id) === requestedId
            );
            if (foundIndex !== -1) {
              startIndex = foundIndex;
            }
          }

          const currentMaterial = normalizedMaterials[startIndex];
          setCurrentMaterialIndex(startIndex);

          setChapterTitle(currentMaterial.chapter_title || "");
          if (currentMaterial.topics.length > 0) {
            setTopics(currentMaterial.topics);
          } else {
            setTopics([{ title: "No topics found", summary: "", subtopics: [] }]);
          }
        }
      }
      setTimeout(() => {
        if (response.status === 200) {
          handlesuccess(response?.data?.message || "Topics extracted successfully")
        }
      }, 2000);

    } catch (error) {
      console.error('Error fetching extracted topics:', error);
      setTopics([{ title: "Error loading topics", summary: "", subtopics: [] }]);
      setLoadingProgress(100); // Complete progress even on error
    } finally {
      clearInterval(progressInterval);
      // Small delay before hiding loader to show 100% completion
      setTimeout(() => {
        setIsLoadingTopics(false);
        setLoadingProgress(0);
      }, 500);
    }
  };

  // Navigate between multiple materials (when user selected multiple files)
  const handleMaterialNavigate = (direction) => {
    if (!Array.isArray(materialsTopics) || materialsTopics.length === 0) return;

    let nextIndex = currentMaterialIndex;
    if (direction === "prev") {
      nextIndex = Math.max(0, currentMaterialIndex - 1);
    } else if (direction === "next") {
      nextIndex = Math.min(materialsTopics.length - 1, currentMaterialIndex + 1);
    }

    if (nextIndex === currentMaterialIndex) return;

    const material = materialsTopics[nextIndex];
    setCurrentMaterialIndex(nextIndex);
    setChapterTitle(material.chapter_title || "");
    setTopics(
      Array.isArray(material.topics) && material.topics.length > 0
        ? material.topics
        : [{ title: "No topics found", summary: "", subtopics: [] }]
    );
    setExpandedTopicIndex(null);
  };

  // Helper: resolve current materialId based on navigation state + currentMaterialIndex
  const getCurrentMaterialId = () => {
    const materialIds = navState.materialIds || navState.selectedIds || [];
    const safeIndex = Array.isArray(materialIds) && materialIds.length > 0
      ? Math.min(
        Math.max(currentMaterialIndex || 0, 0),
        materialIds.length - 1
      )
      : 0;
    return Array.isArray(materialIds) && materialIds.length > 0 ? materialIds[safeIndex] : null;
  };

  // Call assistant suggestion API for chatbot
  const callAssistantApi = async (userQuery) => {
    const trimmed = (userQuery || "").trim();
    if (!trimmed) return;

    const materialId = getCurrentMaterialId();

    if (!materialId) {
      setChatHistory((prev) => [
        ...prev,
        {
          type: "assistant",
          text: "I need a chapter material selected before I can suggest topics.",
        },
      ]);
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/${materialId}/assistant-suggest-topics`,
        { user_query: trimmed },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const apiData = response?.data?.data || {};

      // Push assistant reply text (if present) as a normal assistant message
      if (apiData.reply) {
        setChatHistory((prev) => [
          ...prev,
          {
            type: "assistant",
            text: apiData.reply,
          },
        ]);
      }

      if (Array.isArray(apiData.suggestions)) {
        const mapped = apiData.suggestions.map((s, idx) => ({
          id: s.suggestion_id || s.id || String(idx + 1),
          title: s.title || "",
          description: s.summary || "",
          subtitle: s.supporting_quote || "",
          added: false,
        }));

        // Update sidebar suggestions list (latest group)
        setSuggestions(mapped);

        // Also push as a chat message so they appear just after the query
        setChatHistory((prev) => [
          ...prev,
          {
            type: "suggestions",
            suggestions: mapped,
          },
        ]);
      }
    } catch (error) {
      // Keep errors in console only, do not show extra assistant text bubbles
      console.error("Error calling assistant-suggest-topics API:", error);
    }
  };

  const handleAddTopicFromSuggestion = (id) => {
    if (!id) return;

    const materialId = getCurrentMaterialId();
    if (!materialId) return;

    // Toggle added state in suggestions list (Add / Deselect)
    setSuggestions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, added: !s.added } : s))
    );

    // Also toggle inside chatHistory suggestion message
    setChatHistory((prev) =>
      prev.map((msg) => {
        if (msg.type !== "suggestions") return msg;
        return {
          ...msg,
          suggestions: msg.suggestions.map((s) =>
            s.id === id ? { ...s, added: !s.added } : s
          ),
        };
      })
    );

    // Toggle which suggestion IDs should be sent to assistant-add-topics API per material
    setSelectedSuggestionByMaterial((prev) => {
      const key = String(materialId);
      const existing = prev[key] || [];
      const isAlreadySelected = existing.includes(id);

      const updatedIds = isAlreadySelected
        ? existing.filter((sid) => sid !== id)
        : [...existing, id];

      return {
        ...prev,
        [key]: updatedIds,
      };
    });
  };

  const handleNextClick = async () => {
    try {
      const entries = Object.entries(selectedSuggestionByMaterial || {}).filter(
        ([, ids]) => Array.isArray(ids) && ids.length > 0
      );

      if (entries.length > 0) {
        const token = localStorage.getItem("access_token");

        const results = await Promise.allSettled(
          entries.map(([materialId, ids]) =>
            axios.post(
              `${BACKEND_API_URL}/chapter-materials/${materialId}/assistant-add-topics`,
              { suggestion_id: ids },
              {
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            )
          )
        );

        // Check if all requests succeeded
        const allSucceeded = results.every(result => result.status === 'fulfilled' && result.value?.status === 200);

        if (allSucceeded) {
          handlesuccess("Topics added successfully");

          setTimeout(() => {
            const materialIds = navState.materialIds || navState.selectedIds || [];
            navigate("/chapter/MergeChapter", {
              state: {
                materialIds,
              },
            });
          }, 1500);
        } else {
          // Find first error
          const failedResult = results.find(result =>
            result.status === 'rejected' || result.value?.status !== 200
          );

          const errorMsg = failedResult?.status === 'rejected'
            ? failedResult.reason?.response?.data?.detail || failedResult.reason?.message
            : failedResult?.value?.data?.detail || failedResult?.value?.data?.message;

          handleerror(errorMsg || "Failed to add some topics");
        }
      } else {
        // No suggestions selected, navigate directly
        const materialIds = navState.materialIds || navState.selectedIds || [];
        navigate("/chapter/MergeChapter", {
          state: {
            materialIds,
          },
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save lecture configuration";
      handleerror(errorMessage);
    }
  };

  // Auto-scroll chat area
  // - Scroll when a new chat message (user/assistant) arrives
  // - Do NOT scroll when only suggestions blocks are added
  useEffect(() => {
    if (!assistantExpanded || !chatListRef.current) return;

    const last = chatHistory[chatHistory.length - 1];
    if (!last) return;

    if (last.type === "user" || last.type === "assistant") {
      chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
    }
  }, [chatHistory, assistantExpanded]);

  const sendUserMessage = (text) => {
    const trimmed = (text || "").trim();
    if (!trimmed) return null;
    setChatHistory((prev) => [...prev, { type: "user", text: trimmed }]);
    setAssistantExpanded(true);
    setAssistantVisible(true);
    return trimmed;
  };

  const handleSendMessage = async () => {
    const trimmed = sendUserMessage(chatMessage);
    setChatMessage("");
    if (!trimmed) return;

    try {
      setAssistantLoading(true);
      await callAssistantApi(trimmed);
    } finally {
      setAssistantLoading(false);
    }
  };

  // Theme classes (aligned with other chapter pages)
  const pageBg = isDark ? "bg-black text-gray-100" : "bg-[#F5F5F9] text-zinc-900";
  const cardBg = isDark ? "bg-zinc-900" : "bg-white";
  const inputBg = isDark ? "bg-[#18181b] border border-zinc-800" : "bg-white border border-zinc-200";
  const accentLabel = isDark ? "text-blue-400" : "text-blue-600";

  return (
    <div className={`flex ${pageBg} h-screen overflow-hidden transition-colors duration-300 font-sans`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">

        {/* Header - Sticky */}
        <div
          className={`sticky top-0 z-20 ${isDark ? "bg-black" : "bg-white"
            }`}
        >
          <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Loading Overlay with Circular Progress */}
        {isLoadingTopics && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center space-y-6">
              {/* Circular Progress */}
              <div className="relative w-32 h-32">
                {/* Background Circle */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#d4d4d8"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.3"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#696CFF"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - loadingProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />
                </svg>
                {/* Percentage Text */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {Math.round(loadingProgress)}%
                  </span>
                </div>
              </div>

              {/* Loading Text */}
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  Extracting Topics
                </h3>
                <p className="text-sm text-gray-300">
                  Please wait while we analyze your content...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-20 pt-6">
          <div className="w-full mx-auto flex flex-col space-y-8">

            {/* Top Header Section */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
                  <button
                    onClick={() => navigate(-1)}
                    className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                    Add Topic Narration
                  </h2>
                </div>
                <p className="text-gray-500 text-sm sm:text-base font-light">
                  View and manage chapter topics with AI assistance
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssistantVisible(true);
                    setAssistantExpanded(true);
                    setChatHistory((prev) =>
                      prev && prev.length > 0
                        ? prev
                        : [
                          {
                            type: "assistant",
                            text: "How can I help you with this chapter?",
                          },
                        ]
                    );
                  }}
                  className={`mr-0.5 group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform cursor-pointer ${isDark
                    ? 'bg-white text-black hover:bg-zinc-100'
                    : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'
                    }`}
                >
                  <Sparkles size={16} className={isDark ? "text-yellow-500" : "text-yellow-300"} />
                  AI Assistant
                </button>
                <span className="text-xs text-gray-500 font-medium">Get AI help anytime</span>
              </div>
            </div>

            {/* Chapter Title Display with material navigation */}
            <div className="space-y-3">
              {!isLoadingTopics && (
                <div className="flex items-center justify-between ml-1">
                  <label className={`block text-sm font-semibold ${accentLabel}`}>
                    Chapter Title
                  </label>
                  {materialsTopics && materialsTopics.length > 1 && (
                    <div className="flex items-center gap-3 text-[11px] text-gray-400 select-none">
                      <button
                        type="button"
                        onClick={() => handleMaterialNavigate("prev")}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-700 text-xs hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        disabled={currentMaterialIndex === 0}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <span className="min-w-[60px] text-center font-medium">
                        {currentMaterialIndex + 1} / {materialsTopics.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleMaterialNavigate("next")}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-700 text-xs hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        disabled={currentMaterialIndex >= materialsTopics.length - 1}
                      >
                        <ChevronRight size={16} />
                      </button>

                    </div>
                  )}
                </div>
              )}

              {isLoadingTopics ? (
                // Skeleton while extracting topics
                <div
                  className={`w-full rounded-2xl h-11 sm:h-12 ${isDark
                    ? "bg-zinc-900/70 border border-zinc-800"
                    : "bg-zinc-100 border border-zinc-200"
                    } overflow-hidden relative`}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.6s_infinite]" />
                </div>
              ) : (
                <div className={`w-full rounded-2xl px-6 py-4 text-base font-medium ${inputBg} border border-transparent`}>
                  {chapterTitle || "No chapter title available"}
                </div>
              )}
            </div>

            {/* Topics Section */}
            <div className="space-y-6">
              {isLoadingTopics ? (
                <>
                  <div className="h-5 border-b border-blue-500/20 mb-2" />
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-sky-500"></div>
                    <p className="text-xs text-gray-500 animate-pulse">Extracting topics from material...</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-blue-500/30 pb-3">
                    <h2
                      className={`text-lg font-bold flex items-center gap-3 ${isDark ? "text-white" : "text-zinc-900"
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-[#696CFF]'}`}></div>
                      Topics
                      <span className={`text-sm px-3 py-1 rounded-full font-semibold ${isDark ? 'bg-white text-black' : 'bg-[#696CFF] text-white'}`}>{topics.length}</span>
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        const materialIds = navState.materialIds || navState.selectedIds || [];
                        if (materialIds.length > 0) fetchExtractedTopics(materialIds);
                      }}
                      className={`cursor-pointer px-6 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all transform active:scale-95 flex items-center gap-2 ${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'}`}
                    >
                      <RotateCcw size={14} className={`transition-transform duration-500`} />
                      Restore Data
                    </button>
                  </div>

                  <div className="space-y-3">
                    {topics.map((topic, index) => (
                      <div
                        key={index}
                        className={`rounded-xl border border-transparent overflow-hidden transition-all duration-300 ${cardBg}`}
                      >
                        <button
                          onClick={() => setExpandedTopicIndex(expandedTopicIndex === index ? null : index)}
                          className="w-full flex items-start cursor-pointer justify-between text-left p-4 sm:p-5 group"
                        >
                          <div className="flex-1 pr-6">
                            <h3
                              className={`text-[16px] 2xl:text-[20px] text-base font-bold mb-1.5 transition-colors whitespace-pre-wrap ${expandedTopicIndex === index
                                ? isDark
                                  ? 'text-white'
                                  : 'text-[#696CFF]'
                                : isDark
                                  ? 'text-gray-200 group-hover:text-white'
                                  : 'text-zinc-900 group-hover:text-zinc-900'
                                }`}
                            >
                              <MathText>{topic.title || `Topic ${index + 1}`}</MathText>
                            </h3>

                            <p className="text-xs text-gray-500 line-clamp-2 font-light leading-relaxed whitespace-pre-wrap">
                              <MathText>{topic.summary || ""}</MathText>
                            </p>
                          </div>
                          <div
                            className={`mt-1 p-1 rounded-full transition-colors ${expandedTopicIndex === index
                              ? isDark
                                ? 'bg-zinc-800 text-white'
                                : 'bg-[#696CFF]/10 text-[#696CFF]'
                              : isDark
                                ? 'text-zinc-600 group-hover:text-zinc-400'
                                : 'text-zinc-500 group-hover:text-zinc-700'
                              }`}
                          >
                            {expandedTopicIndex === index ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </div>
                        </button>

                        {/* Expanded Content */}
                        {expandedTopicIndex === index && (
                          <div className="px-5 pb-6 pt-2 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">

                            {/* Full Summary */}
                            {topic.summary && (
                              <div className={`w-full text-[10px] 2xl:text-[14px] rounded-lg px-3 py-2 text-xs transition-all whitespace-pre-wrap ${isDark
                                ? "bg-zinc-950/50 text-gray-400 border border-zinc-800/50"
                                : "bg-zinc-100 text-zinc-800 border border-zinc-200"
                                }`}>
                                <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">
                                  <MathText>{topic.summary}</MathText>
                                </p>
                              </div>
                            )}

                            {/* Subtopics List */}

                            {topic.subtopics && topic.subtopics.length > 0 && (
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <label className={`text-[16px] font-semibold ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                    Sub Topics & Narration
                                  </label>
                                  <span className="text-[14px] text-zinc-500">{topic.subtopics.length} items</span>
                                </div>
                                <div className="space-y-3">
                                  {topic.subtopics.map((sub, idx) => (
                                    <div
                                      key={idx}
                                      className={`group relative pl-4 border-l-2 transition-colors ${isDark
                                        ? "border-zinc-800 hover:border-white"
                                        : "border-zinc-200 hover:border-[#696CFF]"
                                        }`}
                                    >
                                      <div className="mb-1.5">
                                        <h4
                                          className={`text-xs text-[12px] 2xl:text-[15px] font-medium transition-colors whitespace-pre-wrap ${isDark
                                            ? "text-gray-300 group-hover:text-white"
                                            : "text-zinc-800 group-hover:text-[#696CFF]"
                                            }`}
                                        >
                                          <MathText>{sub.title}</MathText>             </h4>
                                      </div>
                                      {sub.narration && (
                                        <div
                                          className={`w-full text-[10px] 2xl:text-[14px] rounded-lg px-3 py-2 text-xs transition-all whitespace-pre-wrap ${isDark
                                            ? "bg-zinc-950/50 text-gray-400 border border-zinc-800/50"
                                            : "bg-zinc-100 text-zinc-800 border border-zinc-200"
                                            }`}
                                        >
                                          <MathText>{sub.narration || "No narration available for this subtopic."}</MathText>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex justify-end gap-3 pt-6">
              {/* <button
                onClick={() => navigate(-1)}
                className="px-5 py-2 rounded-lg cursor-pointer border border-zinc-800 text-gray-400 text-xs sm:text-sm font-medium transition-colors"
              >
                Cancel
              </button> */}
              <button
                onClick={handleNextClick}
                className={`px-6 py-2 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold hover:shadow-lg hover:shadow-white/10 transition-all transform active:scale-95 ${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'}`}
              >
                Next
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* Assistant Popup */}
      {assistantVisible && (
        <div className="fixed inset-x-2 bottom-2 sm:bottom-4 sm:right-4 sm:inset-x-auto z-50 flex flex-col items-end gap-2">
          {/* Expanded assistant only - compact greeting view removed */}
          <div
            className={`w-full max-w-[400px] h-[60vh] max-h-[65vh] sm:w-[400px] sm:h-[600px] sm:max-h-[600px] rounded-2xl shadow-2xl border flex flex-col ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              }`}
          >

            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-zinc-800">
              <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>Chapter Assistant</span>
              <button onClick={() => setAssistantVisible(false)}><X size={14} className="text-gray-400 cursor-pointer" /></button>
            </div>

            {/* Chat + Suggestions content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-6" ref={chatListRef}>

              {/* Chat bubbles + inline suggestions */}
              <div className="space-y-3">
                {chatHistory.map((msg, i) => {
                  if (msg.type === "user") {
                    return (
                      <div key={i} className="flex justify-end">
                        <div className={`max-w-[80%] rounded-full px-4 py-2 text-sm leading-snug shadow-sm ${isDark ? 'bg-white text-black' : 'bg-[#696CFF] text-white'}`}>
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === "assistant") {
                    return (
                      <div key={i} className="flex justify-start">
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-snug shadow-sm border ${isDark
                            ? "bg-zinc-800/90 border-zinc-700 text-zinc-100"
                            : "bg-zinc-100 border-zinc-200 text-zinc-800"
                            }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === "suggestions" && msg.suggestions.length > 0) {
                    return (
                      <div key={i} className="flex justify-start">
                        <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-xs space-y-2 shadow-sm border ${isDark
                          ? 'bg-zinc-800/90 border-zinc-700 text-zinc-100'
                          : 'bg-zinc-100 border-zinc-200 text-zinc-800'
                          }`}>

                          <div className="flex items-center justify-between text-[11px] font-semibold opacity-80">
                            <span>Grounded AI Suggestions </span>
                            <span className="text-[10px]">AI topics</span>
                          </div>

                          <div className="space-y-2">
                            {msg.suggestions.map((s) => (
                              <div
                                key={s.id}
                                className={`rounded-2xl px-3 py-2 flex flex-col gap-1 border ${isDark
                                  ? 'bg-zinc-900/70 border-zinc-700'
                                  : 'bg-white border-zinc-200'
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-[11px] font-semibold mb-0.5">{s.title}</h4>
                                    <p className="text-[11px] leading-snug opacity-90">{s.description}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleAddTopicFromSuggestion(s.id)}
                                    className={`text-[11px] font-semibold cursor-pointer whitespace-nowrap ${s.added
                                      ? "text-emerald-400 hover:text-emerald-300"
                                      : isDark ? "text-white hover:text-gray-200" : "text-[#696CFF] hover:text-[#696CFF]/80"
                                      }`}
                                  >
                                    {s.added ? "Added" : "Add"}
                                  </button>
                                </div>
                                {s.subtitle && (
                                  <p className="text-[11px] opacity-80 mt-1">{s.subtitle}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Assistant loading indicator */}
              {assistantLoading && (
                <div className="flex justify-start">
                  <div
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] shadow-sm border ${isDark
                      ? "bg-zinc-800/80 border-zinc-700 text-zinc-300"
                      : "bg-zinc-100 border-zinc-200 text-zinc-700"
                      }`}
                  >
                    <span className="inline-flex gap-1">
                      <span className={`w-1 h-1 rounded-full animate-bounce ${isDark ? 'bg-white' : 'bg-[#696CFF]'}`} />
                      <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:120ms] ${isDark ? 'bg-white' : 'bg-[#696CFF]'}`} />
                      <span className={`w-1 h-1 rounded-full animate-bounce [animation-delay:240ms] ${isDark ? 'bg-white' : 'bg-[#696CFF]'}`} />
                    </span>
                    <span>Thinking…</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div className="p-4 border-t border-zinc-800">
              <div className="relative">
                <input
                  type="text"
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="send your message..."
                  className={`w-full rounded-full py-3 pl-5 pr-12 text-sm focus:outline-none border ${isDark
                    ? "bg-zinc-950 border-zinc-800 text-gray-200 placeholder:text-zinc-500"
                    : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400"
                    }`}
                />

                <button
                  onClick={handleSendMessage}
                  className="absolute right-1.5 top-1.5 p-2 bg-white rounded-full hover:bg-zinc-200"
                >
                  <Send size={14} className="text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}