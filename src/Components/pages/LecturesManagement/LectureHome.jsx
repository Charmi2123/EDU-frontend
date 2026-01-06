import React, { useEffect, useRef, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets.js";
import { ChevronDown, Play, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

// Chapter Card Component
const ChapterCard = ({ data, isDark, onDelete, onShare }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);
    const [showAll, setShowAll] = useState(false);
    const [imgError, setImgError] = useState(false);
    const defaultIcon = isDark ? getAsset("lectureicon_dark") : getAsset("lectureicon_light");

    return (
        <div className={`rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent p-4 flex flex-col h-full`}>
            <div className="flex items-start gap-3 mb-3">
                <img
                    src={(!imgError && data.cover_photo_url) ? data.cover_photo_url : defaultIcon}
                    onError={() => setImgError(true)}
                    alt="Chapter"
                    className="w-15 h-15 opacity-90 object-cover rounded-md"
                />
                <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-800'}`}>{data.title}</p>
                    <p className={`text-[13px] ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                        {data.std && data.std !== 'general' ? `Class ${data.std}` : 'General Lecture'} • {data.language || 'English'}
                    </p>
                </div>
            </div>
            <ul className={`text-[12px] ${isDark ? 'text-gray-300' : 'text-zinc-700'} space-y-1 ml-4 list-disc mb-3`}>
                {(data.bullets && data.bullets.length > 0) ? (
                    <>
                        {(showAll ? data.bullets : data.bullets.slice(0, 3)).map((bullet, idx) => {
                            // Truncate bullet text to max 50 characters
                            const maxLength = 50;
                            const truncatedText = bullet.length > maxLength
                                ? bullet.substring(0, maxLength) + '...'
                                : bullet;
                            return (
                                <li key={idx} className="pl-1 marker:text-gray-400" title={bullet}>
                                    {truncatedText}
                                </li>
                            );
                        })}
                        {data.bullets.length > 3 && (
                            <li
                                onClick={() => setShowAll(!showAll)}
                                className="list-none text-[11px] font-medium opacity-70 mt-1.5 cursor-pointer hover:underline"
                            >
                                {showAll ? "Show less" : `+ ${data.bullets.length - 3} more keys`}
                            </li>
                        )}
                    </>
                ) : (
                    <>
                        <li className="pl-1 marker:text-gray-400">AI History</li>
                        <li className="pl-1 marker:text-gray-400">Present Application</li>
                        <li className="pl-1 marker:text-gray-400">Future trends</li>
                    </>
                )}
            </ul>
            <div className="flex items-center justify-around mt-auto pt-2">
                {/* Left Buttons */}
                <div className="flex items-center gap-2 justify-around w-full">
                    {/* Play Button */}
                    <button
                        onClick={() => navigate("/lecture/LectureVideo", {
                            state: {
                                lectureId: data.lecture_id,
                                subject: data.subject,
                                title: data.title,
                                std: data.std,
                                division: data.division
                            }
                        })}
                        className={`cursor-pointer w-full justify-center px-2 inline-flex items-center gap-2 h-8 text-[13px] md:h-10 md:text-[14px] lg:h-8 lg:text-[13px] rounded-md font-semibold transition-colors duration-150 ${isDark ? 'bg-zinc-700 text-white hover:bg-white hover:text-black' : 'bg-zinc-300 hover:bg-[#696CFF] text-zinc-800 hover:text-white'}`}>
                        <span>Play</span>
                        <Play fill="currentColor" className="w-4 h-4" />
                    </button>
                    {/* Share Button */}
                    {/* <button
                        onClick={() => onShare && onShare(data)}
                        className={`cursor-pointer w-[35%] lg:w-full justify-center px-2 inline-flex items-center gap-2 h-8 text-[13px] md:h-10 md:text-[14px] lg:h-8 lg:text-[13px] rounded-md font-medium transition-colors duration-150 ${isDark ? 'bg-zinc-700 text-white hover:bg-white hover:text-black' : 'bg-zinc-300 hover:bg-[#696CFF] text-zinc-800 hover:text-white'}`}>
                        <span>Share</span>
                        <Share2 fill="currentColor" className="w-4 h-4" />
                    </button> */}
                    {/* Remove Button */}
                    {!isAdminPath && (
                        <button
                            onClick={() => onDelete(data)}
                            className={`cursor-pointer w-full justify-center px-2 inline-flex items-center gap-2 h-8 text-[13px] md:h-10 md:text-[14px] lg:h-8 lg:text-[13px] rounded-md font-medium transition-colors duration-150 ${isDark ? 'bg-zinc-700 text-white hover:bg-white hover:text-black' : 'bg-zinc-300 hover:bg-[#696CFF] text-zinc-800 hover:text-white'}`}
                        >
                            <span>Remove</span>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

function LectureHome({ theme, isDark, toggleTheme, sidebardata }) {
    // const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark'; // Removed as per user request
    const [showFilter, setShowFilter] = useState(false);
    const [openFilter, setOpenFilter] = useState(null);

    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [lectureData, setLectureData] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [classOptions, setClassOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [allFilterData, setAllFilterData] = useState([]); // Store complete filter data

    // Search state (drives Header search bar)
    const [searchValue, setSearchValue] = useState("");

    // Share Modal State
    const [showShareModal, setShowShareModal] = useState(false);
    const [lectureToShare, setLectureToShare] = useState(null);
    const [shareStd, setShareStd] = useState("");
    const [isSharing, setIsSharing] = useState(false);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [lectureToDelete, setLectureToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // AbortController refs
    const fetchLecturesAbortController = useRef(null);

    const navigate = useNavigate();
    const filterRef = useRef(null);
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);

    // Fetch filter options from API
    const fetchFilters = async () => {
        try {
            const token = localStorage.getItem("access_token");

            const response = await axios.get(`${BACKEND_API_URL}/lectures/public_lecture/filters`, {
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (response.data?.status && response.data?.data) {
                const filterData = response.data.data;

                // Store complete filter data for dynamic filtering
                setAllFilterData(filterData);

                // Extract unique classes (std values)
                const uniqueClasses = [...new Set(filterData.map(item => item.std))].sort((a, b) => {
                    // Sort numerically if both are numbers, otherwise alphabetically
                    const numA = parseInt(a);
                    const numB = parseInt(b);
                    if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                    }
                    return a.localeCompare(b);
                });

                // Extract unique subjects from all items (initial load - all subjects)
                const allSubjects = filterData.flatMap(item => item.subject || []);
                const uniqueSubjects = [...new Set(allSubjects)]
                    .map(subject => subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase())
                    .sort();

                setClassOptions(uniqueClasses);
                setSubjectOptions(uniqueSubjects);
            }
        } catch (error) {
            console.error("Error fetching filters:", error);
            // Fallback to empty arrays if API fails
            setClassOptions([]);
            setSubjectOptions([]);
            setAllFilterData([]);
        }
    };

    // Memoized filtered subjects
    const filteredSubjects = React.useMemo(() => {
        if (!selectedClass) {
            const allSubjects = allFilterData.flatMap(item => item.subject || []);
            return [...new Set(allSubjects)]
                .map(subject => subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase())
                .sort();
        } else {
            const classData = allFilterData.filter(item => item.std === selectedClass);
            const classSubjects = classData.flatMap(item => item.subject || []);
            return [...new Set(classSubjects)]
                .map(subject => subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase())
                .sort();
        }
    }, [selectedClass, allFilterData]);

    // Update subjects when class selection changes
    useEffect(() => {
        setSubjectOptions(filteredSubjects);

        // Clear subject selection if it's not available for the selected class
        if (selectedClass && selectedSubject && !filteredSubjects.includes(selectedSubject)) {
            setSelectedSubject("");
        }
    }, [filteredSubjects, selectedClass, selectedSubject]);

    // Fetch lectures from API
    const fetchLectures = async (filters = {}) => {
        // Cancel previous request if exists
        if (fetchLecturesAbortController.current) {
            fetchLecturesAbortController.current.abort();
        }
        fetchLecturesAbortController.current = new AbortController();

        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            let url = `${BACKEND_API_URL}/lectures`;

            // Build query params based on filters
            const params = new URLSearchParams();
            // Use filters passed in or state (prefer passed in for atomic updates)
            const activeStd = filters.hasOwnProperty('std') ? filters.std : selectedClass;
            const activeSub = filters.hasOwnProperty('subject') ? filters.subject : selectedSubject;

            if (activeStd) params.append('std', activeStd);
            if (activeSub) params.append('subject', activeSub.toLowerCase());

            const queryString = params.toString();
            if (queryString) {
                url += `?${queryString}`;
            }

            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal: fetchLecturesAbortController.current.signal,
            });

            // Handle the response
            if (response.data?.data?.lectures && Array.isArray(response.data.data.lectures)) {
                setLectureData(response.data.data.lectures);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setLectureData(response.data?.data);
            } else {
                console.warn('Unexpected response format:', response.data);
                setLectureData([]);
            }
        } catch (error) {
            if (axios.isCancel(error)) {
                console.log("Fetch aborted");
            } else {
                console.error("Error fetching lectures:", error);
                setLectureData([]);
            }
        } finally {
            // Only stop loading if not aborted (because another request might have started)
            if (fetchLecturesAbortController.current && !fetchLecturesAbortController.current.signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    // Fetch filters and lectures on component mount
    useEffect(() => {
        fetchFilters();
        fetchLectures();

        return () => {
            if (fetchLecturesAbortController.current) {
                fetchLecturesAbortController.current.abort();
            }
        }
    }, []);

    const resetFilters = async () => {
        setSelectedClass("");
        setSelectedSubject("");
        await fetchLectures({ std: "", subject: "" });
    };

    const applyFilters = () => {
        setShowFilter(false);
        fetchLectures();
    };

    const closeFilterPopup = () => {
        setShowFilter(false);
        setOpenFilter(null);
    };

    const closeFilterPopupWithReset = async () => {
        await resetFilters();
        closeFilterPopup();

    };

    // Delete Handlers
    const handleDeleteClick = (lecture) => {
        setLectureToDelete(lecture);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!lectureToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("access_token");

            // API requires: std, subject, lecture_id as query params
            const response = await axios.delete(`${BACKEND_API_URL}/lectures`, {
                headers: {
                    "Accept": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                params: {
                    std: lectureToDelete.std,
                    subject: lectureToDelete.subject,
                    lecture_id: lectureToDelete.lecture_id,
                },
            });

            if (response.data) {
                handlesuccess("Lecture deleted successfully");
                fetchLectures();
            }
        } catch (error) {
            console.error("Error deleting lecture:", error);
            handleerror("Failed to delete lecture. Please try again.");
        } finally {
            setLectureToDelete(null);
            setShowDeleteModal(false);
            setIsDeleting(false);
        }
    };

    // Share Handlers
    const handleShareClick = (lecture) => {
        setLectureToShare(lecture);
        setShareStd(lecture?.std && lecture.std !== "general" ? String(lecture.std) : "");
        setShowShareModal(true);
    };

    const confirmShare = async () => {
        if (!lectureToShare || !shareStd) {
            handleerror("Please enter class (std) before sharing.");
            return;
        }

        setIsSharing(true);
        try {
            const token = localStorage.getItem("access_token");

            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureToShare.lecture_id}/share`,
                { std: String(shareStd) },
                {
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (response.data) {
                handlesuccess("Share successfully");
                setShowShareModal(false);
                setLectureToShare(null);
                setShareStd("");
            }
        } catch (error) {
            console.error("Error sharing lecture:", error);
            handleerror("Failed to share lecture. Please try again.");
        } finally {
            setIsSharing(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!filterRef.current) return;
            if (openFilter && !filterRef.current.contains(event.target)) {
                setOpenFilter(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openFilter]);

    // Search-based filtering across title, chapter, language, std, subject
    const filteredLectures = React.useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return lectureData;

        return lectureData.filter((item) => {
            const title = (item.title || "").toLowerCase();
            const chapter = (item.chapter || "").toLowerCase();
            const language = (item.language || "").toLowerCase();
            const std = (item.std != null ? String(item.std) : "").toLowerCase();
            const subject = (item.subject || "").toLowerCase();

            const bullets = (item.bullets || []).join(" ").toLowerCase();

            return (
                title.includes(query) ||
                chapter.includes(query) ||
                language.includes(query) ||
                std.includes(query) ||
                subject.includes(query) ||
                bullets.includes(query)
            );
        });
    }, [searchValue, lectureData]);

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Lecture Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        isSearchbar={true}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        isBack={!!isAdminPath}
                        backValue={isAdminPath ? -1 : 0}
                    />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    <div className={`w-full rounded px-4 py-3 text-base md:text-lg flex items-center justify-between mb-2 shrink-0 border border-transparent ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        <div className="flex items-center gap-6 select-none">
                            <span className={`${isDark ? 'text-gray-300' : 'text-zinc-700'}`}><span className="font-bold">Total Lectures:</span> <span className="font-semibold">{filteredLectures.length}</span></span>

                            {selectedClass && (
                                <>
                                    <span className={`${isDark ? 'bg-zinc-700' : 'bg-zinc-300'} h-5 w-px`} aria-hidden="true"></span>
                                    <span className={`${isDark ? 'text-gray-300' : 'text-zinc-700'}`}><span className="font-bold">Class:</span> <span className="font-semibold">{selectedClass}</span></span>
                                </>
                            )}

                            {selectedSubject && (
                                <>
                                    <span className={`${isDark ? 'bg-zinc-700' : 'bg-zinc-300'} h-5 w-px`} aria-hidden="true"></span>
                                    <span className={`${isDark ? 'text-gray-300' : 'text-zinc-700'}`}><span className="font-bold">Subject:</span> <span className="font-semibold">{selectedSubject}</span></span>
                                </>
                            )}
                        </div>
                        {/* <button
                            type="button"
                            onClick={() => navigate("/lecture/addlecture")}
                            aria-label="Add new lecture"
                            className={`cursor-pointer inline-flex items-center justify-center rounded-sm px-2 py-2 transition-colors duration-150 ${resolvedDark ? 'bg-zinc-700 text-gray-100 hover:bg-zinc-700/60' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/70'}`}>
                            <PlusIcon className="w-4 h-4" />
                        </button> */}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <button
                            type="button"
                            onClick={() => setShowFilter(true)}
                            className={`${isDark
                                ? "bg-zinc-800 text-gray-100"
                                : "bg-white text-zinc-800"
                                } border border-transparent cursor-pointer inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 self-start`}
                        >
                            <SlidersHorizontal className="mr-2 w-4" />
                            Filter
                        </button>
                    </div>

                    {showFilter && (
                        <div
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                            onClick={closeFilterPopupWithReset}
                        >
                            <div
                                ref={filterRef}
                                className={`${isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"} rounded-2xl p-6 w-[80%] max-w-md max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl border ${isDark ? "border-zinc-700" : "border-zinc-200"}`}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-semibold">Filter Lectures</h3>
                                    <button
                                        type="button"
                                        onClick={closeFilterPopupWithReset}
                                        className={`p-2 cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative z-30">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFilter((prev) => (prev === "class" ? null : "class"))}
                                            className={`${isDark ? "bg-zinc-800 text-gray-100" : "bg-gray-100 text-zinc-800"} border border-transparent w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-all duration-150 ${openFilter === "class" ? "rounded-t-md rounded-b-none border-b-transparent" : "rounded-md"}`}
                                        >
                                            <span className="font-medium">{selectedClass || "Select Standard"}</span>
                                            <span className="text-[10px]"><ChevronDown className={`size-4 ${openFilter === "class" ? "rotate-180" : ""}`} /></span>
                                        </button>
                                        {openFilter === "class" && (
                                            <div
                                                className={`${isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-zinc-800"} relative z-100 -mt-px w-full rounded-b-xl rounded-t-none px-3 py-3 border border-transparent transition-all duration-150 max-h-40 overflow-y-auto no-scrollbar`}
                                            >
                                                <div className="flex flex-wrap gap-2">
                                                    {classOptions.length > 0 ? (
                                                        classOptions.map((item) => (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedClass(item);
                                                                    setOpenFilter(null);
                                                                }}
                                                                className={`${selectedClass === item
                                                                    ? `${isDark ? "bg-white text-black" : "bg-[#696CFF] text-white"}`
                                                                    : isDark
                                                                        ? "bg-zinc-700 text-gray-100"
                                                                        : "bg-gray-100 text-zinc-800"
                                                                    } cursor-pointer px-3 py-1 text-sm font-medium capitalize transition-all duration-150 hover:scale-[1.03]`}
                                                            >
                                                                {item}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>No classes available</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {selectedClass && (
                                        <div className="relative z-20">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFilter((prev) => (prev === "subject" ? null : "subject"))}
                                                disabled={!selectedClass}
                                                className={`${isDark ? "bg-zinc-800 text-gray-100" : "bg-gray-100 text-zinc-800"} border border-transparent w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer ${!selectedClass ? 'opacity-50 cursor-not-allowed' : ''} ${openFilter === "subject" ? "rounded-t-md rounded-b-none border-b-transparent" : "rounded-md"}`}
                                            >
                                                <span className="font-medium">{selectedSubject || "Select Subject"}</span>
                                                <span className="text-[10px]"><ChevronDown className={`size-4 ${openFilter === "subject" ? "rotate-180" : ""}`} /></span>
                                            </button>
                                            {openFilter === "subject" && selectedClass && (
                                                <div
                                                    className={`${isDark ? "bg-zinc-800 text-gray-100" : "bg-white text-zinc-800"} relative z-100 -mt-px w-full rounded-b-xl rounded-t-none px-3 py-3 border border-transparent max-h-40 overflow-y-auto no-scrollbar`}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {subjectOptions.length > 0 ? (
                                                            subjectOptions.map((item) => (
                                                                <button
                                                                    key={item}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setSelectedSubject(item);
                                                                        setOpenFilter(null);
                                                                    }}
                                                                    className={`${selectedSubject === item
                                                                        ? `${isDark ? "bg-white text-black" : "bg-[#696CFF] text-white"}`
                                                                        : isDark
                                                                            ? "bg-zinc-700 text-gray-100"
                                                                            : "bg-gray-100 text-zinc-800"
                                                                        } cursor-pointer px-3 py-1 text-sm font-medium capitalize transition-all duration-150 hover:scale-[1.03]`}
                                                                >
                                                                    {item}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>No subjects available</p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {selectedClass && selectedSubject && (
                                    <div className="flex items-center justify-end gap-3 mt-6 pt-4">
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                setShowFilter(false);
                                                await resetFilters();
                                                setOpenFilter(null);
                                            }}
                                            className={`${isDark
                                                ? "bg-transparent text-gray-200 border border-zinc-600 hover:bg-zinc-800"
                                                : "bg-transparent text-zinc-800 border border-zinc-300 hover:bg-zinc-100"
                                                } cursor-pointer rounded-full px-5 py-2 text-sm font-medium`}
                                        >
                                            Reset
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                applyFilters();
                                                closeFilterPopup();
                                            }}
                                            className={`${isDark
                                                ? "bg-white text-black hover:bg-zinc-100"
                                                : "bg-[#696CFF] text-white hover:bg-[#696CFF]/80"
                                                } cursor-pointer rounded-full px-5 py-2 text-sm font-medium shadow-sm`}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Lecture Grid - Scrollable section */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 items-stretch gap-4 auto-rows-[1fr]">
                                {[...Array(8)].map((_, index) => (
                                    <div key={index} className={`rounded-lg ${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent p-4 flex flex-col h-full animate-pulse`}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-15 h-15 rounded-md ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className="flex-1 space-y-2">
                                                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                                <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pl-5 mb-3">
                                            <div className={`h-2 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-2 w-5/6 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-2 w-4/6 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        </div>
                                        <div className="flex items-center justify-around mt-auto pt-2 gap-2">
                                            <div className={`h-8 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-8 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-8 w-full rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLectures.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <p className={`${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>No lectures found.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 items-stretch gap-3 auto-rows-[1fr]">
                                {filteredLectures.map((item) => (
                                    <ChapterCard
                                        key={item.lecture_id}
                                        data={item}
                                        isDark={isDark}
                                        onDelete={handleDeleteClick}
                                        onShare={handleShareClick}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`border border-transparent w-full max-w-md rounded-2xl p-6 transform transition-all scale-100 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`p-3 rounded-full mb-4 ${isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-100 text-red-600'}`}>
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    Delete Lecture?
                                </h3>
                                <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Are you sure you want to delete this lecture? This action cannot be undone.
                                </p>
                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowDeleteModal(false)}
                                        className={`flex-1 px-4 py-2.5 cursor-pointer rounded-xl font-medium transition-colors ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-2.5 cursor-pointer rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Share Lecture Modal */}
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className={`border border-transparent w-full max-w-md rounded-2xl p-6 transform transition-all scale-100 ${isDark ? "bg-zinc-900" : "bg-white"}`}>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>
                                        Share Lecture
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowShareModal(false);
                                            setLectureToShare(null);
                                            setShareStd("");
                                        }}
                                        className={`cursor-pointer text-sm px-2 py-1 rounded-md ${isDark ? "text-gray-300 hover:bg-zinc-800" : "text-gray-600 hover:bg-gray-100"}`}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}>
                                        Class Number (Std)
                                    </label>
                                    <input
                                        type="text"
                                        value={shareStd}
                                        onChange={(e) => setShareStd(e.target.value)}
                                        placeholder="Enter class (e.g., 10)"
                                        className={`w-full rounded-md border border-transparent px-3 py-2 text-sm outline-none ${isDark ? "bg-zinc-900 text-gray-100 placeholder:text-gray-500" : "bg-white text-zinc-900 placeholder:text-zinc-400"}`}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowShareModal(false);
                                            setLectureToShare(null);
                                            setShareStd("");
                                        }}
                                        className={`px-4 py-2 cursor-pointer rounded-xl text-sm font-medium ${isDark ? "bg-zinc-800 text-white hover:bg-zinc-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmShare}
                                        disabled={isSharing}
                                        className="px-4 py-2 cursor-pointer rounded-xl text-sm font-medium bg-[#696CFF] text-white hover:bg-[#575BFF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSharing ? "Sharing..." : "Share"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LectureHome;