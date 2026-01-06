import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Pause, Play, MessageCircle, Loader2, Download } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
import fixWebmDuration from "fix-webm-duration";
// import Avatar from "./components/Avatar";
import Chatbot from "./components/Chatbot";
import QuestionPopup from "./components/QuestionPopup";
import AudioManager from "./components/AudioManager";
import TypingEffect from "./components/TypingEffect";
import MathTypingEffect from "./components/MathTypingEffect";

// ✅ FIX 1: Move Local Image Loading OUTSIDE the component
const localSlideImages = import.meta.glob('../../../assets/Slide*.*', { eager: true });
const localImagesMap = {};

Object.keys(localSlideImages).forEach(path => {
    const match = path.match(/Slide(\d+)\./i);
    if (match && match[1]) {
        const index = parseInt(match[1], 10);
        localImagesMap[index] = localSlideImages[path].default;
    }
});

// STATE MACHINE
const STATES = {
    IDLE: 'IDLE',
    SLIDE_PLAYING: 'SLIDE_PLAYING',
    SLIDE_PAUSED: 'SLIDE_PAUSED',
    QUESTION_WAIT: 'QUESTION_WAIT',
    CHATBOT_ACTIVE: 'CHATBOT_ACTIVE',
    RECORDING_ACTIVE: 'RECORDING_ACTIVE'
};

