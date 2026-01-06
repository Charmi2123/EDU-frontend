
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
// import Sidebar from "../../Tools/Sidebar.jsx";
// import Header from "../../Tools/Header.jsx";
import Sidebar from "../Tools/Sidebar.jsx";
import Header from "../Tools/Header.jsx";
import { ThumbsUp, MessageSquare, Share2, Bookmark, Flag, Send, X, Reply, Info } from "lucide-react";
import axios from "axios";
// import { BACKEND_API_URL } from "../../../utils/assets.js";
import {BACKEND_API_URL} from "../../utils/assets.js";
function VideosS({ isDark, toggleTheme, sidebardata }) {
    const location = useLocation();
    const params = useParams();
    const navigate = useNavigate();
    const passedVideo = location.state?.video;
    const shellBg = isDark ? "bg-black text-[#E5E7EB]" : "bg-[#F5F7FB] text-[#0F172A]";
    const panelBg = isDark ? "bg-zinc-900 border-[#1F2430]" : "bg-white border-[#E5E7EB]";
    const subText = isDark ? "text-[#9CA3AF]" : "text-[#6B7280]";

    // API states
    const [videoData, setVideoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Format duration from seconds to MM:SS
    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };
    // Fetch video details from API
    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                // Get video ID from URL params first, then from passed video data
                const videoId = params.id || passedVideo?.id || '2'; // Default to 2 as per your example
                // displat video details API
                const response = await axios.get(
                    `${BACKEND_API_URL}/school-portal/videos/${videoId}`,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status && response.data?.data?.video) {
                    setVideoData(response.data.data.video);
                    // Set like status from API response
                    if (response.data.data.video.user_liked !== undefined) {
                        setLiked(response.data.data.video.user_liked);
                    }
                    // Set total likes from API response
                    if (response.data.data.video.total_likes !== undefined) {
                        setTotalLikes(response.data.data.video.total_likes);
                    }
                    // Set comments from API response
                    if (response.data.data.comments) {
                        const formattedComments = response.data.data.comments.map(comment => ({
                            id: comment.id,
                            name: comment.student_name || comment.enrollment_number,
                            time: new Date(comment.created_at).toLocaleDateString(),
                            text: comment.comment,
                            likes: comment.like_count,
                        }));
                        setComments(formattedComments);
                    }
                } else {
                    setError('Invalid response format');
                }
            } catch (err) {
                console.error('Failed to fetch video details:', err);
                setError(err.response?.data?.message || 'Failed to fetch video details');
            } finally {
                setLoading(false);
            }
        };

        fetchVideoDetails();
    }, [params.id, passedVideo?.id]);

    // Use only the data from API
    const pageData = useMemo(() => ({
        subjectLabel: videoData?.subject || 'Unknown Subject',
        title: videoData?.title || 'Unknown Title',
        chapter: videoData?.chapter_name || 'Unknown Chapter',
        bookName: videoData?.chapter_name || 'Unknown Chapter',
        duration: formatDuration(videoData?.duration_seconds) || '0:00',
        description: videoData?.description || 'No description available',
        highlights: videoData?.topics || [],
        // videoUrl: videoData?.video_url || "https://www.youtube.com/embed/cE-Ej1ycXtk",
        videoUrl: "https://www.youtube.com/embed/cE-Ej1ycXtk",
        thumb: videoData?.thumbnail_url || null,
        relatedVideos: videoData?.related_videos?.map(rv => ({
            id: rv.id,
            title: rv.title || 'Unknown Title',
            duration: formatDuration(rv.duration_seconds) || '0:00',
            thumb: rv.thumbnail_url || null,
            subject: rv.subject || 'Unknown Subject',
            chapter_name: rv.chapter_name || 'Unknown Chapter',
            // videoUrl:rv.video_url?.startsWith('http') ? rv.video_url : `${BACKEND_API_URL}${rv.video_url}` || '',
            videoUrl: "https://www.youtube.com/embed/cE-Ej1ycXtk",
            user_liked: rv.user_liked || false,
        })) || [],
    }), [videoData]);

    // Reset video loading when video URL changes
    useEffect(() => {
        setVideoLoading(true);
    }, [pageData.videoUrl]);
    const [showComments, setShowComments] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [liked, setLiked] = useState(false);
    const [totalLikes, setTotalLikes] = useState(0);
    const [bookmarked, setBookmarked] = useState(false);
    const [notInterested, setNotInterested] = useState(false);
    const [likedComments, setLikedComments] = useState({});
    const [likedReplies, setLikedReplies] = useState({});
    const [commentInput, setCommentInput] = useState("");
    const descRef = useRef(null);
    const [comments, setComments] = useState([]);
    const [videoLoading, setVideoLoading] = useState(true);

    // Fetch comments from API
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('No authentication token found');
                    return;
                }

                // Get video ID from params or passed video data
                const videoId = params.id || passedVideo?.id || '2';
                // GET Commenet API
                const response = await axios.get(
                    `${BACKEND_API_URL}/school-portal/videos/${videoId}/comments`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status && response.data?.data?.comments) {
                    const formattedComments = response.data.data.comments.map(comment => ({
                        id: comment.id,
                        name: comment.student_name || comment.enrollment_number,
                        time: new Date(comment.created_at).toLocaleDateString(),
                        text: comment.comment,
                        likes: comment.like_count || 0,
                    }));
                    setComments(formattedComments);
                } else {
                    console.error('Invalid response format from comments API');
                }
            } catch (err) {
                console.error('Failed to fetch comments:', err);
                // Keep default comments if API fails
            }
        };

        fetchComments();
    }, [params.id, passedVideo?.id]);

    const formatCount = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
        return String(n);
    };

    useEffect(() => {
        if (showDescription && descRef.current) {
            try {
                descRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } catch (_) {}
        }
    }, [showDescription]);

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            postComment();
        }
    };

    const postComment = async () => {
        const text = commentInput.trim();
        if (!text) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            // Get video ID from params or passed video data
            const videoId = params.id || passedVideo?.id || '2';
            // post Comment API CAll 
            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoId}/comments`,
                {
                    comment: text
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status && response.data?.data?.comment) {
                const newComment = {
                    id: response.data.data.comment.id,
                    name: response.data.data.comment.student_name || response.data.data.comment.enrollment_number,
                    time: "Just now",
                    text: response.data.data.comment.comment,
                    likes: response.data.data.comment.like_count || 0,
                };
                setComments([newComment, ...comments]);
                setCommentInput("");
            } else {
                console.error('Invalid response format from comment API');
            }
        } catch (err) {
            console.error('Failed to post comment:', err);
            // Fallback to client-side comment if API fails
            const newComment = {
                id: Date.now(),
                name: "You",
                time: "Just now",
                text,
                likes: 0,
            };
            setComments([newComment, ...comments]);
            setCommentInput("");
        }
    };

    const toggleCommentLike = (id) => {
        setLikedComments((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleVideoLike = async () => {
        // Update UI immediately for instant feedback
        const newLikedState = !liked;
        setLiked(newLikedState);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                // Revert if no token
                setLiked(!newLikedState);
                return;
            }

            // Get video ID from params or passed video data
            const videoId = params.id || passedVideo?.id || '2';

            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoId}/like`,
                {
                    liked: newLikedState
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status) {
                // Update total likes from API response if available
                if (response.data.data?.total_likes !== undefined) {
                    setTotalLikes(response.data.data.total_likes);
                } else {
                    // Fallback: update locally if API doesn't return count
                    setTotalLikes(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
                }
            } else {
                // Revert if API call fails
                setLiked(!newLikedState);
                console.error('Failed to like video');
            }
        } catch (err) {
            console.error('Failed to like video:', err);
            // Revert if API call fails
            setLiked(!newLikedState);
        }
    };

    const toggleReplyLike = (id) => {
        setLikedReplies((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-3 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="text-sm opacity-60">Loading video details...</div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-sm text-red-500">{error}</div>
                        </div>
                    ) : (
                        <div className="relative flex-1 min-h-0">
                            <div className={`w-full max-w-7xl mx-auto no-scrollbar grid gap-6 lg:grid-cols-3 h-full overflow-y-auto ${showDescription ? 'blur-sm pointer-events-none' : ''}`}>

                        {/* Left: Main Video and Meta */}
                        <div className="lg:col-span-2 space-y-4">
                            {/* Video Player */}
                            <div className="rounded-xl overflow-hidden bg-black/90">
                                <div className="relative aspect-video lg:aspect-2/1">
                                    {videoLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
                                                    <div className="w-16 h-16 border-4 border-t-white border-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                                                </div>
                                                <div className="text-white text-sm font-medium">Loading video...</div>
                                            </div>
                                        </div>
                                    )}
                                    <iframe
                                        className="absolute inset-0 w-full h-full"
                                        src={pageData.videoUrl}
                                        title="Video player"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        referrerPolicy="strict-origin-when-cross-origin"
                                        allowFullScreen
                                        onLoad={() => setVideoLoading(false)}
                                    />
                                </div>
                            </div>

                            {/* Meta Card */}
                            <div className={`border ${panelBg} rounded-xl px-4 py-3 md:px-5 md:py-2`}>
                                <span className={`inline-block text-xs px-2 py-1 rounded ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-200 text-zinc-700'} mb-2`}>{pageData.subjectLabel}</span>
                                <h2 className="text-2xl font-bold">{pageData.title}</h2>
                                <p className={`text-base ${subText} mb-4`}>{pageData.description}</p>

                                {/* Actions */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={handleVideoLike}
                                        className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md border cursor-pointer transition ${
                                            isDark
                                                ? 'border-zinc-700 hover:bg-zinc-800'
                                                : 'border-zinc-300 hover:bg-zinc-100'
                                        }`}
                                    >
                                        <ThumbsUp
                                            className={`w-4 h-4 transition-transform duration-150 group-active:scale-90 ${
                                                liked
                                                    ? (isDark ? 'text-white scale-110' : 'text-blue-600 scale-110')
                                                    : (isDark ? subText : 'text-zinc-900')
                                            }`}
                                            fill={liked ? 'currentColor' : 'none'}
                                        />
                                        <span className={`hidden sm:inline text-sm ${isDark ? '' : 'text-zinc-900'}`}>
                                            Like {totalLikes > 0 && `(${formatCount(totalLikes)})`}
                                        </span>
                                    </button>
                                    <button className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md border cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'} transition`}>
                                        <Share2 className={`w-4 h-4 ${isDark ? subText : 'text-zinc-900'}`} />
                                        <span className={`hidden sm:inline text-sm ${isDark ? '' : 'text-zinc-900'}`}>Share</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowComments(!showComments); setShowDescription(false); }}
                                        className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md border cursor-pointer transition ${showComments
                                            ? (isDark ? 'bg-zinc-200 text-zinc-900 border-transparent' : 'bg-zinc-900 text-white border-transparent')
                                            : (isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100')
                                        }`}
                                    >
                                        <MessageSquare className={`w-4 h-4 ${showComments ? '' : (isDark ? subText : 'text-zinc-900')}`} />
                                        <span className={`hidden sm:inline text-sm ${showComments ? '' : (isDark ? '' : 'text-zinc-900')}`}>Comments</span>
                                    </button>
                                    <button
                                        onClick={() => { setShowDescription(true); setShowComments(false); }}
                                        className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md border cursor-pointer transition ${showDescription
                                            ? (isDark ? 'bg-zinc-200 text-zinc-900 border-transparent' : 'bg-zinc-900 text-white border-transparent')
                                            : (isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100')
                                        }`}
                                    >
                                        <Info className={`w-4 h-4 ${showDescription ? '' : (isDark ? subText : 'text-zinc-900')}`} />
                                        <span className={`hidden sm:inline text-sm ${showDescription ? '' : (isDark ? '' : 'text-zinc-900')}`}>Description</span>
                                    </button>
                                    <button
                                        onClick={() => setNotInterested((prev) => !prev)}
                                        className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md border cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'} transition ml-auto`}
                                    >
                                        <Flag
                                            className={`w-4 h-4 transition-transform duration-150 group-active:scale-90 ${
                                                notInterested
                                                    ? (isDark ? 'text-red-500 scale-110' : 'text-red-600 scale-110')
                                                    : (isDark ? subText : 'text-zinc-900')
                                            }`}
                                            fill={notInterested ? 'currentColor' : 'none'}
                                        />
                                        <span className={`hidden sm:inline text-sm ${isDark ? '' : 'text-zinc-900'}`}>
                                            Not Interested
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setBookmarked((prev) => !prev)}
                                        className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md border cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'} transition`}
                                    >
                                        <Bookmark
                                            className={`w-4 h-4 transition-transform duration-150 group-active:scale-90 ${
                                                bookmarked
                                                    ? (isDark ? 'text-white scale-110' : 'text-blue-600 scale-110')
                                                    : (isDark ? subText : 'text-zinc-900')
                                            }`}
                                            fill={bookmarked ? 'currentColor' : 'none'}
                                        />
                                        <span className={`hidden sm:inline text-sm ${isDark ? '' : 'text-zinc-900'}`}>
                                            Bookmark
                                        </span>
                                    </button>
                                </div>

                                {/* <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} my-4`} /> */}

                                {/* Info rows */}
                                {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <div className={`text-xs ${subText} mb-1`}>Chapter Name</div>
                                        <div className="text-sm font-medium">{pageData.bookName}</div>
                                    </div>
                                    <div>
                                        <div className={`text-xs ${subText} mb-1`}>Duration</div>
                                        <div className="text-sm font-medium">{pageData.duration}</div>
                                    </div>
                                </div> */}
                            </div>


                        </div>

                        {/* Right: Related / Comments */}
                        <aside className="lg:col-span-1 mb-4 lg:mb-0">
                            {showComments ? (
                                <div className={`border ${panelBg} rounded-xl p-4 md:p-5 flex flex-col min-h-0 max-h-[88vh] lg:max-h-[83vh]`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold">Comment</h3>
                                        <button onClick={() => setShowComments(false)} className={`h-8 w-8 inline-flex items-center justify-center rounded-md border cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'} transition`} aria-label="Close comments">
                                            <X className={`w-4 h-4 ${subText}`} />
                                        </button>
                                    </div>
                                    <div className={`text-xs ${subText} mb-2`}>Join The Discussion About This Video</div>
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'} text-xs font-semibold`}>U</div>
                                        <div className="flex-1">
                                        <textarea
                                            value={commentInput}
                                            onChange={(e) => setCommentInput(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            placeholder="Add a comment...."
                                            rows={3}
                                            className={`w-full resize-none rounded-md border px-3 py-2 outline-none ${isDark ? 'bg-zinc-900 border-zinc-800 placeholder-zinc-500 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent' : 'bg-white border-zinc-300 placeholder-zinc-400 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent'}`}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end mb-3">
                                    <button onClick={postComment} className={`h-9 px-3 inline-flex items-center gap-2 rounded-md transition ${isDark ? 'bg-white text-zinc-900 border-2 border-zinc-800 hover:bg-zinc-900 hover:text-white' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'}`}>
                                        <Send className={`w-4 h-4`} />
                                        <span className="text-sm">Post Comment</span>
                                    </button>
                                </div>
                                    <div className={`text-xs ${subText} mb-2`}>{comments.length} Comment</div>
                                    <div className="flex-1 min-h-0 overflow-y-auto space-y-6 pr-1 no-scrollbar">
                                        {comments.map((c, idx) => (
                                            <div key={c.id}>
                                                <div className="flex items-start gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'} text-xs font-semibold`}>
                                                        {c.name.split(' ').map(p=>p[0]).slice(0,2).join('')}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center">
                                                            <div className="text-sm font-medium truncate">{c.name}</div>
                                                            <span className={`px-2 ${subText}`}>•</span>
                                                            <div className={`text-xs ${subText}`}>{c.time}</div>
                                                        </div>
                                                        <div className={`text-sm mt-1`}>{c.text}</div>
                                                        <div className="flex items-center mt-2 text-xs">
                                                            <button
                                                                onClick={() => toggleCommentLike(c.id)}
                                                                className={`group text-xs inline-flex items-center gap-1 transition cursor-pointer`}
                                                            >
                                                                <ThumbsUp
                                                                    className={`w-3.5 h-3.5 transition-transform duration-150 group-active:scale-90 ${
                                                                        likedComments[c.id]
                                                                            ? 'text-[#2563EB] scale-110'
                                                                            : subText
                                                                    }`}
                                                                    fill={likedComments[c.id] ? 'currentColor' : 'none'}
                                                                />
                                                                <span className={`${likedComments[c.id] ? 'text-[#2563EB]' : subText}`}>
                                                                    {formatCount(c.likes)}
                                                                </span>
                                                            </button>
                                                            <span className={`px-3 ${subText}`}>•</span>
                                                            <button className={`group text-xs inline-flex items-center gap-1`}>
                                                                <Reply className={`w-3.5 h-3.5 ${subText} group-hover:text-[#2563EB]`} />
                                                                <span className={`${subText} group-hover:text-[#2563EB]`}>Reply</span>
                                                            </button>
                                                        </div>
                                                        {c.replies && c.replies.length > 0 && (
                                                            <div className="mt-4 pl-10 space-y-4">
                                                                {c.replies.map((r) => (
                                                                    <div key={r.id} className="flex items-start gap-3">
                                                                        <div className={`h-7 w-7 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'} text-[10px] font-semibold`}>
                                                                            {r.name.split(' ').map(p=>p[0]).slice(0,2).join('')}
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="flex items-center">
                                                                                <div className="text-sm font-medium truncate">{r.name}</div>
                                                                                <span className={`px-2 ${subText}`}>•</span>
                                                                                <div className={`text-xs ${subText}`}>{r.time}</div>
                                                                            </div>
                                                                            <div className={`text-sm mt-1`}>{r.text}</div>
                                                                            <div className="flex items-center mt-2 text-xs">
                                                                                <button
                                                                                    onClick={() => toggleReplyLike(r.id)}
                                                                                    className={`group text-xs inline-flex items-center gap-1 transition cursor-pointer`}
                                                                                >
                                                                                    <ThumbsUp
                                                                                        className={`w-3.5 h-3.5 transition-transform duration-150 group-active:scale-90 ${
                                                                                            likedReplies[r.id]
                                                                                                ? 'text-[#2563EB] scale-110'
                                                                                                : subText
                                                                                        }`}
                                                                                        fill={likedReplies[r.id] ? 'currentColor' : 'none'}
                                                                                    />
                                                                                    <span className={`${likedReplies[r.id] ? 'text-[#2563EB]' : subText}`}>
                                                                                        {formatCount(r.likes)}
                                                                                    </span>
                                                                                </button>
                                                                                <span className={`px-3 ${subText}`}>•</span>
                                                                                <button className={`group text-xs inline-flex items-center gap-1`}>
                                                                                    <Reply className={`w-3.5 h-3.5 ${subText} group-hover:text-[#2563EB]`} />
                                                                                    <span className={`${subText} group-hover:text-[#2563EB]`}>Reply</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                {idx < comments.length - 1 && <div className={`mt-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={`border ${panelBg} rounded-xl p-4 md:p-5`}>
                                    <h3 className="text-sm font-semibold mb-3">Related Video</h3>
                                    <div className="space-y-3">
                                        {pageData.relatedVideos.map((rv)=> (
                                            <div key={rv.id} onClick={() => navigate(`/StudentPortal/Videos/${rv.id}`, { state: { video: rv }, replace: true })} className={`flex gap-3 items-center rounded-lg border ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-white'} p-2 cursor-pointer hover:opacity-80 transition-opacity`}>
                                                <div className="w-24 h-16 rounded-md overflow-hidden bg-zinc-800/60">
                                                    {rv.thumb ? (
                                                        <div className={`w-full h-full bg-cover bg-center`} style={{ backgroundImage: `url('${rv.thumb}')` }} />
                                                    ) : (
                                                        <div className={`w-full h-full flex items-center justify-center text-xs ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
                                                            No Image
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium truncate">{rv.title}</div>
                                                    <div className={`text-xs ${subText}`}>{rv.duration}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>
                        </div>
                        {/* Description Bottom Sheet Modal (scoped to main content) */}
                        {showDescription && (
                            <>
                                <div
                                    className={`absolute inset-0 z-40 ${isDark ? 'bg-black/50' : 'bg-black/40'} backdrop-blur-[3px]`}
                                    onClick={() => setShowDescription(false)}
                                />
                                <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center p-4">
                                    <div
                                        ref={descRef}
                                        className={`w-full max-w-7xl mx-auto border ${isDark ? 'border-[#1F2430] bg-zinc-900' : 'border-[#3B82F6] bg-white'} rounded-2xl p-6 md:p-8 lg:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transform transition-transform duration-300 translate-y-0`}
                                    >
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className={`text-xl md:text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Video Description</h3>
                                            <button onClick={() => setShowDescription(false)} className={`h-8 w-8 inline-flex items-center justify-center rounded-md border cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-200'} transition`} aria-label="Close description">
                                                <X className={`w-4 h-4 ${subText}`} />
                                            </button>
                                        </div>
                                        <div className={`text-xs uppercase tracking-wide ${subText} mb-3`}>About This Video</div>
                                        <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-200' : 'text-zinc-800'} mb-6`}>
                                            {pageData.description}
                                        </p>
                                        <div className={`text-xs uppercase tracking-wide ${subText} mb-3`}>Main Highlights</div>
                                        <ul className={`list-disc pl-6 space-y-2 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                            {pageData.highlights.map((h, idx) => (
                                                <li key={idx}>{h}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </>
                        )}
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
}

export default VideosS;


