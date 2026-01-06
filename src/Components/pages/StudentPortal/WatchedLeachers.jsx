import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { CalendarDays, Clock3, Play, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { BACKEND_API_URL } from "../../../utils/assets.js";

// API implementation
const API_BASE_URL = `${BACKEND_API_URL}/school-portal`;

const getAuthToken = () => {
    return localStorage.getItem('token');
};

const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

const fetchWatchedLectures = async () => {
    try {
        const token = getAuthToken();

        const response = await fetch(`${API_BASE_URL}/watched-lectures`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.status) {
            throw new Error(data.message || 'Failed to fetch watched lectures');
        }

        const transformedData = {
            summary: {
                watchedVideos: data.data.summary.watched_videos,
                totalWatchTime: formatDuration(data.data.summary.total_watch_seconds),
                completedVideos: data.data.summary.completed_videos,
                totalRecords: data.data.summary.total_records,
            },
            lectures: data.data.videos.map(video => ({
                id: video.id,
                title: video.title,
                chapter: video.chapter_name,
                subject: video.subject,
                watchedDate: new Date(video.user_last_watched_at).toLocaleDateString('en-GB'),
                completion: video.user_watch_duration_seconds > 0
                    ? `${Math.min(100, Math.round((video.user_watch_duration_seconds / video.duration_seconds) * 100))}% Complete`
                    : '0% Complete',
                currentTime: formatTime(video.user_watch_duration_seconds),
                duration: formatTime(video.duration_seconds),
                thumb: video.thumbnail_url,
                videoUrl: video.video_url,
                liked: video.user_liked,
                subscribed: video.user_subscribed,
                totalLikes: video.total_likes,
                totalComments: video.total_comments,
            }))
        };

        return transformedData;
    } catch (error) {
        console.error('Error fetching watched lectures:', error);
        throw error;
    }
};

function WatchedLeachers({ isDark, toggleTheme, sidebardata }) {
    const shellBg = isDark ? "bg-black text-[#E5E7EB]" : "bg-[#F5F7FB] text-[#0F172A]";
    const panelBg = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200";
    const subText = isDark ? "text-zinc-400" : "text-zinc-600";

    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [searchValue, setSearchValue] = useState("");

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);
                const apiData = await fetchWatchedLectures();
                setData(apiData);
            } catch (err) {
                setError(err.message || 'Failed to load watched lectures');
                console.error('API Error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const stats = data ? [
        { id: 1, label: "Watched Videos", value: data.summary.watchedVideos.toString(), icon: Play },
        { id: 2, label: "Total Watch Time", value: data.summary.totalWatchTime, icon: Clock3 },
        { id: 3, label: "Completed", value: `${data.summary.completedVideos}/${data.summary.watchedVideos}`, icon: CheckCircle2 },
    ] : [
        { id: 1, label: "Watched Videos", value: "0", icon: Play },
        { id: 2, label: "Total Watch Time", value: "0m", icon: Clock3 },
        { id: 3, label: "Completed", value: "0/0", icon: CheckCircle2 },
    ];

    // Filter lectures based on search value
    const filteredLectures = data ? data.lectures.filter(lec => {
        if (!searchValue.trim()) return true;

        const search = searchValue.toLowerCase().trim();
        return (
            lec.title.toLowerCase().includes(search) ||
            lec.chapter.toLowerCase().includes(search) ||
            lec.subject.toLowerCase().includes(search) ||
            lec.watchedDate.toLowerCase().includes(search) ||
            lec.completion.toLowerCase().includes(search)
        );
    }) : [];

    const openLectureVideo = (lecture) => {
        const id = lecture?.id;
        if (!id) return;
        navigate(`/StudentPortal/Videos`, { state: { video: lecture } });
    };

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Portalheader title="Watched Leacher" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} searchValue={searchValue} setSearchValue={setSearchValue} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
                    <div className="flex flex-col min-h-0 h-full">
                        <h2 className="text-[26px] font-bold leading-none tracking-normal">
                            Watched lecture
                        </h2>

                        {/* Stats row */}
                        <div className={`${isDark ? 'bg-[#131313]' : 'bg-white'} rounded-lg p-4 mt-4`}>
                            <div className="flex flex-col md:flex-row gap-4">
                                {stats.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={item.id}
                                            className={`${isDark ? 'bg-zinc-800' : 'bg-gray-100'} flex-1 rounded-2xl px-4 py-3 flex items-center gap-4`}
                                        >
                                            <div className="p-2">
                                                <Icon className={`${isDark ? 'text-white' : 'text-black'} w-6 h-6`} />
                                            </div>
                                            <div className="flex flex-col">
                                                <div className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'} text-sm`}>{item.label}</div>
                                                <div className={`${isDark ? 'text-white' : 'text-black'} mt-1 text-xl font-semibold`}>{item.value}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading && (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                <span className="ml-2 text-sm subText">Loading watched lectures...</span>
                            </div>
                        )}

                        {/* Error State */}
                        {error && (
                            <div className={`rounded-2xl border p-6 mt-5 flex items-center gap-3`}>
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <div>
                                    <div className="text-sm font-medium text-red-500">Error loading data</div>
                                    <div className={`text-xs ${subText} mt-1`}>{error}</div>
                                </div>
                            </div>
                        )}

                        {/* Watched lecture list */}
                        {!loading && !error && data && (
                            <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 space-y-4">
                                {filteredLectures.length === 0 ? (
                                    <div className={`p-8 text-center`}>
                                        <div className={`text-sm ${subText}`}>
                                            {searchValue.trim() ? 'No lectures found matching your search' : 'No watched lectures found'}
                                        </div>
                                    </div>
                                ) : (
                                    filteredLectures.map((lec) => (
                                        <div
                                            key={lec.id}
                                            className={`${panelBg} rounded-2xl border p-4 flex flex-col sm:flex-row gap-4 cursor-pointer`}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => openLectureVideo(lec)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    openLectureVideo(lec);
                                                }
                                            }}
                                        >
                                            <div className="relative w-full sm:w-64 h-32 sm:h-36 overflow-hidden rounded-xl shrink-0">
                                                <img
                                                    src={lec.thumb}
                                                    alt={lec.title}
                                                    className="h-full w-full object-cover"
                                                />

                                                <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[11px] px-2 py-1 rounded-md bg-black/70 text-white">
                                                    <Clock3 className="h-3 w-3" />
                                                    <span>{lec.currentTime}/{lec.duration}</span>
                                                </div>
                                            </div>

                                            <div className="flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-base font-semibold leading-snug">{lec.title}</h3>
                                                    <div className={`mt-1 text-sm ${subText}`}>{lec.chapter}</div>
                                                    <div className={`text-sm ${subText}`}>{lec.subject}</div>
                                                    <div className={`mt-3 text-xs ${subText} flex items-center gap-4`}>
                                                        <span className="inline-flex items-center gap-1 text-white">
                                                            <CalendarDays className="h-4 w-4" />
                                                            <span>
                                                                Watched Date : <span className="font-medium text-xs text-inherit">{lec.watchedDate}</span>
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 text-xs font-medium text-emerald-400">
                                                    {lec.completion}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default WatchedLeachers;