
import React, { useEffect, useRef, useState, useMemo } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import Sidebar from "../../Tools/Sidebar.jsx";
import Portalheader from "../../Tools/Portalheader.jsx";
import { ThumbsUp, MessageSquare, Share2, Bookmark, Flag, Send, X, Reply, Info, Settings, RotateCcw, RotateCw, Volume, Gauge, Monitor, Volume2, VolumeX, Maximize, Play, RefreshCw, RefreshCcw, Settings2 } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, getAsset } from "../../../utils/assets.js";

function Videos({ isDark, toggleTheme, sidebardata }) {
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
    const [totalLikes, setTotalLikes] = useState(0);

    // Video control states
    const [showSettings, setShowSettings] = useState(false);
    const [currentSettingsView, setCurrentSettingsView] = useState('main'); // 'main', 'speed', 'quality'
    const [isLoop, setIsLoop] = useState(false);
    const [isStableVolume, setIsStableVolume] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [quality, setQuality] = useState('auto');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [videoInitialized, setVideoInitialized] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [canPlayVideo, setCanPlayVideo] = useState(false);
    const [progressKey, setProgressKey] = useState(0); // Force progress bar re-render
    const videoRef = useRef(null);
    const currentVideoIdRef = useRef(null);
    const watchSessionRef = useRef(null);
    const lifetimeMaxProgressRef = useRef(0);

    // Format duration from seconds to MM:SS
    const formatDuration = (seconds) => {
        if (!seconds) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    // Send watch progress to backend (in seconds)
    const sendWatchProgress = async (videoId, incrementSeconds, videoDurationSeconds) => {
        try {
            if (!incrementSeconds || incrementSeconds <= 0) return;

            const token = localStorage.getItem("token");
            if (!token) return;

            if (!videoId) return;

            const payload = { watch_seconds: Math.floor(incrementSeconds) };
            if (videoDurationSeconds && videoDurationSeconds > 0) {
                payload.duration_seconds = Math.floor(videoDurationSeconds);
            }

            await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoId}/watch`,
                payload,
                {
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
        } catch (err) {
            console.error("Failed to record watch progress:", err);
        }
    };

    const toFirstLetterCapital = (value) => {
        if (value === null || value === undefined) return "";
        const s = String(value).trim();
        if (!s) return "";
        return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    };

    // Fetch video details from API (same as Trash/Videos.jsx)
    useEffect(() => {
        const fetchVideoDetails = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("No authentication token found");
                    setLoading(false);
                    return;
                }

                const videoId = params.id || passedVideo?.id || "2";
                currentVideoIdRef.current = videoId;
                lifetimeMaxProgressRef.current = 0;

                const response = await axios.get(
                    `${BACKEND_API_URL}/school-portal/videos/${videoId}`,
                    {
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status && response.data?.data?.video) {
                    const apiVideo = response.data.data.video;
                    const existingWatchSeconds = Number(
                        apiVideo.user_watch_duration_seconds ??
                        apiVideo.watch_duration_seconds ??
                        0
                    );
                    lifetimeMaxProgressRef.current = Number.isFinite(existingWatchSeconds) && existingWatchSeconds > 0
                        ? Math.floor(existingWatchSeconds)
                        : 0;
                    setVideoData(apiVideo);

                    if (apiVideo.user_liked !== undefined) {
                        setLiked(apiVideo.user_liked);
                    }

                    if (apiVideo.total_likes !== undefined) {
                        setTotalLikes(apiVideo.total_likes);
                    }

                    if (apiVideo.user_subscribed !== undefined) {
                        setBookmarked(apiVideo.user_subscribed);
                    }

                    if (response.data.data.comments) {
                        const formattedComments = response.data.data.comments.map((comment) => ({
                            id: comment.id,
                            name: comment.student_name || comment.enrollment_number,
                            time: new Date(comment.created_at).toLocaleDateString(),
                            text: comment.comment,
                            likes: comment.like_count || 0,
                        }));
                        setComments(formattedComments);
                    }
                } else {
                    setError("Invalid response format");
                }
            } catch (err) {
                console.error("Failed to fetch video details:", err);
                setError(err.response?.data?.message || "Failed to fetch video details");
            } finally {
                setLoading(false);
            }
        };

        fetchVideoDetails();
    }, [params.id, passedVideo?.id]);

    // Fetch comments from API (same as Trash/Videos.jsx)
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("No authentication token found");
                    return;
                }

                const videoId = params.id || passedVideo?.id || "2";

                const response = await axios.get(
                    `${BACKEND_API_URL}/school-portal/videos/${videoId}/comments`,
                    {
                        headers: {
                            accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status && response.data?.data?.comments) {
                    const formattedComments = response.data.data.comments.map((comment) => ({
                        id: comment.id,
                        name: comment.student_name || comment.enrollment_number,
                        time: new Date(comment.created_at).toLocaleDateString(),
                        text: comment.comment,
                        likes: comment.like_count || 0,
                    }));
                    setComments(formattedComments);
                } else {
                    console.error("Invalid response format from comments API");
                }
            } catch (err) {
                console.error("Failed to fetch comments:", err);
            }
        };

        fetchComments();
    }, [params.id, passedVideo?.id]);

    // Build page data from API response with graceful fallback
    const pageData = useMemo(() => {
        const defaultVideoUrl = "/lecture-1764833360871.webm";

        if (!videoData) {
            return {
                subjectLabel: "Music",
                title: "Namo Namo - Lyrical Video",
                chapter: "Devotional Songs",
                bookName: "Devotional Songs Collection",
                duration: "4:30",
                description:
                    "A beautiful devotional song with meaningful lyrics and soothing music.",
                highlights: ["Devotional Music", "Spiritual Content", "Peaceful Melody"],
                videoUrl: defaultVideoUrl,
                thumb:
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa27?q=80&w=400&auto=format&fit=crop",
                relatedVideos: [],
            };
        }

        // Handle both full URLs and relative paths
        let videoUrl = videoData.video_url || defaultVideoUrl;
        if (videoUrl && !videoUrl.startsWith('http') && !videoUrl.startsWith('/')) {
            videoUrl = `/${videoUrl}`;
        }

        return {
            subjectLabel: videoData.subject || "Unknown Subject",
            title: videoData.title || "Unknown Title",
            chapter: videoData.chapter_name || "Unknown Chapter",
            bookName: videoData.chapter_name || "Unknown Chapter",
            duration: formatDuration(videoData.duration_seconds) || "0:00",
            description: videoData.description || "No description available",
            highlights: videoData.topics || [],
            videoUrl: videoUrl,
            thumb: videoData.thumbnail_url || null,
            relatedVideos:
                videoData.related_videos?.map((rv) => ({
                    id: rv.id,
                    title: rv.title || "Unknown Title",
                    duration: formatDuration(rv.duration_seconds) || "0:00",
                    thumb: rv.thumbnail_url || null,
                    subject: rv.subject || "Unknown Subject",
                    chapter_name: rv.chapter_name || "Unknown Chapter",
                    videoUrl: rv.video_url || defaultVideoUrl,
                    user_liked: rv.user_liked || false,
                })) || [],
        };
    }, [videoData]);

    // Video control functions
    const toggleLoop = () => {
        if (videoRef.current) {
            videoRef.current.loop = !isLoop;
            setIsLoop(!isLoop);
        }
    };

    const toggleStableVolume = () => {
        setIsStableVolume(!isStableVolume);
        // Implement stable volume logic here
    };

    const changePlaybackSpeed = (speed) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };

    const changeQuality = (newQuality) => {
        setQuality(newQuality);
        // Implement quality change logic here
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            const video = videoRef.current;

            if (!isFullscreen) {
                // YouTube-style mobile fullscreen
                if (video.webkitEnterFullscreen) {
                    // iOS Safari - native video fullscreen
                    video.webkitEnterFullscreen();
                } else if (video.requestFullscreen) {
                    // Standard fullscreen API
                    video.requestFullscreen().then(() => {
                        // Try to lock orientation to landscape on mobile
                        if (screen.orientation && screen.orientation.lock) {
                            screen.orientation.lock('landscape').catch(() => { });
                        }
                    }).catch(() => {
                        // Fallback for mobile
                        if (video.webkitEnterFullscreen) {
                            video.webkitEnterFullscreen();
                        }
                    });
                } else if (video.webkitRequestFullscreen) {
                    video.webkitRequestFullscreen();
                } else if (video.mozRequestFullScreen) {
                    video.mozRequestFullScreen();
                } else if (video.msRequestFullscreen) {
                    video.msRequestFullscreen();
                }
            } else {
                // Exit fullscreen
                if (video.webkitExitFullscreen) {
                    video.webkitExitFullscreen();
                } else if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }

                // Unlock orientation when exiting fullscreen
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock().catch(() => { });
                }
            }
        }
    };

    const handleVideoKeyPress = (e) => {
        const video = videoRef.current;
        if (!video) return;
        
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                handleVideoClick();
                break;
            case 'arrowleft':
                e.preventDefault();
                skipBackward();
                break;
            case 'arrowright':
                e.preventDefault();
                skipForward();
                break;
            case 'j':
                e.preventDefault();
                video.currentTime = Math.max(video.currentTime - 10, 0);
                break;
            case 'l':
                e.preventDefault();
                video.currentTime = Math.min(video.currentTime + 10, duration);
                break;
            case 'm':
                e.preventDefault();
                toggleMute();
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'c':
                e.preventDefault();
                toggleCaptions();
                break;
        }
    };

    const skipForward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);
        }
    };

    const skipBackward = () => {
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
        }
    };

    // YouTube-style video controls
    const handleVideoClick = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                // Reset to beginning only if video has ended
                if (currentTime >= duration || videoRef.current.ended) {
                    videoRef.current.currentTime = 0;
                    setCurrentTime(0);
                    setProgressKey(prev => prev + 1);
                }
                // Ensure no other videos are playing
                const allVideos = document.querySelectorAll('video');
                allVideos.forEach(v => {
                    if (v !== videoRef.current) {
                        v.pause();
                    }
                });
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const togglePlayPause = () => {
        handleVideoClick();
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    // YouTube-style captions toggle
    const toggleCaptions = () => {
        // Placeholder for captions functionality
        console.log('Captions toggle - not implemented yet');
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Smooth progress update with debounce for visual updates
    const progressUpdateRef = useRef(null);
    const updateProgressSmoothly = (time) => {
        if (progressUpdateRef.current) {
            cancelAnimationFrame(progressUpdateRef.current);
        }
        progressUpdateRef.current = requestAnimationFrame(() => {
            setCurrentTime(time);
        });
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            if (video && !isNaN(video.currentTime)) {
                updateProgressSmoothly(video.currentTime);
                const session = watchSessionRef.current;
                if (session) {
                    const currentPos = video.currentTime || 0;
                    const currentMax = session.sessionMaxPosition ?? session.sessionStartPosition ?? 0;
                    session.sessionMaxPosition = Math.max(currentMax, currentPos);
                }
            }
        };
        
        const updateDuration = () => {
            if (video && !isNaN(video.duration) && video.duration > 0) {
                setDuration(video.duration);
            }
        };
        
        const sendWatchIfAny = () => {
            const session = watchSessionRef.current;
            if (!session) return;
            const elapsedMs = Date.now() - session.startedAt;
            watchSessionRef.current = null;
            const elapsedSeconds = Math.floor(elapsedMs / 1000);
            const baseline = Math.max(
                Math.floor(session.initialLifetime ?? 0),
                Math.floor(session.sessionStartPosition ?? 0),
            );
            const sessionPeak = Math.floor(session.sessionMaxPosition ?? baseline);
            const uniqueGain = Math.max(0, sessionPeak - baseline);
            if (uniqueGain > 0) {
                lifetimeMaxProgressRef.current += uniqueGain;
                if (video && !Number.isNaN(video.duration) && video.duration > 0) {
                    lifetimeMaxProgressRef.current = Math.min(
                        lifetimeMaxProgressRef.current,
                        Math.floor(video.duration)
                    );
                }
                // Fire and forget; no need to block UI
                const reportedDuration =
                    video && !isNaN(video.duration) && video.duration > 0
                        ? Math.round(video.duration)
                        : undefined;
                sendWatchProgress(session.videoId, uniqueGain, reportedDuration);
            }
        };

        const handlePlay = () => {
            setIsPlaying(true);
            // Start a new watch window for the currently loaded video id
            const videoId = currentVideoIdRef.current;
            if (videoId) {
                const startPosition = video && !isNaN(video.currentTime) ? video.currentTime : 0;
                watchSessionRef.current = {
                    startedAt: Date.now(),
                    videoId,
                    sessionStartPosition: startPosition,
                    sessionMaxPosition: startPosition,
                    initialLifetime: lifetimeMaxProgressRef.current,
                };
            }
        };

        const handlePause = () => {
            setIsPlaying(false);
            // On pause, flush watched time to backend
            sendWatchIfAny();
        };
        const handleEnded = () => {
            setIsPlaying(false);
            // On end, flush any remaining watched time
            sendWatchIfAny();
            // Force complete reset when video ends
            if (video && videoInitialized) {
                video.currentTime = 0;
                setCurrentTime(0);
                // Force progress bar complete reset
                setProgressKey(prev => prev + 1);
                // Multiple resets to ensure clean state
                setTimeout(() => {
                    if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        setCurrentTime(0);
                        setProgressKey(prev => prev + 1);
                    }
                }, 10);
                setTimeout(() => {
                    setCurrentTime(0);
                    setProgressKey(prev => prev + 1);
                }, 25);
            }
        };
        const handleLoadedData = () => {
            if (video && !isNaN(video.duration) && video.duration > 0) {
                setDuration(video.duration);
                // Mark video as initialized only on first load
                if (!videoInitialized) {
                    setVideoInitialized(true);
                    setCurrentTime(0);
                }
            }
        };
        const handleCanPlay = () => {
            setIsVideoLoading(false);
            setCanPlayVideo(true);
        };
        const handleLoadStart = () => {
            setIsVideoLoading(true);
            setCanPlayVideo(false);
        };
        const handleError = (e) => {
            console.error('Video error:', e);
            setIsVideoLoading(false);
            setCanPlayVideo(false);
            // Try to reload video on error
            if (video.src) {
                video.load();
            }
        };

        // Use requestAnimationFrame for smoother updates
        let animationId;
        const smoothUpdate = () => {
            if (video && !video.paused && !video.ended) {
                updateTime();
                animationId = requestAnimationFrame(smoothUpdate);
            }
        };

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('canplay', updateDuration);
        video.addEventListener('error', handleError);
        video.addEventListener('play', () => {
            animationId = requestAnimationFrame(smoothUpdate);
        });
        video.addEventListener('pause', () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        });

        return () => {
            // Component unmount / url change: flush any remaining watch time
            sendWatchIfAny();
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('canplay', updateDuration);
            video.removeEventListener('error', handleError);
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
        };
    }, [pageData.videoUrl]);

    // Fullscreen event listeners for YouTube-style behavior
    useEffect(() => {
        const handleFullscreenChange = () => {
            const isCurrentlyFullscreen = !!(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(isCurrentlyFullscreen);
        };

        const handleWebkitFullscreenChange = () => {
            setIsFullscreen(!!document.webkitFullscreenElement);
        };

        const handleVideoFullscreen = () => {
            setIsFullscreen(true);
        };

        const handleVideoExitFullscreen = () => {
            setIsFullscreen(false);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleWebkitFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        // Video specific events for iOS Safari
        if (videoRef.current) {
            const video = videoRef.current;
            video.addEventListener('webkitbeginfullscreen', handleVideoFullscreen);
            video.addEventListener('webkitendfullscreen', handleVideoExitFullscreen);
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleWebkitFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

            if (videoRef.current) {
                const video = videoRef.current;
                video.removeEventListener('webkitbeginfullscreen', handleVideoFullscreen);
                video.removeEventListener('webkitendfullscreen', handleVideoExitFullscreen);
            }
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        if (video && pageData.videoUrl) {
            // Stop any currently playing video
            video.pause();
            video.currentTime = 0;
            
            // Reset video states when URL changes
            setCurrentTime(0);
            setDuration(0);
            setIsPlaying(false);
            setVideoInitialized(false);
            
            // Load new video
            video.load();
        }
    }, [pageData.videoUrl]);

    // Global video management - ensure only one video plays at a time
    useEffect(() => {
        // Pause all videos when component unmounts or when navigating away
        return () => {
            const video = videoRef.current;
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        };
    }, []);

    // Stop video when leaving the page
    useEffect(() => {
        const handleBeforeUnload = () => {
            const video = videoRef.current;
            if (video) {
                video.pause();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            handleVideoKeyPress(e);
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFullscreen]);

    const closeSettings = () => {
        setShowSettings(false);
        setCurrentSettingsView('main');
    };

    const toggleFullscreenAndCloseSettings = () => {
        const wasSettingsOpen = showSettings;
        if (wasSettingsOpen) {
            setShowSettings(false);
            setCurrentSettingsView('main');
        }
        toggleFullscreen();
    };
    const [showComments, setShowComments] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [liked, setLiked] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    // const [notInterested, setNotInterested] = useState(false); // Commented out - Not Interested functionality
    const [likedComments, setLikedComments] = useState({});
    const [likedReplies, setLikedReplies] = useState({});
    const [commentInput, setCommentInput] = useState("");
    const descRef = useRef(null);
    const [comments, setComments] = useState([]);

    const formatCount = (n) => {
        if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
        if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "k";
        return String(n);
    };

    useEffect(() => {
        if (showDescription && descRef.current) {
            try {
                descRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            } catch (_) { }
        }
    }, [showDescription]);

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            postComment();
        }
    };

    const postComment = async () => {
        const text = commentInput.trim();
        if (!text) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                return;
            }

            const videoId = params.id || passedVideo?.id || "2";

            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoId}/comments`,
                {
                    comment: text,
                },
                {
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status && response.data?.data?.comment) {
                const newComment = {
                    id: response.data.data.comment.id,
                    name:
                        response.data.data.comment.student_name ||
                        response.data.data.comment.enrollment_number,
                    time: "Just now",
                    text: response.data.data.comment.comment,
                    likes: response.data.data.comment.like_count || 0,
                };
                setComments([newComment, ...comments]);
                setCommentInput("");
            } else {
                console.error("Invalid response format from comment API");
            }
        } catch (err) {
            console.error("Failed to post comment:", err);
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
        const newLikedState = !liked;
        setLiked(newLikedState);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                setLiked(!newLikedState);
                return;
            }

            const videoId = params.id || passedVideo?.id || "2";

            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoId}/like`,
                {
                    liked: newLikedState,
                },
                {
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status) {
                if (response.data.data?.total_likes !== undefined) {
                    setTotalLikes(response.data.data.total_likes);
                } else {
                    setTotalLikes((prev) =>
                        newLikedState ? prev + 1 : Math.max(0, prev - 1)
                    );
                }
            } else {
                setLiked(!newLikedState);
                console.error("Failed to like video");
            }
        } catch (err) {
            console.error("Failed to like video:", err);
            setLiked(!newLikedState);
        }
    };

    const handleBookmarkToggle = async () => {
        const newBookmarkedState = !bookmarked;
        setBookmarked(newBookmarkedState);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No authentication token found");
                setBookmarked(!newBookmarkedState);
                return;
            }

            const videoId = params.id || passedVideo?.id || "2";

            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/videos/${videoId}/subscribe`,
                {
                    subscribed: newBookmarkedState,
                },
                {
                    headers: {
                        accept: "application/json",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status) {
                // Bookmark successfully updated
                console.log("Video subscription status updated:", response.data.message);
            } else {
                setBookmarked(!newBookmarkedState);
                console.error("Failed to update bookmark status");
            }
        } catch (err) {
            console.error("Failed to update bookmark:", err);
            setBookmarked(!newBookmarkedState);
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
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 px-0 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20 transition-all duration-300">
                    <Portalheader title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-4 md:mt-6 flex-1 flex flex-col min-h-0 px-4 md:px-8">
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
                            <div className={`w-full max-w-7xl mx-auto no-scrollbar grid gap-4 md:gap-6 lg:grid-cols-3 h-full overflow-y-auto ${showDescription ? 'pointer-events-none' : ''}`}>

                                {/* Left: Main Video and Meta */}
                                <div className="lg:col-span-2 space-y-3 md:space-y-4">
                                    {/* Video Player - Modified for local video with custom controls */}
                                    <div className="rounded-xl overflow-hidden bg-black/90">
                                        <div className="relative aspect-video lg:aspect-2/1 group">
                                            <video
                                                ref={videoRef}
                                                className="absolute inset-0 w-full h-full cursor-pointer"
                                                autoPlay
                                                controls={false}
                                                controlsList="nodownload noplaybackrate noremoteplayback"
                                                disablePictureInPicture
                                                playsInline
                                                webkit-playsinline="true"
                                                x-webkit-airplay="allow"
                                                preload="metadata"
                                                onClick={handleVideoClick}
                                            >
                                                <source src={pageData.videoUrl} type="video/webm" />
                                                <source src={pageData.videoUrl} type="video/mp4" />
                                                Your browser does not support the video tag.
                                            </video>

                                            {/* Loading Spinner */}
                                            {isVideoLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-12 h-12 border-3 border-zinc-300 border-t-white rounded-full animate-spin"></div>
                                                        <div className="text-sm text-white opacity-80">Loading video...</div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Center Controls - YouTube Style: Skip Back, Play/Pause, Skip Forward */}
                                            {canPlayVideo && (
                                                <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-200 ${isFullscreen ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                                                    }`}>
                                                <div className="flex items-center justify-center gap-4 sm:gap-6 md:gap-8 lg:gap-12 max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px] w-full px-4">
                                                    {/* Skip Backward Button */}
                                                    <div
                                                        className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center pointer-events-auto shrink-0"
                                                        title="Skip backward 10 seconds"
                                                        onClick={() => { skipBackward(); closeSettings(); }}
                                                    >
                                                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                                                            <RotateCcw className="w-full h-full text-white" />
                                                            <span className="text-white text-[8px] sm:text-[10px] md:text-xs font-bold absolute">10</span>
                                                        </div>
                                                    </div>

                                                    {/* Play/Pause Button */}
                                                    <div
                                                        className="bg-zinc-800/70 rounded-full p-2 sm:p-3 md:p-4 cursor-pointer pointer-events-auto hover:bg-zinc-900/80 transition-colors shrink-0"
                                                        onClick={() => { togglePlayPause(); closeSettings(); }}
                                                    >
                                                        {isPlaying ? (
                                                            <svg className=" w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <rect x="6" y="4" width="3" height="12" />
                                                                <rect x="11" y="4" width="3" height="12" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M5 4v12l10-6z" />
                                                            </svg>
                                                        )}
                                                    </div>

                                                    {/* Skip Forward Button */}
                                                    <div
                                                        className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center pointer-events-auto shrink-0"
                                                        title="Skip forward 10 seconds"
                                                        onClick={() => { skipForward(); closeSettings(); }}
                                                    >
                                                        <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center">
                                                            <RotateCw className="w-full h-full text-white" />
                                                            <span className="text-white text-[8px] sm:text-[10px] md:text-xs font-bold absolute">10</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                </div>
                                            )}

                                            {/* Custom Controls Overlay */}
                                            {canPlayVideo && (
                                                <div className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 to-transparent px-2 py-2 sm:px-3 sm:py-3 md:px-4 md:py-4 transition-opacity duration-200 ${isFullscreen ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
                                                    }`}>
                                                {/* Progress Bar */}
                                                <div className="mb-2 sm:mb-3">
                                                    <div className="relative w-full h-1 bg-zinc-600 rounded-full overflow-hidden">
                                                        <div 
                                                            key={progressKey}
                                                            className="absolute left-0 top-0 h-full bg-white rounded-full progress-fill transition-all duration-0 ease-linear"
                                                            style={{ 
                                                                width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                                                                transform: currentTime === 0 ? 'scaleX(0)' : 'scaleX(1)',
                                                                transformOrigin: 'left'
                                                            }}
                                                        />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={duration || 100}
                                                            value={currentTime}
                                                            onChange={(e) => { handleSeek(e); closeSettings(); }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between gap-1 sm:gap-2">
                                                    {/* Left controls */}
                                                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0">
                                                        <button
                                                            onClick={() => { toggleMute(); closeSettings(); }}
                                                            className="p-1 sm:p-1.5 md:p-2 rounded hover:bg-white/20 text-white transition shrink-0 cursor-pointer"
                                                            title={isMuted ? 'Unmute' : 'Mute'}
                                                        >
                                                            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                                        </button>
                                                        <button
                                                            onClick={() => { togglePlayPause(); closeSettings(); }}
                                                            className="p-1 sm:p-1.5 md:p-2 rounded hover:bg-white/20 text-white transition relative z-30 shrink-0 cursor-pointer"
                                                        >
                                                            {isPlaying ? (
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <rect x="6" y="4" width="3" height="12" />
                                                                    <rect x="11" y="4" width="3" height="12" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path d="M5 4v12l10-6z" />
                                                                </svg>
                                                            )}
                                                        </button>
                                                        <span className="text-xs sm:text-sm text-white whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</span>
                                                    </div>

                                                    {/* Right controls */}
                                                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setShowSettings(!showSettings)}
                                                                className="p-1 sm:p-1.5 md:p-2 rounded hover:bg-white/20 text-white transition cursor-pointer"
                                                                title="Settings"
                                                            >
                                                                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                                                            </button>

                                                            {/* Settings Menu */}
                                                            {showSettings && (
                                                                <>
                                                                {/* Mobile Settings Menu */}
                                                                <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setShowSettings(false)}></div>
                                                                <div className="fixed bottom-2 left-2 right-2 w-auto rounded-2xl border border-zinc-700 bg-zinc-900 shadow-lg z-50 sm:hidden"
                                                                     onClick={(e) => e.stopPropagation()}>
                                                                    {currentSettingsView === 'main' && (
                                                                        <>
                                                                            {/* Loop Video Toggle */}
                                                                            <div className="flex items-center justify-between p-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <img src={getAsset('loop_video')} alt="Loop Video" className="w-4 h-4" />
                                                                                    <span className="text-sm font-medium text-zinc-200">Loop Video</span>
                                                                                </div>
                                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        value=""
                                                                                        className="sr-only peer"
                                                                                        checked={isLoop}
                                                                                        onChange={toggleLoop}
                                                                                    />
                                                                                    <div className="w-9 h-5 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-gray-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-black after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                                                                                </label>
                                                                            </div>

                                                                            {/* Stable Volume Toggle */}
                                                                            <div className="flex items-center justify-between p-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    
                                                                                    <Volume2 className="w-5 h-5 text-white"/>
                                                                                    <span className="text-sm font-medium text-zinc-200">Stable Volume</span>
                                                                                </div>
                                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        value=""
                                                                                        className="sr-only peer"
                                                                                        checked={isStableVolume}
                                                                                        onChange={toggleStableVolume}
                                                                                    />
                                                                                    <div className="w-9 h-5 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-gray-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-black after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                                                                                </label>
                                                                            </div>

                                                                            
                                                                            {/* Playback Speed Option */}
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('speed')}
                                                                                className="flex items-center justify-between w-full rounded-md p-3 text-sm font-medium text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <img src={getAsset('playvideospeed')} alt="Playback Speed" className="w-4 h-4" />
                                                                                    <span>Playback Speed</span>
                                                                                </div>
                                                                                <span className="text-zinc-400">{playbackSpeed}x</span>
                                                                            </button>

                                                                            
                                                                            {/* Quality Option */}
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('quality')}
                                                                                className="flex items-center justify-between w-full rounded-md p-3 text-sm font-medium text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <Settings2 className="w-5 h-5"/>
                                                                                    <span>Quality</span>
                                                                                </div>
                                                                                <span className="text-zinc-400 capitalize">{quality}</span>
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    {currentSettingsView === 'speed' && (
                                                                        <div className="p-3 max-h-[165px] overflow-y-auto no-scrollbar">
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('main')}
                                                                                className="flex items-center gap-2 mb-2 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                                                </svg>
                                                                                Playback Speed
                                                                            </button>
                                                                            <div className="space-y-1">
                                                                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                                                    <button
                                                                                        key={speed}
                                                                                        onClick={() => {
                                                                                            changePlaybackSpeed(speed);
                                                                                            setShowSettings(false);
                                                                                            setCurrentSettingsView('main');
                                                                                        }}
                                                                                        className={`w-full text-left px-3 py-2 rounded text-sm cursor-pointer ${playbackSpeed === speed ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                                                                                    >
                                                                                        {speed}x
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {currentSettingsView === 'quality' && (
                                                                        <div className="p-3 max-h-[165px] overflow-y-auto no-scrollbar">
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('main')}
                                                                                className="flex items-center gap-2 mb-2 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                                                </svg>
                                                                                Quality
                                                                            </button>
                                                                            <div className="space-y-1">
                                                                                {['auto', '1080p', '720p', '480p', '360p'].map(q => (
                                                                                    <button
                                                                                        key={q}
                                                                                        onClick={() => {
                                                                                            changeQuality(q);
                                                                                            setShowSettings(false);
                                                                                            setCurrentSettingsView('main');
                                                                                        }}
                                                                                        className={`w-full text-left px-3 py-2 rounded text-sm capitalize cursor-pointer ${quality === q ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                                                                                    >
                                                                                        {q}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Desktop Settings Menu */}
                                                                <div className="absolute bottom-full right-0 mb-7 w-50 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-lg z-50 max-sm:hidden">
                                                                    {currentSettingsView === 'main' && (
                                                                        <>
                                                                            {/* Loop Video Toggle */}
                                                                            <div className="flex items-center justify-between p-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <img src={getAsset('loop_video')} alt="Loop Video" className="w-4 h-4" />
                                                                                    <span className="text-sm font-medium text-zinc-200">Loop Video</span>
                                                                                </div>
                                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        value=""
                                                                                        className="sr-only peer"
                                                                                        checked={isLoop}
                                                                                        onChange={toggleLoop}
                                                                                    />
                                                                                    <div className="w-9 h-5 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-gray-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-black after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                                                                                </label>
                                                                            </div>

                                                                            {/* Stable Volume Toggle */}
                                                                            <div className="flex items-center justify-between p-3">
                                                                                <div className="flex items-center gap-3">
                                                                                    
                                                                                    <Volume2 className="w-5 h-5 text-white"/>
                                                                                    <span className="text-sm font-medium text-zinc-200">Stable Volume</span>
                                                                                </div>
                                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        value=""
                                                                                        className="sr-only peer"
                                                                                        checked={isStableVolume}
                                                                                        onChange={toggleStableVolume}
                                                                                    />
                                                                                    <div className="w-9 h-5 bg-gray-500 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-gray-300 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-black after:border-transparent after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-white"></div>
                                                                                </label>
                                                                            </div>

                                                                            
                                                                            {/* Playback Speed Option */}
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('speed')}
                                                                                className="flex items-center justify-between w-full rounded-md p-3 text-sm font-medium text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <img src={getAsset('playvideospeed')} alt="Playback Speed" className="w-4 h-4" />
                                                                                    <span>Playback Speed</span>
                                                                                </div>
                                                                                <span className="text-zinc-400">{playbackSpeed}x</span>
                                                                            </button>

                                                                            
                                                                            {/* Quality Option */}
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('quality')}
                                                                                className="flex items-center justify-between w-full rounded-md p-3 text-sm font-medium text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <div className="flex items-center gap-2">
                                                                                    <Settings2 className="w-5 h-5"/>
                                                                                    <span>Quality</span>
                                                                                </div>
                                                                                <span className="text-zinc-400 capitalize">{quality}</span>
                                                                            </button>
                                                                        </>
                                                                    )}

                                                                    {currentSettingsView === 'speed' && (
                                                                        <div className="p-3 max-h-[165px] overflow-y-auto no-scrollbar">
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('main')}
                                                                                className="flex items-center gap-2 mb-2 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                                                </svg>
                                                                                Playback Speed
                                                                            </button>
                                                                            <div className="space-y-1">
                                                                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                                                    <button
                                                                                        key={speed}
                                                                                        onClick={() => {
                                                                                            changePlaybackSpeed(speed);
                                                                                            setShowSettings(false);
                                                                                            setCurrentSettingsView('main');
                                                                                        }}
                                                                                        className={`w-full text-left px-3 py-2 rounded text-sm cursor-pointer ${playbackSpeed === speed ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                                                                                    >
                                                                                        {speed}x
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {currentSettingsView === 'quality' && (
                                                                        <div className="p-3 max-h-[165px] overflow-y-auto no-scrollbar">
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('main')}
                                                                                className="flex items-center gap-2 mb-2 text-sm text-zinc-400 hover:text-zinc-200 cursor-pointer"
                                                                            >
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                                                </svg>
                                                                                Quality
                                                                            </button>
                                                                            <div className="space-y-1">
                                                                                {['auto', '1080p', '720p', '480p', '360p'].map(q => (
                                                                                    <button
                                                                                        key={q}
                                                                                        onClick={() => {
                                                                                            changeQuality(q);
                                                                                            setShowSettings(false);
                                                                                            setCurrentSettingsView('main');
                                                                                        }}
                                                                                        className={`w-full text-left px-3 py-2 rounded text-sm capitalize cursor-pointer ${quality === q ? 'bg-zinc-600 text-white' : 'text-zinc-300'}`}
                                                                                    >
                                                                                        {q}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                </>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={toggleFullscreenAndCloseSettings}
                                                            className="p-1 sm:p-1.5 md:p-2 rounded hover:bg-white/20 text-white transition cursor-pointer"
                                                            title="Fullscreen"
                                                        >
                                                            <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                                                        </button>
                                                    </div>
                                                </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Meta Card */}
                                    <div className={`border ${panelBg} rounded-xl px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-2`}>
                                        <span className={`inline-block text-xs px-2 py-1 rounded ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-[#696CFF] text-white'} mb-2`}>{toFirstLetterCapital(pageData.subjectLabel)}</span>
                                        <h2 className="text-2xl font-bold">{pageData.title}</h2>
                                        <p className={`text-base ${subText} mb-4`}>{pageData.description}</p>

                                        {/* Actions */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <button
                                                onClick={handleVideoLike}
                                                className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md cursor-pointer transition ${isDark
                                                    ? 'bg-zinc-800 hover:bg-zinc-700'
                                                    : 'bg-zinc-100 hover:bg-zinc-200'
                                                    }`}
                                            >
                                                <ThumbsUp
                                                    className={`w-4 h-4 transition-transform duration-150 group-active:scale-90 ${liked
                                                        ? (isDark ? 'text-white scale-110' : 'text-blue-600 scale-110')
                                                        : (isDark ? 'text-white' : 'text-black')
                                                        }`}
                                                    fill={liked ? 'currentColor' : 'none'}
                                                />
                                                <span className={`hidden sm:inline font-inter font-semibold text-base leading-none tracking-normal capitalize ${isDark ? 'text-white' : 'text-black'}`}>
                                                    Like
                                                    {/* {totalLikes > 0 && `(${formatCount(totalLikes)})`} */}
                                                </span>
                                            </button>
                                            <button className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                                                <Share2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                                                <span className={`hidden sm:inline font-inter font-semibold text-base leading-none tracking-normal capitalize ${isDark ? 'text-white' : 'text-black'}`}>Share</span>
                                            </button>
                                            <button
                                                onClick={() => { setShowComments(!showComments); if (!showComments) setShowDescription(false); }}
                                                className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md cursor-pointer transition ${showComments
                                                    ? (isDark ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-900 text-white')
                                                    : (isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200')
                                                    }`}
                                            >
                                                <MessageSquare className={`w-4 h-4 ${showComments ? '' : (isDark ? 'text-white' : 'text-black')}`} />
                                                <span className={`hidden sm:inline font-inter font-semibold text-base leading-none tracking-normal capitalize ${showComments ? '' : (isDark ? 'text-white' : 'text-black')}`}>Comments</span>
                                            </button>
                                            <button
                                                onClick={() => { setShowDescription(true); setShowComments(false); }}
                                                className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md cursor-pointer transition ${showDescription
                                                    ? (isDark ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-900 text-white')
                                                    : (isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200')
                                                    }`}
                                            >
                                                <Info className={`w-4 h-4 ${showDescription ? '' : (isDark ? 'text-white' : 'text-black')}`} />
                                                <span className={`hidden sm:inline font-inter font-semibold text-base leading-none tracking-normal capitalize ${showDescription ? '' : (isDark ? 'text-white' : 'text-black')}`}>Description</span>
                                            </button>
                                            {/* Not Interested Button - Commented out */}
                                            {/* <button
                                                onClick={() => setNotInterested((prev) => !prev)}
                                                className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                                            >
                                                <Flag
                                                    className={`w-4 h-4 transition-transform duration-150 group-active:scale-90 ${notInterested
                                                        ? (isDark ? 'text-red-500 scale-110' : 'text-red-600 scale-110')
                                                        : (isDark ? 'text-white' : 'text-black')
                                                        }`}
                                                    fill={notInterested ? 'currentColor' : 'none'}
                                                />
                                                <span className={`hidden sm:inline font-inter font-semibold text-base leading-none tracking-normal capitalize ${isDark ? 'text-white' : 'text-black'}`}>
                                                    Not Interested
                                                </span>
                                            </button> */}
                                            <button
                                                onClick={handleBookmarkToggle}
                                                className={`group flex items-center gap-0 sm:gap-2 h-9 px-2 sm:px-3 rounded-md cursor-pointer transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}
                                            >
                                                <Bookmark
                                                    className={`w-4 h-4 transition-transform duration-150 group-active:scale-90 ${bookmarked
                                                        ? (isDark ? 'text-white scale-110' : 'text-blue-500 scale-110')
                                                        : (isDark ? 'text-white' : 'text-black')
                                                        }`}
                                                    fill={bookmarked ? 'currentColor' : 'none'}
                                                />
                                                
                                            </button>
                                        </div>

                                    </div>


                                </div>

                                {/* Right: Related / Comments */}
                                <aside className="lg:col-span-1 mb-3 md:mb-4 lg:mb-0">
                                    {showComments ? (
                                        <>
                                            {/* Overlay */}
                                            <div
                                                className={`fixed inset-0 z-40 ${isDark ? 'bg-black/50' : 'bg-black/30'}`}
                                                onClick={() => setShowComments(false)}
                                            />

                                            {/* Sidebar */}
                                            <div className={`fixed top-0 right-0 h-full w-96 ${isDark ? 'bg-zinc-900' : 'bg-white'} shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${showComments ? 'translate-x-0' : 'translate-x-full'
                                                }`}>
                                                {/* Header */}
                                                <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                                    <div className="flex items-center justify-between">
                                                        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Comments</h3>
                                                        <button
                                                            onClick={() => setShowComments(false)}
                                                            className={`h-8 w-8 inline-flex items-center justify-center rounded-md cursor-pointer transition ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-600'}`}
                                                            aria-label="Close comments"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Comment Input */}
                                                <div className={`p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                                    <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'} mb-3`}>Join The Discussion About This Video</div>
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex-1">
                                                            <textarea
                                                                value={commentInput}
                                                                onChange={(e) => setCommentInput(e.target.value)}
                                                                onKeyDown={handleKeyPress}
                                                                placeholder="Add a comment...."
                                                                rows={3}
                                                                className={`w-full resize-none rounded-md border px-3 py-2 outline-none ${isDark ? 'bg-zinc-800 border-zinc-800 placeholder-zinc-500 focus:ring-2 focus:ring-[#2563EB] focus:border-transparent' : 'bg-white border-zinc-300 placeholder-zinc-400 focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-end mt-3">
                                                        <button onClick={postComment} className={`h-9 px-3 inline-flex items-center gap-2 rounded-md transition-colors ${isDark ? 'bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-100' : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'} cursor-pointer`}>
                                                            <span className="text-sm font-semibold font-inter text-[14px] leading-none tracking-normal capitalize">
                                                                Post Comment
                                                            </span>

                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Comments List */}
                                                <div className="flex-1 overflow-y-auto no-scrollbar p-4" style={{ height: 'calc(100vh - 280px)' }}>

                                                    <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'} mb-3`}>{comments.length} Comments</div>
                                                    {comments.length > 0 ? (
                                                        <div className="space-y-4">
                                                            {comments.map((c, idx) => (
                                                                <div key={c.id} className={idx < comments.length - 1 ? `pb-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}` : ''}>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'} text-xs font-semibold flex-shrink-0`}>
                                                                            {c.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-zinc-900'} truncate`}>{c.name}</span>
                                                                                <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{c.time}</span>
                                                                            </div>
                                                                            <div className={`text-sm ${isDark ? 'text-zinc-200' : 'text-zinc-800'} mb-2 wrap-break-word`}>{c.text}</div>
                                                                            <div className="flex items-center gap-4 text-xs">
                                                                                {/* <button
                                                                                    onClick={() => toggleCommentLike(c.id)}
                                                                                    className={`group inline-flex items-center gap-1 transition cursor-pointer`}
                                                                                >
                                                                                    <ThumbsUp
                                                                                        className={`w-3.5 h-3.5 transition-transform duration-150 group-active:scale-90 ${likedComments[c.id]
                                                                                            ? 'text-blue-600 scale-110'
                                                                                            : (isDark ? 'text-zinc-400' : 'text-zinc-600')
                                                                                            }`}
                                                                                        fill={likedComments[c.id] ? 'currentColor' : 'none'}
                                                                                    />
                                                                                    <span className={`${likedComments[c.id] ? 'text-blue-600' : (isDark ? 'text-zinc-400' : 'text-zinc-600')}`}>
                                                                                        {formatCount(c.likes)}
                                                                                    </span>
                                                                                </button> */}
                                                                                {/* <button className={`group inline-flex items-center gap-1 cursor-pointer`}>
                                                                                    <Reply className={`w-3.5 h-3.5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'} group-hover:text-blue-600`} />
                                                                                    <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-600'} group-hover:text-blue-600`}>Reply</span>
                                                                                </button> */}
                                                                            </div>
                                                                            {c.replies && c.replies.length > 0 && (
                                                                                <div className="mt-3 space-y-3">
                                                                                    {c.replies.map((r) => (
                                                                                        <div key={r.id} className="flex items-start gap-2">
                                                                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-800'} text-xs flex-shrink-0`}>
                                                                                                {r.name.split(' ').map(p => p[0]).slice(0, 2).join('')}
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                                    <span className={`text-xs font-medium ${isDark ? 'text-zinc-200' : 'text-zinc-700'} truncate`}>{r.name}</span>
                                                                                                    <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>{r.time}</span>
                                                                                                </div>
                                                                                                <div className={`text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-600'} wrap-break-word`}>{r.text}</div>
                                                                                                <div className="flex items-center gap-3 mt-1 text-xs">
                                                                                                    {/* <button
                                                                                                        onClick={() => toggleReplyLike(r.id)}
                                                                                                        className={`group inline-flex items-center gap-1 cursor-pointer`}
                                                                                                    >
                                                                                                        <ThumbsUp
                                                                                                            className={`w-3 h-3 transition-transform duration-150 group-active:scale-90 ${likedReplies[r.id]
                                                                                                                ? 'text-blue-600 scale-110'
                                                                                                                : (isDark ? 'text-zinc-500' : 'text-zinc-500')
                                                                                                                }`}
                                                                                                            fill={likedReplies[r.id] ? 'currentColor' : 'none'}
                                                                                                        />
                                                                                                        <span className={`${likedReplies[r.id] ? 'text-blue-600' : (isDark ? 'text-zinc-500' : 'text-zinc-500')}`}>
                                                                                                            {formatCount(r.likes)}
                                                                                                        </span>
                                                                                                    </button> */}
                                                                                                    {/* <button className={`group inline-flex items-center gap-1 cursor-pointer`}>
                                                                                                        <Reply className={`w-3 h-3 ${isDark ? 'text-zinc-500' : 'text-zinc-500'} group-hover:text-blue-600`} />
                                                                                                        <span className={`${isDark ? 'text-zinc-500' : 'text-zinc-500'} group-hover:text-blue-600`}>Reply</span>
                                                                                                    </button> */}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-8">
                                                            <div className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>No comments yet. Be the first to comment!</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className={`border ${panelBg} rounded-xl p-3 sm:p-4 md:p-5 text-center`}>
                                            <div className={`text-sm ${subText}`}>
                                                No related videos available
                                            </div>
                                        </div>
                                    )}
                                </aside>
                            </div>
                            {/* Description Bottom Sheet Modal (scoped to main content) */}
                            {showDescription && (
                                <>
                                    <div
                                        className={`fixed inset-0 z-40 ${isDark ? 'bg-black/10' : 'bg-black/5'}`}
                                        onClick={() => setShowDescription(false)}
                                    />
                                    <div className="fixed inset-0 z-50 flex items-end justify-center animate-in fade-in duration-300" onClick={() => setShowDescription(false)}>
                                        <div
                                            ref={descRef}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`w-full border ${isDark ? 'border-[#1F2430] bg-zinc-900' : 'border-[#3B82F6] bg-white'} rounded-2xl p-4 sm:p-6 md:p-8 lg:p-10 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transform transition-transform duration-300 max-h-[50vh] overflow-y-auto animate-in slide-in-from-bottom-5 duration-300`}
                                        >
                                            <div className="flex items-center justify-between mb-4 md:mb-6">
                                                <h3 className={`text-lg md:text-xl lg:text-2xl font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Video Description</h3>
                                                <button onClick={() => setShowDescription(false)} className={`h-8 w-8 inline-flex items-center justify-center rounded-md border cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-200'} transition`} aria-label="Close description">
                                                    <X className={`w-4 h-4 ${subText}`} />
                                                </button>
                                            </div>
                                            <div className={`text-xs uppercase tracking-wide ${subText} mb-3`}>About This Video</div>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-200' : 'text-zinc-800'} mb-4 md:mb-6`}>
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

export default Videos;
