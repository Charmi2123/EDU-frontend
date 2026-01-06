// export default ChapterManagement;
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { Pencil, Trash2, Clock } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getAsset, BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets";


const ensureBearer = (token) => {
    if (!token) return "";
    return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

const formatFileSize = (sizeValue) => {
    if (sizeValue === null || sizeValue === undefined) return "—";
    if (typeof sizeValue === "string" && /[a-zA-Z]/.test(sizeValue)) return sizeValue;
    const bytes = Number(sizeValue);
    if (!Number.isFinite(bytes) || bytes <= 0) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let value = bytes;
    let unitIndex = 0;
    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }
    const precision = value >= 100 ? 0 : value >= 10 ? 1 : 2;
    return `${value.toFixed(precision)}${units[unitIndex]}`;
};

const formatDuration = (durationValue) => {
    if (durationValue === null || durationValue === undefined || durationValue === "") return "—";
    if (typeof durationValue === "string" && durationValue.includes(":")) return durationValue;
    const totalSeconds = Number(durationValue);
    if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return "—";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

function ChapterManagement({ isDark, toggleTheme, sidebardata, addchapter }) {
    const [openMenu, setOpenMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(0); // 0-based page index
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [showFilter, setShowFilter] = useState(false);
    const [openFilter, setOpenFilter] = useState(null); // 'class' | 'subject' | 'chapter' | null
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedChapter, setSelectedChapter] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // store video or index if needed later
    const [videos, setVideos] = useState([]);
    const [loadingLectures, setLoadingLectures] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const filterRef = useRef(null);
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);
    const navigate = useNavigate();

    useEffect(() => {
        const controller = new AbortController();
        const fetchLectures = async () => {
            setLoadingLectures(true);
            setFetchError("");
            try {
                // Check both "token" (for members) and "access_token" (for admin)
                const storedToken = typeof window !== "undefined"
                    ? (localStorage.getItem("token") || localStorage.getItem("access_token"))
                    : "";
                const authToken = storedToken || "";
                const headers = {
                    Accept: "application/json",
                    Authorization: ensureBearer(authToken),
                };

                const response = await axios.get(`${BACKEND_API_URL}/chapter-materials/chapter_lectures`, {
                    headers,
                    signal: controller.signal,
                });

                const payload = response?.data;
                const list = Array.isArray(payload?.data?.items)
                    ? payload.data.items
                    : Array.isArray(payload?.lectures)
                        ? payload.lectures
                        : Array.isArray(payload)
                            ? payload
                            : [];

                const normalized = list.map((item, index) => ({
                    id: item?.id ?? item?.lecture_uid,
                    subject: item?.subject || "—",
                    chapterName: item?.chapter || "—",
                    title: item?.chapter || `Chapter ${index + 1}`,
                    size: formatFileSize(item?.size ?? item?.file_size ?? item?.file_size_bytes ?? item?.size),
                    topics: Array.isArray(item?.topics)
                        ? item.topics.filter(Boolean)
                        : typeof item?.topics === "string"
                            ? [item.topics]
                            : [],
                    duration: `${item?.video_duration_minutes ?? 20}:00`,
                }));

                setVideos(normalized);
                setCurrentPage(0);
            } catch (error) {
                if (!axios.isCancel(error)) {
                    const message = error?.response?.data?.message || error?.response?.data?.detail || error.message || "Failed to load lectures.";
                    setFetchError(message);
                    if (typeof handleerror === "function") {
                        handleerror(message);
                    }
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoadingLectures(false);
                }
            }
        };

        fetchLectures();
        return () => controller.abort();
    }, []);

    const totalVideos = videos.length;
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedVideos = videos.slice(startIndex, endIndex);

    const handleChangeRowsPerPage = (e) => {
        const value = Number(e.target.value);
        setRowsPerPage(value);
        setCurrentPage(0);
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
        const maxPage = Math.max(Math.ceil(totalVideos / rowsPerPage) - 1, 0);
        setCurrentPage((prev) => (prev < maxPage ? prev + 1 : prev));
    };

    const classOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
    const subjectOptions = [
        "English",
        "Gujrati",
        "Hindi",
        "Sanskrit",
        "Activity",
        "Science",
        "Math's",
        "Computer",
        "Science",
    ];
    const chapterOptions = [
        "Fundamentals Of Physics - Volume 1",
        "Essential Concepts Of Physics - Volume A",
    ];

    const resetFilters = () => {
        setSelectedClass("");
        setSelectedSubject("");
        setSelectedChapter("");
    };

    // Close any open filter dropdown when clicking outside the filter card
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

    const handleDeleteLecture = async () => {
        if (!deleteTarget?.id) return;

        try {
            const token =
                localStorage.getItem("access_token") ||
                localStorage.getItem("token") ||
                "";

            await axios.delete(`${BACKEND_API_URL}/chapter-materials/${deleteTarget.id}`, {
                headers: {
                    Accept: "application/json",
                    ...(token ? { Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}` } : {}),
                },
            });

            handlesuccess?.("Lecture deleted successfully");

            setVideos((prev) => prev.filter((video) => video.id !== deleteTarget.id));
            setDeleteModalOpen(false);
            setDeleteTarget(null);
        } catch (error) {
            const message = error?.response?.data?.message || "Failed to delete lecture";
            handleerror?.(message);
        }
    };

    return (
        <div
            className={`flex ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
                } h-screen overflow-x-hidden overflow-y-hidden transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="relative flex flex-col min-h-0 min-w-0 w-full md:ml-20 lg:ml-72 px-3 sm:px-4 md:px-6 pt-6 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Chapter Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        isSearchbar={videos.length === 0 ? false : true}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={`mt-6 flex-1 transition-colors duration-300 ${isDark ? "bg-black" : "bg-zinc-50"
                        }`}
                >
                    <div
                        className={`h-full flex flex-col ${isDark ? "bg-black text-gray-200" : "bg-white text-[#696CFF]"
                            }`}
                    >
                        {/* Top Table Container */}
                        <div className={`w-full max-w-none rounded pb-0 p-3 md:px-5 lg:px-6 overflow-x-auto no-scrollbar transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border`}>

                            {/* Top Row */}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <h2 className={`font-medium header-3 transition-colors duration-300 ${isDark ? "text-white" : "text-[#696CFF]"}`}>
                                    Chapter Management
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFilter((prev) => !prev);
                                        setOpenFilter(null);
                                    }}
                                    className={`${isDark
                                        ? "bg-zinc-800 text-gray-100 hover:bg-zinc-700 border border-zinc-700"
                                        : "bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-300"
                                        } cursor-pointer inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200 self-start`}
                                >
                                    {showFilter ? "Hide Filter" : "Show Filter"}
                                </button>
                            </div>

                            {showFilter && (
                                <div
                                    ref={filterRef}
                                    className={`mb-5 space-y-3 rounded-2xl border px-3 sm:px-4 py-3 shadow-md transition-all duration-200 ${isDark
                                        ? "bg-black/40 border-zinc-800"
                                        : "bg-zinc-50 border-zinc-200"
                                        }`}
                                >
                                    {/* Dropdown row */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {/* Class dropdown */}
                                        <div className="relative z-1000">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFilter((prev) => (prev === "class" ? null : "class"))}
                                                className={`${isDark
                                                    ? "bg-zinc-900 border-zinc-700 text-gray-100"
                                                    : "bg-white border-zinc-300 text-zinc-800"
                                                    } w-full flex items-center justify-between rounded-md border px-4 py-2 text-xs sm:text-sm cursor-pointer shadow-sm hover:shadow transition-all duration-150`}
                                            >
                                                <span>{selectedClass || "Class"}</span>
                                                <span className="text-[10px]">▾</span>
                                            </button>
                                            {openFilter === "class" && (
                                                <div
                                                    className={`${isDark
                                                        ? "bg-zinc-900 text-gray-100"
                                                        : "bg-white text-zinc-800"
                                                        } absolute z-50 mt-2 w-full rounded-2xl border ${isDark ? "border-zinc-700" : "border-zinc-300"
                                                        } px-3 py-3 shadow-xl transition-all duration-150`}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {classOptions.map((item) => (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedClass(item);
                                                                    setOpenFilter(null);
                                                                }}
                                                                className={`${selectedClass === item
                                                                    ? "bg-white text-black"
                                                                    : isDark
                                                                        ? "bg-zinc-800 text-gray-100"
                                                                        : "bg-zinc-100 text-zinc-800"
                                                                    } cursor-pointer px-3 py-1 rounded-full text-xs transition-all duration-150 hover:scale-[1.03]`}
                                                            >
                                                                {item}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Subject Name dropdown */}
                                        <div className="relative z-1000">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFilter((prev) => (prev === "subject" ? null : "subject"))}
                                                className={`${isDark
                                                    ? "bg-zinc-900 border-zinc-700 text-gray-100"
                                                    : "bg-white border-zinc-300 text-zinc-800"
                                                    } w-full flex items-center justify-between rounded-md border px-4 py-2 text-xs sm:text-sm cursor-pointer`}
                                            >
                                                <span>{selectedSubject || "Subject Name"}</span>
                                                <span className="text-[10px]">▾</span>
                                            </button>
                                            {openFilter === "subject" && (
                                                <div
                                                    className={`${isDark
                                                        ? "bg-zinc-900 text-gray-100"
                                                        : "bg-white text-zinc-800"
                                                        } absolute z-50 mt-2 w-full rounded-xl border ${isDark ? "border-zinc-700" : "border-zinc-300"
                                                        } px-3 py-3 shadow-lg`}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {subjectOptions.map((item) => (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedSubject(item);
                                                                    setOpenFilter(null);
                                                                }}
                                                                className={`${selectedSubject === item
                                                                    ? "bg-white text-black"
                                                                    : isDark
                                                                        ? "bg-zinc-800 text-gray-100"
                                                                        : "bg-zinc-100 text-zinc-800"
                                                                    } cursor-pointer px-3 py-1 rounded-full text-xs transition-all duration-150 hover:scale-[1.03]`}
                                                            >
                                                                {item}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chapter Name dropdown */}
                                        <div className="relative z-1000">
                                            <button
                                                type="button"
                                                onClick={() => setOpenFilter((prev) => (prev === "chapter" ? null : "chapter"))}
                                                className={`${isDark
                                                    ? "bg-zinc-900 border-zinc-700 text-gray-100"
                                                    : "bg-white border-zinc-300 text-zinc-800"
                                                    } w-full flex items-center justify-between rounded-md border px-4 py-2 text-xs sm:text-sm cursor-pointer`}
                                            >
                                                <span>{selectedChapter || "Chapter Name"}</span>
                                                <span className="text-[10px]">▾</span>
                                            </button>
                                            {openFilter === "chapter" && (
                                                <div
                                                    className={`${isDark
                                                        ? "bg-zinc-900 text-gray-100"
                                                        : "bg-white text-zinc-800"
                                                        } absolute z-50 mt-2 w-full rounded-xl border ${isDark ? "border-zinc-700" : "border-zinc-300"
                                                        } px-3 py-3 shadow-lg`}
                                                >
                                                    <div className="flex flex-col gap-2">
                                                        {chapterOptions.map((item) => (
                                                            <button
                                                                key={item}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedChapter(item);
                                                                    setOpenFilter(null);
                                                                }}
                                                                className={`${selectedChapter === item
                                                                    ? "bg-white text-black"
                                                                    : isDark
                                                                        ? "bg-zinc-800 text-gray-100"
                                                                        : "bg-zinc-100 text-zinc-800"
                                                                    } cursor-pointer w-full text-left px-4 py-1.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02]`}
                                                            >
                                                                {item}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reset / Apply row */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className={`${isDark
                                                ? "bg-transparent text-gray-200 border border-zinc-600 hover:bg-zinc-900"
                                                : "bg-transparent text-zinc-700 border border-zinc-300 hover:bg-zinc-100"
                                                } cursor-pointer rounded-full px-5 py-1.5 text-xs sm:text-sm`}
                                        >
                                            Reset Filter
                                        </button>
                                        <button
                                            type="button"
                                            className={`${isDark
                                                ? "bg-white text-black hover:bg-zinc-100"
                                                : "bg-white text-zinc-900 hover:bg-zinc-100"
                                                } cursor-pointer rounded-full px-5 py-1.5 text-xs sm:text-sm shadow-sm`}
                                        >
                                            Apply Filter
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Video Table — SCROLLABLE Y (md: ~4 rows, mobile: ~3 rows) */}
                            {loadingLectures && (
                                <div className={`flex items-center gap-3 mt-5 mb-3 text-sm ${isDark ? 'text-gray-200' : 'text-zinc-700'}`}>
                                    <Clock className="animate-spin" size={16} />
                                    <span>Loading chapter lectures...</span>
                                </div>
                            )}

                            {fetchError && (
                                <div className={`mt-4 mb-2 rounded-lg border px-4 py-3 text-sm ${isDark ? 'bg-red-500/10 border-red-400 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    {fetchError}
                                </div>
                            )}

                            {!loadingLectures && videos.length !== 0 && (
                                <div
                                    className={`overflow-y-auto no-scrollbar ${showFilter ? "max-h-[calc(100vh-480px)] md:max-h-[calc(100vh-380px)]" : "max-h-[calc(100vh-280px)] md:max-h-[calc(100vh-250px)]"} mt-5`}
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {paginatedVideos.map((video) => (
                                            <div
                                                key={video.id}
                                                className={`flex gap-4 rounded-2xl border p-4 relative overflow-hidden ${isDark ? 'bg-linear-to-br from-zinc-900 via-zinc-900/80 to-black border-zinc-800' : 'bg-white border-zinc-200 shadow-[0_10px_30px_rgba(105,108,255,0.08)]'}`}
                                            >
                                                <div className={`w-28 sm:w-32 h-24 sm:h-28 rounded-xl shrink-0 relative ${isDark ? 'bg-zinc-800' : 'bg-[#e7e6ff]'} overflow-hidden`}>
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-wide opacity-40">
                                                        Thumbnail
                                                    </div>
                                                    <div className={`absolute bottom-2 right-2 text-[11px] px-2 py-1 rounded-full ${isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-black'}`}>
                                                        {video.duration}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div>
                                                            <p className={`text-xs font-semibold mb-2 uppercase tracking-wide ${isDark ? 'text-indigo-300' : 'text-[#696CFF]'}`}>
                                                                Subject · {video.subject}
                                                            </p>
                                                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'} line-clamp-2`}>
                                                                {video.title}
                                                            </p>
                                                            <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                                                Size · {video.size}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3">
                                                        {Array.isArray(video.topics) && video.topics.length > 0 ? (
                                                            <ul className={`space-y-1 text-xs ${isDark ? 'text-gray-200' : 'text-zinc-700'} list-disc list-inside`}>
                                                                {video.topics.slice(0, 3).map((topicText, idx) => (
                                                                    <li key={`${video.id}-topicCard-${idx}`} className="truncate">
                                                                        {topicText}
                                                                    </li>
                                                                ))}
                                                                {video.topics.length > 3 && (
                                                                    <li className="italic opacity-70">+{video.topics.length - 3} more</li>
                                                                )}
                                                            </ul>
                                                        ) : (
                                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>No topics found</p>
                                                        )}
                                                    </div>

                                                    {!isAdminPath && (
                                                        <div className="mt-4 flex items-center justify-between">
                                                            <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Lecture #{video.id}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => navigate(`/chapter/EditChapter`, {
                                                                        state: {
                                                                            id: video.id,
                                                                            video_duration_minutes: video.duration?.replace(':00', ''),
                                                                            chapter_title_override: video.chapterName,
                                                                        }
                                                                    })}
                                                                    className={`p-2 rounded-full ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#eef0ff] text-[#696CFF] hover:bg-[#dfe2ff]'}`}
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setDeleteTarget(video);
                                                                        setDeleteModalOpen(true);
                                                                    }}
                                                                    className={`p-2 rounded-full ${isDark ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Outside click overlay to close menus */}
                        {openMenu !== null && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenu(null)}
                                aria-hidden="true"
                            />
                        )}

                        {deleteModalOpen && (
                            <div
                                className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setDeleteTarget(null);
                                }}
                            >
                                <div
                                    className={`${isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
                                        } rounded-2xl px-6 py-5 w-[90%] max-w-md shadow-2xl border ${isDark ? "border-zinc-700" : "border-zinc-200"
                                        }`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <h3 className="text-xl sm:text-2xl font-semibold mb-3">Confirm Delete</h3>
                                    <p className="text-sm sm:text-base mb-6 opacity-90">
                                        Are you sure you want to delete this?
                                    </p>

                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDeleteModalOpen(false);
                                                setDeleteTarget(null);
                                            }}
                                            className={`px-5 py-1.5 rounded-full text-sm font-medium border ${isDark
                                                ? "border-zinc-600 text-gray-200 hover:bg-zinc-800"
                                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                                }`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteLecture}
                                            className={`px-5 py-1.5 rounded-full text-sm font-medium text-white ${isDark ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loadingLectures && totalVideos === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-33">
                                <h2 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Uploaded Your First Video</h2>
                                <p className={`text-sm mb-6 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Make This Space Your Own</p>
                                {!isAdminPath && (
                                    <NavLink
                                        to={addchapter}
                                        className={`px-5 py-2 cursor-pointer rounded font-medium transition-colors duration-300 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        Add Chapters
                                    </NavLink>
                                )}
                            </div>
                        ) : (

                            <div className={`flex justify-between items-center text-sm mt-1 px-4 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                <div>
                                    {totalVideos > 0 && (
                                        <span>
                                            {startIndex + 1} - {Math.min(endIndex, totalVideos)} of {totalVideos}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span>Rows per page:</span>
                                    <select
                                        className={`rounded px-2 py-1 outline-none cursor-pointer transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-700 text-gray-200' : 'bg-white border-zinc-300 text-black'} border`}
                                        value={rowsPerPage}
                                        onChange={handleChangeRowsPerPage}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <button
                                        className={`px-2 cursor-pointer transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-600 hover:text-[#696CFF]'}`}
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 0}
                                    >&lt;</button>

                                    <button
                                        className={`px-2 cursor-pointer transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-600 hover:text-[#696CFF]'}`}
                                        onClick={handleNextPage}
                                        disabled={(currentPage + 1) * rowsPerPage >= totalVideos}
                                    >&gt;</button>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}

export default ChapterManagement;

