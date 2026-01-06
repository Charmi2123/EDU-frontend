import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { io } from "socket.io-client";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ChevronLeft, Pause, Play, MessageCircle, Mic, MicOff, SendHorizontal, Download } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handleerror, handlesuccess } from "../../../utils/assets.js";
import Chatbot from "./components/Chatbot";
import QuestionPopup from "./components/QuestionPopup";
import AudioManager from "./components/AudioManager";
import TypingEffect from "./components/TypingEffect";
import useRecorder from "./components/useRecorder";

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
    CHATBOT_ACTIVE: 'CHATBOT_ACTIVE'
};

function LectureVideo({ theme, isDark }) {
    const location = useLocation();
    const navigate = useNavigate();

    // State Management
    const [currentState, setCurrentState] = useState(STATES.IDLE);
    const [lectureData, setLectureData] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState(null);
    const [lectureId, setLectureId] = useState(null);

    // Audio State
    const [audioContext, setAudioContext] = useState(null);
    const [analyserNode, setAnalyserNode] = useState(null);
    const [currentAudioSource, setCurrentAudioSource] = useState(null);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const [slideDuration, setSlideDuration] = useState(0);
    const progressFrameRef = useRef(null);
    const audioManagerRef = useRef(null);

    // Video Ref
    const videoRef = useRef(null);

    // Chat State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([{ id: 1, text: "Hi, Welcome To Class", sender: "system" }]);
    const socketRef = useRef(null);

    // Recording Hook
    const {
        isRecording,
        isPaused: isRecordingPaused,
        hasRecordingData,
        isConverting,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        downloadRecording,
        cleanup: cleanupRecording
    } = useRecorder(audioContext);

    // Question Popup State
    const [isQuestionPopupOpen, setIsQuestionPopupOpen] = useState(false);
    const popupTimeoutRef = useRef(null);

    // Track if recording has ever been started (for download button visibility)
    const [recordingEverStarted, setRecordingEverStarted] = useState(false);

    // Initialize Audio Context
    useEffect(() => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        setAudioContext(ctx);
        setAnalyserNode(analyser);

        return () => {
            if (ctx.state !== 'closed') {
                ctx.close();
            }
            if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
            cleanupRecording();
        };
    }, []);

    // Get lectureId from URL params or location.state
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const idFromUrl = urlParams.get('lectureId');
        const idFromState = location.state?.lectureId;

        const resolvedId = idFromUrl || idFromState;
        setLectureId(resolvedId);
    }, [location.state?.lectureId]);

    // Fetch Lecture Data
    useEffect(() => {
        const fetchLectureData = async () => {
            if (!lectureId) {
                setPageError("Missing Lecture Information");
                setIsLoading(false);
                return;
            }

            setIsLoading(true);

            try {
                const token = localStorage.getItem("access_token") || localStorage.getItem("token");
                const response = await axios.get(`${BACKEND_API_URL}/lectures/${lectureId}/play`, {
                    headers: { Authorization: token ? `Bearer ${token}` : "" }
                });

                if (response.data?.lecture_url) {
                    const detailUrl = BACKEND_API_URL + response.data.lecture_url;
                    const detailRes = await axios.get(detailUrl);
                    const slides = (detailRes.data.slides || []).map((slide, index) => ({
                        audio_url: BACKEND_API_URL + slide.audio_url,
                        title: slide.title || "",
                        bullets: slide.bullets || [],
                        subnarrations: slide.subnarrations || [],
                        narration: slide.narration || "",
                        question: slide.question || "",
                        content_url: slide.content_url || slide.visual_url || slide.image_url || "",
                        video_url: slide.video_url || "",
                        isLastSlide: index === (detailRes.data.slides || []).length - 1
                    }));

                    setLectureData(slides);
                    setCurrentState(STATES.IDLE);
                } else {
                    setPageError("Lecture content not found");
                }
            } catch (error) {
                console.error("Failed to fetch lecture data:", error);
                setPageError("Failed to load lecture data");
            } finally {
                setIsLoading(false);
            }
        };

        if (lectureId) {
            fetchLectureData();
        }
    }, [lectureId]);

    // Progress Tracking Loop
    useEffect(() => {
        let animationFrameId;

        const animateProgress = () => {
            if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0 && audioManagerRef.current && lectureData[currentSlideIndex]) {
                const elapsed = audioManagerRef.current.getSlideElapsed();

                const slide = lectureData[currentSlideIndex];
                const titleLen = slide.title?.length || 0;
                const bulletsLen = slide.bullets.reduce((acc, b) => acc + b.length, 0);
                const narrationLen = slide.narration?.length || 0;
                const totalChars = titleLen + bulletsLen + narrationLen;

                const typingDuration = Math.max(2, totalChars * 0.04);
                const prog = Math.min(elapsed / typingDuration, 1);
                setPlaybackProgress(prog);

                if (elapsed < slideDuration) {
                    animationFrameId = requestAnimationFrame(animateProgress);
                } else {
                    setPlaybackProgress(1);
                }
            }
        };

        if (currentState === STATES.SLIDE_PLAYING && slideDuration > 0) {
            animationFrameId = requestAnimationFrame(animateProgress);
        }

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [currentState, slideDuration, currentSlideIndex, lectureData]);

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

            if (data.audio_url && audioManagerRef.current) {
                audioManagerRef.current.playChatbotAudio(data.audio_url);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Helper functions for recorder
    const getSlideData = useCallback(() => lectureData[currentSlideIndex], [lectureData, currentSlideIndex]);
    const getLogoSrc = useCallback(() => '/inai-logo-light.png', []);
    const getSlideImageSrc = useCallback(() => {
        const slide = lectureData[currentSlideIndex];
        return localImagesMap[currentSlideIndex + 1] || slide?.content_url || null;
    }, [lectureData, currentSlideIndex]);
    const getVideoElement = useCallback(() => videoRef.current, []);
    const getProgress = useCallback(() => playbackProgress, [playbackProgress]);

    // Play Slide
    const playSlide = useCallback(async (index) => {
        if (!lectureData[index] || !audioContext) return;

        if (popupTimeoutRef.current) {
            clearTimeout(popupTimeoutRef.current);
            popupTimeoutRef.current = null;
        }
        setIsQuestionPopupOpen(false);

        setCurrentSlideIndex(index);
        setCurrentState(STATES.SLIDE_PLAYING);
        setPlaybackProgress(0);
        setSlideDuration(0);

        // Resume recording if it was paused
        if (isRecording && isRecordingPaused) {
            resumeRecording(getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress);
        }

        const slide = lectureData[index];
        if (audioManagerRef.current) {
            const { duration } = await audioManagerRef.current.playSlideAudio(slide.audio_url, () => {
                if (progressFrameRef.current) cancelAnimationFrame(progressFrameRef.current);
                setPlaybackProgress(1);

                if (!slide.isLastSlide) {
                    setCurrentState(STATES.QUESTION_WAIT);
                    popupTimeoutRef.current = setTimeout(() => {
                        setIsQuestionPopupOpen(true);
                    }, 1500);
                } else {
                    setCurrentState(STATES.IDLE);
                    if (isRecording) stopRecording();
                }
            }) || { duration: 0 };

            setSlideDuration(duration || 0);
        }
    }, [lectureData, audioContext, isRecording, isRecordingPaused, stopRecording, resumeRecording, getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress]);

    // Handle Question Response
    const handleQuestionResponse = useCallback((response) => {
        setIsQuestionPopupOpen(false);

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
            setCurrentState(STATES.CHATBOT_ACTIVE);
            setIsChatOpen(true);
            if (audioManagerRef.current) {
                audioManagerRef.current.pauseSlideAudio();
            }
            // Pause recording when chatbot opens
            if (isRecording && !isRecordingPaused) {
                pauseRecording();
            }

            if (response && response !== 'YES' && typeof response === 'string') {
                const questionText = response;
                setMessages(prev => [...prev, { id: Date.now(), text: questionText, sender: "user" }]);

                if (socketRef.current?.connected) {
                    socketRef.current.emit("lecture:chat", {
                        lecture_id: lectureId?.toString(),
                        question: questionText
                    });
                }
            }
        }
    }, [currentState, currentSlideIndex, lectureData.length, playSlide, isRecording, isRecordingPaused, stopRecording, pauseRecording, lectureId]);

    // Handle Play/Pause Button
    const handlePlayPause = useCallback(async () => {
        if (currentState === STATES.SLIDE_PLAYING) {
            // PAUSE
            audioManagerRef.current?.pauseSlideAudio();
            setCurrentState(STATES.SLIDE_PAUSED);

            // Pause recording
            if (isRecording && !isRecordingPaused) {
                pauseRecording();
            }
        } else if (currentState === STATES.SLIDE_PAUSED) {
            // RESUME
            audioManagerRef.current?.resumeSlideAudio();
            setCurrentState(STATES.SLIDE_PLAYING);

            // Resume recording
            if (isRecording && isRecordingPaused) {
                resumeRecording(getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress);
            }

            setIsQuestionPopupOpen(false);
        } else if (currentState === STATES.IDLE || currentState === STATES.QUESTION_WAIT) {
            // START or NEXT SLIDE
            if (!isRecording && currentSlideIndex === 0 && playbackProgress === 0) {
                // First play - start recording
                setRecordingEverStarted(true);
                const success = await startRecording(
                    getSlideData,
                    getLogoSrc,
                    getSlideImageSrc,
                    getVideoElement,
                    getProgress,
                    audioManagerRef
                );
                if (success) {
                    playSlide(0);
                }
            } else if (playbackProgress >= 1 && currentSlideIndex < lectureData.length - 1) {
                playSlide(currentSlideIndex + 1);
            } else {
                playSlide(currentSlideIndex);
            }
        }
    }, [currentState, isRecording, isRecordingPaused, currentSlideIndex, playbackProgress, lectureData.length,
        pauseRecording, resumeRecording, startRecording, playSlide,
        getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress]);

    // Handle Chat Open
    const handleChatOpen = useCallback(() => {
        setIsChatOpen(true);

        // Pause lecture audio
        if (currentState === STATES.SLIDE_PLAYING) {
            audioManagerRef.current?.pauseSlideAudio();
            setCurrentState(STATES.CHATBOT_ACTIVE);
        }

        // Pause recording
        if (isRecording && !isRecordingPaused) {
            pauseRecording();
        }
    }, [currentState, isRecording, isRecordingPaused, pauseRecording]);

    // Handle Chat Close
    const handleChatClose = useCallback(() => {
        setIsChatOpen(false);
        // Keep lecture paused - user must manually resume
        if (currentState === STATES.CHATBOT_ACTIVE) {
            setCurrentState(STATES.SLIDE_PAUSED);
        }
        // Recording stays paused until lecture resumes
    }, [currentState]);

    // Handle Download
    const handleDownload = useCallback(async () => {
        if (!hasRecordingData) {
            handleerror("No recording data available");
            return;
        }

        if (isConverting) {
            handleerror("Already preparing download, please wait...");
            return;
        }

        handlesuccess("Preparing recording for download...");
        const success = await downloadRecording();
        if (success) {
            handlesuccess("Recording downloaded successfully!");
        } else {
            handleerror("Failed to download recording");
        }
    }, [hasRecordingData, downloadRecording, isConverting]);

    // Download button state
    const downloadButtonState = useMemo(() => {
        // Button is always visible after recording starts, but enabled/disabled based on state
        if (!recordingEverStarted && !hasRecordingData) {
            return {
                visible: false,
                enabled: false,
                color: 'bg-gray-300',
                textColor: 'text-gray-500',
                cursor: 'cursor-not-allowed',
                tooltip: 'No recording'
            };
        }

        // Converting to MP4
        if (isConverting) {
            return {
                visible: true,
                enabled: false,
                color: 'bg-yellow-500',
                textColor: 'text-white',
                cursor: 'cursor-wait',
                tooltip: 'Converting to MP4...'
            };
        }

        // Recording active (not paused) - show but disable
        if (isRecording && !isRecordingPaused) {
            return {
                visible: true,
                enabled: false,
                color: 'bg-gray-400',
                textColor: 'text-gray-200',
                cursor: 'cursor-not-allowed',
                tooltip: 'Recording in progress...'
            };
        }

        // Paused with data - enabled
        if (hasRecordingData) {
            return {
                visible: true,
                enabled: true,
                color: 'bg-green-500 hover:bg-green-600',
                textColor: 'text-white',
                cursor: 'cursor-pointer',
                tooltip: 'Download Recording'
            };
        }

        // Default disabled state
        return {
            visible: true,
            enabled: false,
            color: 'bg-gray-300',
            textColor: 'text-gray-500',
            cursor: 'cursor-not-allowed',
            tooltip: 'Waiting...'
        };
    }, [recordingEverStarted, isRecording, isRecordingPaused, hasRecordingData, isConverting]);

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
                onAudioSourceChange={setCurrentAudioSource}
            />

            {/* ============================================ */}
            {/* MAIN LECTURE CONTENT - RECORDABLE AREA      */}
            {/* ============================================ */}
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
                    <div className="flex-1 relative w-full h-full">

                        {currentSlide && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-4/5 overflow-y-auto p-8">
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
                                                        <TypingEffect
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
                                            <TypingEffect
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

                    {currentSlide?.video_url ? (
                        <div className="flex-1 w-full h-full flex items-center justify-center p-4">
                            <video
                                ref={videoRef}
                                src={currentSlide.video_url}
                                className="max-w-full max-h-full rounded-lg shadow-lg"
                                controls={false}
                                muted={true}
                                playsInline
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    ) : (localImagesMap[currentSlideIndex + 1] || currentSlide?.content_url) ? (
                        <div className={`flex-1 w-full h-full flex items-center justify-center transition-opacity duration-700 ${currentState === STATES.SLIDE_PLAYING || playbackProgress > 0 ? 'opacity-100' : 'opacity-0'}`}>
                            {(localImagesMap[currentSlideIndex + 1] || currentSlide.content_url).match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                                <img
                                    src={localImagesMap[currentSlideIndex + 1] || currentSlide.content_url}
                                    alt="Slide Content"
                                    className="w-full h-min rounded-lg shadow-lg"
                                />
                            ) : (
                                <iframe
                                    src={currentSlide.content_url}
                                    className="w-full h-full border-0 rounded-lg shadow-lg"
                                    title="Slide Content"
                                    allowFullScreen
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium text-lg italic">
                        </div>
                    )}

                </div>
            </div>

            {/* ============================================ */}
            {/* CONTROLS - NEVER RECORDED                   */}
            {/* ============================================ */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-50">
                {/* Play/Pause Button */}
                <button
                    onClick={handlePlayPause}
                    disabled={lectureData.length === 0}
                    className="w-16 h-16 flex items-center justify-center rounded-full bg-gray-800 border-2 border-gray-900 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    {currentState === STATES.SLIDE_PLAYING ? (
                        <Pause className="w-6 h-6 text-white" />
                    ) : (
                        <Play className="w-6 h-6 text-white ml-1" />
                    )}
                </button>

                {/* Chat Button */}
                <button
                    onClick={isChatOpen ? handleChatClose : handleChatOpen}
                    disabled={lectureData.length === 0}
                    className={`w-16 h-16 flex items-center justify-center rounded-full border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isChatOpen ? 'bg-gray-800 border-gray-900' : 'bg-white border-gray-800'}`}
                >
                    <MessageCircle className={`w-6 h-6 ${isChatOpen ? 'text-white' : 'text-gray-800'}`} />
                </button>

                {/* Download Button - Next to Chat */}
                {downloadButtonState.visible && (
                    <button
                        onClick={handleDownload}
                        disabled={!downloadButtonState.enabled || isConverting}
                        className={`w-16 h-16 flex items-center justify-center rounded-full border-2 border-gray-300 transition-all ${downloadButtonState.color} ${downloadButtonState.cursor}`}
                        title={downloadButtonState.tooltip}
                    >
                        {isConverting ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <Download className={`w-6 h-6 ${downloadButtonState.textColor}`} />
                        )}
                    </button>
                )}
            </div>

            {/* Progress Bar - NEVER RECORDED */}
            {lectureData.length > 0 && (
                <div className="absolute bottom-26 left-0 right-0 px-6 z-20">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex justify-between mb-2 text-sm font-semibold text-gray-800">
                            <span>Slide {currentSlideIndex + 1} / {lectureData.length}</span>
                            <span>{Math.round(((currentSlideIndex + 1) / lectureData.length) * 100)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div className="h-full bg-linear-to-r from-blue-500 to-purple-500 rounded-full transition-all" style={{ width: `${((currentSlideIndex + 1) / lectureData.length) * 100}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
                <div className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-red-500 rounded-full shadow-lg">
                    <div className={`w-3 h-3 rounded-full bg-white ${isRecordingPaused ? '' : 'animate-pulse'}`} />
                    <span className="text-white text-sm font-semibold">
                        {isRecordingPaused ? 'REC PAUSED' : 'REC'}
                    </span>
                </div>
            )}

            {/* Question Popup - NEVER RECORDED */}
            <QuestionPopup
                isOpen={isQuestionPopupOpen}
                onResponse={handleQuestionResponse}
                onClose={() => handleQuestionResponse('NO')}
            />

            {/* Chatbot - NEVER RECORDED */}
            {isChatOpen && (
                <Chatbot
                    messages={messages}
                    onSendMessage={(text) => {
                        setMessages(prev => [...prev, { id: Date.now(), text, sender: "user" }]);
                        if (socketRef.current?.connected) {
                            socketRef.current.emit("lecture:chat", {
                                lecture_id: lectureId?.toString(),
                                question: text
                            });
                        }
                    }}
                    onClose={handleChatClose}
                />
            )}
        </div>
    );
}

export default LectureVideo;