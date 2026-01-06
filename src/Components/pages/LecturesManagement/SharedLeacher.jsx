import React, { useEffect, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
import { Play, Trash2, Clock } from 'lucide-react';
import axios from "axios";

// लेक्चर लिस्ट आइटम (लाइट/डार्क थीम सपोर्ट)
const LectureListItem = ({ lecture, isDark, onDelete }) => {
    const placeholderStyle = `${isDark ? 'bg-zinc-800' : 'bg-zinc-300'} relative w-28 h-20 md:w-[320px] md:h-[150px] rounded-xl shrink-0 overflow-hidden`;
    const formatDuration = (seconds) => {
        if (!seconds) return "00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const duration = formatDuration(lecture.duration_seconds);

    const [imgError, setImgError] = useState(false);

    return (
        // मुख्य कंटेनर को 'flex' से 'flex items-start' रखा गया है, लेकिन अब लेक्चर जानकारी और बटन को एक साथ एक 'flex-col' में लपेटेंगे।
        <div className={`flex items-start justify-between gap-4 p-4 ${isDark ? 'border-zinc-800' : 'border-zinc-200'} border-b last:border-b-0`}>
            {/* Thumbnail + duration badge */}
            <div className={placeholderStyle}>
                {(!imgError && lecture.cover_photo_url) ? (
                    <img
                        src={lecture.cover_photo_url}
                        onError={() => setImgError(true)}
                        className="w-full h-full object-cover"
                        alt={lecture.title}
                    />
                ) : lecture.lecture_url ? (
                    <video
                        src={lecture.lecture_url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                    />
                ) : (
                    <div className={`w-full h-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-300'}`} />
                )}
                <div className={`absolute bottom-1 right-1 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-medium ${isDark ? 'bg-black/70 text-gray-100' : 'bg-black/70 text-white'}`}>
                    {duration}
                </div>
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Title */}
                <p className={`${isDark ? 'text-[#A6A6A6]' : 'text-zinc-800/80'} text-base md:text-lg font-semibold truncate`}>
                    {lecture.title || "Untitled Lecture"}
                </p>

                {/* Class & Subject */}
                <p className={`${isDark ? 'text-white' : 'text-zinc-700'} text-sm md:text-base truncate`}>
                    {lecture.std ? `Class ${lecture.std}` : 'General Lecture'}
                    {lecture.subject ? ` • ${lecture.subject}` : ''}
                </p>

                {/* Actions for md+ */}
                <div className="hidden md:flex items-center gap-4 mt-3">
                    {/* <button className={`${isDark ? 'bg-zinc-800 text-white hover:text-zinc-700' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'} inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition`}>
                        <span>Play</span>
                        <Play fill="white" size={14} />
                    </button> */}
                    <button
                        onClick={() => onDelete && onDelete(lecture)}
                        className={`${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-gray-200' : 'bg-white hover:bg-white/90 text-zinc-700'} inline-flex cursor-pointer items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold transition`}>
                        <span>Remove</span>
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Actions for mobile (icon-only) */}
            <div className="flex md:hidden flex-col items-center gap-4 ml-2 shrink-0">
                {/* <button className={`${isDark ? 'bg-white text-zinc-900' : 'bg-[#696CFF] text-white'} w-9 h-9 rounded-md grid place-items-center`} aria-label="Play">
                    <Play size={16} />
                </button> */}
                <button
                    onClick={() => onDelete && onDelete(lecture)}
                    className={`${isDark ? 'bg-zinc-800 text-gray-200' : 'bg-zinc-100 text-zinc-700'} w-9 h-9 rounded-md grid place-items-center`}
                    aria-label="Remove"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

function SharedLeacher({ theme, isDark, toggleTheme, sidebardata }) {
    const [lectures, setLectures] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Search state for header search bar
    const [searchValue, setSearchValue] = useState("");

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [lectureToDelete, setLectureToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchSharedLectures = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("access_token");

                const response = await axios.get(`${BACKEND_API_URL}/lectures/shared`, {
                    headers: {
                        'Accept': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (response.data && Array.isArray(response.data)) {
                    setLectures(response.data);
                } else {
                    setLectures([]);
                }
            } catch (error) {
                console.error("Error fetching shared lectures:", error);
                handleerror("Failed to load shared lectures. Please try again.");
                setLectures([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSharedLectures();
    }, []);

    // Filter lectures based on search across title, std (class), and subject
    const filteredLectures = React.useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return lectures;

        return lectures.filter((lecture) => {
            const title = (lecture.title || "").toLowerCase();
            const std = (lecture.std != null ? String(lecture.std) : "").toLowerCase();
            const subject = (lecture.subject || "").toLowerCase();

            return (
                title.includes(query) ||
                std.includes(query) ||
                subject.includes(query)
            );
        });
    }, [searchValue, lectures]);

    const handleDeleteClick = (lecture) => {
        setLectureToDelete(lecture);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!lectureToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("access_token");

            const response = await axios.delete(
                `${BACKEND_API_URL}/lectures/${lectureToDelete.lecture_id}/shared`,
                {
                    headers: {
                        'Accept': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (response.data) {
                handlesuccess("Lecture unshared successfully");
                // Remove from local state without refetching
                setLectures((prev) => prev.filter((item) => item.lecture_id !== lectureToDelete.lecture_id));
            }
        } catch (error) {
            console.error("Error deleting shared lecture:", error);
            handleerror("Failed to delete shared lecture. Please try again.");
        } finally {
            setIsDeleting(false);
            setLectureToDelete(null);
            setShowDeleteModal(false);
        }
    };

    return (
        <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-[#F5F5F9] text-zinc-900'} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Lecture Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        isSearchbar={true}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                    />
                </div>

                {/* ===== Main Section (only list scrolls) ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {/* Heading */}
                    <div className={`shrink-0 text-base md:text-lg w-full font-semibold px-4 py-3 inline-block rounded border border-transparent ${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700'} mb-5`}>
                        Shared lecture
                    </div>

                    {/* Lecture List */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className={`${isDark ? 'divide-zinc-800' : 'divide-zinc-200'} divide-y`}>
                                {[...Array(6)].map((_, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-start justify-between gap-4 p-4 animate-pulse`}
                                    >
                                        {/* Thumbnail skeleton */}
                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-28 h-20 md:w-[320px] md:h-[150px] rounded-xl`} />

                                        {/* Text + buttons skeleton */}
                                        <div className="flex flex-col flex-1 min-w-0 gap-2">
                                            <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-4 w-2/3 rounded-md`} />
                                            <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-1/2 rounded-md`} />
                                            <div className="hidden md:flex items-center gap-3 mt-2">
                                                {/* <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-8 w-20 rounded-md`} /> */}
                                                <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-8 w-20 rounded-md`} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLectures.length === 0 ? (
                            <div className="flex items-center justify-center h-64 text-sm">
                                No shared lectures found.
                            </div>
                        ) : (
                            <div className={`${isDark ? 'divide-zinc-800' : 'divide-zinc-200'} divide-y`}>
                                {filteredLectures.map((lecture) => (
                                    <LectureListItem
                                        key={lecture.lecture_id}
                                        lecture={lecture}
                                        isDark={isDark}
                                        onDelete={handleDeleteClick}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div >

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className={`w-full max-w-md rounded-2xl p-6 transform transition-all scale-100 border border-transparent ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        <div className="flex flex-col items-center text-center">
                            <div className={`p-3 rounded-full mb-4 ${isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-100 text-red-600'}`}>
                                <Trash2 className="w-8 h-8" />
                            </div>
                            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                Delete Shared Lecture?
                            </h3>
                            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Are you sure you want to delete this shared lecture? This action cannot be undone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setLectureToDelete(null);
                                    }}
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
        </div >
    );
}

export default SharedLeacher;
