import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ImageOff } from "lucide-react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";
import Portalheader from "../../Tools/Portalheader.jsx";

function SelectSubject({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    const [subjects, setSubjects] = useState([
        { key: "all", label: "All subject" },
    ]);

    const toFirstLetterCapital = (value) => {
        if (value === null || value === undefined) return "";
        const s = String(value).trim();
        if (!s) return "";
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    const [active, setActive] = useState("all");
    const [activeIndex, setActiveIndex] = useState(0);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const tabsWrapRef = useRef(null);
    const tabRefs = useRef([]);
    const [indicator, setIndicator] = useState({ left: 0, width: 0, top: 0, height: 0, ready: false });
    const maxPerRow = 6;
    const [imageErrors, setImageErrors] = useState({});
    const [searchValue, setSearchValue] = useState("");

    const handleImageError = (videoId) => {
        setImageErrors(prev => ({ ...prev, [videoId]: true }));
    };

    const updateIndicatorTo = (indexOrKey) => {
        const idx = typeof indexOrKey === 'number' ? indexOrKey : subjects.findIndex(s => s.key === indexOrKey);
        const el = tabRefs.current[idx];
        const wrap = tabsWrapRef.current;
        if (el && wrap) {
            const wrapRect = wrap.getBoundingClientRect();
            const rect = el.getBoundingClientRect();
            setIndicator({
                left: rect.left - wrapRect.left,
                width: rect.width,
                top: rect.top - wrapRect.top,
                height: rect.height,
                ready: true,
            });
        }
    };

    // Fetch videos from API
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(
                    `${BACKEND_API_URL}/school-portal/dashboard/videos`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status && response.data?.data?.videos) {
                    const videosData = response.data.data.videos;

                    // Generate subjects dynamically from video data
                    const uniqueSubjects = new Map();
                    videosData.forEach((video) => {
                        if (!video.subject) return;
                        const raw = String(video.subject);
                        const key = raw.toLowerCase();
                        if (!uniqueSubjects.has(key)) {
                            uniqueSubjects.set(key, { key: key, label: raw });
                        }
                    });

                    setSubjects([
                        { key: "all", label: "All subject" },
                        ...Array.from(uniqueSubjects.values()),
                    ]);

                    console.log('Generated subjects from videos:', Array.from(uniqueSubjects.values()));

                    const formattedVideos = videosData.map(video => ({
                        id: video.id,
                        subject: video.subject.toLowerCase(),
                        title: video.subject,
                        subtitle: video.title,
                        topics: [video.chapter_name, video.description?.substring(0, 50) + '...' || ''],
                        duration: formatDuration(video.duration_seconds),
                        thumb: video.thumbnail_url,
                        videoUrl: video.video_url,
                        chapter_name: video.chapter_name,
                        description: video.description,
                    }));
                    setVideos(formattedVideos);
                } else {
                    setError('Invalid response format');
                }
            } catch (err) {
                console.error('Failed to fetch videos:', err);
                setError(err.response?.data?.message || 'Failed to fetch videos');
            } finally {
                setLoading(false);
            }
        };

        fetchVideos();
    }, []);

    // Format duration from seconds to MM:SS
    const formatDuration = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        // Initialize to active tab after first render/layout
        updateIndicatorTo(activeIndex);

        // Recompute on resize
        const onResize = () => updateIndicatorTo(activeIndex);
        window.addEventListener('resize', onResize);

        // Keep indicator aligned when user scrolls horizontally
        const wrap = tabsWrapRef.current;
        const onScroll = () => updateIndicatorTo(activeIndex);
        if (wrap) wrap.addEventListener('scroll', onScroll);

        return () => {
            window.removeEventListener('resize', onResize);
            if (wrap) wrap.removeEventListener('scroll', onScroll);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeIndex, subjects.length]);

    const filtered = useMemo(() => {
        console.log('Current active filter:', active);
        console.log('Search value:', searchValue);
        console.log('Total videos:', videos.length);

        let filteredVideos = videos;

        // Filter by subject first
        if (active !== "all") {
            filteredVideos = filteredVideos.filter(v => v.subject === active.toLowerCase());
        }

        // Then filter by search value
        if (searchValue.trim()) {
            const searchLower = searchValue.toLowerCase().trim();
            filteredVideos = filteredVideos.filter(v =>
                v.title.toLowerCase().includes(searchLower) ||
                v.subtitle.toLowerCase().includes(searchLower) ||
                v.chapter_name?.toLowerCase().includes(searchLower) ||
                v.description?.toLowerCase().includes(searchLower) ||
                v.topics?.some(topic => topic.toLowerCase().includes(searchLower))
            );
        }

        console.log('Final filtered videos count:', filteredVideos.length);
        console.log('Final filtered videos:', filteredVideos.map(v => ({ title: v.title, subject: v.subject })));

        return filteredVideos;
    }, [active, videos, searchValue]);
    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-100 text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 min-w-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Portalheader title="12th Science" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} searchValue={searchValue} setSearchValue={setSearchValue} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
                    <div className="flex flex-col min-h-0 h-full">
                        <h2 className="font-bold text-[26px] leading-none tracking-normal">
                            Select Subject
                        </h2>

                        <div className="mt-4 w-full">
                            <div
                                ref={tabsWrapRef}
                                className={`${isDark ? "bg-zinc-900" : "bg-white ring-1 ring-zinc-200"
                                    } relative flex w-full rounded-full px-2 py-2 gap-12 overflow-x-auto no-scrollbar scroll-smooth`}
                            >
                                {subjects.map((s, i) => (
                                    <button
                                        key={`${s.key}-${i}`}
                                        ref={el => (tabRefs.current[i] = el)}
                                        onClick={() => { setActive(s.key); setActiveIndex(i); updateIndicatorTo(i); }}
                                        className={`relative z-10 rounded-full flex-none w-1/3 sm:w-1/4 lg:w-1/6 px-4 py-2 
text-[18px] font-inter font-semibold leading-none tracking-normal 
whitespace-nowrap select-none cursor-pointer flex items-center justify-center 
text-center snap-center transition-colors duration-150 ${isDark
                                                ? activeIndex === i
                                                    ? "bg-zinc-800 text-white"
                                                    : "text-white/80"
                                                : activeIndex === i
                                                    ? "bg-[#696cff] text-white"
                                                    : "text-zinc-800"
                                            }`}
                                    >
                                        {toFirstLetterCapital(s.label)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <h3 className="mt-6 mb-3 font-inter font-bold text-[20px] leading-none tracking-normal">
                            Video
                        </h3>


                        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1">
                            {loading ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                        <div className="text-sm opacity-60">Loading videos...</div>
                                    </div>
                                </div>
                            ) : error ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm text-red-500">{error}</div>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="flex items-center justify-center h-32">
                                    <div className="text-sm opacity-60">No videos found for this subject</div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-6">
                                    {filtered.map((item) => (
                                        <div key={item.id} className={`${isDark ? "bg-zinc-900" : "bg-white"} rounded-xl overflow-hidden border ${isDark ? "border-zinc-800" : "border-zinc-200"}`}>
                                            <div className="relative aspect-16/10 overflow-hidden cursor-pointer" onClick={() => navigate('/StudentPortal/Videos', { state: { video: item } })}>
                                                {imageErrors[item.id] || !item.thumb ? (
                                                    <div className={`h-full w-full flex flex-col items-center justify-center ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                                        <ImageOff className={`w-8 h-8 ${isDark ? 'text-zinc-600' : 'text-zinc-400'} mb-2`} />
                                                        <span className={`text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>No Image</span>
                                                    </div>
                                                ) : (
                                                    <img
                                                        src={item.thumb}
                                                        alt={item.title}
                                                        className="h-full w-full object-cover"
                                                        onError={() => handleImageError(item.id)}
                                                    />
                                                )}
                                                <div className="absolute inset-0 bg-black/30" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        className="h-14 w-14 rounded-full bg-[#4A4A4A] backdrop-blur flex cursor-pointer items-center justify-center"
                                                    >
                                                        <img src={getAsset('videolist_dark')} alt="play" className="h-6 w-6 pointer-events-none" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="text-white font-inter font-bold text-[16px] leading-none tracking-normal capitalize mb-2">{item.title}</div>
                                                <div className="mt-1 font-inter font-medium text-[14px] leading-none tracking-normal capitalize mb-2">{item.subtitle}</div>
                                                <div className="mt-2 font-inter font-normal text-[12px] leading-none tracking-normal capitalize opacity-80 mb-2">{item.topics[0]}</div>
                                                <div className="mt-2 font-inter font-normal text-[10px] leading-none tracking-normal capitalize opacity-80 mb-2">{item.topics[1]?.substring(0, 30)}...</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
}

export default SelectSubject;