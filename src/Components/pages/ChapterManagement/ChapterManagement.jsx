// export default ChapterManagement;
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { Pencil, Trash2, Clock, Video, ChevronDown, SlidersHorizontal, X } from "lucide-react";
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

// Extracted VideoCard Component for managing individual state
const VideoCard = ({ video, index, isDark, isAdminPath, navigate, setDeleteTarget, setDeleteModalOpen }) => {
    const [showAllTopics, setShowAllTopics] = useState(false);

    return (
        <div
            className={`flex gap-4 border border-transparent p-4 relative overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'}`}
        >
            <div className={`w-28 sm:w-32 h-24 sm:h-28 shrink-0 relative ${isDark ? 'bg-zinc-800' : 'bg-[#e7e6ff]'} overflow-hidden`}>
                {video.thumbnailUrl ? (
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title || 'Lecture thumbnail'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-xs uppercase tracking-wide opacity-40">
                        Thumbnail
                    </div>
                )}
                <div className={`absolute bottom-2 right-2 text-[11px] px-2 py-1 ${isDark ? 'bg-black/70 text-white' : 'bg-white/90 text-black'}`}>
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
                            {(showAllTopics ? video.topics : video.topics.slice(0, 3)).map((topicText, idx) => (
                                <li key={`${video.id}-topicCard-${idx}`} className="truncate">
                                    {topicText}
                                </li>
                            ))}
                            {video.topics.length > 3 && (
                                <li
                                    onClick={() => setShowAllTopics(!showAllTopics)}
                                    className="list-none italic opacity-70 cursor-pointer hover:underline"
                                >
                                    {showAllTopics ? "Show less" : `+${video.topics.length - 3} more`}
                                </li>
                            )}
                        </ul>
                    ) : (
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>No topics found</p>
                    )}
                </div>

                {!isAdminPath && (
                    <div className="flex items-center justify-between mt-auto">
                        <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}></span>
                        <div className="flex items-center gap-2">
                            {/* Edit Button commented out in original */}
                            <button
                                type="button"
                                onClick={() => {
                                    setDeleteTarget(video);
                                    setDeleteModalOpen(true);
                                }}
                                className={`p-2 cursor-pointer rounded-full ${isDark ? 'bg-red-500/10 text-red-200 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function ChapterManagement({ isDark, toggleTheme, sidebardata, addchapter }) {
    const [openMenu, setOpenMenu] = useState(null);
    const [showFilter, setShowFilter] = useState(false);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [openFilter, setOpenFilter] = useState(null); // 'class' | 'subject' | 'chapter' | null
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");
    const [selectedChapter, setSelectedChapter] = useState("");
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // store video or index if needed later
    const [videos, setVideos] = useState([]);
    const [allVideos, setAllVideos] = useState([]); // Store original data for search
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingLectures, setLoadingLectures] = useState(false);
    const [fetchError, setFetchError] = useState("");

    // Filter options from API
    const [standardOptions, setStandardOptions] = useState([]);
    const [subjectOptions, setSubjectOptions] = useState([]);
    const [chapterOptions, setChapterOptions] = useState([]);

    const filterRef = useRef(null);
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);
    const navigate = useNavigate();

    // Fetch filters and lectures from API
    const fetchFiltersAndLectures = async (std = "", subject = "", chapters = "") => {
        setLoadingLectures(true);
        setFetchError("");

        try {
            const storedToken = typeof window !== "undefined"
                ? (localStorage.getItem("token") || localStorage.getItem("access_token"))
                : "";
            const authToken = storedToken || "";
            const headers = {
                Accept: "application/json",
                Authorization: ensureBearer(authToken),
            };

            // If no filters are selected, use the original API to get all lectures
            if (!std && !subject && !chapters) {
                const response = await axios.get(`${BACKEND_API_URL}/chapter-materials/chapter_lectures`, {
                    headers,
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
                    thumbnailUrl: item?.thumbnail_url,
                }));

                setVideos(normalized);
                setAllVideos(normalized); // Store for search
                setLoadingLectures(false);
                return;
            }

            // If filters are selected, use the filters API
            const params = new URLSearchParams();
            if (std) params.append("std", std);
            if (subject) params.append("subject", subject);
            if (chapters) params.append("chapters", chapters);

            const queryString = params.toString();
            const url = `${BACKEND_API_URL}/chapter-materials/chapters/filters${queryString ? `?${queryString}` : ""}`;

            const response = await axios.get(url, { headers });

            // Handle both API response formats
            const rawData = response?.data;

            // Check status on outer level (rawData.status) OR nested level (rawData.data.status)
            const hasStatus = rawData?.status || rawData?.data?.status;

            // Get the actual data - could be in rawData.data or directly in rawData
            const dataPayload = rawData?.data || rawData;

            if (hasStatus) {
                // Handle all possible key variations from different API versions
                const stdData = dataPayload.std || dataPayload.standards || dataPayload.standard || [];
                const subjectData = dataPayload.subject || dataPayload.subjects || [];
                const chapterData = dataPayload.chapter_title || dataPayload.chapter || dataPayload.chapters || [];

                setStandardOptions(Array.isArray(stdData) ? stdData : []);
                setSubjectOptions(Array.isArray(subjectData) ? subjectData : []);
                setChapterOptions(Array.isArray(chapterData) ? chapterData : []);

                // Update lectures
                const list = Array.isArray(dataPayload.lectures) ? dataPayload.lectures : [];

                const normalized = list.map((item, index) => ({
                    id: item?.id ?? item?.lecture_uid,
                    subject: item?.subject || "—",
                    chapterName: item?.chapter || "—",
                    title: item?.chapter || `Chapter ${index + 1}`,
                    size: item?.size || formatFileSize(item?.file_size ?? item?.file_size_bytes),
                    topics: Array.isArray(item?.topics)
                        ? item.topics.filter(Boolean)
                        : typeof item?.topics === "string"
                            ? [item.topics]
                            : [],
                    duration: `${item?.video_duration_minutes ?? 20}:00`,
                    thumbnailUrl: item?.thumbnail_url || "",
                }));

                setVideos(normalized);
                setAllVideos(normalized); // Store for search
            }
        } catch (error) {
            if (!axios.isCancel(error)) {
                const message = error?.response?.data?.message || error?.response?.data?.detail || error.message || "Failed to load lectures.";
                setFetchError(message);
                if (typeof handleerror === "function") {
                    handleerror(message);
                }
            }
        } finally {
            setLoadingLectures(false);
        }
    };

    // Initial load - fetch all data and initial filter options
    useEffect(() => {
        fetchFiltersAndLectures();
        fetchFilterOptions(); // Fetch initial filter options (standards list)
    }, []);

    // Fetch only filter options (not lectures) when standard is selected
    const fetchFilterOptions = async (std = "", subject = "") => {
        try {
            const storedToken = typeof window !== "undefined"
                ? (localStorage.getItem("token") || localStorage.getItem("access_token"))
                : "";
            const authToken = storedToken || "";
            const headers = {
                Accept: "application/json",
                Authorization: ensureBearer(authToken),
            };

            const params = new URLSearchParams();
            if (std) params.append("std", std);
            if (subject) params.append("subject", subject);

            const queryString = params.toString();
            const url = `${BACKEND_API_URL}/chapter-materials/chapters/filters${queryString ? `?${queryString}` : ""}`;

            const response = await axios.get(url, { headers });

            // Handle both API response formats
            const rawData = response?.data;

            // Check status on outer level (rawData.status) OR nested level (rawData.data.status)
            const hasStatus = rawData?.status || rawData?.data?.status;

            // Get the actual data - could be in rawData.data or directly in rawData
            const dataPayload = rawData?.data || rawData;

            if (hasStatus) {
                // Handle all possible key variations from different API versions
                const stdData = dataPayload.std || dataPayload.standards || dataPayload.standard || [];
                const subjectData = dataPayload.subject || dataPayload.subjects || [];
                const chapterData = dataPayload.chapter_title || dataPayload.chapter || dataPayload.chapters || [];

                setStandardOptions(Array.isArray(stdData) ? stdData : []);
                setSubjectOptions(Array.isArray(subjectData) ? subjectData : []);
                setChapterOptions(Array.isArray(chapterData) ? chapterData : []);
            }
        } catch (error) {
            console.error("Failed to fetch filter options:", error);
        }
    };

    // When class is selected, fetch subjects options only
    useEffect(() => {
        if (selectedClass) {
            fetchFilterOptions(selectedClass);
            // Reset dependent filters
            setSelectedSubject("");
            setSelectedChapter("");
        }
    }, [selectedClass]);

    // When subject is selected, fetch chapters options only
    useEffect(() => {
        if (selectedClass && selectedSubject) {
            fetchFilterOptions(selectedClass, selectedSubject);
            // Reset dependent filter
            setSelectedChapter("");
        }
    }, [selectedSubject]);

    const totalVideos = videos.length;

    const resetFilters = async () => {
        setSelectedClass("");
        setSelectedSubject("");
        setSelectedChapter("");
        fetchFilterOptions(); // Reset filter options to default
        // Fetch all data again immediately
        setLoadingLectures(true);
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token") || "";
            const response = await axios.get(`${BACKEND_API_URL}/chapter-materials/chapter_lectures`, {
                headers: {
                    Accept: "application/json",
                    Authorization: ensureBearer(token),
                },
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
                thumbnailUrl: item?.thumbnail_url,
            }));

            setVideos(normalized);
            setAllVideos(normalized);
        } catch (error) {
            console.error("Error resetting chapter filters:", error);
        } finally {
            setLoadingLectures(false);
        }
    };

    const applyFilters = () => {
        // Fetch with current selections - only when Apply is clicked
        fetchFiltersAndLectures(selectedClass, selectedSubject, selectedChapter);
        setOpenFilter(null);
        setShowFilterPopup(false);
    };

    const closeFilterPopup = () => {
        setShowFilterPopup(false);
        setOpenFilter(null);
    };


    // Search effect - filter videos when searchQuery changes
    useEffect(() => {
        if (!searchQuery.trim()) {
            // If search is empty, show all videos
            setVideos(allVideos);
            return;
        }

        const lowerQuery = searchQuery.toLowerCase();
        const filtered = allVideos.filter((video) => {
            // Search in subject
            const subjectMatch = video.subject?.toLowerCase().includes(lowerQuery);

            // Search in chapter name
            const chapterMatch = video.chapterName?.toLowerCase().includes(lowerQuery) ||
                video.title?.toLowerCase().includes(lowerQuery);

            // Search in topics
            const topicsMatch = video.topics?.some(topic =>
                topic?.toLowerCase().includes(lowerQuery)
            );

            return subjectMatch || chapterMatch || topicsMatch;
        });

        setVideos(filtered);
    }, [searchQuery, allVideos]);


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
            className={`flex ${isDark ? "bg-black text-white" : "bg-[#F5F5F9] text-zinc-900"
                } h-screen overflow-x-hidden overflow-y-hidden transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="relative flex flex-col min-h-0 min-w-0 w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Chapter Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        isSearchbar={allVideos.length === 0 ? false : true}
                        searchValue={searchQuery}
                        setSearchValue={setSearchQuery}
                        isBack={isAdminPath ? true : false}
                        backValue={isAdminPath ? -1 : 0}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={`mt-6 flex-1 transition-colors duration-300`}
                >
                    <div
                        className={`h-full flex flex-col`}
                    >
                        {/* Top Table Container */}
                        <div className={`w-full max-w-none rounded pb-0 p-3 md:px-3 lg:px-3 overflow-x-auto no-scrollbar transition-colors duration-300`}>

                            {/* Top Row */}

                            <div className="flex flex-row items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowFilterPopup(true);
                                        // Fetch filter options when opening filter popup
                                        if (selectedClass && selectedSubject) {
                                            fetchFilterOptions(selectedClass, selectedSubject);
                                        } else if (selectedClass) {
                                            fetchFilterOptions(selectedClass);
                                        } else {
                                            fetchFilterOptions();
                                        }
                                    }}
                                    className={`${isDark
                                        ? "bg-zinc-800 text-gray-100"
                                        : "bg-white text-zinc-800"
                                        } border border-transparent cursor-pointer inline-flex items-center justify-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors duration-200`}
                                >
                                    <SlidersHorizontal className="mr-2 w-4" />
                                    Filter
                                </button>
                            </div>

                            {showFilterPopup && (
                                <div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                                    onClick={closeFilterPopup}
                                >
                                    <div
                                        ref={filterRef}
                                        className={`${isDark ? "bg-zinc-900 text-white" : "bg-white text-zinc-900"
                                            } rounded-2xl p-6 w-[80%] max-w-md max-h-[80vh] overflow-y-auto no-scrollbar shadow-2xl border ${isDark ? "border-zinc-700" : "border-zinc-200"
                                            }`}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-semibold">Filter Chapters</h3>
                                            <button
                                                type="button"
                                                onClick={closeFilterPopup}
                                                className={`p-2 cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        
                                        {/* Dropdown row */}
                                        <div className="space-y-4">
                                            {/* Class dropdown */}
                                            <div className="relative z-30">
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenFilter((prev) => (prev === "class" ? null : "class"))}
                                                    className={`${isDark
                                                        ? "bg-zinc-800 text-gray-100"
                                                        : "bg-gray-100 text-zinc-800"
                                                        } border border-transparent w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-all duration-150 ${openFilter === "class" ? "rounded-t-md rounded-b-none border-b-transparent" : "rounded-md"}`}
                                                >
                                                    <span className="font-medium">{selectedClass || "Select Standard"}</span>
                                                    <span className="text-[10px]"><ChevronDown className={`size-4 ${openFilter === "class" ? "rotate-180" : ""}`} /></span>
                                                </button>
                                                {openFilter === "class" && (
                                                    <div
                                                        className={`${isDark
                                                            ? "bg-zinc-800 text-gray-100"
                                                            : "bg-white text-zinc-800"
                                                            } relative z-100 -mt-px w-full rounded-b-xl rounded-t-none px-3 py-3 border border-transparent transition-all duration-150 max-h-40 overflow-y-auto no-scrollbar`}
                                                    >
                                                        <div className="flex flex-wrap gap-2">
                                                            {standardOptions.map((item) => (
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
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Subject Name dropdown */}
                                            {selectedClass && (
                                                <div className="relative z-20">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenFilter((prev) => (prev === "subject" ? null : "subject"))}
                                                        disabled={!selectedClass}
                                                        className={`${isDark
                                                            ? "bg-zinc-800 text-gray-100"
                                                            : "bg-gray-100 text-zinc-800"
                                                            } border border-transparent w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer ${!selectedClass ? 'opacity-50 cursor-not-allowed' : ''} ${openFilter === "subject" ? "rounded-t-md rounded-b-none border-b-transparent" : "rounded-md"}`}
                                                    >
                                                        <span className="font-medium">{selectedSubject || "Select Subject"}</span>
                                                        <span className="text-[10px]"><ChevronDown className={`size-4 ${openFilter === "subject" ? "rotate-180" : ""}`} /></span>
                                                    </button>
                                                    {openFilter === "subject" && selectedClass && (
                                                        <div
                                                            className={`${isDark
                                                                ? "bg-zinc-800 text-gray-100"
                                                                : "bg-white text-zinc-800"
                                                                } relative z-100 -mt-px w-full rounded-b-xl rounded-t-none px-3 py-3 border border-transparent max-h-40 overflow-y-auto no-scrollbar`}
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
                                                                            ? `${isDark ? "bg-white text-black" : "bg-[#696CFF] text-white"}`
                                                                            : isDark
                                                                                ? "bg-zinc-700 text-gray-100"
                                                                                : "bg-gray-100 text-zinc-800"
                                                                            } cursor-pointer px-3 py-1 text-sm font-medium capitalize transition-all duration-150 hover:scale-[1.03]`}
                                                                    >
                                                                        {item}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Chapter Name dropdown */}
                                            {selectedSubject && (
                                                <div className="relative z-10">
                                                    <button
                                                        type="button"
                                                        onClick={() => setOpenFilter((prev) => (prev === "chapter" ? null : "chapter"))}
                                                        disabled={!selectedSubject}
                                                        className={`${isDark
                                                            ? "bg-zinc-800 text-gray-100"
                                                            : "bg-gray-100 text-zinc-800"
                                                            } border border-transparent w-full flex items-center justify-between px-4 py-3 text-sm cursor-pointer ${!selectedSubject ? 'opacity-50 cursor-not-allowed' : ''} ${openFilter === "chapter" ? "rounded-t-md rounded-b-none border-b-transparent" : "rounded-md"}`}
                                                    >
                                                        <span className="font-medium">{selectedChapter || "Select Chapter"}</span>
                                                        <span className="text-[10px]"><ChevronDown className={`size-4 ${openFilter === "chapter" ? "rotate-180" : ""}`} /></span>
                                                    </button>
                                                    {openFilter === "chapter" && selectedSubject && (
                                                        <div
                                                            className={`${isDark
                                                                ? "bg-zinc-800 text-gray-100"
                                                                : "bg-white text-zinc-800"
                                                                } relative z-100 -mt-px w-full rounded-b-xl rounded-t-none px-3 py-3 border border-transparent max-h-40 overflow-y-auto no-scrollbar`}
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
                                                                            ? `${isDark ? "bg-white text-black" : "bg-[#696CFF] text-white"}`
                                                                            : isDark
                                                                                ? "bg-zinc-700 text-gray-100"
                                                                                : "bg-gray-100 text-zinc-800"
                                                                            } cursor-pointer w-full text-left px-4 py-2 text-sm font-medium capitalize transition-all duration-150 hover:scale-[1.02]`}
                                                                    >
                                                                        {item}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        {selectedClass && selectedSubject && selectedChapter && (
                                            <div className="flex items-center justify-end gap-3 mt-6 pt-4">
                                                <button
                                                    type="button"
                                                    onClick={resetFilters}
                                                    className={`${isDark
                                                        ? "bg-transparent text-gray-200 border border-zinc-600 hover:bg-zinc-800"
                                                        : "bg-transparent text-zinc-800 border border-zinc-300 hover:bg-zinc-100"
                                                        } cursor-pointer rounded-full px-5 py-2 text-sm font-medium`}
                                                >
                                                    Reset
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={applyFilters}
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

                            {/* Skeleton Loading Cards */}
                            {loadingLectures && (
                                <div className={`overflow-y-auto no-scrollbar ${"max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-230px)]"} mt-5`}>
                                    <h2 className={`font-medium header-3 mb-4 transition-colors duration-300 ${isDark ? "text-white" : "text-[#696CFF]"}`}>Chapter Management</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                                            <div
                                                key={item}
                                                className={`flex gap-4 border p-4 relative overflow-hidden animate-pulse ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}
                                            >
                                                {/* Skeleton Thumbnail */}
                                                <div className={`w-28 sm:w-32 h-24 sm:h-28 shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                                    <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite]" />
                                                </div>

                                                {/* Skeleton Content */}
                                                <div className="flex flex-col flex-1 min-w-0 gap-2">
                                                    {/* Subject line */}
                                                    <div className={`h-3 w-24 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                    {/* Title lines */}
                                                    <div className={`h-4 w-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                    <div className={`h-4 w-3/4 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                    {/* Size line */}
                                                    <div className={`h-3 w-16 mt-1 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                    {/* Topics skeleton */}
                                                    <div className="mt-2 space-y-1">
                                                        <div className={`h-3 w-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                        <div className={`h-3 w-5/6 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {fetchError && (
                                <div className={`mt-4 mb-2 rounded-lg border px-4 py-3 text-sm ${isDark ? 'bg-red-500/10 border-red-400 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    {fetchError}
                                </div>
                            )}

                            {!loadingLectures && videos.length !== 0 && (
                                <div
                                    className={`overflow-y-auto no-scrollbar ${"max-h-[calc(100vh-220px)] md:max-h-[calc(100vh-230px)]"} mt-5`}
                                >
                                    <h2 className={`font-medium header-3 mb-4 transition-colors duration-300 ${isDark ? "text-white" : "text-[#696CFF]"}`}>Chapter Management</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {videos.map((video, index) => (
                                            <VideoCard
                                                key={`${video.id}-${index}`}
                                                video={video}
                                                index={index}
                                                isDark={isDark}
                                                isAdminPath={isAdminPath}
                                                navigate={navigate}
                                                setDeleteTarget={setDeleteTarget}
                                                setDeleteModalOpen={setDeleteModalOpen}
                                            />
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
                                            className={`px-5 py-1.5 cursor-pointer rounded-full text-sm font-medium border ${isDark
                                                ? "border-zinc-600 text-gray-200 hover:bg-zinc-800"
                                                : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                                }`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeleteLecture}
                                            className={`px-5 py-1.5 cursor-pointer rounded-full text-sm font-medium text-white ${isDark ? "bg-red-500 hover:bg-red-600" : "bg-red-500 hover:bg-red-600"}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loadingLectures && totalVideos === 0 && (
                            <div className="flex flex-col items-center justify-center text-center py-33">
                                <h2 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Uploaded Your First Video</h2>
                                <p className={`text-sm mb-6 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Make This Space Your Own</p>
                                {!isAdminPath && (
                                    <div
                                        onClick={() => navigate(addchapter)}
                                        className={`px-5 py-2 cursor-pointer rounded font-medium transition-colors duration-300 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                    >
                                        Add Chapters
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

export default ChapterManagement;

