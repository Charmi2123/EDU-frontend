import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useLocation, useNavigate } from "react-router-dom";
import { Pencil, Mic, Paperclip, Camera, Send, PencilOff, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL } from "../../../utils/assets";

function NarrationPage({ theme = 'dark', isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter" }) {
    const isDark = typeof isDarkProp === 'boolean' ? isDarkProp : theme === 'dark';

    const location = useLocation();
    const navigate = useNavigate();
    const navState = location.state || {};
    const lectureId = navState.lectureId || null;

    const [slides, setSlides] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [isLoadingSlides, setIsLoadingSlides] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [generatedLectureId, setGeneratedLectureId] = useState(null);
    const [narration, setNarration] = useState("");
    const [originalNarration, setOriginalNarration] = useState("");
    const [isManualEdit, setIsManualEdit] = useState(false);
    const [showPromptBar, setShowPromptBar] = useState(false);
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);

    const messagesEndRef = useRef(null);
    const messagesStartRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const mainScrollRef = useRef(null); // main scrollable area
    const narrationContentRef = useRef(null);
    const bulletsContentRef = useRef(null);
    const questionContentRef = useRef(null);
    const [isAtTop, setIsAtTop] = useState(true);
    const [isAtBottom, setIsAtBottom] = useState(true);
    const [isMathJaxReady, setIsMathJaxReady] = useState(false);

    const handlePromptSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        const next = { id: Date.now(), text: prompt.trim() };
        setMessages((prev) => [...prev, next]);
        setPrompt("");
    };

    useEffect(() => {
        // After new message, scroll main content to bottom smoothly
        const el = mainScrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            setIsAtTop(scrollTop <= 2);
            setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 2);
        };

        // scroll to bottom on new message
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        handleScroll();
    }, [messages]);

    useEffect(() => {
        const el = mainScrollRef.current;
        if (!el) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = el;
            setIsAtTop(scrollTop <= 2);
            setIsAtBottom(scrollTop + clientHeight >= scrollHeight - 2);
        };

        el.addEventListener("scroll", handleScroll);
        // Initialize once
        handleScroll();

        return () => {
            el.removeEventListener("scroll", handleScroll);
        };
    }, []);

    const scrollMessagesToTop = () => {
        const el = mainScrollRef.current;
        if (el) {
            el.scrollTo({ top: 0, behavior: "smooth" });
        }
    };

    const scrollMessagesToBottom = () => {
        const el = mainScrollRef.current;
        if (el) {
            el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
    };

    const cardCls = `${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-4 sm:p-5 transition-colors duration-200`;

    const lastFetchedLectureId = useRef(null);

    useEffect(() => {
        let attempt = 0;
        const timer = setInterval(() => {
            attempt += 1;
            if (window.MathJax?.typesetPromise) {
                setIsMathJaxReady(true);
                clearInterval(timer);
            }
            if (attempt > 20) {
                clearInterval(timer);
            }
        }, 250);
        return () => clearInterval(timer);
    }, []);



    useEffect(() => {
        const fetchSlides = async () => {
            if (!lectureId) return;

            if (lastFetchedLectureId.current === lectureId) return;
            lastFetchedLectureId.current = lectureId;
            setIsLoadingSlides(true);
            setLoadingProgress(0);

            // Simulate progress while waiting for API
            const progressInterval = setInterval(() => {
                setLoadingProgress((prev) => {
                    // Progress slows down as it approaches 90%
                    if (prev < 30) return prev + 3;
                    if (prev < 60) return prev + 2;
                    if (prev < 85) return prev + 1;
                    if (prev < 90) return prev + 0.5;
                    if (prev < 92) return prev + 0.2;
                    if (prev < 99) return prev + 0.15;
                    return prev; // Stop at 90% until API responds
                });
            }, 1200);

            try {
                const token = localStorage.getItem('access_token');
                const response = await axios.post(
                    `${BACKEND_API_URL}/chapter-materials/chapter_lecture/generate/${lectureId}`,
                    {},
                    {
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }
                );

                const lecture = response?.data?.data?.lecture;
                if (lecture && Array.isArray(lecture.slides)) {
                    // API responded successfully - complete the progress bar
                    setLoadingProgress(100);
                    // Store the generated lecture_id from API response
                    setGeneratedLectureId(lecture.lecture_id);
                    setSlides(lecture.slides);
                    setCurrentSlideIndex(0);
                    const firstNarration = lecture.slides[0]?.narration || "";
                    setNarration(firstNarration);
                    setOriginalNarration(firstNarration);
                }
            } catch (error) {
                console.error('Error generating lecture slides:', error);
                setLoadingProgress(100); // Complete progress even on error
            } finally {
                clearInterval(progressInterval);
                // Small delay before hiding loader to show 100% completion
                setTimeout(() => {
                    setIsLoadingSlides(false);
                    setLoadingProgress(0);
                }, 500);
            }
        };

        fetchSlides();
    }, [lectureId]);

    // Function to regenerate slides
    const handleRegenerate = async () => {
        if (!lectureId) return;

        setIsLoadingSlides(true);
        setLoadingProgress(0);
        setIsManualEdit(false);

        // Simulate progress while waiting for API
        const progressInterval = setInterval(() => {
            setLoadingProgress((prev) => {
                // Progress slows down as it approaches 90%
                if (prev < 30) return prev + 3;
                if (prev < 60) return prev + 2;
                if (prev < 85) return prev + 1;
                if (prev < 90) return prev + 0.5;
                if (prev < 92) return prev + 0.2;
                if (prev < 99) return prev + 0.15;
                return prev; // Stop at 90% until API responds
            });
        }, 1200);

        try {
            const token = localStorage.getItem('access_token');
            const response = await axios.post(
                `${BACKEND_API_URL}/chapter-materials/chapter_lecture/generate/${lectureId}`,
                {},
                {
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            const lecture = response?.data?.data?.lecture;
            if (lecture && Array.isArray(lecture.slides)) {
                setLoadingProgress(100);
                setGeneratedLectureId(lecture.lecture_id);
                setSlides(lecture.slides);
                setCurrentSlideIndex(0);
                const firstNarration = lecture.slides[0]?.narration || "";
                setNarration(firstNarration);
                setOriginalNarration(firstNarration);
                handlesuccess("Lecture regenerated successfully");
            }
        } catch (error) {
            console.error('Error regenerating lecture slides:', error);
            handleerror("Failed to regenerate lecture");
            setLoadingProgress(100);
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setIsLoadingSlides(false);
                setLoadingProgress(0);
            }, 500);
        }
    };

    const currentSlide = slides.length > 0 ? slides[currentSlideIndex] : null;

    const mathSignature = [
        narration,
        (currentSlide?.bullets || []).join('||'),
        currentSlide?.question || '',
        currentSlideIndex
    ].join('__');

    useEffect(() => {
        if (!isMathJaxReady) return;
        const containers = [narrationContentRef.current, bulletsContentRef.current, questionContentRef.current].filter(Boolean);
        if (!containers.length) return;
        const typeset = async () => {
            try {
                window.MathJax?.typesetClear?.(containers);
                await window.MathJax?.typesetPromise?.(containers);
            } catch (error) {
                // minor error suppress
            }
        };
        typeset();
    }, [isMathJaxReady, mathSignature, isDark, theme]);

    // Add global style for MathJax overflow handling and error hiding
    useEffect(() => {
        const style = document.createElement('style');
        style.id = 'mathjax-custom-styles';
        style.innerHTML = `
            mjx-container {
                overflow: visible !important;
                white-space: normal !important;
                max-width: 100%;
                display: inline-block !important;
                vertical-align: middle !important;
            }
            .mjx-chtml {
                outline: none !important;
            }
            /* Hide ALL MathJax error colors - completely remove red text */
            mjx-merror,
            mjx-merror *,
            mjx-container mjx-merror,
            mjx-container mjx-merror *,
            .MathJax mjx-merror,
            .MathJax mjx-merror * {
                color: inherit !important;
                background: transparent !important;
                background-color: transparent !important;
                border: none !important;
                box-shadow: none !important;
            }
            .MathJax_Error,
            .MathJax_Error * {
                color: inherit !important;
                background: transparent !important;
                background-color: transparent !important;
            }
            mjx-container[jax="CHTML"] mjx-merror,
            mjx-container[jax="CHTML"] mjx-merror *,
            mjx-container[jax="SVG"] mjx-merror,
            mjx-container[jax="SVG"] mjx-merror * {
                color: inherit !important;
                fill: currentColor !important;
            }
            /* Override any inline red color styles */
            [style*="color: red"],
            [style*="color:red"],
            [style*="color: #d00"],
            [style*="color:#d00"],
            [style*="color: #cc0000"],
            [style*="color:#cc0000"] {
                color: inherit !important;
            }
            /* Ensure fractions display properly */
            mjx-mfrac {
                display: inline-block !important;
                vertical-align: middle !important;
            }
            mjx-frac {
                display: inline-block !important;
            }
        `;
        // Remove existing style if present
        const existingStyle = document.getElementById('mathjax-custom-styles');
        if (existingStyle) {
            existingStyle.remove();
        }
        document.head.appendChild(style);
        return () => {
            const styleToRemove = document.getElementById('mathjax-custom-styles');
            if (styleToRemove) {
                styleToRemove.remove();
            }
        };
    }, []);

    const handlePrevSlide = () => {
        if (currentSlideIndex > 0) {
            const nextIndex = currentSlideIndex - 1;
            setCurrentSlideIndex(nextIndex);
            const nextNarration = slides[nextIndex]?.narration || "";
            setNarration(nextNarration);
            setOriginalNarration(nextNarration);
        }
    };

    const handleNextSlide = () => {
        if (currentSlideIndex < slides.length - 1) {
            const nextIndex = currentSlideIndex + 1;
            setCurrentSlideIndex(nextIndex);
            const nextNarration = slides[nextIndex]?.narration || "";
            setNarration(nextNarration);
            setOriginalNarration(nextNarration);
        }
    };

    return (
        <div className={`relative flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-[#F5F5F9] text-zinc-900'} min-h-screen overflow-y-hidden transition-colors duration-300`}>
            {/* Full-page loading overlay with circular progress */}
            {isLoadingSlides && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-6">
                        {/* Circular Progress */}
                        <div className="relative w-40 h-40">
                            {/* Background Circle */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="#d4d4d8"
                                    strokeWidth="10"
                                    fill="none"
                                    opacity="0.3"
                                />
                                {/* Progress Circle */}
                                <circle
                                    cx="80"
                                    cy="80"
                                    r="70"
                                    stroke="#696CFF"
                                    strokeWidth="10"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 70}`}
                                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - loadingProgress / 102)}`}
                                    strokeLinecap="round"
                                    className="transition-all duration-300 ease-out"
                                />
                            </svg>
                            {/* Percentage Text */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-4xl font-bold text-white">
                                    {Math.round(loadingProgress)}%
                                </span>
                            </div>
                        </div>

                        {/* Loading Text */}
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-white">
                                Generating Lecture
                            </h3>
                            <p className="text-sm text-gray-300">
                                Please wait while we generate your content...
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300`}>
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* Scrollable content */}
                <main ref={mainScrollRef} className="mt-4 sm:mt-6 flex-1 overflow-y-auto no-scrollbar">
                    <div className="w-full mx-auto space-y-4">
                        {/* Toolbar row (sticky) */}
                        <div className={`${isDark ? 'bg-linear-to-r from-zinc-900/95 via-zinc-900/90 to-zinc-900/95' : 'bg-linear-to-r from-white/95 via-[#f5f5ff]/95 to-white/95'} sticky top-0 z-30 border border-transparent rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}
                        >
                            <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
                                <button
                                    onClick={() => navigate(-1)}
                                    className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                                    Narration
                                </h2>
                            </div>
                            <div className="flex gap-2 max-w-fit justify-center items-center">
                                {/* <button
                                    onClick={() => navigate(backto, {
                                        state: {
                                            lectureId
                                        }
                                    })}
                                    className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full flex justify-center items-center cursor-pointer px-4 py-1.5 rounded-md text-sm transition-colors duration-200`}
                                >
                                    Cancel
                                </button> */}
                                {/* <button
                                    onClick={() => {
                                        setNarration(originalNarration);
                                        setIsManualEdit(false);
                                    }}
                                    className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} max-w-fit flex justify-center items-center cursor-pointer px-4 py-1.5 rounded-md text-sm hover:shadow transition-all duration-200`}
                                >
                                    ReGenerate
                                </button> */}
                                <button
                                    onClick={handleRegenerate}
                                    disabled={isLoadingSlides}
                                    className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} max-w-fit flex justify-center items-center cursor-pointer px-4 py-1.5 rounded-md text-sm hover:shadow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {isLoadingSlides ? 'Regenerating...' : 'ReGenerate'}
                                </button>
                            </div>
                        </div>

                        {/* Narration card */}
                        <div className={`${cardCls} flex flex-col relative overflow-hidden`}>
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg sm:text-xl font-semibold`}
                                >
                                    {currentSlide ? currentSlide.title : 'Lecture Narration'}
                                </div>
                                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-[11px] mt-1`}
                                >
                                    {slides.length > 0
                                        ? `Slide ${currentSlideIndex + 1} of ${slides.length}`
                                        : 'Browse narration from your lecture once generated'}
                                </p>
                            </div>

                            <div className="absolute top-4 right-4 flex items-center gap-2">
                                {showPromptBar && (
                                    <button
                                        type="button"
                                        onClick={() => setIsManualEdit((prev) => !prev)}
                                        className={`p-2 rounded-md border-none ${isDark ? 'border-zinc-700' : 'border-zinc-300'} cursor-pointer transition-colors duration-200`}
                                        aria-label="Enable manual edit"
                                    >
                                        {isManualEdit ? <PencilOff size={14} /> : <Pencil size={14} />}
                                    </button>
                                )}

                                {/* <button
                                    type="button"
                                    onClick={() => {
                                        setNarration(originalNarration);
                                        setIsManualEdit(false);
                                    }}
                                    className={`${isDark
                                        ? 'bg-white text-zinc-800 hover:bg-[#f2f3ff] border border-zinc-700'
                                        : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'
                                        } px-3 py-1.5 rounded-md text-[11px] sm:text-xs border ${isDark ? 'border-zinc-700' : 'border-zinc-300'} cursor-pointer inline-flex items-center gap-1 transition-all duration-200`}
                                >
                                    Re Generate <RotateCcw size={14} />
                                </button> */}
                            </div>

                            {/* Slide narration content */}
                            <div className={`${isDark ? 'text-gray-100' : 'text-gray-900'} mt-2 space-y-3`}>
                                {!isLoadingSlides && slides.length === 0 && (
                                    <div className="text-xs text-gray-400 text-center py-6">
                                        No lecture narration available yet.
                                    </div>
                                )}

                                {!isLoadingSlides && currentSlide && (
                                    <div className="flex items-start gap-3 sm:gap-4">
                                        {/* Left arrow - Controls all sections */}
                                        <button
                                            type="button"
                                            onClick={handlePrevSlide}
                                            disabled={currentSlideIndex === 0}
                                            className={`hidden sm:flex items-center justify-center h-10 w-10 rounded-full border cursor-pointer ${isDark ? 'border-zinc-700 text-gray-300 hover:bg-zinc-800/60' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 mt-2`}
                                        >
                                            <ChevronLeft size={18} />
                                        </button>

                                        {/* Content sections */}
                                        {/* Helper function to process content for MathJax and Hindi */}
                                        {(() => {
                                            const processContent = (text) => {
                                                if (!text) return "";

                                                let s = text;

                                                // Step 1: Unescape double-escaped characters
                                                s = s.replace(/\\\\\\\\/g, '\\\\');
                                                s = s.replace(/\\\\\$/g, '');

                                                // Step 2: Fix common LaTeX issues that cause errors
                                                // Fix unbalanced braces in \frac - ensure proper format
                                                s = s.replace(/\\frac\s*([^{])/g, '\\frac{$1}');

                                                // Fix pipe characters for determinants/matrices - convert to \vert
                                                s = s.replace(/\|([^|]+)\|/g, '\\lvert $1 \\rvert');

                                                // Fix issues with subscripts without braces
                                                s = s.replace(/_([a-zA-Z0-9])([a-zA-Z0-9])/g, '_{$1$2}');

                                                // Step 3: Convert $$ ... $$ to \[ ... \] for display math (MathJax compatible)
                                                s = s.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
                                                    // Check for Indic/Hindi characters - don't render as math
                                                    if (/[\u0900-\u0DFF]/.test(content)) {
                                                        return content.replace(/\\/g, '');
                                                    }
                                                    return `\\[${content}\\]`;
                                                });

                                                // Step 4: Convert $ ... $ to \( ... \) for inline math (MathJax compatible)
                                                s = s.replace(/\$([^$]+?)\$/g, (match, content) => {
                                                    // Check for Indic/Hindi characters - don't render as math
                                                    if (/[\u0900-\u0DFF]/.test(content)) {
                                                        return content.replace(/\\/g, '');
                                                    }
                                                    return `\\(${content}\\)`;
                                                });

                                                // Step 5: Remove ALL remaining stray dollar signs
                                                s = s.replace(/\$/g, '');

                                                // Step 6: Clean up multiple spaces but preserve newlines
                                                s = s.replace(/[ \t]+/g, ' ');

                                                return s;
                                            };

                                            return (
                                                <div className="flex-1 space-y-3">
                                                    {/* Bullets Section */}
                                                    {currentSlide?.bullets && currentSlide.bullets.length > 0 && (
                                                        <div ref={bulletsContentRef} className={`rounded-2xl border ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-white'} px-4 sm:px-5 py-3 sm:py-4`}>
                                                            <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                                                                Key Points
                                                            </div>
                                                            <ul className="space-y-2.5 pl-1">
                                                                {currentSlide.bullets.map((point, index) => (
                                                                    <li key={index} className="flex items-start gap-2.5">
                                                                        <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${isDark ? 'bg-blue-400' : 'bg-[#696CFF]'}`}></span>
                                                                        <span className="flex-1 text-[17px] leading-8">
                                                                            {processContent(point)}
                                                                        </span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Narration Box */}
                                                    {narration && narration.trim() && (
                                                        <div
                                                            key={currentSlideIndex}
                                                            className={`rounded-2xl border ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-white'} px-4 sm:px-5 py-3 sm:py-4 transition-all duration-300 ease-out`}
                                                        >
                                                            <div className="flex items-center justify-between mb-2">
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                                                    Slide Narration
                                                                </div>
                                                                <span className="text-[11px] text-gray-400">
                                                                    {currentSlideIndex + 1} / {slides.length}
                                                                </span>
                                                            </div>

                                                            {isManualEdit ? (
                                                                <textarea
                                                                    value={narration}
                                                                    onChange={(e) => setNarration(e.target.value)}
                                                                    className={`${isDark ? 'bg-zinc-900 text-gray-100 border-zinc-700' : 'bg-white text-zinc-900 border-zinc-300'} text-sm leading-relaxed text-justify w-full rounded-lg border px-3 py-2 h-[37vh] md:h-[40vh] lg:h-[40vh] xl:h-[40vh] overflow-y-auto no-scrollbar resize-none`}
                                                                    placeholder="Edit narration manually here"
                                                                />
                                                            ) : (
                                                                <div ref={narrationContentRef} className="text-[17px] leading-8 text-left max-h-[27vh] md:max-h-[30vh] lg:max-h-[30vh] xl:max-h-[30vh] overflow-y-auto pr-1 no-scrollbar space-y-3">
                                                                    {narration.split(/\\n|\n/).map((line, i) => {
                                                                        if (!line.trim()) return <br key={i} />;

                                                                        const cleanLine = processContent(line);

                                                                        // Parse bold markdown (**text**)
                                                                        const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
                                                                        return (
                                                                            <p key={i} className="leading-8">
                                                                                {parts.map((part, index) => {
                                                                                    if (part.startsWith('**') && part.endsWith('**')) {
                                                                                        return <strong key={index} className="font-bold text-gray-900 dark:text-gray-100">{part.slice(2, -2)}</strong>;
                                                                                    }
                                                                                    return <span key={index}>{part}</span>;
                                                                                })}
                                                                            </p>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Questions Section - Only show on last slide */}
                                                    {currentSlide?.question && currentSlide.question.trim() && currentSlideIndex === slides.length - 1 && (
                                                        <div className={`rounded-2xl border ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-zinc-200 bg-white'} px-4 sm:px-5 py-3 sm:py-4`}>
                                                            <div className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
                                                                Questions
                                                            </div>
                                                            <div ref={questionContentRef} className={`${isDark ? 'bg-zinc-900/50 border-zinc-700' : 'bg-blue-50 border-blue-200'} border rounded-lg p-3`}>
                                                                <p className="text-[17px] leading-8 whitespace-pre-line">
                                                                    {processContent(currentSlide.question)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Show message only if everything is empty */}
                                                    {!narration?.trim() && (!currentSlide?.bullets || currentSlide.bullets.length === 0) && !currentSlide?.question?.trim() && (
                                                        <div className="text-center py-6 text-gray-400 text-sm">
                                                            No content available for this slide.
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}

                                        {/* Right arrow - Controls all sections */}
                                        <button
                                            type="button"
                                            onClick={handleNextSlide}
                                            disabled={currentSlideIndex >= slides.length - 1}
                                            className={`hidden sm:flex items-center justify-center h-10 w-10 rounded-full border cursor-pointer ${isDark ? 'border-zinc-700 text-gray-300 hover:bg-zinc-800/60' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 mt-2`}
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                )}

                                {/* Mobile arrows below card */}
                                {!isLoadingSlides && currentSlide && (
                                    <div className="flex sm:hidden items-center justify-center gap-4 mt-3">
                                        <button
                                            type="button"
                                            onClick={handlePrevSlide}
                                            disabled={currentSlideIndex === 0}
                                            className={`flex items-center justify-center h-9 w-9 rounded-full border cursor-pointer ${isDark ? 'border-zinc-700 text-gray-300 hover:bg-zinc-800/60' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105`}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span className="text-[11px] text-gray-400">
                                            {currentSlideIndex + 1} / {slides.length}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleNextSlide}
                                            disabled={currentSlideIndex >= slides.length - 1}
                                            className={`flex items-center justify-center h-9 w-9 rounded-full border cursor-pointer ${isDark ? 'border-zinc-700 text-gray-300 hover:bg-zinc-800/60' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-100'} disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105`}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                        </div>
                        {/* Action buttons - stay attached to the bottom of the card (hidden once edit/chat is enabled) */}
                        {!showPromptBar && (
                            <div className="mt-4 pt-2 flex flex-row gap-4 sm:gap-4">
                                <button
                                    onClick={() => navigate("/chapter/CoverPage", { state: { lectureId: generatedLectureId } })}
                                    className={`${isDark
                                        ? 'bg-white text-zinc-800 hover:bg-[#f2f3ff] border border-zinc-700'
                                        : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'
                                        } w-full sm:w-28 md:w-32 px-4 py-2 rounded-md text-xs sm:text-sm cursor-pointer flex justify-center items-center transition-all duration-200 hover:shadow`}
                                >
                                    Generate
                                </button>

                                {/* <button
                                    type="button"
                                    onClick={() => {
                                        setShowPromptBar(true);
                                        setIsManualEdit(false);
                                    }}
                                    className={`${isDark ? 'bg-zinc-800 text-gray-100 hover:bg-zinc-700' : 'bg-white text-[#696CFF] hover:bg-[#f9faff] border border-[#696CFF]/40'} w-full sm:w-28 md:w-32 px-4 py-2 rounded-md text-xs sm:text-sm cursor-pointer shadow-md hover:shadow-lg transition-all duration-200`}
                                >
                                    Edit
                                </button> */}
                            </div>
                        )}

                        {/* Prompt bar for AI-based edits */}
                        {showPromptBar && (
                            <div className="mt-4 space-y-3">
                                {/* Simple chat-like history (right aligned bubbles) */}
                                {messages.length > 0 && (
                                    <div className="rounded-2xl p-3 py-3 border-none transparent transition-colors duration-200">
                                        <div
                                            ref={messagesContainerRef}
                                            className="space-y-2 no-scrollbar pr-1"
                                        >
                                            <div ref={messagesStartRef} />
                                            {messages.map((m) => (
                                                <div key={m.id} className="flex justify-end">
                                                    <div
                                                        className={`inline-block max-w-full rounded-2xl px-3 py-2 text-xs sm:text-sm ${isDark ? 'bg-white text-zinc-900' : 'bg-white border border-zinc-200 text-zinc-900'}`}
                                                    >
                                                        {m.text}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    </div>
                                )}

                                {/* Prompt input row with icons, fixed at bottom like chat */}
                                <form onSubmit={handlePromptSubmit}>
                                    <div
                                        style={{ position: "fixed", bottom: 18, width: "-webkit-fill-available" }}
                                        className="md:left-5 md:right-5 lg:left-28 lg:right-28 px-4 md:pl-24 lg:pl-80 md:pr-6 flex items-center gap-3 relative"
                                    >
                                        {/* Center floating scroll arrow like ChatGPT */}
                                        {messages.length > 1 && !(isAtTop && isAtBottom) && (
                                            <button
                                                type="button"
                                                onClick={isAtBottom ? scrollMessagesToTop : scrollMessagesToBottom}
                                                className={`${isDark
                                                    ? 'bg-zinc-900 text-gray-200 hover:bg-zinc-800'
                                                    : 'bg-white text-zinc-800 border border-zinc-200 hover:bg-zinc-100'
                                                    } flex items-center justify-center w-8 h-8 rounded-full cursor-pointer transition-colors duration-200 absolute -top-[50px] left-1/2 lg:left-[60%] -translate-x-1/2`}
                                                aria-label={isAtBottom ? 'Scroll to first message' : 'Scroll to last message'}
                                            >
                                                {isAtBottom ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </button>
                                        )}
                                        {/* Grey pill textbox that auto-fills width */}
                                        <div
                                            className={`${isDark
                                                ? 'bg-zinc-900/95 text-gray-200 border-zinc-700'
                                                : 'bg-white/95 text-zinc-900 border-zinc-200'
                                                } flex-1 rounded-full px-4 sm:px-6 py-3 flex items-center gap-3 border`}
                                        >
                                            <input
                                                type="text"
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder="Any Specification say it"
                                                className={`${isDark ? 'bg-transparent text-gray-200 placeholder-gray-500' : 'bg-transparent text-zinc-900 placeholder-zinc-400'} flex-1 text-xs sm:text-sm outline-none`}
                                            />

                                            <div className="flex items-center gap-2 text-zinc-400">
                                                <button type="button" className="p-1 rounded-full hover:bg-zinc-800/60 cursor-pointer transition-colors duration-200">
                                                    <Paperclip size={16} />
                                                </button>
                                                <button type="button" className="p-1 rounded-full hover:bg-zinc-800/60 cursor-pointer transition-colors duration-200">
                                                    <Camera size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        {/* Mic/Send circle to the right of textbox */}
                                        {prompt.trim() ? (
                                            <button
                                                type="submit"
                                                className={`${isDark
                                                    ? 'bg-linear-to-br from-[#696CFF] to-[#9C6BFF] text-white hover:from-[#5a5dff] hover:to-[#8b5fff]'
                                                    : 'bg-linear-to-br from-[#696CFF] to-[#9C6BFF] text-white hover:from-[#5a5dff] hover:to-[#8b5fff]'
                                                    } flex items-center justify-center w-9 h-9 rounded-full text-xs sm:text-sm cursor-pointer shadow-md hover:shadow-lg transition-all duration-200`}
                                            >
                                                <Send size={16} />
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                className={`${isDark
                                                    ? 'bg-white text-zinc-900'
                                                    : 'bg-zinc-900 text-white'
                                                    } flex items-center justify-center w-9 h-9 rounded-full cursor-pointer shadow-md hover:shadow-lg transition-all duration-200`}
                                            >
                                                <Mic size={16} />
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </main>
            </div >
        </div >
    );
}

export default NarrationPage;
