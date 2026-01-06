import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { Plus, Trash2, Lock, Check, ArrowLeft } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets";
import MathText from "../../Tools/MathText";

function MergeChapter({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  const [selectedChapters, setSelectedChapters] = useState([]);
  const [confirmedChapters, setConfirmedChapters] = useState([]);
  const [topicsDataList, setTopicsDataList] = useState([]); // API payloads for all materials' topics
  const [isLoadingTopics, setIsLoadingTopics] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const navState = location.state || {};
  const [lectureId, setlectureId] = useState()
  const lastFetchedMaterialKey = useRef(null);

  // Material IDs passed from previous screen (AddTopicNarration / UploadBook)
  const materialIds = navState.materialIds || navState.selectedIds || [];

  // Fetch topics for all materials so we can show them as selectable “chapters”
  useEffect(() => {
    if (!Array.isArray(materialIds) || materialIds.length === 0) return;

    const key = materialIds.join("|");
    if (lastFetchedMaterialKey.current === key) return;
    lastFetchedMaterialKey.current = key;

    const fetchTopicsForAll = async () => {
      setIsLoadingTopics(true);
      try {
        const token = localStorage.getItem("access_token");

        const requests = materialIds.map((id) => {
          const mid = id;
          return axios.get(
            `${BACKEND_API_URL}/chapter-materials/${mid}/topics`,
            {
              headers: {
                Accept: "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            }
          );
        });

        const responses = await Promise.allSettled(requests);

        const allData = responses
          .map((res) => (res.status === "fulfilled" ? res.value?.data?.data : null))
          .filter((d) => d);

        setTopicsDataList(allData);
      } catch (error) {
        console.error("Error fetching topics for merge:", error);
      } finally {
        setIsLoadingTopics(false);
      }
    };

    fetchTopicsForAll();
  }, [BACKEND_API_URL, materialIds]);

  const handleToggleChapter = (book, chapter) => {
    setSelectedChapters((prev) => {
      const exists = prev.some(
        (item) => item.bookId === book.id && item.chapterId === chapter.id
      );

      if (exists) {
        return prev.filter(
          (item) => !(item.bookId === book.id && item.chapterId === chapter.id)
        );
      }

      return [
        ...prev,
        {
          bookId: book.id,
          chapterId: chapter.id,
          title: chapter.title,
          bookTitle: book.title || "",
          material_id: chapter.material_id,
          topic_id: chapter.topic_id || null,
          suggestion_topic_id: chapter.suggestion_topic_id || null,
          subtopics: chapter.subtopics || [],
        },
      ];
    });
  };

  // Map API topics payload into the same shape that the existing UI expects as “books” and “chapters”
  const books = Array.isArray(topicsDataList)
    ? topicsDataList.map((td) => ({
      id: td.material_id,
      title: td.chapter_title || `Material ${td.material_id}`,
      author: "", // not used in layout meaningfully
      chapters: (td.topic_id || []).map((t) => ({
        id: t.topic_id || t.suggestion_topic_id,
        title: t.title,
        material_id: td.material_id,
        topic_id: t.topic_id || null,
        suggestion_topic_id: t.suggestion_topic_id || null,
        subtopics: t.subtopics || [],
      })),
    }))
    : [];

  const handleCreateMergedLecture = async () => {
    if (!confirmedChapters.length) return;

    // Build topicSelections payload grouped by material_id
    const grouped = {};

    confirmedChapters.forEach((item) => {
      const mid = item.material_id;
      if (!mid) return;

      if (!grouped[mid]) {
        grouped[mid] = { material_id: mid, topic_id: [], suggestion_topic_id: [] };
      }

      if (item.topic_id) {
        grouped[mid].topic_id.push(item.topic_id);
      }
      if (item.suggestion_topic_id) {
        grouped[mid].suggestion_topic_id.push(item.suggestion_topic_id);
      }
    });

    const topicSelections = Object.values(grouped).map((g) => {
      const payload = { material_id: g.material_id };
      if (g.topic_id.length) payload.topic_id = g.topic_id;
      if (g.suggestion_topic_id.length) payload.suggestion_topic_id = g.suggestion_topic_id;
      return payload;
    });

    if (!topicSelections.length) return;

    try {
      const token = localStorage.getItem("access_token");

      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/create_merged_chapter_lecture`,
        { topicSelections },
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = response?.data?.data;
      if (response.status === 200) {
        handlesuccess(response?.data?.message || "Merged lecture created successfully")
        navigate("/chapter/AllChapters", {
          state: {
            lectureId: data?.lecture_id || data?.merged_id || null
          }
        });
      }
      const newLectureId = data?.lecture_id || data?.merged_id || null;
      if (newLectureId) {
        setlectureId(newLectureId);
      }
      // TODO: optionally navigate with lecture_id or show success toast
    } catch (error) {
      console.error("Error creating merged lecture:", error);
    }
  };

  const handleNextNavigation = () => {
    if (!lectureId) {
      handleerror("Merging pending. Please create a merged lecture before continuing.");
      return;
    }

    navigate("/chapter/AllChapters", {
      state: {
        lectureId
      }
    });
  };

  const canProceed = Boolean(lectureId);

  return (
    <div
      className={`flex ${isDark ? "bg-black text-gray-100" : "bg-[#F5F5F9] text-[#232347]"
        } h-screen overflow-hidden no-scrollbar transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header
            title="Add Topics Management"
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-5 flex-1 overflow-y-scroll no-scrollbar">
          <div className="w-full mx-auto flex flex-col space-y-4">
            {/* Toolbar row (sticky) */}
            <div
              className={`${isDark
                ? "bg-zinc-900"
                : "bg-white"
                } sticky top-0 z-30 border border-transparent rounded-lg px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}
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
              <div className="flex gap-2 w-[200px] justify-center items-center">
                {/* <button
                  onClick={() => navigate(backto, {
                    state: {
                      materialIds: navState.selectedIds || navState.materialIds,
                    }
                  })}
                  className={`${isDark
                    ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700"
                    : "bg-white text-[#4a4c78] hover:bg-zinc-100 border border-[#d9d8ef]"
                    } w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  aria-disabled={!canProceed}
                  onClick={handleNextNavigation}
                  className={`${isDark
                    ? "bg-white text-black"
                    : "bg-[#6a6dff] text-white"}
                    w-full px-4 py-1.5 flex items-center cursor-pointer justify-center rounded-md text-sm font-medium transition-colors
                    ${canProceed
                      ? isDark ? "hover:bg-zinc-100" : "hover:bg-[#585bdf]"
                      : "opacity-50 cursor-not-allowed"}`}
                >
                  Next
                </button> */}
              </div>
            </div>

            {/* Main merge layout */}
            {isLoadingTopics ? (
              // Full-page style loading while topics are being fetched
              <div className="flex-1 flex items-center justify-center py-24">
                <div className="flex flex-col items-center gap-3 text-xs sm:text-sm text-gray-400">
                  <div className="h-8 w-8 border border-transparent rounded-full animate-spin" />
                  <span>Loading topics for all selected materials...</span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6">
                {/* Left: Merge Chapter card */}
                <div
                  className={`flex-1 max-h-fit rounded-lg border border-transparent px-5 sm:px-7 py-5 sm:py-6 ${isDark ? "bg-zinc-950" : "bg-white"
                    }`}
                >
                  <div className="mb-2">
                    <h2 className="text-lg sm:text-xl font-semibold">Merge Topics</h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400">
                      Select Topics From Multiple Topics To Merge Into A Complete Lecture
                    </p>
                  </div>

                  {/* Book list (topics from API) */}
                  <div className="space-y-4 max-h-[49vh] overflow-y-auto pr-2 no-scrollbar">
                    {books.length === 0 && (
                      <div className="text-xs text-gray-400">No topics available.</div>
                    )}
                    {books.map((book) => (
                      <div
                        key={book.id}
                        className={`rounded-2xl px-4 sm:px-5 py-4 space-y-3 border ${isDark
                          ? "bg-zinc-900 border-zinc-800"
                          : "bg-white border-[#edeafd]"
                          }`}
                      >
                        {/* Book header */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-sm sm:text-base font-semibold">
                              {book.title}
                            </h3>
                            <p className="mt-1 text-[11px] sm:text-xs text-gray-400">
                              {book.chapters.length} Topics
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const allChapters = book.chapters.map(c => c.id);
                              const selectedInBook = selectedChapters.filter(s => s.bookId === book.id).map(s => s.chapterId);
                              const isAllSelected = book.chapters.length > 0 && selectedInBook.length === book.chapters.length;
                              const isIndeterminate = selectedInBook.length > 0 && selectedInBook.length < book.chapters.length;

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isAllSelected) {
                                      // Deselect all
                                      setSelectedChapters(prev => prev.filter(item => item.bookId !== book.id));
                                    } else {
                                      // Select all
                                      const newSelections = book.chapters.map(c => ({
                                        bookId: book.id,
                                        chapterId: c.id,
                                        title: c.title,
                                        bookTitle: book.title || "",
                                        material_id: c.material_id,
                                        topic_id: c.topic_id || null,
                                        suggestion_topic_id: c.suggestion_topic_id || null,
                                        subtopics: c.subtopics || [],
                                      }));

                                      setSelectedChapters(prev => {
                                        const otherBooks = prev.filter(item => item.bookId !== book.id);
                                        return [...otherBooks, ...newSelections];
                                      });
                                    }
                                  }}
                                  className={`flex h-6 w-6 items-center justify-center rounded border transition-colors cursor-pointer ${(isAllSelected || isIndeterminate)
                                    ? isDark
                                      ? "bg-white border-white text-black"
                                      : "bg-[#6a6dff] border-[#6a6dff] text-white"
                                    : isDark
                                      ? "border-zinc-500 text-transparent"
                                      : "border-[#cbc9ef] text-transparent"
                                    }`}
                                >
                                  {isAllSelected && <Check className="h-4 w-4" />}
                                  {isIndeterminate && <div className={`h-0.5 w-3 ${isDark ? "bg-black" : "bg-white"}`} />}
                                </button>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Chapters list */}
                        <div className="space-y-3">
                          {book.chapters.map((chapter, index) => {
                            const isChecked = selectedChapters.some(
                              (item) => item.bookId === book.id && item.chapterId === chapter.id
                            );

                            return (
                              <div
                                key={chapter.id}
                                className={`flex items-center gap-3 rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm ${isDark
                                  ? "bg-[#1f1f1f] border border-zinc-800"
                                  : "bg-white border border-[#e9e7fb]"
                                  }`}
                              >
                                {/* Square checkbox */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleChapter(book, chapter)}
                                  className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors cursor-pointer ${isChecked
                                    ? isDark
                                      ? "bg-white border-white text-black"
                                      : "bg-[#6a6dff] border-[#6a6dff] text-white"
                                    : isDark
                                      ? "border-zinc-500 text-gray-400"
                                      : "border-[#cbc9ef] text-[#7b7dad]"
                                    }`}
                                >
                                  {isChecked && (
                                    <Check className="h-4 w-4" />
                                  )}
                                </button>

                                {/* Number circle */}
                                <div
                                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${isDark
                                    ? "border-zinc-600 text-gray-200"
                                    : isChecked
                                      ? "border-[#6a6dff] text-[#6a6dff]"
                                      : "border-[#c5c4e9] text-[#4b4d7a]"
                                    }`}
                                >
                                  {index + 1}
                                </div>

                                {/* Chapter text */}
                                <div
                                  className={`flex-1 text-sm whitespace-pre-wrap ${isChecked
                                    ? isDark
                                      ? "font-semibold text-white"
                                      : "font-semibold text-[#1f1f3d]"
                                    : isDark
                                      ? "text-gray-300"
                                      : "text-[#4a4c78]"
                                    }`}
                                >
                                  <MathText>{chapter.title}</MathText>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer buttons */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setConfirmedChapters(selectedChapters)}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs sm:text-sm font-medium cursor-pointer transition-colors ${isDark
                        ? "bg-white text-black hover:bg-zinc-100"
                        : "bg-[#6a6dff] text-white hover:bg-[#585bdf]"
                        }`}
                    >
                      <span>Add Topic</span>
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Right: Merged Lecture card (always visible, driven by confirmedChapters) */}
                <div
                  className={`flex-1 rounded-2xl border border-transparent px-5 sm:px-7 py-5 sm:py-6 ${isDark ? "bg-zinc-950" : "bg-white"
                    }`}
                >
                  <div className="mb-4">
                    <h2 className="text-base sm:text-lg font-semibold">Merged Lecture</h2>
                    <p className="mt-1 text-xs sm:text-sm text-gray-400">
                      {confirmedChapters.length} Topic(s) selected
                    </p>
                  </div>

                  <div
                    className={`mb-5 rounded-lg border border-dashed px-4 py-3 ${isDark ? "border-zinc-700 bg-zinc-900" : "border-[#696CFF] bg-[#f9f8ff]"
                      }`}
                  >
                    <p
                      className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-[#585a88]"
                        }`}
                    >
                      Select Topics from different Topics to create a comprehensive lecture
                    </p>
                  </div>

                  <div className="mb-5 space-y-2">
                    <p className="text-xs sm:text-sm text-gray-400">Selected Topics:</p>
                    {confirmedChapters.length === 0 ? (
                      <div
                        className={`rounded-lg border px-3 py-2 text-xs sm:text-sm ${isDark
                          ? "border-zinc-800 bg-[#1f1f1f] text-gray-400"
                          : "border-[#e4e2f6] bg-white text-[#7a7cb0]"
                          }`}
                      >
                        No Topics selected yet
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[35vh] overflow-y-scroll no-scrollbar">
                        {confirmedChapters.map((item) => (
                          <div
                            key={`${item.bookId}-${item.chapterId}`}
                            className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm ${isDark
                              ? "bg-[#1f1f1f] border border-zinc-800 text-white"
                              : "bg-white border border-[#e5e3f6] text-[#1f1f3d]"
                              }`}
                          >
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${isDark
                                ? "border-zinc-600 text-gray-100"
                                : "border-[#c1c0ec] text-[#5b5da0]"
                                }`}
                            >
                              ✓
                            </div>

                            <div className="flex-1 flex flex-col gap-2">
                              {/* Chapter title */}
                              <span className={`text-[20px] font-semibold whitespace-pre-wrap ${isDark ? "text-white" : "text-[#696CFF]"}`}><MathText>{item.title}</MathText></span>

                              {/* Optional short context (book title or first subtopic title) */}
                              {/* <span className={`text-[11px] ${isDark ? "text-gray-400" : "text-[#7b7dab]"}`}>
                              {Array.isArray(item.subtopics) && item.subtopics.length > 0
                                ? item.subtopics[0].title || item.bookTitle
                                : item.bookTitle}
                            </span> */}

                              {/* Full subtopics + narration list */}
                              {Array.isArray(item.subtopics) && item.subtopics.length > 0 && (
                                <div className="mt-1 space-y-4">
                                  {item.subtopics.map((sub, idx) => (
                                    <div key={idx} className="text-[11px] leading-snug space-y-1">
                                      <div className={`text-[15px] 2xl:text-[17px] whitespace-pre-wrap ${isDark ? "text-gray-200 font-semibold" : "text-[#3f4170] font-bold"}`}>
                                        {idx + 1}. <MathText>{sub.title}</MathText>
                                      </div>
                                      {sub.narration && (
                                        <div className={`text-[13px] 2xl:text-[15px] whitespace-pre-wrap ${isDark ? "text-gray-400" : "text-[#5a5c8c]"}`}>
                                          <MathText>{sub.narration}</MathText>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={confirmedChapters.length === 0}
                    aria-disabled={confirmedChapters.length === 0}
                    onClick={handleCreateMergedLecture}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-md text-xs sm:text-sm font-medium px-4 py-2.5 cursor-pointer transition-colors ${isDark ? "bg-white text-black hover:bg-zinc-100" : "bg-[#6a6dff] text-white hover:bg-[#585bdf]"
                      } ${confirmedChapters.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <span>Create Merged Lecture</span>
                    <Lock className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default MergeChapter;
// import React, { useState, useEffect, useRef } from "react";
// import Sidebar from "../../Tools/Sidebar";
// import Header from "../../Tools/Header";
// import { Plus, Trash2, Lock, Check, ArrowLeft } from "lucide-react";
// import { NavLink, useLocation, useNavigate } from "react-router-dom";
// import axios from "axios";
// import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets";
// import MathText from "../../Tools/MathText";

// function MergeChapter({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto }) {
//   const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

//   const [selectedChapters, setSelectedChapters] = useState([]);
//   const [confirmedChapters, setConfirmedChapters] = useState([]);
//   const [topicsDataList, setTopicsDataList] = useState([]); // API payloads for all materials' topics
//   const [isLoadingTopics, setIsLoadingTopics] = useState(false);
//   const navigate = useNavigate();
//   const location = useLocation();
//   const navState = location.state || {};
//   const [lectureId, setlectureId] = useState()
//   const lastFetchedMaterialKey = useRef(null);

//   // Material IDs passed from previous screen (AddTopicNarration / UploadBook)
//   const materialIds = navState.materialIds || navState.selectedIds || [];

//   // Fetch topics for all materials so we can show them as selectable "chapters"
//   useEffect(() => {
//     if (!Array.isArray(materialIds) || materialIds.length === 0) return;

//     const key = materialIds.join("|");
//     if (lastFetchedMaterialKey.current === key) return;
//     lastFetchedMaterialKey.current = key;

//     const fetchTopicsForAll = async () => {
//       setIsLoadingTopics(true);
//       try {
//         const token = localStorage.getItem("access_token");

//         const requests = materialIds.map((id) => {
//           const mid = id;
//           return axios.get(
//             `${BACKEND_API_URL}/chapter-materials/${mid}/topics`,
//             {
//               headers: {
//                 Accept: "application/json",
//                 ...(token ? { Authorization: `Bearer ${token}` } : {}),
//               },
//             }
//           );
//         });

//         const responses = await Promise.allSettled(requests);

//         const allData = responses
//           .map((res) => (res.status === "fulfilled" ? res.value?.data?.data : null))
//           .filter((d) => d);

//         setTopicsDataList(allData);
//       } catch (error) {
//         console.error("Error fetching topics for merge:", error);
//       } finally {
//         setIsLoadingTopics(false);
//       }
//     };

//     fetchTopicsForAll();
//   }, [BACKEND_API_URL, materialIds]);

//   const handleToggleChapter = (book, chapter) => {
//     setSelectedChapters((prev) => {
//       const exists = prev.some(
//         (item) => item.bookId === book.id && item.chapterId === chapter.id
//       );

//       if (exists) {
//         return prev.filter(
//           (item) => !(item.bookId === book.id && item.chapterId === chapter.id)
//         );
//       }

//       return [
//         ...prev,
//         {
//           bookId: book.id,
//           chapterId: chapter.id,
//           title: chapter.title,
//           bookTitle: book.title || "",
//           material_id: chapter.material_id,
//           topic_id: chapter.topic_id || null,
//           suggestion_topic_id: chapter.suggestion_topic_id || null,
//           subtopics: chapter.subtopics || [],
//         },
//       ];
//     });
//   };

//   // Map API topics payload into the same shape that the existing UI expects as "books" and "chapters"
//   const books = Array.isArray(topicsDataList)
//     ? topicsDataList.map((td) => ({
//       id: td.material_id,
//       title: td.chapter_title || `Material ${td.material_id}`,
//       author: "", // not used in layout meaningfully
//       chapters: (td.topic_id || []).map((t) => ({
//         id: t.topic_id || t.suggestion_topic_id,
//         title: t.title,
//         material_id: td.material_id,
//         topic_id: t.topic_id || null,
//         suggestion_topic_id: t.suggestion_topic_id || null,
//         subtopics: t.subtopics || [],
//       })),
//     }))
//     : [];

//   const handleCreateMergedLecture = async () => {
//     if (!confirmedChapters.length) return;

//     // Build topicSelections payload grouped by material_id
//     const grouped = {};

//     confirmedChapters.forEach((item) => {
//       const mid = item.material_id;
//       if (!mid) return;

//       if (!grouped[mid]) {
//         grouped[mid] = { material_id: mid, topic_id: [], suggestion_topic_id: [] };
//       }

//       if (item.topic_id) {
//         grouped[mid].topic_id.push(item.topic_id);
//       }
//       if (item.suggestion_topic_id) {
//         grouped[mid].suggestion_topic_id.push(item.suggestion_topic_id);
//       }
//     });

//     const topicSelections = Object.values(grouped).map((g) => {
//       const payload = { material_id: g.material_id };
//       if (g.topic_id.length) payload.topic_id = g.topic_id;
//       if (g.suggestion_topic_id.length) payload.suggestion_topic_id = g.suggestion_topic_id;
//       return payload;
//     });

//     if (!topicSelections.length) return;

//     try {
//       const token = localStorage.getItem("access_token");

//       const response = await axios.post(
//         `${BACKEND_API_URL}/chapter-materials/create_merged_chapter_lecture`,
//         { topicSelections },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             ...(token ? { Authorization: `Bearer ${token}` } : {}),
//           },
//         }
//       );

//       const data = response?.data?.data;
//       if (response.status === 200) {
//         handlesuccess(response?.data?.message || "Merged lecture created successfully")
//         navigate("/chapter/AllChapters", {
//           state: {
//             lectureId: data?.lecture_id || data?.merged_id || null
//           }
//         });
//       }
//       const newLectureId = data?.lecture_id || data?.merged_id || null;
//       if (newLectureId) {
//         setlectureId(newLectureId);
//       }
//       // TODO: optionally navigate with lecture_id or show success toast
//     } catch (error) {
//       console.error("Error creating merged lecture:", error);
//     }
//   };

//   const handleNextNavigation = () => {
//     if (!lectureId) {
//       handleerror("Merging pending. Please create a merged lecture before continuing.");
//       return;
//     }

//     navigate("/chapter/AllChapters", {
//       state: {
//         lectureId
//       }
//     });
//   };

//   const canProceed = Boolean(lectureId);

//   return (
//     <div
//       className={`flex ${isDark ? "bg-black text-gray-100" : "bg-[#F5F5F9] text-[#232347]"
//         } h-screen overflow-hidden transition-colors duration-300`}
//     >
//       {/* Sidebar */}
//       <Sidebar isDark={isDark} sidebardata={sidebardata} />

//       {/* Main Section */}
//       <div className="flex flex-col min-h-0 h-full w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 overflow-hidden box-border transition-all duration-300">
//         {/* Header */}
//         <div className="sticky top-0 z-20">
//           <Header
//             title="Add Chapter Management"
//             isDark={isDark}
//             toggleTheme={toggleTheme}
//           />
//         </div>

//         {/* Scrollable content */}
//         <main className="mt-4 sm:mt-5 flex-1 overflow-y-hidden no-scrollbar">
//           <div className="w-full mx-auto flex flex-col space-y-4">
//             {/* Toolbar row (sticky) */}
//             <div
//               className={`${isDark
//                 ? "bg-zinc-900"
//                 : "bg-white"
//                 } sticky top-0 z-30 border border-transparent rounded-lg px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}
//             >
//               <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
//                 <button
//                   onClick={() => navigate(-1)}
//                   className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
//                 >
//                   <ArrowLeft size={20} />
//                 </button>
//                 <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
//                   Merged Content
//                 </h2>
//               </div>
//               <div className="flex gap-2 w-[200px] justify-center items-center">
//                 {/* <button
//                   onClick={() => navigate(backto, {
//                     state: {
//                       materialIds: navState.selectedIds || navState.materialIds,
//                     }
//                   })}
//                   className={`${isDark
//                     ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700"
//                     : "bg-white text-[#4a4c78] hover:bg-zinc-100 border border-[#d9d8ef]"
//                     } w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   aria-disabled={!canProceed}
//                   onClick={handleNextNavigation}
//                   className={`${isDark
//                     ? "bg-white text-black"
//                     : "bg-[#6a6dff] text-white"}
//                     w-full px-4 py-1.5 flex items-center cursor-pointer justify-center rounded-md text-sm font-medium transition-colors
//                     ${canProceed
//                       ? isDark ? "hover:bg-zinc-100" : "hover:bg-[#585bdf]"
//                       : "opacity-50 cursor-not-allowed"}`}
//                 >
//                   Next
//                 </button> */}
//               </div>
//             </div>

//             {/* Main merge layout */}
//             {isLoadingTopics ? (
//               // Full-page style loading while topics are being fetched
//               <div className="flex-1 flex items-center justify-center py-24">
//                 <div className="flex flex-col items-center gap-3 text-xs sm:text-sm text-gray-400">
//                   <div className="h-8 w-8 border border-transparent rounded-full animate-spin" />
//                   <span>Loading topics for all selected materials...</span>
//                 </div>
//               </div>
//             ) : (
//               <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-hidden">
//                 {/* Left: Merge Chapter card */}
//                 <div
//                   className={`flex-1 rounded-lg border border-transparent px-5 sm:px-7 py-5 sm:py-6 overflow-y-auto no-scrollbar ${isDark ? "bg-zinc-950" : "bg-white"
//                     }`}
//                 >
//                   <div className="mb-2">
//                     <h2 className="text-lg sm:text-xl font-semibold">Merge Chapter</h2>
//                     <p className="mt-1 text-xs sm:text-sm text-gray-400">
//                       Select Chapters From Multiple Chapters To Merge Into A Complete Lecture
//                     </p>
//                   </div>

//                   {/* Book list (topics from API) */}
//                   <div className="space-y-4">
//                     {books.length === 0 && (
//                       <div className="text-xs text-gray-400">No topics available.</div>
//                     )}
//                     {books.map((book) => (
//                       <div
//                         key={book.id}
//                         className={`rounded-2xl px-4 sm:px-5 py-4 space-y-3 border ${isDark
//                           ? "bg-zinc-900 border-zinc-800"
//                           : "bg-white border-[#edeafd]"
//                           }`}
//                       >
//                         {/* Book header */}
//                         <div className="flex items-start justify-between gap-3">
//                           <div>
//                             <h3 className="text-sm sm:text-base font-semibold">
//                               {book.title}
//                             </h3>
//                             <p className="mt-1 text-[11px] sm:text-xs text-gray-400">
//                               {book.chapters.length} chapters
//                             </p>
//                           </div>
//                           <div className="flex items-center gap-2">
//                             {(() => {
//                               const allChapters = book.chapters.map(c => c.id);
//                               const selectedInBook = selectedChapters.filter(s => s.bookId === book.id).map(s => s.chapterId);
//                               const isAllSelected = book.chapters.length > 0 && selectedInBook.length === book.chapters.length;
//                               const isIndeterminate = selectedInBook.length > 0 && selectedInBook.length < book.chapters.length;

//                               return (
//                                 <button
//                                   type="button"
//                                   onClick={() => {
//                                     if (isAllSelected) {
//                                       // Deselect all
//                                       setSelectedChapters(prev => prev.filter(item => item.bookId !== book.id));
//                                     } else {
//                                       // Select all
//                                       const newSelections = book.chapters.map(c => ({
//                                         bookId: book.id,
//                                         chapterId: c.id,
//                                         title: c.title,
//                                         bookTitle: book.title || "",
//                                         material_id: c.material_id,
//                                         topic_id: c.topic_id || null,
//                                         suggestion_topic_id: c.suggestion_topic_id || null,
//                                         subtopics: c.subtopics || [],
//                                       }));

//                                       setSelectedChapters(prev => {
//                                         const otherBooks = prev.filter(item => item.bookId !== book.id);
//                                         return [...otherBooks, ...newSelections];
//                                       });
//                                     }
//                                   }}
//                                   className={`flex h-6 w-6 items-center justify-center rounded border transition-colors cursor-pointer ${(isAllSelected || isIndeterminate)
//                                     ? isDark
//                                       ? "bg-white border-white text-black"
//                                       : "bg-[#6a6dff] border-[#6a6dff] text-white"
//                                     : isDark
//                                       ? "border-zinc-500 text-transparent"
//                                       : "border-[#cbc9ef] text-transparent"
//                                     }`}
//                                 >
//                                   {isAllSelected && <Check className="h-4 w-4" />}
//                                   {isIndeterminate && <div className={`h-0.5 w-3 ${isDark ? "bg-black" : "bg-white"}`} />}
//                                 </button>
//                               );
//                             })()}
//                           </div>
//                         </div>

//                         {/* Chapters list */}
//                         <div className="space-y-3">
//                           {book.chapters.map((chapter, index) => {
//                             const isChecked = selectedChapters.some(
//                               (item) => item.bookId === book.id && item.chapterId === chapter.id
//                             );

//                             return (
//                               <div
//                                 key={chapter.id}
//                                 className={`flex items-center gap-3 rounded-lg px-3 sm:px-4 py-2.5 text-xs sm:text-sm ${isDark
//                                   ? "bg-[#1f1f1f] border border-zinc-800"
//                                   : "bg-white border border-[#e9e7fb]"
//                                   }`}
//                               >
//                                 {/* Square checkbox */}
//                                 <button
//                                   type="button"
//                                   onClick={() => handleToggleChapter(book, chapter)}
//                                   className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors cursor-pointer ${isChecked
//                                     ? isDark
//                                       ? "bg-white border-white text-black"
//                                       : "bg-[#6a6dff] border-[#6a6dff] text-white"
//                                     : isDark
//                                       ? "border-zinc-500 text-gray-400"
//                                       : "border-[#cbc9ef] text-[#7b7dad]"
//                                     }`}
//                                 >
//                                   {isChecked && (
//                                     <Check className="h-4 w-4" />
//                                   )}
//                                 </button>

//                                 {/* Number circle */}
//                                 <div
//                                   className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${isDark
//                                     ? "border-zinc-600 text-gray-200"
//                                     : isChecked
//                                       ? "border-[#6a6dff] text-[#6a6dff]"
//                                       : "border-[#c5c4e9] text-[#4b4d7a]"
//                                     }`}
//                                 >
//                                   {index + 1}
//                                 </div>

//                                 {/* Chapter text */}
//                                 <div
//                                   className={`flex-1 text-sm whitespace-pre-wrap ${isChecked
//                                     ? isDark
//                                       ? "font-semibold text-white"
//                                       : "font-semibold text-[#1f1f3d]"
//                                     : isDark
//                                       ? "text-gray-300"
//                                       : "text-[#4a4c78]"
//                                     }`}
//                                 >
//                                   <MathText>{chapter.title}</MathText>
//                                 </div>
//                               </div>
//                             );
//                           })}
//                         </div>
//                       </div>
//                     ))}
//                   </div>

//                   {/* Footer buttons */}
//                   <div className="mt-4 flex items-center justify-between">
//                     <button
//                       type="button"
//                       onClick={() => setConfirmedChapters(selectedChapters)}
//                       className={`inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs sm:text-sm font-medium cursor-pointer transition-colors ${isDark
//                         ? "bg-white text-black hover:bg-zinc-100"
//                         : "bg-[#6a6dff] text-white hover:bg-[#585bdf]"
//                         }`}
//                     >
//                       <span>Add Topic</span>
//                       <Plus className="h-3 w-3" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Right: Merged Lecture card - Sticky with controlled scrolling */}
//                 <div
//                   className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-transparent px-5 sm:px-7 py-5 sm:py-6 sticky top-4 self-start max-h-[calc(100vh-8rem)] ${isDark ? "bg-zinc-950" : "bg-white"
//                     }`}
//                 >
//                   <div className="mb-4">
//                     <h2 className="text-base sm:text-lg font-semibold">Merged Lecture</h2>
//                     <p className="mt-1 text-xs sm:text-sm text-gray-400">
//                       {confirmedChapters.length} chapter(s) selected
//                     </p>
//                   </div>

//                   <div
//                     className={`mb-5 rounded-lg border border-dashed px-4 py-3 ${isDark ? "border-zinc-700 bg-zinc-900" : "border-[#696CFF] bg-[#f9f8ff]"
//                       }`}
//                   >
//                     <p
//                       className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-[#585a88]"
//                         }`}
//                     >
//                       Select chapters from different chapters to create a comprehensive lecture
//                     </p>
//                   </div>

//                   <div className="min-h-0 flex-1 mb-5 overflow-y-auto no-scrollbar">
//                     <p className="text-xs sm:text-sm text-gray-400 mb-2">Selected Chapters:</p>
//                     {confirmedChapters.length === 0 ? (
//                       <div
//                         className={`rounded-lg border px-3 py-2 text-xs sm:text-sm ${isDark
//                           ? "border-zinc-800 bg-[#1f1f1f] text-gray-400"
//                           : "border-[#e4e2f6] bg-white text-[#7a7cb0]"
//                           }`}
//                       >
//                         No chapters selected yet
//                       </div>
//                     ) : (
//                       <div className="space-y-2">
//                         {confirmedChapters.map((item) => (
//                           <div
//                             key={`${item.bookId}-${item.chapterId}`}
//                             className={`flex items-start gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm ${isDark
//                               ? "bg-[#1f1f1f] border border-zinc-800 text-white"
//                               : "bg-white border border-[#e5e3f6] text-[#1f1f3d]"
//                               }`}
//                           >
//                             <div
//                               className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${isDark
//                                 ? "border-zinc-600 text-gray-100"
//                                 : "border-[#c1c0ec] text-[#5b5da0]"
//                                 }`}
//                             >
//                               ✓
//                             </div>

//                             <div className="flex-1 flex flex-col gap-2">
//                               {/* Chapter title */}
//                               <span className={`text-[20px] font-semibold whitespace-pre-wrap ${isDark ? "text-white" : "text-[#696CFF]"}`}><MathText>{item.title}</MathText></span>

//                               {/* Full subtopics + narration list */}
//                               {Array.isArray(item.subtopics) && item.subtopics.length > 0 && (
//                                 <div className="mt-1 space-y-4">
//                                   {item.subtopics.map((sub, idx) => (
//                                     <div key={idx} className="text-[11px] leading-snug space-y-1">
//                                       <div className={`text-[15px] 2xl:text-[17px] whitespace-pre-wrap ${isDark ? "text-gray-200 font-semibold" : "text-[#3f4170] font-bold"}`}>
//                                         {idx + 1}. <MathText>{sub.title}</MathText>
//                                       </div>
//                                       {sub.narration && (
//                                         <div className={`text-[13px] 2xl:text-[15px] whitespace-pre-wrap ${isDark ? "text-gray-400" : "text-[#5a5c8c]"}`}>
//                                           <MathText>{sub.narration}</MathText>
//                                         </div>
//                                       )}
//                                     </div>
//                                   ))}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>

//                   <button
//                     type="button"
//                     disabled={confirmedChapters.length === 0}
//                     aria-disabled={confirmedChapters.length === 0}
//                     onClick={handleCreateMergedLecture}
//                     className={`w-full inline-flex items-center justify-center gap-2 rounded-md text-xs sm:text-sm font-medium px-4 py-2.5 cursor-pointer transition-colors ${isDark ? "bg-white text-black hover:bg-zinc-100" : "bg-[#6a6dff] text-white hover:bg-[#585bdf]"
//                       } ${confirmedChapters.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
//                   >
//                     <span>Create Merged Lecture</span>
//                     <Lock className="h-4 w-4" />
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }

// export default MergeChapter;