function LectureVideo({ theme, isDark }) {
    const location = useLocation();
    const navigate = useNavigate();

    // Get lectureId from location.state OR URL query params (for Preview Lecture from CoverPage)
    const lectureId = useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return location.state?.lectureId || searchParams.get('lectureId');
    }, [location.state?.lectureId, location.search]);

    // Detect if this is a chapter preview (opened from CoverPage) - No recording/upload in preview mode

    const isChapterPreview = useMemo(() => {
        // ✅ FIX: Only consider it a preview if the URL path explicitly contains 'chapter'
        // This prevents 'Live Lecture' from becoming 'Preview' on page refresh
        return location.pathname.includes('chapter');
    }, [location.pathname]);

    // ✅ Mobile Detection - Show "Desktop Only" page for mobile/tablet users only (< 768px)
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            // Check screen width for mobile/tablet only (< 768px)
            // Laptops (>= 768px) should show the lecture normally
            const isMobileWidth = window.innerWidth < 768;
            const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            // Only consider mobile if both width is small AND it's a mobile device
            // OR if width is very small (phone size < 768px)
            setIsMobile(isMobileWidth && (isMobileAgent || window.innerWidth < 768));
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // State Management
    const [currentState, setCurrentState] = useState(STATES.IDLE);
    const [lectureData, setLectureData] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [lectureInfo, setLectureInfo] = useState({ std: '', division: '' });  // ✅ Store std & division from API

    // Audio State
    const [audioContext, setAudioContext] = useState(null);
    const [analyserNode, setAnalyserNode] = useState(null);
    const [currentAudioSource, setCurrentAudioSource] = useState(null);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [slideDuration, setSlideDuration] = useState(0);
    const progressFrameRef = useRef(null);
    const audioManagerRef = useRef(null);
    // ✅ NEW: Smooth progress tracking using refs to avoid React batching issues
    const progressRef = useRef(0);
    const lastProgressUpdateRef = useRef(0);
    // ✅ NEW: Track if we've already started preloading to prevent duplicates
    const hasPreloadedRef = useRef(false);

    // Video Ref
    const videoRef = useRef(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, text: "Hi, Welcome To Class", sender: "system" }]);
    const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);  // ✅ ChatGPT-like behavior
    const [pendingMessages, setPendingMessages] = useState([]);  // ✅ Queue for pending messages (for UI display)
    const messageQueueRef = useRef([]);  // ✅ ROBUST: Ref-based queue for reliable processing
    const isProcessingQueueRef = useRef(false);  // ✅ Prevent duplicate processing
    const socketRef = useRef(null);

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [hasRecordingStarted, setHasRecordingStarted] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const audioDestinationRef = useRef(null);
    const screenStreamRef = useRef(null);
    const recordingStartTimeRef = useRef(null);
    const shouldUploadRef = useRef(true);  // ✅ Flag to control if recording should upload

    // Question Popup State
    const [isQuestionPopupOpen, setIsQuestionPopupOpen] = useState(false);
    const popupTimeoutRef = useRef(null);

    // Initialize Audio Context
    useEffect(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;

        // ✅ Ensure audio output is connected to speakers globally
        analyser.connect(ctx.destination);

        // Create audio destination for recording (system audio only, no mic)
        const audioDestination = ctx.createMediaStreamDestination();
        audioDestinationRef.current = audioDestination;

        setAudioContext(ctx);
        setAnalyserNode(analyser);

        return () => {
            // ✅ Stop screen sharing when navigating away
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }

            // ✅ Stop media recorder
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
            }

            // ✅ Close audio context
            if (ctx.state !== 'closed') {
                ctx.close();
            }

            // ✅ Clear timeout
            if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        };
    }, []);

    // ✅ Handle browser back button and tab close - Stop screen sharing WITHOUT upload
    useEffect(() => {
        const stopScreenSharingWithoutUpload = () => {
            // ✅ Set flag to prevent upload
            shouldUploadRef.current = false;

            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(track => track.stop());
                screenStreamRef.current = null;
            }
            if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {
                    // Already stopped
                }
            }
        };

        // Handle page unload (tab close, refresh)
        const handleBeforeUnload = () => {
            stopScreenSharingWithoutUpload();
        };

        // Handle browser back/forward navigation
        const handlePopState = () => {
            stopScreenSharingWithoutUpload();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            stopScreenSharingWithoutUpload(); // Also stop on unmount
        };
    }, []);

    // Fetch Lecture Data
    useEffect(() => {
        let isCancelled = false;  // ✅ FIX: Prevent double fetch in StrictMode

        const fetchLectureData = async () => {
            if (isCancelled) return;  // ✅ Skip if cancelled

            setIsLoading(true);

            if (!lectureId) {
                setPageError("Missing Lecture Information");
                setIsLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                const response = await axios.get(`${BACKEND_API_URL}/lectures/${lectureId}/play`, {
                    headers: { Authorization: token ? `Bearer ${token}` : "" }
                });

                if (response.data?.lecture_url) {
                    const detailUrl = BACKEND_API_URL + response.data.lecture_url;
                    const detailRes = await axios.get(detailUrl);

                    // ✅ Extract std and division from API response
                    const apiStd = response.data?.std || detailRes.data?.std || '';
                    const apiDivision = response.data?.division || detailRes.data?.division || '';
                    setLectureInfo({
                        std: apiStd?.toString() || '',
                        division: apiDivision?.toString() || ''
                    });
                    console.log('Lecture Info:', { std: apiStd, division: apiDivision });

                    const slides = (detailRes.data.slides || []).map((slide, index) => {
                        // ✅ Extract image URL from various possible fields
                        const imageUrl = slide.image_url ||
                            slide.static_image?.url ||
                            slide.content_url ||
                            slide.visual_url ||
                            "";

                        // ✅ Extract video URL from various possible fields
                        const videoUrl = slide.video_url ||
                            slide.static_video?.url ||
                            "";

                        // ✅ Helper to format URL safely
                        const getFullUrl = (path) => {
                            if (!path) return "";
                            if (path.startsWith('http')) return path;
                            return `${BACKEND_API_URL}${path}`;
                        };

                        return {
                            audio_url: getFullUrl(slide.audio_url),
                            title: slide.title || "",
                            bullets: slide.bullets || [],
                            subnarrations: slide.subnarrations || [],
                            narration: slide.narration || "",
                            question: slide.question || "",
                            image_url: imageUrl,  // ✅ Separate image URL
                            video_url: videoUrl,  // ✅ Separate video URL
                            isLastSlide: index === (detailRes.data.slides || []).length - 1
                        };
                    });

                    setLectureData(slides);
                    setCurrentState(STATES.IDLE);

                    // ✅ Load ALL audio files at once (as requested)
                    const audioUrls = slides
                        .map(s => s.audio_url)
                        .filter(url => url && !url.includes('undefined') && !url.includes('null'));

                    // ✅ CRITICAL: Prevent duplicate preload calls (React StrictMode can trigger twice)
                    if (audioUrls.length > 0 && !hasPreloadedRef.current) {
                        hasPreloadedRef.current = true; // Mark as started immediately
                        console.log(`📦 Preloading all ${audioUrls.length} audio files...`);
                        // Small delay to ensure Ref is ready
                        setTimeout(() => {
                            if (audioManagerRef.current) {
                                audioManagerRef.current.preloadAudioUrls(audioUrls)
                                    .then(() => console.log('✅ All audio files preloaded successfully!'))
                                    .catch(err => console.warn('Audio preload warning:', err));
                            } else {
                                console.warn('AudioManager ref missing during preload');
                                hasPreloadedRef.current = false; // Reset if ref missing
                            }
                        }, 500);
                    }
                } else {
                    if (!isCancelled) setPageError("Lecture content not found");
                }
            } catch (error) {
                console.error("Failed to fetch lecture data:", error);
                if (!isCancelled) setPageError("Failed to load lecture data");
            } finally {
                if (!isCancelled) setIsLoading(false);
            }
        };

        fetchLectureData();

        // ✅ Cleanup: Cancel on unmount to prevent double fetch and reset preload flag
        return () => {
            isCancelled = true;
            hasPreloadedRef.current = false; // Reset for next lecture
        };
    }, [lectureId]);

    // ✅ FIXED: Progress Tracking Loop with smooth updates
    useEffect(() => {
        let animationFrameId;
        let isActive = true;

        const animateProgress = () => {
            if (!isActive) return;

            // 1. Safety Checks: State PLAYING hona chahiye aur Audio Manager ready hona chahiye
            if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current) {

                // 2. Audio ka current time nikalo (AudioManager se)
                const elapsed = audioManagerRef.current.getSlideElapsed();

                // 3. Calculation: (Kitna time chala / Total time kitna hai)
                // Math.min use kiya taaki progress kabhi 1 (100%) se upar na jaye
                const prog = Math.min(elapsed / slideDuration, 1);

                // 4. Store in ref for immediate access (prevents batching delays)
                progressRef.current = prog;

                // 5. Throttle state updates to ~30fps (every ~33ms) to avoid excessive re-renders
                // But ALWAYS update if progress difference is significant (> 0.5%)
                const now = performance.now();
                const timeSinceLastUpdate = now - lastProgressUpdateRef.current;
                const progressDiff = Math.abs(prog - playbackProgress);

                if (timeSinceLastUpdate >= 33 || progressDiff >= 0.005) {
                    setPlaybackProgress(prog);
                    lastProgressUpdateRef.current = now;
                }

                // 6. Check karo audio abhi baaki hai ya nahi
                if (prog < 1) {
                    // Agar audio bacha hai, to animation loop continue rakho
                    animationFrameId = requestAnimationFrame(animateProgress);
                } else {
                    // Agar audio duration complete ho gayi, to progress 100% set kardo
                    progressRef.current = 1;
                    setPlaybackProgress(1);
                }
            } else if (currentState === STATES.SLIDE_PLAYING && slideDuration === 0) {
                // Agar duration abhi set nahi hua, wait karo aur retry karo
                animationFrameId = requestAnimationFrame(animateProgress);
            }
        };

        // Start animation loop when playing
        if (currentState === STATES.SLIDE_PLAYING) {
            // Reset last update time when starting
            lastProgressUpdateRef.current = performance.now();
            animationFrameId = requestAnimationFrame(animateProgress);
        }

        return () => {
            isActive = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [currentState, slideDuration, currentSlideIndex, playbackProgress]);

    // Socket.IO Setup
    useEffect(() => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token");
        if (!token) return;

        socketRef.current = io(`${BACKEND_API_URL}/lecture-player`, {
            transports: ["websocket"],
            auth: { token }
        });

        socketRef.current.on("lecture:reply", (data) => {
            const botResponse = {
                id: Date.now(),
                text: data.answer || data.display_text || data.message || "Received response",
                sender: "system",
                audio_url: data.audio_url
            };
            setMessages(prev => [...prev, botResponse]);
            setIsWaitingForResponse(false);  // ✅ Response received - enable input
            isProcessingQueueRef.current = false;  // ✅ Mark processing complete

            if (data.audio_url && audioManagerRef.current) {
                audioManagerRef.current.playChatbotAudio(data.audio_url);
            }

            // ✅ ROBUST: Process next pending message if any
            if (messageQueueRef.current.length > 0 && !isProcessingQueueRef.current) {
                isProcessingQueueRef.current = true;  // ✅ Lock processing
                const nextMessage = messageQueueRef.current.shift();  // ✅ Get and remove first item

                // Update UI state to sync
                setPendingMessages([...messageQueueRef.current]);

                // Send the next message after a short delay
                setTimeout(() => {
                    if (socketRef.current?.connected) {
                        // Add message to UI
                        setMessages(msgPrev => [...msgPrev, { id: Date.now(), text: nextMessage, sender: "user" }]);
                        setIsWaitingForResponse(true);

                        socketRef.current.emit("lecture:chat", {
                            lecture_id: lectureId?.toString(),
                            question: nextMessage
                        });
                    } else {
                        isProcessingQueueRef.current = false;  // ✅ Unlock if socket not connected
                    }
                }, 300);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [lectureId]);

    // =========================================
    // RECORDING FUNCTIONS (OLD FLOW - SCREEN CAPTURE)
    // =========================================

    // Upload recording to API
    const uploadRecording = useCallback(async (blob, filename) => {
        try {
            setIsUploading(true);
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const searchParams = new URLSearchParams(location.search);

            // ✅ Priority: API response > location.state > URL params > fallback
            const stdParam = lectureInfo.std || location.state?.std || searchParams.get('std') || '';
            const divisionParam = lectureInfo.division || location.state?.division || searchParams.get('division') || '';

            console.log('Uploading with std:', stdParam, 'division:', divisionParam);

            const formData = new FormData();
            formData.append('file', blob, filename);
            formData.append('std', stdParam);
            formData.append('division', divisionParam);

            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${lectureId}/share-recording`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Accept': 'application/json',
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            handlesuccess("Recording uploaded successfully!");
            console.log("Upload response:", response.data);
        } catch (error) {
            console.error("Upload failed:", error);
            handleerror("Failed to upload recording. File saved locally.");
        } finally {
            setIsUploading(false);
        }
    }, [lectureId, lectureInfo, location.state?.std, location.state?.division, location.search]);

    // Download and Upload Recording
    // ✅ UPDATED: Always use MP4 format for better compatibility
    const downloadAndUploadRecording = useCallback(async (blob, isMP4 = true) => {
        // ✅ ALWAYS use MP4 extension for universal compatibility
        const extension = 'mp4';
        const mimeType = 'video/mp4';
        const filename = `lecture-${Date.now()}.${extension}`;

        // Create a new blob with clean MIME type (without codecs) for API compatibility
        const cleanBlob = new Blob([blob], { type: mimeType });

        // Save blob for manual download option
        setRecordedBlob(cleanBlob);

        // Upload to API (background, no blocking UI)
        await uploadRecording(cleanBlob, filename);
    }, [uploadRecording]);

    // ---------------------------------------------------------
    // Recording Logic
    // ---------------------------------------------------------

    // Stop Recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        setHasRecordingStarted(false);
        setIsRecording(false);

        // Stop screen stream tracks
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
            screenStreamRef.current = null;
        }

        // Reset lecture to beginning (slide 0) after recording stops
        setCurrentSlideIndex(0);
        setPlaybackProgress(0);
        setCurrentState(STATES.IDLE);
        setHasRecordingStarted(false);

        // Stop any playing audio
        if (audioManagerRef.current) {
            audioManagerRef.current.pauseSlideAudio();
        }
    }, []);

    // Start Recording - Uses Screen Capture API to record the browser tab with system audio only
    const startRecording = useCallback(async () => {
        try {
            // Request screen capture - will capture the current browser tab
            const displayMediaOptions = {
                video: {
                    displaySurface: 'browser',
                    cursor: 'never', // Hide mouse cursor in recording
                    width: { ideal: 1280, max: 1280 },  // 720p width
                    height: { ideal: 720, max: 720 },   // 720p height
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: false, // We'll use our own audio from AudioContext
                preferCurrentTab: true, // Prefer capturing the current tab
                selfBrowserSurface: 'include', // Include this tab in the options
                surfaceSwitching: 'exclude', // Don't allow switching
                monitorTypeSurfaces: 'exclude' // Exclude entire screen options
            };

            let screenStream;
            try {
                screenStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);
                screenStreamRef.current = screenStream;
            } catch (err) {
                console.error("Screen capture not available:", err);
                handleerror("Screen sharing permission is required to start the lecture");
                return false;
            }

            // Get video track from screen capture
            const videoTrack = screenStream.getVideoTracks()[0];
            if (!videoTrack) {
                handleerror("Could not get video track from screen capture");
                return false;
            }

            // Set up track ended handler (user clicks "Stop sharing")
            videoTrack.onended = () => {
                console.log("Screen sharing stopped by user");
                stopRecording();
            };

            // Get audio from the audio context destination (lecture audio only, no mic)
            if (!audioDestinationRef.current && audioContext) {
                audioDestinationRef.current = audioContext.createMediaStreamDestination();
                // ✅ FIX: Connect existing audio source immediately if it exists
                if (currentAudioSource) {
                    try {
                        currentAudioSource.connect(audioDestinationRef.current);
                        console.log("✅ UseEffec tConnected existing audio source to recorder");
                    } catch (e) {
                        // ignore if already connected
                    }
                }
            }

            // Combine video from screen capture and audio from our AudioContext
            const tracks = [videoTrack];
            if (audioDestinationRef.current?.stream?.getAudioTracks().length > 0) {
                tracks.push(...audioDestinationRef.current.stream.getAudioTracks());
            }
            const combinedStream = new MediaStream(tracks);

            // Determine best supported mime type
            // ✅ PRIORITY: MP4 format for better compatibility
            // MP4 works better across devices and platforms
            let mimeType = '';
            let isMP4 = false;

            // ✅ FIRST: Try MP4 format (better compatibility for uploads)
            const mp4Types = [
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=avc1,mp4a.40.2',
                'video/mp4;codecs=avc1',
                'video/mp4'
            ];

            for (const type of mp4Types) {
                if (MediaRecorder.isTypeSupported(type)) {
                    mimeType = type;
                    isMP4 = true;
                    console.log('✅ Using MP4 format:', type);
                    break;
                }
            }

            // ✅ FALLBACK: Use WebM if MP4 not supported (Chrome/Firefox)
            // Note: WebM recorded but will be saved with .mp4 extension for compatibility
            if (!mimeType) {
                const webmTypes = [
                    'video/webm;codecs=vp8,opus',
                    'video/webm;codecs=vp9,opus',
                    'video/webm;codecs=vp8',
                    'video/webm'
                ];

                for (const type of webmTypes) {
                    if (MediaRecorder.isTypeSupported(type)) {
                        mimeType = type;
                        console.log('⚠️ Using WebM format (MP4 not supported, will convert to .mp4 extension):', type);
                        break;
                    }
                }
            }

            // Create recorder with settings for stability
            const recorderOptions = {
                videoBitsPerSecond: 2500000 // 2.5 Mbps for 720p
            };

            if (mimeType) {
                recorderOptions.mimeType = mimeType;
            }

            const recorder = new MediaRecorder(combinedStream, recorderOptions);

            recordedChunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunksRef.current.push(e.data);
                }
            };

            recorder.onstop = async () => {
                // Stop all tracks from the screen capture
                if (screenStreamRef.current) {
                    screenStreamRef.current.getTracks().forEach(track => track.stop());
                    screenStreamRef.current = null;
                }

                // ✅ Check if we should upload (false when navigating away)
                if (!shouldUploadRef.current) {
                    console.log('Recording stopped due to navigation - skipping upload');
                    recordedChunksRef.current = [];
                    return;
                }

                // Determine if it's native MP4 based on recorder's mimeType
                const recorderMimeType = recorder.mimeType || '';
                const isNativeMP4 = recorderMimeType.includes('mp4');

                // ✅ ALWAYS use video/mp4 as final output type for better compatibility
                // Even if browser recorded WebM, we save as MP4 for universal playback
                let blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
                recordedChunksRef.current = [];

                console.log('✅ Recording stopped. Original format:', recorderMimeType, 'Output: video/mp4, Size:', blob.size);

                // Fix WebM duration metadata if original was WebM (duration often missing)
                if (!isNativeMP4 && blob.size > 0) {
                    try {
                        // Calculate approximate duration based on recording time
                        const recordingDuration = Date.now() - recordingStartTimeRef.current;
                        console.log('Fixing duration metadata:', recordingDuration, 'ms');
                        blob = await fixWebmDuration(blob, recordingDuration, { logger: false });
                        // Re-wrap with MP4 type after duration fix
                        blob = new Blob([blob], { type: 'video/mp4' });
                        console.log('✅ Duration fixed, output as MP4');
                    } catch (err) {
                        console.warn('Could not fix duration:', err);
                        // Continue with original blob
                    }
                }

                // ✅ Download and upload - ALWAYS as MP4 for better compatibility
                if (blob.size > 0) {
                    await downloadAndUploadRecording(blob, true); // Always treat as MP4
                }
            };

            recorder.start(100); // Collect data every 100ms for stability
            mediaRecorderRef.current = recorder;
            recordingStartTimeRef.current = Date.now(); // Track recording start time for duration fix
            setIsRecording(true);
            setHasRecordingStarted(true);
            shouldUploadRef.current = true;  // ✅ Reset flag - allow upload on normal completion

            console.log('Recording started successfully with screen capture');
            return true;
        } catch (error) {
            console.error("Recording start failed:", error);
            handleerror("Failed to start recording: " + error.message);
            return false;
        }
    }, [audioContext, downloadAndUploadRecording, stopRecording]);

    // Play Slide - Auto-starts recording on first play
    const playSlide = useCallback(async (index) => {
        if (!lectureData[index] || !audioContext) return;

        // Auto-start recording on first play if not already started (SKIP for chapter preview)
        if (!isChapterPreview && !hasRecordingStarted && index === 0) {
            const recordingStarted = await startRecording();
            if (!recordingStarted) {
                // User denied screen sharing permission - don't start lecture
                // handleerror("Screen sharing permission is required to start the lecture");
                return;
            }
        }

        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }
        setIsQuestionPopupOpen(false);

        setCurrentSlideIndex(index);
        setCurrentState(STATES.SLIDE_PLAYING);
        // ✅ FIXED: Sync refs and state together for smooth progress reset
        progressRef.current = 0;
        lastProgressUpdateRef.current = performance.now();
        setPlaybackProgress(0);
        setSlideDuration(0);

        const slide = lectureData[index];
        if (audioManagerRef.current) {
            // Connect audio to recording destination if recording
            if (audioDestinationRef.current && currentAudioSource) {
                try {
                    currentAudioSource.connect(audioDestinationRef.current);
                } catch (e) {
                    // Already connected or source ended
                }
            }

            const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
                if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
                setPlaybackProgress(1);

                if (!slide.isLastSlide) {
                    setCurrentState(STATES.QUESTION_WAIT);
                    popupTimeoutRef.current = setTimeout(() => {
                        setIsQuestionPopupOpen(true);
                    }, 1500);
                } else {
                    // Last slide finished - stop recording (only if not in chapter preview mode)
                    setCurrentState(STATES.IDLE);
                    if (!isChapterPreview && isRecording) {
                        stopRecording();
                    }
                }
            }) || { duration: 0 };

            setSlideDuration(duration || 0);
        }
    }, [lectureData, audioContext, isRecording, stopRecording, hasRecordingStarted, startRecording, currentAudioSource, isChapterPreview]);


    // ---------------------------------------------------------
    // ✅ FIXED: Handle Send Message (No duplicate - Queue only)
    // ---------------------------------------------------------
    const handleSendMessage = useCallback((text) => {
        if (!text || typeof text !== 'string' || !text.trim()) return;

        // ✅ ROBUST: If already waiting for response, add to queue ONLY
        if (isWaitingForResponse || isProcessingQueueRef.current) {
            // Add to both ref and state
            messageQueueRef.current.push(text.trim());
            setPendingMessages([...messageQueueRef.current]);  // ✅ Update UI
            return;
        }

        // 1. UI update: Add user message
        setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);
        setIsWaitingForResponse(true);  // ✅ Start waiting for response
        isProcessingQueueRef.current = true;  // ✅ Mark as processing

        // 2. Send to Backend via Socket
        if (socketRef.current?.connected) {
            socketRef.current.emit("lecture:chat", {
                lecture_id: lectureId?.toString(),
                question: text
            });
        } else {
            // If socket not connected, reset flags
            setIsWaitingForResponse(false);
            isProcessingQueueRef.current = false;
        }
    }, [lectureId, isWaitingForResponse]);


    // ---------------------------------------------------------
    // ✅ UPDATED LOGIC: Handle Question Response
    // ---------------------------------------------------------
    const handleQuestionResponse = useCallback((response) => {
        setIsQuestionPopupOpen(false);

        // Agar user ne 'NO' select kiya ya close kiya
        if (response === 'NO') {
            if (currentState === STATES.SLIDE_PAUSED) {
                audioManagerRef.current?.resumeSlideAudio();
                setCurrentState(STATES.SLIDE_PLAYING);
            } else {
                if (currentSlideIndex < lectureData.length - 1) {
                    playSlide(currentSlideIndex + 1);
                } else {
                    setCurrentState(STATES.IDLE);
                    if (isRecording) stopRecording();
                }
            }
        } else {
            // ✅ SCENARIO: User sends a question (response holds the text or 'YES')
            setCurrentState(STATES.CHATBOT_ACTIVE);
            setIsChatOpen(true);
            if (audioManagerRef.current) {
                audioManagerRef.current.pauseSlideAudio();
            }

            // Agar response ek proper question text hai (sirf 'YES' nahi), toh use chat me bhejo
            // Using the common handleSendMessage function
            if (response && response !== 'YES' && typeof response === 'string') {
                handleSendMessage(response);
            }
        }
    }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, stopRecording, handleSendMessage]);

    // Download Recording (manual download option)
    const downloadRecording = useCallback(() => {
        if (!recordedBlob) return;

        const url = URL.createObjectURL(recordedBlob);
        const link = document.createElement('a');
        link.href = url;
        // ✅ ALWAYS use .mp4 extension for better compatibility
        link.download = `lecture-${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        handlesuccess("Recording downloaded!");
    }, [recordedBlob]);

    // ✅ Chapter Preview Navigation - Go to Previous Slide
    const goToPreviousSlide = useCallback(async () => {
        if (currentSlideIndex > 0) {
            const wasPlaying = currentState === STATES.SLIDE_PLAYING;
            const wasPaused = currentState === STATES.SLIDE_PAUSED;
            const newIndex = currentSlideIndex - 1;

            // ✅ FIX: Stop ALL audio first to prevent overlapping
            if (audioManagerRef.current) {
                audioManagerRef.current.stopAllAudio();
            }

            setPlaybackProgress(0);
            progressRef.current = 0;
            setCurrentSlideIndex(newIndex);

            // Maintain state based on what user was doing
            if (wasPlaying) {
                // Was playing → auto-play new slide
                await new Promise(resolve => setTimeout(resolve, 50));
                playSlide(newIndex);
            } else if (wasPaused) {
                // Was paused → stay paused (don't change to IDLE so buttons stay visible)
                setCurrentState(STATES.SLIDE_PAUSED);
            } else {
                // Was IDLE → stay IDLE
                setCurrentState(STATES.IDLE);
            }
        }
    }, [currentSlideIndex, currentState, playSlide]);

    // ✅ Chapter Preview Navigation - Go to Next Slide
    const goToNextSlide = useCallback(async () => {
        if (currentSlideIndex < lectureData.length - 1) {
            const wasPlaying = currentState === STATES.SLIDE_PLAYING;
            const wasPaused = currentState === STATES.SLIDE_PAUSED;
            const newIndex = currentSlideIndex + 1;

            // ✅ FIX: Stop ALL audio first to prevent overlapping
            if (audioManagerRef.current) {
                audioManagerRef.current.stopAllAudio();
            }

            setPlaybackProgress(0);
            progressRef.current = 0;
            setCurrentSlideIndex(newIndex);

            // Maintain state based on what user was doing
            if (wasPlaying) {
                // Was playing → auto-play new slide
                await new Promise(resolve => setTimeout(resolve, 50));
                playSlide(newIndex);
            } else if (wasPaused) {
                // Was paused → stay paused (don't change to IDLE so buttons stay visible)
                setCurrentState(STATES.SLIDE_PAUSED);
            } else {
                // Was IDLE → stay IDLE
                setCurrentState(STATES.IDLE);
            }
        }
    }, [currentSlideIndex, lectureData.length, currentState, playSlide]);

    const currentSlide = lectureData[currentSlideIndex];

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-gray-600">Loading Lecture...</p>
                </div>
            </div>
        );
    }

    // ✅ Mobile Detection - Show "Desktop Only" page (Theme Aware)
    if (isMobile) {
        return (
            <div className={`fixed inset-0 flex items-center justify-center p-6 ${isDark
                ? 'bg-linear-to-br from-slate-900 via-slate-800 to-slate-900'
                : 'bg-linear-to-br from-gray-50 via-white to-gray-100'
                }`}>
                <div className="max-w-md w-full text-center">
                    {/* Animated Background Circles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-pulse ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/20'
                            }`}></div>
                        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/15'
                            }`} style={{ animationDelay: '1s' }}></div>
                    </div>

                    {/* Content Card */}
                    <div className={`relative backdrop-blur-xl rounded-3xl p-8 shadow-2xl ${isDark
                        ? 'bg-white/5 border border-white/10'
                        : 'bg-white/80 border border-gray-200'
                        }`}>
                        {/* Laptop Icon */}
                        <div className="w-24 h-24 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-600 rounded-2xl rotate-6 opacity-50"></div>
                            <div className={`relative rounded-2xl w-full h-full flex items-center justify-center border ${isDark
                                ? 'bg-slate-800 border-slate-700'
                                : 'bg-white border-gray-200'
                                }`}>
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <defs>
                                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#8b5cf6" />
                                        </linearGradient>
                                    </defs>
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="2" y1="20" x2="22" y2="20"></line>
                                    <line x1="8" y1="17" x2="16" y2="17"></line>
                                </svg>
                            </div>
                        </div>

                        {/* Title */}
                        <h1 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Desktop Only
                        </h1>

                        {/* Subtitle */}
                        <p className={`text-base mb-8 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            This lecture is available only on desktop devices for the best learning experience.
                        </p>

                        {/* Back Button */}
                        <button
                            onClick={() => navigate(-1)}
                            className="w-full cursor-pointer py-4 px-6 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/25"
                        >
                            Go Back
                        </button>

                        {/* Hint */}
                        <p className={`text-xs mt-6 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            Open this page on a laptop or desktop computer
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="fixed inset-0 bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <p className="text-gray-800 text-lg font-semibold">{pageError}</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-gray-800 text-white rounded-full font-bold hover:bg-gray-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-white overflow-hidden">

            {/* Audio Manager */}
            <AudioManager
                ref={audioManagerRef}
                audioContext={audioContext}
                analyserNode={analyserNode}
                onAudioSourceChange={(source) => {
                    setCurrentAudioSource(source);
                    // Connect audio source to recording destination for system audio capture
                    if (audioDestinationRef.current && source) {
                        try {
                            source.connect(audioDestinationRef.current);
                        } catch (e) {
                            // Already connected
                        }
                    }
                }}
            />

            {/* Recording Indicator */}
            {/* {isRecording && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-full font-semibold animate-pulse">
                    <div className="w-3 h-3 bg-white rounded-full animate-ping" />
                    <span>Recording...</span>
                </div>
            )} */}

            {/* Uploading Indicator - HIDDEN (upload happens in background) */}
            {/* {isUploading && (
                <div className="absolute inset-0 z-100 bg-black/50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4 shadow-2xl">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-gray-800 font-semibold text-lg">Uploading recording...</p>
                        <p className="text-gray-500 text-sm">Please wait while we upload your lecture</p>
                    </div>
                </div>
            )} */}

            {/* Main Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-between px-8 py-6">
                {/* Left: Avatar & Logo */}
                <div className="flex flex-col items-center justify-center gap-8">
                    <img src="/inai-logo-light.png" alt="INAI" className="w-32 h-auto" />
                </div>

                {/* Right: Whiteboard */}
                <div
                    className="w-full h-full flex flex-1 items-center justify-center relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* ✅ Left Arrow - Previous Slide (Only in Chapter Preview) */}
                    {isChapterPreview && currentSlideIndex > 0 && (
                        <button
                            onClick={goToPreviousSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                            title="Previous Slide"
                        >
                            <ChevronLeft size={28} strokeWidth={2.5} />
                        </button>
                    )}
                    <div className="flex-1 relative w-full h-full">

                        {currentSlide && (
                            <div className="absolute inset-0 flex items-center justify-center mr-5">
                                <div
                                    id="lecture-content-scroll"
                                    className="w-full h-4/5 overflow-x-hidden overflow-y-auto scroll-smooth p-8"
                                    style={{ scrollBehavior: 'smooth' }}
                                >
                                    {currentSlide.title && (
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-3 border-b-2 border-gray-800 text-center">
                                            {currentSlide.title}
                                        </h2>
                                    )}

                                    {currentSlide.bullets.length > 0 ? (
                                        <ul className="space-y-3">
                                            {currentSlide.bullets.map((bullet, i) => {
                                                const totalBullets = currentSlide.bullets.length;
                                                const step = 1 / totalBullets;
                                                const start = i * step;
                                                const localProgress = Math.max(0, Math.min(1, (playbackProgress - start) / step));

                                                return (
                                                    <li key={i} className="relative pl-6 text-gray-800 text-base">
                                                        <span className="absolute left-0 text-xl font-bold">•</span>
                                                        <MathTypingEffect
                                                            text={bullet}
                                                            progress={localProgress}
                                                            isTyping={currentState === STATES.SLIDE_PLAYING && localProgress < 1 && localProgress > 0}
                                                        />
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    ) : currentSlide.narration && (
                                        <div className="text-gray-800 text-base leading-relaxed">
                                            <MathTypingEffect
                                                text={currentSlide.narration}
                                                progress={playbackProgress}
                                                isTyping={currentState === STATES.SLIDE_PLAYING}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* ✅ Helper function to convert Google Drive URL to embeddable format */}
                    {(() => {
                        const convertDriveUrl = (url) => {
                            if (!url) return '';
                            // Convert Google Drive share link to direct embed/preview link
                            // Format: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
                            // To: https://drive.google.com/file/d/FILE_ID/preview (for iframe)
                            // Or: https://drive.google.com/uc?export=view&id=FILE_ID (for direct image)
                            const driveMatch = url.match(/\/file\/d\/([^\/]+)/);
                            if (driveMatch) {
                                const fileId = driveMatch[1];
                                return { fileId, isGoogleDrive: true };
                            }
                            return { url, isGoogleDrive: false };
                        };

                        // Check for video first
                        if (currentSlide?.video_url) {
                            const videoInfo = convertDriveUrl(currentSlide.video_url);
                            return (
                                <div className="flex-1 w-full flex items-center justify-center p-4">
                                    {videoInfo.isGoogleDrive ? (
                                        <iframe
                                            src={`https://drive.google.com/file/d/${videoInfo.fileId}/preview?autoplay=1`}
                                            className="w-full max-w-3xl h-[400px] md:h-[450px] rounded-lg shadow-lg"
                                            allow="autoplay"
                                            allowFullScreen
                                            title="Slide Video"
                                        />
                                    ) : (
                                        <video
                                            ref={videoRef}
                                            src={currentSlide.video_url}
                                            className="w-full max-w-3xl h-[400px] md:h-[450px] rounded-lg shadow-lg"
                                            controls={false}
                                            muted={true}
                                            playsInline
                                            autoPlay
                                            onLoadedData={(e) => e.target.play()}
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    )}
                                </div>
                            );
                        }

                        // Check for image
                        const imageUrl = localImagesMap[currentSlideIndex + 1] || currentSlide?.image_url;
                        if (imageUrl) {
                            const imageInfo = convertDriveUrl(imageUrl);
                            return (
                                <div className={`flex-1 w-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
                                    {imageInfo.isGoogleDrive ? (
                                        <iframe
                                            src={`https://drive.google.com/file/d/${imageInfo.fileId}/preview`}
                                            className="w-full max-w-3xl h-[400px] md:h-[500px] rounded-lg shadow-lg border-0"
                                            title="Slide Image"
                                            allowFullScreen
                                        />
                                    ) : imageUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                        <img
                                            src={imageUrl}
                                            alt="Slide Content"
                                            className="w-full h-min rounded-lg shadow-lg"
                                        />
                                    ) : (
                                        <iframe
                                            src={imageUrl}
                                            className="w-full h-full border-0 rounded-lg shadow-lg"
                                            title="Slide Content"
                                            allowFullScreen
                                        />
                                    )}
                                </div>
                            );
                        }

                        // No media
                        return (
                            <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
                            </div>
                        );
                    })()}

                    {/* ✅ Right Arrow - Next Slide (Only in Chapter Preview) */}
                    {isChapterPreview && currentSlideIndex < lectureData.length - 1 && (
                        <button
                            onClick={goToNextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black hover:bg-gray-800 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110 cursor-pointer"
                            title="Next Slide"
                        >
                            <ChevronRight size={28} strokeWidth={2.5} />
                        </button>
                    )}

                </div>
            </div>

            {/* Bottom Controls Bar - Icons + Text Labels Layout */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50">
                <div className="flex items-center gap-4">
                    {/* Left: Control Buttons with Icons + Text Labels */}
                    <div className="flex items-center gap-2">

                        {/* ✅ Stop/Start Button - Only pauses/resumes audio, NO popup, NO chatbot */}
                        <button
                            onClick={() => {
                                // Simple toggle - sirf audio pause/resume, koi popup ya chatbot nahi
                                if (currentState === STATES.SLIDE_PLAYING) {
                                    // Stop: Pause audio without any popup
                                    audioManagerRef.current?.pauseSlideAudio();
                                    setCurrentState(STATES.SLIDE_PAUSED);
                                    // NO popup open: setIsQuestionPopupOpen(false) - intentionally not opening
                                } else if (currentState === STATES.SLIDE_PAUSED) {
                                    // Start: Resume audio without any popup
                                    // ✅ FIX: If progress is 0, it means we navigated here and never played -> Play from start
                                    if (playbackProgress === 0) {
                                        playSlide(currentSlideIndex);
                                    } else {
                                        audioManagerRef.current?.resumeSlideAudio();
                                        setCurrentState(STATES.SLIDE_PLAYING);
                                        setIsQuestionPopupOpen(false);
                                    }
                                }
                            }}
                            disabled={currentState === STATES.IDLE || currentState === STATES.CHATBOT_ACTIVE || isChatOpen}
                            className="h-10 px-4 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-white border-2 border-gray-300 hover:bg-gray-100 disabled:opacity-40 disabled:hidden disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                            {currentState === STATES.SLIDE_PLAYING ? (
                                <Pause className="w-4 h-4 text-gray-800" />
                            ) : (
                                <Play className="w-4 h-4 text-gray-800" />
                            )}
                            <span className="text-sm font-semibold text-gray-800">
                                {currentState === STATES.SLIDE_PLAYING ? 'Stop' : 'Start'}
                            </span>
                        </button>

                        {/* Play/Pause/Resume Button - Icon + Text */}
                        <button
                            onClick={() => {
                                // Case 1: Agar chal raha hai to pause karo
                                if (currentState === STATES.SLIDE_PLAYING) {
                                    audioManagerRef.current?.pauseSlideAudio();
                                    setCurrentState(STATES.SLIDE_PAUSED);
                                    setIsQuestionPopupOpen(true);
                                }
                                else {
                                    // Case 2 (FIXED): Agar Paused hai YA Chatbot Active hai, to wahin se RESUME karo
                                    if (currentState === STATES.SLIDE_PAUSED || currentState === STATES.CHATBOT_ACTIVE) {
                                        // ✅ FIX: If progress is 0 and Paused, it means new slide -> Play from start
                                        if (currentState === STATES.SLIDE_PAUSED && playbackProgress === 0) {
                                            playSlide(currentSlideIndex);
                                        } else {
                                            audioManagerRef.current?.resumeSlideAudio();
                                            setCurrentState(STATES.SLIDE_PLAYING);
                                            setIsQuestionPopupOpen(false);
                                        }
                                    }
                                    // Case 3: Agar slide khatam ho gayi hai aur next slide hai
                                    else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
                                        playSlide(currentSlideIndex + 1);
                                    }
                                    // Case 4: Agar bilkul shuru se chalana hai (Restart)
                                    else {
                                        playSlide(currentSlideIndex);
                                    }
                                }
                            }}
                            disabled={isChatOpen || (currentState === STATES.IDLE && lectureData.length === 0) || (currentState === STATES.SLIDE_PLAYING && slideDuration === 0)}
                            className="h-10 px-4 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                            {currentState === STATES.SLIDE_PLAYING ? (
                                <Pause className="w-4 h-4 text-white" />
                            ) : (
                                <Play className="w-4 h-4 text-white" />
                            )}
                            <span className="text-sm font-semibold text-white">
                                {currentState === STATES.SLIDE_PLAYING ? 'Pause' : (currentState === STATES.SLIDE_PAUSED || currentState === STATES.CHATBOT_ACTIVE) ? 'Resume' : 'Play'}
                            </span>
                        </button>

                        {/* Chat Button - Icon + Text */}
                        <button
                            onClick={() => {
                                if (!isChatOpen) {
                                    // Chat Open kar rahe hain -> Pause if playing
                                    if (currentState === STATES.SLIDE_PLAYING || currentState === STATES.SLIDE_PAUSED) {
                                        audioManagerRef.current?.pauseSlideAudio();
                                        setCurrentState(STATES.CHATBOT_ACTIVE);
                                    }
                                    setIsChatOpen(true);
                                } else {
                                    // Chat Close kar rahe hain -> Stop chatbot audio & Resume lecture
                                    audioManagerRef.current?.stopChatbotAudio();

                                    if (currentState === STATES.CHATBOT_ACTIVE) {
                                        audioManagerRef.current?.resumeSlideAudio();
                                        setCurrentState(STATES.SLIDE_PLAYING);
                                    }
                                    setIsChatOpen(false);
                                }
                            }}
                            className={`h-10 px-4 flex cursor-pointer items-center justify-center gap-2 rounded-full border-2 transition-all whitespace-nowrap ${isChatOpen ? 'bg-gray-800 border-gray-900' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
                        >
                            <MessageCircle className={`w-4 h-4 ${isChatOpen ? 'text-white' : 'text-gray-800'}`} />
                            <span className={`text-sm font-semibold ${isChatOpen ? 'text-white' : 'text-gray-800'}`}>
                                {isChatOpen ? 'Close Chat' : 'Open Chat'}
                            </span>
                        </button>
                    </div>

                    {/* Right: Progress Bar - Shows overall lecture progress */}
                    {lectureData.length > 0 && (() => {
                        // Calculate overall progress: (completed slides + current slide progress) / total slides
                        const overallProgress = ((currentSlideIndex + playbackProgress) / lectureData.length) * 100;
                        return (
                            <div className="w-66">
                                <div className="flex justify-between mb-1 text-xs font-semibold text-gray-700">
                                    <span>Slide {currentSlideIndex + 1} / {lectureData.length}</span>
                                    <span>{Math.round(overallProgress)}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full"
                                        style={{
                                            width: `${Math.min(overallProgress, 100)}%`,
                                            transition: 'width 0.15s ease-out',
                                            willChange: 'width'
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* Audio Manager (Invisible Helper) */}
            <AudioManager
                ref={audioManagerRef}
                audioContext={audioContext}
                analyserNode={analyserNode}
                onAudioSourceChange={(source) => {
                    setCurrentAudioSource(source);
                    // ✅ Critical: Connect to recorder immediately if destination exists
                    if (audioDestinationRef.current) {
                        try {
                            source.connect(audioDestinationRef.current);
                        } catch (e) {
                            // ignore
                        }
                    }
                }}
            />

            {/* Question Popup */}
            <QuestionPopup
                isOpen={isQuestionPopupOpen}
                onResponse={handleQuestionResponse}
                onClose={() => handleQuestionResponse('NO')}
            />

            {/* Chatbot */}
            {isChatOpen && (
                <Chatbot
                    messages={messages}
                    pendingMessages={pendingMessages}
                    onSendMessage={handleSendMessage}
                    isWaitingForResponse={isWaitingForResponse}
                    onStopAudio={() => {
                        // ✅ Stop chatbot audio when user starts speaking
                        audioManagerRef.current?.stopChatbotAudio();
                    }}
                    onClose={() => {
                        setIsChatOpen(false);

                        // ✅ Stop chatbot audio when closing
                        audioManagerRef.current?.stopChatbotAudio();

                        // FIX: Agar chat active thi, to turant resume karo bina restart kiye
                        if (currentState === STATES.CHATBOT_ACTIVE) {
                            audioManagerRef.current?.resumeSlideAudio();
                            setCurrentState(STATES.SLIDE_PLAYING);
                        }
                    }}
                />
            )}
        </div>
    );
}

export default LectureVideo;