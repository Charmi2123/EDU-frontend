

import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, Share2, Download, Play, Square, ChevronLeft, Pause, RotateCcw, Search, ArrowRight, User, Maximize, Volume2, VolumeX, RotateCw, Settings, Settings2 } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess, getAsset } from "../../../utils/assets.js";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";

function PlayedVideo({ theme, isDark, toggleTheme, sidebardata }) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [studentSearch, setStudentSearch] = useState("");
    const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
    const [lecturejson, setLecturejson] = useState("");
    const [showControls, setShowControls] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const [mediaRecorder, setMediaRecorder] = useState(null);
    const autoUploadRef = useRef(false); // To track if upload should happen automatically
    const [viewportDimensions, setViewportDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
        isPortrait: window.innerHeight > window.innerWidth
    });

    const isMobile = viewportDimensions.width < 768;

    useEffect(() => {
        const handleResize = () => {
            setViewportDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
                isPortrait: window.innerHeight > window.innerWidth
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Video Controls State
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Custom Video Player States
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [currentSettingsView, setCurrentSettingsView] = useState('main');
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [quality, setQuality] = useState('auto');
    const [isLoop, setIsLoop] = useState(false);
    const [isStableVolume, setIsStableVolume] = useState(false);
    const [videoInitialized, setVideoInitialized] = useState(false);
    const [isVideoLoading, setIsVideoLoading] = useState(true);
    const [canPlayVideo, setCanPlayVideo] = useState(false);
    const [progressKey, setProgressKey] = useState(0);
    const [videoError, setVideoError] = useState(false);

    // Skip accumulation state
    const [skipAccumulator, setSkipAccumulator] = useState(0);
    const skipTimeoutRef = useRef(null);


    // Format duration from seconds to MM:SS
    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    // Video Control Functions
    const toggleLoop = () => {
        if (videoRef.current) {
            videoRef.current.loop = !isLoop;
            setIsLoop(!isLoop);
        }
    };

    const toggleStableVolume = () => {
        setIsStableVolume(!isStableVolume);
    };

    const changePlaybackSpeed = (speed) => {
        if (videoRef.current) {
            videoRef.current.playbackRate = speed;
            setPlaybackSpeed(speed);
        }
    };

    const changeQuality = (newQuality) => {
        setQuality(newQuality);
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            const videoContainer = videoRef.current.parentElement;
            if (!isFullscreen) {
                if (videoContainer.requestFullscreen) {
                    videoContainer.requestFullscreen().then(() => {
                        if (window.screen.orientation && window.screen.orientation.lock) {
                            window.screen.orientation.lock("landscape").catch((e) => console.log("Orientation lock failed:", e));
                        }
                    }).catch(err => console.log("Fullscreen failed:", err));
                } else if (videoContainer.webkitRequestFullscreen) {
                    videoContainer.webkitRequestFullscreen();
                } else if (videoContainer.msRequestFullscreen) {
                    videoContainer.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    if (window.screen.orientation && window.screen.orientation.unlock) {
                        window.screen.orientation.unlock();
                    }
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                }
            }
        }
    };

    // Handle fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);


    const skipForward = (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, duration);

            // Accumulate positive value
            setSkipAccumulator(prev => (prev < 0 ? 10 : prev + 10));

            if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
            skipTimeoutRef.current = setTimeout(() => {
                setSkipAccumulator(0);
            }, 1000);

            handleVideoInteraction();
        }
    };

    const skipBackward = (e) => {
        if (e) e.stopPropagation();
        if (videoRef.current) {
            videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);

            // Accumulate negative value
            setSkipAccumulator(prev => (prev > 0 ? -10 : prev - 10));

            if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
            skipTimeoutRef.current = setTimeout(() => {
                setSkipAccumulator(0);
            }, 1000);

            handleVideoInteraction();
        }
    };

    const handleSeek = (e) => {
        const newTime = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    };

    // Smooth progress update
    const progressUpdateRef = useRef(null);
    const updateProgressSmoothly = (time) => {
        if (progressUpdateRef.current) {
            cancelAnimationFrame(progressUpdateRef.current);
        }
        progressUpdateRef.current = requestAnimationFrame(() => {
            setCurrentTime(time);
        });
    };

    // Video Event Listeners
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => {
            if (video && !isNaN(video.currentTime)) {
                updateProgressSmoothly(video.currentTime);
            }
        };

        const updateDuration = () => {
            if (video && !isNaN(video.duration) && video.duration > 0) {
                setDuration(video.duration);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            if (video) {
                video.currentTime = 0;
                setCurrentTime(0);
                setProgressKey(prev => prev + 1);
            }
        };

        const handleLoadedData = () => {
            if (video && !isNaN(video.duration) && video.duration > 0) {
                setDuration(video.duration);
                if (!videoInitialized) {
                    setVideoInitialized(true);
                    setCurrentTime(0);
                }
            }
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
            setVideoError(true);
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('loadstart', handleLoadStart);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('loadstart', handleLoadStart);
            video.removeEventListener('error', handleError);
            if (progressUpdateRef.current) cancelAnimationFrame(progressUpdateRef.current);
        };
    }, [videoRef.current]);

    const closeSettings = () => {
        setShowSettings(false);
    };

    const toggleFullscreenAndCloseSettings = () => {
        closeSettings();
        toggleFullscreen();
    };

    // Q&A State
    const [qaItems, setQaItems] = useState([]);
    const [isLoadingQA, setIsLoadingQA] = useState(false);

    const toggleQaItem = (id) => {
        setQaItems((prev) =>
            prev.map((it) => {
                // If this is the clicked item, toggle it
                // If it's any other item, close it
                if (it.id === id) {
                    return { ...it, open: !it.open };
                } else {
                    return { ...it, open: false };
                }
            })
        );
    };

    // Fetch Q&A data from API
    const fetchQAData = async (lectureId) => {
        if (!lectureId) return;

        try {
            setIsLoadingQA(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");

            const response = await axios.get(
                `${BACKEND_API_URL}/lectures/${lectureId}/qa`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.status && response.data?.data) {
                // Map API response to UI format
                const formattedQA = response.data.data.map(item => ({
                    id: item.id,
                    question: item.question,
                    answer: item.response_text,
                    open: false,
                    audio_url: item.audio_url,
                    language: item.language
                }));

                setQaItems(formattedQA);
                console.log("Q&A data fetched successfully:", formattedQA);
            }
        } catch (error) {
            console.error("Failed to fetch Q&A data:", error);
            // Keep empty array on error
            setQaItems([]);
        } finally {
            setIsLoadingQA(false);
        }
    };

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLectureData = async () => {
            // If lecturejson is provided directly, use it
            if (location.state?.lecturejson) {
                setLecturejson(location.state.lecturejson);
                console.log("Lecture JSON from state:", location.state.lecturejson);
                return;
            }

            // If lectureId is provided but no lecturejson, fetch from API
            if (location.state?.lectureId) {
                try {
                    const token = localStorage.getItem("token");
                    const response = await axios.get(
                        `${BACKEND_API_URL}/lectures/${location.state.lectureId}/play`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`
                            }
                        }
                    );

                    if (response.data?.lecture_url) {
                        setLecturejson(response.data.lecture_url);
                        console.log("Lecture JSON from API:", response.data.lecture_url);
                    }
                } catch (error) {
                    console.error("Failed to fetch lecture data:", error);
                    // Removed setSpeechError as it's not defined
                }
            }
        };

        fetchLectureData();
    }, [location.state?.lecturejson, location.state?.lectureId]);

    // Fetch Q&A data when lectureId is available
    useEffect(() => {
        const lectureId = location.state?.lectureId;
        if (lectureId) {
            fetchQAData(lectureId);
        }
    }, [location.state?.lectureId]);

    // Handle viewport resize and orientation changes
    useEffect(() => {
        const handleResize = () => {
            setViewportDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
                isPortrait: window.innerHeight > window.innerWidth
            });
        };

        const handleOrientationChange = () => {
            setTimeout(handleResize, 100);
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleOrientationChange);

        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleOrientationChange);
        };
    }, []);

    // Listen for messages from iframe (e.g. Lecture Ended)
    useEffect(() => {
        const handleMessage = (event) => {
            // Adjust condition based on actual message sent by iframe
            // Assuming "LectureCompleted" or similar
            if (event.data === "LectureCompleted" || event.data?.type === "LectureCompleted") {
                console.log("Lecture completed received");
                if (isRecording) {
                    autoUploadRef.current = true;
                    stopRecording();
                }
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, [isRecording]);

    // Control visibility timer
    const controlsTimeoutRef = useRef(null);

    const handleVideoInteraction = () => {
        if (isRecording) {
            setShowControls(false);
            return;
        }

        setShowControls(true);

        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }

        // Only hide if settings are not open
        if (!showSettings) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        }
    };

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, []);

    // Handle Escape key to stop recording
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isRecording) {
                stopRecording();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isRecording, mediaRecorder]);

    // Hide cursor when recording
    useEffect(() => {
        let styleElement = null;

        if (isRecording) {
            // Create a style element to force cursor hidden on EVERYTHING
            styleElement = document.createElement('style');
            styleElement.textContent = `
                *, *::before, *::after {
                    cursor: none !important;
                }
            `;
            document.head.appendChild(styleElement);
        }

        // Cleanup function to remove style when recording stops
        return () => {
            if (styleElement) {
                document.head.removeChild(styleElement);
            }
        };
    }, [isRecording]);



    // Start recording - captures current tab/window
    const startRecording = async () => {
        try {

            // Get display media stream
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    displaySurface: 'browser',
                    cursor: 'always'
                },
                audio: true,
                preferCurrentTab: true
            });

            // Priority order for mimeTypes
            const mimeTypes = [
                "video/mp4",
                "video/webm;codecs=vp9",
                "video/webm"
            ];

            const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || "video/webm";

            const recorder = new MediaRecorder(stream, {
                mimeType,
                videoBitsPerSecond: 5000000 // 5 Mbps for high quality (perfect quality)
            });

            const chunks = [];

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunks.push(event.data);
                }
            };

            recorder.onstop = () => {
                // Strip codecs from mimeType to ensure backend compatibility (e.g. "video/webm;codecs=vp9" -> "video/webm")
                const cleanMimeType = recorder.mimeType.split(';')[0];
                const blob = new Blob(chunks, { type: cleanMimeType });
                setRecordedBlob(blob);
                stream.getTracks().forEach(track => track.stop());
                setIsRecording(false);
                setIsPlaying(false); // Stop lecture playback when recording stops
                setShowControls(true); // Show controls when recording stops

                // Auto upload if triggered
                if (autoUploadRef.current) {
                    handleUpload(blob);
                    autoUploadRef.current = false;
                }
            };

            // Handle system "Stop sharing" button
            stream.getVideoTracks()[0].onended = () => {
                recorder.stop();
            };

            setShowControls(false); // Hide controls immediately before start
            setTimeout(() => {
                if (recorder.state === "inactive") recorder.start();
            }, 1500);
            setMediaRecorder(recorder);
            setIsRecording(true);
            setIsPlaying(true); // Start lecture playback when recording starts
            setIsRecordModalOpen(false); // Close modal after starting
        } catch (error) {
            console.error('Error starting recording:', error);
            setIsRecordModalOpen(false);
        }
    };

    // Stop screen recording
    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            setIsRecording(false);
            setIsPlaying(false); // Stop lecture playback when recording stops
            setShowControls(true); // Ensure controls come back
        }
    };





    const handlePlay = async () => {
        // If not recording, open modal to start/restart recording
        if (!isRecording) {
            setIsRecordModalOpen(true);
            return;
        }

        // Toggle video playback
        if (videoRef.current) {
            if (isPlaying) {
                if (typeof videoRef.current.pause === 'function') videoRef.current.pause();
            } else {
                if (typeof videoRef.current.play === 'function') videoRef.current.play().catch(() => { });
            }
        }
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        if (videoRef.current) {
            if (typeof videoRef.current.pause === 'function') {
                videoRef.current.pause();
            }
            if ('currentTime' in videoRef.current) {
                try { videoRef.current.currentTime = 0; } catch { }
            }
        }
        setIsPlaying(false);

        // Stop recording if active
        if (isRecording) {
            stopRecording();
        }

        // Clear recorded video
        if (recordedBlob) {
            URL.revokeObjectURL(URL.createObjectURL(recordedBlob)); // Clean up
            setRecordedBlob(null);
        }
    };

    // Upload recorded video
    const handleUpload = async (blobToUpload) => {
        const blob = blobToUpload || recordedBlob;
        if (!blob) return;

        // Get Lecture ID
        let lectureId = location.state?.lectureId;
        if (!lectureId && lecturejson) {
            const match = lecturejson.match(/(\d+)\.json$/);
            if (match) lectureId = match[1];
        }

        if (!lectureId) {
            handleerror("Lecture ID not found");
            return;
        }

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const formData = new FormData();

            // Determine extension based on blob type
            const extension = blob.type.split(';')[0].split('/')[1] || 'mp4';
            formData.append('file', blob, `lecture-${lectureId}-${Date.now()}.${extension}`);

            handlesuccess("Uploading recording...");

            console.log("Uploading recording, size:", blob.size);

            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureId}/share-recording`,
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data',
                    },
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                }
            );

            if (response.data) {
                handlesuccess("Recording uploaded successfully!");
                // Clear blob after success
                setRecordedBlob(null);
            }
        } catch (error) {
            console.error("Error uploading recording:", error);
            handleerror("Failed to upload recording.");
        }
    };

    // Download recorded video (Commented out as per request)
    // const handleDownload = () => {
    //     if (recordedBlob) {
    //         const url = URL.createObjectURL(recordedBlob);
    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = `lecture-${Date.now()}.mp4`;
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //         URL.revokeObjectURL(url);
    //     }
    // };

    // Check if upload should be enabled
    const isUploadEnabled = recordedBlob !== null;

    const handleShare = async () => {
        if (selectedStudents.length === 0) {
            alert("Please select at least one student");
            return;
        }

        let lectureId = location.state?.lectureId;
        if (!lectureId) {
            const lectureUrl = lecturejson || location.state?.lectureId;
            if (lectureUrl) {
                const match = lectureUrl.match(/(\d+)\.json$/);
                if (match) lectureId = match[1];
            }
        }


        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            // Assuming the API can handle a list of students or we just send this for now
            // Adjust the payload as per actual backend requirement
            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureId}/share`,
                { students: selectedStudents },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setIsShareOpen(false);
            setSelectedStudents([]);
            handlesuccess(response?.data?.message || "Lecture shared successfully!");
        } catch (error) {
            console.error("Error sharing lecture:", error);
            // Fallback success for demo if API fails due to payload mismatch
            // handlesuccess("Lecture shared successfully! (Demo)");
            handleerror("Failed to share lecture. Please try again.");
        }
    };

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* Secondary Header Row */}
                <div className="px-2 md:px-7 mt-6">
                    <div className={`w-full flex items-center justify-between rounded-lg p-3 md:p-4 ${isDark ? "bg-zinc-900" : "bg-white"} border border-transparent transition-all duration-300`}>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigate(-1)}
                                className={`cursor-pointer p-1 rounded-full ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-50"} transition-colors`}
                            >
                                <ChevronLeft className={`w-6 h-6 ${isDark ? "text-white" : "text-[#696CFF]"}`} />
                            </button>
                            <span className={`font-semibold text-base md:text-[17px] ${isDark ? "text-white" : "text-[#696CFF]"}`}>Live Lecture</span>
                        </div>

                        {/* <button
                            onClick={() => setIsShareOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 ${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} rounded-md transition-all cursor-pointer text-sm font-medium active:scale-95`}
                        >
                            <span>Share With Student</span>
                            <Share2 className="w-4 h-4" />
                        </button> */}
                    </div>
                </div>

                {/* ===== Main Section (Video + Q&A) ===== */}
                {/* ===== Main Section (Video + Q&A) ===== */}
                <main className="mt-6 flex-1 overflow-hidden flex flex-col lg:flex-row gap-4 px-2 md:px-7 pb-6">
                    {/* Video Player Section */}
                    <div className={`w-full lg:flex-1 lg:h-full lg:min-w-0 flex flex-col relative rounded-lg overflow-hidden border border-transparent shrink-0 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        {/* Removed Static Title Header Block */}

                        {/* Video Area */}
                        <div
                            className="w-full aspect-video lg:aspect-auto lg:flex-1 relative bg-black group"
                            onMouseMove={handleVideoInteraction}
                            onTouchStart={handleVideoInteraction}
                            onClick={handleVideoInteraction}
                            onMouseLeave={() => {
                                // If playing and settings closed, hide controls (maybe with short delay or immediately)
                                if (isPlaying && !showSettings && !isMobile) {
                                    // Clear existing timeout to avoid conflict
                                    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                                    setShowControls(false);
                                }
                            }}
                        >
                            {!videoError ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        className="absolute inset-0 w-full h-full object-contain"
                                        src={location.state?.video_url}
                                        autoPlay={false} // Don't autoplay to avoid noise
                                        controls={false}
                                        playsInline
                                    />
                                    {/* Invisible Overlay to Capture Clicks for Showing Controls */}
                                    <div
                                        className="absolute inset-0 z-0 cursor-pointer"
                                        onClick={handleVideoInteraction}
                                    />

                                    {/* Loading Spinner */}
                                    {isVideoLoading && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 border-3 border-zinc-300 border-t-white rounded-full animate-spin"></div>
                                                <div className="text-sm text-white opacity-80">Loading video...</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Center Controls - Only show if video can play and no error */}
                                    {canPlayVideo && !videoError && (
                                        <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none transition-opacity duration-200 ${showControls || showSettings ? 'opacity-100' : 'opacity-0'}`}>
                                            <div className="flex items-center justify-center gap-5 md:gap-7 lg:gap-7 xl:gap-7 pointer-events-auto">
                                                {/* Skip Backward */}
                                                <div className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center group/btn relative" onClick={skipBackward}>
                                                    <div className="w-10 h-10 md:w-16 md:h-16 lg:w-16 lg:h-16 xl:w-16 xl:h-16 flex items-center justify-center bg-transparent rounded-full z-10">
                                                        <RotateCcw className="w-5 h-5 md:w-8 md:h-8 lg:w-9 lg:h-9 2xl:w-10 2xl:h-10 text-white" />
                                                    </div>
                                                    {/* Dynamic numeric countdown side-by-side */}
                                                    {skipAccumulator < 0 && (
                                                        <div className="absolute right-full ml-2 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                                                            <span className="text-xs md:text-lg lg:text-lg 2xl:text-xl font-bold text-white whitespace-nowrap drop-shadow-md">{Math.abs(skipAccumulator)} +</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Play/Pause Main */}
                                                <div
                                                    className="w-14 h-14 md:w-20 md:h-20 lg:w-24 lg:h-24 xl:w-22 xl:h-22 bg-transparent rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        isPlaying ? videoRef.current.pause() : videoRef.current.play();
                                                        handleVideoInteraction();
                                                    }}
                                                >
                                                    {isPlaying ? (
                                                        <Pause className="w-6 h-6 md:w-9 md:h-9 lg:w-10 lg:h-10 2xl:w-12 2xl:h-12 text-white fill-white" />
                                                    ) : (
                                                        <Play className="w-6 h-6 md:w-9 md:h-9 lg:w-10 lg:h-10 2xl:w-12 2xl:h-12 text-white fill-white ml-1 lg:ml-1.5" />
                                                    )}
                                                </div>

                                                {/* Skip Forward */}
                                                <div className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center group/btn relative" onClick={skipForward}>
                                                    {/* Dynamic numeric countdown side-by-side */}
                                                    {skipAccumulator > 0 && (
                                                        <div className="absolute left-full mr-2 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-200">
                                                            <span className="text-xs md:text-lg lg:text-xl font-bold text-white whitespace-nowrap drop-shadow-md">+ {skipAccumulator}</span>
                                                        </div>
                                                    )}
                                                    <div className="w-10 h-10 md:w-16 md:h-16 lg:w-16 lg:h-16 xl:w-16 xl:h-16 flex items-center justify-center bg-transparent rounded-full z-10">
                                                        <RotateCw className="w-5 h-5 md:w-8 md:h-8 lg:w-9 lg:h-9 2xl:w-10 2xl:h-10 text-white" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Static Title Header Overlay - Only show if no video error */}
                                    {!videoError && (
                                        <div className={`absolute top-0 left-0 right-0 p-4 md:px-6 md:py-4 z-20 bg-linear-to-b from-black/80 to-transparent transition-opacity duration-300 pointer-events-none ${showControls || showSettings ? 'opacity-100' : 'opacity-0'}`}>
                                            <h1 className="text-white text-base md:text-[17px] font-bold truncate capitalize shadow-black/50 drop-shadow-md">
                                                {location.state?.title || "Introduction TO Quantum Physics"}
                                            </h1>
                                            <p className="text-zinc-300 text-xs md:text-sm mt-0.5 truncate capitalize shadow-black/50 drop-shadow-md">
                                                {location.state?.subject || "Dr Evelyn Reed"}
                                            </p>
                                        </div>
                                    )}

                                    {/* Bottom Controls Overlay - Hide if video error */}
                                    {canPlayVideo && !videoError && (
                                        <div
                                            className={`absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/90 via-black/60 to-transparent px-4 py-4 pt-12 transition-opacity duration-300 ${showControls || showSettings ? 'opacity-100' : 'opacity-0'}`}
                                            onClick={(e) => e.stopPropagation()} // Prevent closing/toggling
                                            onMouseEnter={() => setShowControls(true)} // Keep visible on hover
                                        >
                                            {/* Progress Bar */}
                                            <div className="mb-3 group/progress relative h-1 hover:h-1.5 transition-all bg-white/20 rounded-full cursor-pointer">
                                                <div
                                                    className="absolute left-0 top-0 bottom-0 bg-[#696CFF] rounded-full transition-all duration-100"
                                                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                                                >
                                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover/progress:opacity-100 hover:scale-125 transition-all" />
                                                </div>
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max={duration || 100}
                                                    value={currentTime}
                                                    onChange={handleSeek}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    onInput={() => setShowControls(true)} // Keep controls visible while seeking
                                                />
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {/* Play/Pause Mini */}
                                                    <button onClick={() => isPlaying ? videoRef.current.pause() : videoRef.current.play()} className="text-white transition-colors cursor-pointer">
                                                        {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                                    </button>

                                                    {/* Volume */}
                                                    <button onClick={toggleMute} className="text-white hover:text-gray-300 transition-colors cursor-pointer">
                                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                                    </button>

                                                    {/* Time */}
                                                    <div className="text-xs font-medium text-white/90">
                                                        <span>{formatTime(currentTime)}</span>
                                                        <span className="mx-1 text-white/50">/</span>
                                                        <span>{formatTime(duration)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {/* Settings */}
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => setShowSettings(!showSettings)}
                                                            className={`text-white hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer ${showSettings ? 'bg-white/20' : ''}`}
                                                        >
                                                            <Settings size={18} />
                                                        </button>

                                                        {/* Settings Menu Popup */}
                                                        {showSettings && (
                                                            <>
                                                                {/* Mobile Bottom Sheet Backdrop (Only if mobile & NOT fullscreen) */}
                                                                <div
                                                                    className={`md:hidden ${isFullscreen ? 'hidden' : 'fixed inset-0 bg-black/50 z-40'}`}
                                                                    onClick={() => setShowSettings(false)}
                                                                ></div>

                                                                {/* Menu Container: Bottom Sheet on Mobile vs Popup on Desktop/Fullscreen */}
                                                                <div className={`
                                                                    bg-zinc-900 border border-zinc-700 shadow-xl overflow-hidden z-50 animate-in slide-in-from-bottom-2 fade-in duration-200
                                                                    ${(isMobile || window.innerWidth < 768) && !isFullscreen
                                                                        ? 'fixed bottom-0 left-0 right-0 w-full rounded-t-xl border-x-0 border-b-0 max-h-[50vh] overflow-y-auto'
                                                                        : 'absolute bottom-full right-0 mb-3 w-60 rounded-xl'
                                                                    }
                                                                `}>
                                                                    {currentSettingsView === 'main' && (
                                                                        <div className="py-1">
                                                                            <button onClick={toggleLoop} className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-800 transition-colors">
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <img src={getAsset('loop_video')} alt="" className="w-4 h-4 opacity-80" />
                                                                                    <span className="text-sm text-zinc-200">Loop Video</span>
                                                                                </div>
                                                                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isLoop ? 'bg-[#696CFF]' : 'bg-zinc-600'}`}>
                                                                                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isLoop ? 'left-4.5' : 'left-0.5'}`} />
                                                                                </div>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('speed')}
                                                                                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <img src={getAsset('playvideospeed')} alt="" className="w-4 h-4 opacity-80" />
                                                                                    <span className="text-sm text-zinc-200">Playback Speed</span>
                                                                                </div>
                                                                                <span className="text-xs text-zinc-400 font-medium">{playbackSpeed}x</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => setCurrentSettingsView('quality')}
                                                                                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-zinc-800 transition-colors"
                                                                            >
                                                                                <div className="flex items-center gap-2.5">
                                                                                    <Settings2 size={16} className="text-zinc-400" />
                                                                                    <span className="text-sm text-zinc-200">Quality</span>
                                                                                </div>
                                                                                <span className="text-xs text-zinc-400 font-medium capitalize">{quality}</span>
                                                                            </button>
                                                                        </div>
                                                                    )}

                                                                    {/* Speed Submenu */}
                                                                    {currentSettingsView === 'speed' && (
                                                                        <div className="py-1">
                                                                            <button onClick={() => setCurrentSettingsView('main')} className="w-full px-3 py-2 flex items-center gap-2 border-b border-zinc-800 hover:bg-zinc-800 transition-colors">
                                                                                <ChevronLeft size={16} className="text-zinc-400" />
                                                                                <span className="text-sm font-medium text-white">Playback Speed</span>
                                                                            </button>
                                                                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                                                    <button
                                                                                        key={speed}
                                                                                        onClick={() => { changePlaybackSpeed(speed); setCurrentSettingsView('main'); setShowSettings(false); }}
                                                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 flex items-center justify-between ${playbackSpeed === speed ? 'text-[#696CFF]' : 'text-zinc-300'}`}
                                                                                    >
                                                                                        <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                                                                        {playbackSpeed === speed && <ArrowRight size={14} />}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Quality Submenu */}
                                                                    {currentSettingsView === 'quality' && (
                                                                        <div className="py-1">
                                                                            <button onClick={() => setCurrentSettingsView('main')} className="w-full px-3 py-2 flex items-center gap-2 border-b border-zinc-800 hover:bg-zinc-800 transition-colors">
                                                                                <ChevronLeft size={16} className="text-zinc-400" />
                                                                                <span className="text-sm font-medium text-white">Quality</span>
                                                                            </button>
                                                                            <div className="max-h-48 overflow-y-auto no-scrollbar">
                                                                                {['auto', '1080p', '720p', '480p', '360p'].map(q => (
                                                                                    <button
                                                                                        key={q}
                                                                                        onClick={() => { changeQuality(q); setCurrentSettingsView('main'); setShowSettings(false); }}
                                                                                        className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-800 flex items-center justify-between capitalize ${quality === q ? 'text-[#696CFF]' : 'text-zinc-300'}`}
                                                                                    >
                                                                                        <span>{q}</span>
                                                                                        {quality === q && <ArrowRight size={14} />}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Fullscreen */}
                                                    <button onClick={toggleFullscreenAndCloseSettings} className="text-white hover:text-white transition-colors p-1.5 rounded-full hover:bg-white/10 cursor-pointer">
                                                        <Maximize size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Fallback Error / Placeholder UI (No Controls) */
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-white">
                                    <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
                                        <Play size={24} className="text-zinc-500 ml-1" />
                                    </div>
                                    <h3 className="text-lg font-medium mb-1">Video Unavailable</h3>
                                    <p className="text-sm text-zinc-500 max-w-xs text-center">
                                        The requested video is currently not available or could not be loaded.
                                    </p>
                                </div>
                            )}

                            {/* Recording Indicator - Overlay */}
                            {isRecording && (
                                <div className="absolute top-4 left-4 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/90 backdrop-blur-sm shadow-lg pointer-events-none">
                                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                                    <span className="text-white text-xs font-bold tracking-wide uppercase">Recording</span>
                                </div>
                            )}

                            {/* Stop Recording Button - Floating Overlay */}
                            {isRecording && (
                                <button
                                    onClick={stopRecording}
                                    className="absolute bottom-20 right-4 md:bottom-24 md:right-6 z-40 p-3 md:p-4 cursor-pointer rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 hover:scale-105 transition-all duration-300 flex items-center justify-center"
                                    title="Stop Recording"
                                >
                                    <Square className="w-5 h-5 md:w-6 md:h-6 fill-current" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Q&A Section */}
                    <div className={`w-full lg:w-80 flex-1 lg:flex-none lg:h-full min-h-0 flex flex-col rounded-lg overflow-hidden border border-transparent ${isDark ? "bg-zinc-900" : "bg-white"}`}>
                        {/* Q&A Header */}
                        <div className="px-4 py-3 border border-transparent">
                            <h3 className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-zinc-900"}`}>Q&A</h3>
                        </div>

                        {/* Q&A List */}
                        <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-3">
                            {isLoadingQA ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#696CFF]"></div>
                                </div>
                            ) : qaItems.length === 0 ? (
                                <div className={`text-center py-8 px-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                                    <p className="text-sm">No Q&A available for this lecture.</p>
                                </div>
                            ) : (
                                qaItems.map((item) => (
                                    <div key={item.id} className={`rounded mb-2 ${isDark ? "bg-zinc-800" : "bg-zinc-50"} border border-transparent`}>
                                        <button
                                            className="cursor-pointer w-full flex items-center justify-between px-3 py-3 text-left"
                                            onClick={() => toggleQaItem(item.id)}
                                        >
                                            <span
                                                className={`font-inter font-semibold text-[16px] leading-[100%] ${isDark ? "text-gray-200" : "text-zinc-800"
                                                    }`}
                                            >
                                                {item.question}
                                            </span>

                                            <svg
                                                width="16"
                                                height="16"
                                                viewBox="0 0 24 24"
                                                className={`${item.open ? "rotate-180" : ""} transition-transform shrink-0 ml-2`}
                                                fill="none"
                                            >
                                                <path d="M6 9l6 6 6-6" stroke={isDark ? "#d4d4d8" : "#3f3f46"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </button>
                                        {item.open && (
                                            <div className={`px-3 pb-3`}>
                                                <div className={`${isDark ? "bg-zinc-900" : "bg-white"} border border-transparent rounded px-3 py-2 text-[15px] ${isDark ? "text-zinc-300" : "text-zinc-700"} leading-relaxed`}>
                                                    {item.answer}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </main>
            </div>

            {/* Custom Recording Confirmation Modal */}
            {isRecordModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setIsRecordModalOpen(false)}
                >
                    <div
                        className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'
                            } w-full max-w-md rounded-2xl border border-transparent px-6 py-6 transform transition-all`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                <Play size={32} className="text-green-500" fill="currentColor" />
                            </div>
                            <h3 className="text-lg md:text-xl font-semibold mb-2">
                                {recordedBlob ? "Start New Recording?" : "Start Recording Lecture?"}
                            </h3>
                            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                {recordedBlob ? "Starting a new recording will discard the previous one." : "This will record the current lecture screen"}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setIsRecordModalOpen(false)}
                                className={`flex-1 cursor-pointer px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${isDark
                                    ? 'bg-zinc-800 text-white hover:bg-zinc-700'
                                    : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={startRecording}
                                className="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
                            >
                                <Play size={16} fill="white" />
                                <span>Start</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Share Drawer (Right Side) */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${isShareOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setIsShareOpen(false)}
                />

                {/* Drawer Content */}
                <div
                    className={`absolute top-0 right-0 h-full w-full max-w-[400px] transition-transform duration-500 ease-out transform ${isShareOpen ? 'translate-x-0' : 'translate-x-full'
                        } ${isDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}
                >
                    <div className="flex flex-col h-full relative">
                        {/* Drawer Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsShareOpen(false)}
                                    className={`p-2 rounded-full cursor-pointer transition-colors ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <h2 className="text-xl font-bold">Forward</h2>
                            </div>
                            {/* <button
                                onClick={() => setIsShareOpen(false)}
                                className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                            >
                                <X size={20} />
                            </button> */}
                        </div>

                        {/* Search Bar Container */}
                        <div className="px-5 py-2">
                            <div className={`relative flex items-center rounded-xl px-4 py-3 transition-all ${isDark ? 'bg-zinc-900' : 'bg-[#F2F2F2]'}`}>
                                <Search size={18} className="text-zinc-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="bg-transparent w-full outline-none text-[15px] placeholder:text-zinc-400"
                                />
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto mt-4 px-2 no-scrollbar">
                            {[
                                { id: 1, name: 'Ramesh', avatar: '' },
                                { id: 2, name: 'Sonal', avatar: '' },
                                { id: 3, name: 'Riya', avatar: '' },
                                { id: 4, name: 'Tina', avatar: '' },
                                { id: 5, name: 'Mahesh', avatar: '' },
                                { id: 6, name: 'Sanjay', avatar: '' },
                                { id: 7, name: 'Rahul', avatar: '' },
                            ]
                                .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                                .map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudents(prev =>
                                                prev.includes(student.id)
                                                    ? prev.filter(id => id !== student.id)
                                                    : [...prev, student.id]
                                            );
                                        }}
                                        className={`flex items-center justify-between px-4 py-4 cursor-pointer border-b transition-colors ${isDark ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-zinc-100 hover:bg-zinc-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#FF9F43] to-[#FF6B6B] flex items-center justify-center text-white font-bold p-0.5 border border-transparent overflow-hidden">
                                                <User fill="white" className="w-6 h-6 opacity-80" />
                                            </div>
                                            <span className="font-semibold text-base">{student.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id)
                                            ? (isDark ? 'bg-white border-white' : 'bg-[#696CFF] border-[#696CFF]')
                                            : 'border-zinc-300'
                                            }`}>
                                            {selectedStudents.includes(student.id) && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke={isDark ? "black" : "white"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Floating Action Button (FAB) */}
                        <div className="absolute bottom-10 right-6">
                            <button
                                onClick={handleShare}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform active:scale-95 duration-200 ${selectedStudents.length > 0
                                    ? (isDark ? 'bg-white hover:bg-zinc-200' : 'bg-[#333] hover:bg-black') + ' scale-100'
                                    : (isDark ? 'bg-zinc-500' : 'bg-zinc-400') + ' scale-90 opacity-50 cursor-not-allowed'
                                    }`}
                                disabled={selectedStudents.length === 0}
                            >
                                <ArrowRight size={28} className={isDark && selectedStudents.length > 0 ? "text-black" : "text-white"} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PlayedVideo;