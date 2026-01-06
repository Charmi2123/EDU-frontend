import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Play, Trash2, Calendar, Clock } from "lucide-react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { BACKEND_API_URL } from "../../../utils/assets.js";

function SavedVideos({ isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    const shellBg = isDark ? "bg-black text-[#E5E7EB]" : "bg-[#F5F7FB] text-[#0F172A]";
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [searchValue, setSearchValue] = useState("");

    // Fetch saved videos from API
    const fetchSavedVideos = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                setLoading(false);
                return;
            }

            const response = await axios.get(`${BACKEND_API_URL}/school-portal/videos/saved`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.status && response.data.data.videos) {
                setVideos(response.data.data.videos);
            } else {
                setError('No saved videos found');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch saved videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSavedVideos();
    }, []);

    // Filter videos based on search value
    const filteredVideos = videos.filter(video =>
        video.subject.toLowerCase().includes(searchValue.toLowerCase()) ||
        video.subject.toLowerCase().includes(searchValue.toLowerCase()) ||
        video.chapter_name.toLowerCase().includes(searchValue.toLowerCase())
    );

    const handlePlayVideo = (video) => {
        const id = video?.id;
        if (!id) return;
        navigate(`/StudentPortal/Videos`, { state: { video } });
    };

    const handleConfirmDelete = async () => {
        if (!videoToDelete) return;
        
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No authentication token found');
                return;
            }

            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoToDelete.id}/subscribe`,
                {
                    subscribed: false,
                },
                {
                    headers: {
                        accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status) {
                setVideos((prev) => prev.filter((v) => v.id !== videoToDelete.id));
                setVideoToDelete(null);
            } else {
                setError('Failed to unbookmark video');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to unbookmark video');
        }
    };

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-20">
                    <Portalheader subject="Saved Videos" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} searchValue={searchValue} setSearchValue={setSearchValue} />
                </div>

                {/* Main Section */}
                <main className="mt-4 sm:mt-6 flex-1 flex flex-col min-h-0 px-3 sm:px-4 md:px-6 lg:px-8">
                    <div className="relative flex-1 min-h-0">
                        <div className="w-full h-full flex flex-col">
                            <div className="mb-5">
                                <h2 className="font-inter font-bold text-xl sm:text-2xl lg:text-[26px] leading-none tracking-normal">
                                    Saved Videos
                                </h2>
                                <p
                                    className={`mt-2 sm:mt-3 font-inter font-normal text-base sm:text-lg lg:text-[20px] leading-none tracking-normal
    ${isDark ? "text-zinc-400" : "text-zinc-600"}`}
                                >
                                    "Your collection of saved videos, ready to play.”
                                </p>

                            </div>

                            {/* List of saved video cards (scrollable area) */}
                            <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 sm:gap-4 lg:gap-5">
                                {loading ? (
                                    <div className={`${isDark
                                        ? "bg-zinc-900 border-zinc-800"
                                        : "bg-white border-zinc-200"
                                        } border rounded-2xl px-6 py-8 text-center`}>
                                        <p className={`text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                            Loading saved videos...
                                        </p>
                                    </div>
                                ) : error ? (
                                    <div className={`${isDark
                                        ? "bg-zinc-900 border-zinc-800"
                                        : "bg-white border-zinc-200"
                                        } border rounded-2xl px-6 py-8 text-center`}>
                                        <p className={`text-xs md:text-sm text-red-500`}>
                                            {error}
                                        </p>
                                    </div>
                                ) : filteredVideos.length > 0 ? (
                                    filteredVideos.map((video) => (
                                        <div
                                            key={video.id}
                                            className={`${isDark
                                                ? "bg-zinc-900"
                                                : "bg-white"
                                                } rounded-xl sm:rounded-2xl px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 flex items-center justify-between gap-2 sm:gap-4`}
                                        >
                                            {/* Left: play button + text + meta */}
                                            <div className="flex items-center gap-3 sm:gap-4 md:gap-5 flex-1 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayVideo(video)}
                                                    className={`${isDark
                                                        ? "bg-white text-black"
                                                        : "bg-[#3333331A] text-black"
                                                        } w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 cursor-pointer
                                                 rounded-lg flex items-center justify-center shrink-0`}
                                                >
                                                    <Play className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                                </button>

                                                <div className="flex flex-col gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <h3
                                                        className={`${isDark ? "text-zinc-300" : "text-zinc-900"} font-inter font-medium text-sm sm:text-lg lg:text-lg xl:text-[23px] leading-none tracking-normal truncate`}
                                                    >
                                                        {video.subject}
                                                    </h3>

                                                    <p
                                                        className={`
    font-inter font-medium text-xs sm:text-sm lg:text-base xl:text-[18px] leading-none tracking-normal opacity-80 truncate
    ${isDark ? "text-zinc-400" : "text-zinc-700"}
  `}
                                                    >
                                                        {video.chapter_name}
                                                    </p>


                                                    <div
                                                        className={`mt-1 flex items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                                                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 opacity-80 shrink-0" />
                                                            <span className="font-inter opacity-80 font-medium text-xs sm:text-sm lg:text-base xl:text-[18px] leading-none tracking-normal">
                                                                {new Date(video.created_at).toLocaleDateString()}
                                                            </span>
                                                        </div>


                                                        <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 opacity-80 shrink-0" />
                                                            <span className="font-inter opacity-80 font-medium text-xs sm:text-sm lg:text-base xl:text-[18px] leading-none tracking-normal">
                                                                {Math.floor(video.duration_seconds / 60)}:
                                                                {(video.duration_seconds % 60).toString().padStart(2, '0')}
                                                            </span>
                                                        </div>

                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: delete icon only */}
                                            <button
                                                type="button"
                                                className={`${isDark
                                                    ? "text-zinc-400 hover:text-red-400"
                                                    : "text-zinc-500 hover:text-red-500"
                                                    } transition-colors ml-1 sm:ml-2 cursor-pointer p-1 shrink-0`}
                                                onClick={() => setVideoToDelete(video)}
                                            >
                                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" color={isDark ? "white" : "black"} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className={`${isDark
                                        ? "bg-zinc-900 border-zinc-800"
                                        : "bg-white border-zinc-200"
                                        } border rounded-2xl px-6 py-8 text-center`}>
                                        <p className={`text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                            No saved videos found matching {searchValue}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {videoToDelete && (
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${isDark ? "bg-black/60" : "bg-black/40"
                        } backdrop-blur-[3px]`}
                    onClick={() => setVideoToDelete(null)}
                >
                    <div
                        className={`w-full max-w-sm rounded-2xl border shadow-[0_18px_45px_rgba(0,0,0,0.55)] ${isDark
                            ? "bg-zinc-900 border-zinc-800 text-zinc-50"
                            : "bg-white border-zinc-200 text-zinc-900"
                            } p-6`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base md:text-lg font-semibold mb-2">Confirm Delete</h3>
                        <p className={`text-xs md:text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                            Are you sure you want to delete this?
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setVideoToDelete(null)}
                                className={`inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs md:text-sm font-medium border cursor-pointer transition-colors ${isDark
                                    ? "border-zinc-600 text-zinc-200 hover:bg-zinc-800"
                                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmDelete}
                                className="inline-flex items-center justify-center rounded-lg px-4 py-1.5 text-xs md:text-sm font-medium cursor-pointer bg-red-600 text-white hover:bg-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SavedVideos;
