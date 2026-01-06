import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getAsset } from "../../../utils/assets.js";
import { ArrowRight, ChevronRight } from "lucide-react";

function RoleFeatures({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(null); // null = not determined yet
    const [showIntro, setShowIntro] = useState(true);

    // Drag/Swipe states - using refs to avoid stale closures
    const [dragProgress, setDragProgress] = useState(0);
    const [isDragging, setIsDragging] = useState(false); // For visual feedback
    const [isCompleted, setIsCompleted] = useState(false);
    const buttonRef = useRef(null);
    const isDraggingRef = useRef(false);
    const startXRef = useRef(0);
    const progressRef = useRef(0);

    // Detect mobile screen size - runs immediately on mount
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        checkMobile(); // Check immediately
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle drag start
    const handleDragStart = useCallback((e) => {
        if (isCompleted) return;
        e.preventDefault();
        isDraggingRef.current = true;
        setIsDragging(true);
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        startXRef.current = clientX - (progressRef.current / 100) * (buttonRef.current?.offsetWidth - 56 || 250);
    }, [isCompleted]);

    // Handle drag move
    const handleDragMove = useCallback((e) => {
        if (!isDraggingRef.current || isCompleted) return;
        e.preventDefault();

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const buttonWidth = buttonRef.current?.offsetWidth || 300;
        const maxDrag = buttonWidth - 56;

        const deltaX = clientX - startXRef.current;
        const progress = Math.min(Math.max((deltaX / maxDrag) * 100, 0), 100);

        progressRef.current = progress;
        setDragProgress(progress);

        // If dragged to the end (>85%), complete the action
        if (progress >= 85) {
            isDraggingRef.current = false;
            setIsDragging(false);
            setIsCompleted(true);
            setDragProgress(100);
            progressRef.current = 100;

            setTimeout(() => {
                setShowIntro(false);
            }, 400);
        }
    }, [isCompleted]);

    // Handle drag end
    const handleDragEnd = useCallback(() => {
        if (isCompleted) return;
        isDraggingRef.current = false;
        setIsDragging(false);

        if (progressRef.current < 85) {
            setDragProgress(0);
            progressRef.current = 0;
        }
    }, [isCompleted]);

    // Add global event listeners
    useEffect(() => {
        const handleMove = (e) => handleDragMove(e);
        const handleEnd = () => handleDragEnd();

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleMove, { passive: false });
        window.addEventListener('touchend', handleEnd);
        window.addEventListener('touchcancel', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleEnd);
            window.removeEventListener('touchcancel', handleEnd);
        };
    }, [handleDragMove, handleDragEnd]);

    // Mobile/Tablet Intro Screen - Same vertical layout, no scrolling
    const IntroScreen = () => (
        <div className={`w-screen h-screen max-h-screen overflow-hidden animate-fadeIn flex flex-col ${isDark ? 'bg-black' : 'bg-white'
            }`}>
            {/* Title Section - Top Left */}
            <div className="px-6 md:px-10 pt-8 md:pt-12 shrink-0">
                <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    Meet your
                </h1>
                <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black italic mt-1 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
                    INAI
                </h1>
            </div>

            {/* Avatar - Center */}
            <div className="flex-1 flex items-center justify-center px-4 overflow-hidden min-h-0">
                <div className="relative max-h-full flex items-center justify-center">
                    <img
                        src={getAsset('Model')}
                        alt="INAI Assistant"
                        className="w-auto max-w-[280px] sm:max-w-[320px] md:max-w-[380px] max-h-[45vh] sm:max-h-[50vh] md:max-h-[55vh] object-contain"
                    />
                    <div
                        className="absolute bottom-0 left-0 right-0 h-20 md:h-28 pointer-events-none"
                        style={{
                            background: isDark
                                ? 'linear-gradient(to bottom, transparent 0%, black 100%)'
                                : 'linear-gradient(to bottom, transparent 0%, white 100%)'
                        }}
                    />
                </div>
            </div>

            {/* Slide to Start Button - Drag enabled */}
            <div className="px-6 md:px-10 pb-20 sm:pb-14 md:pb-10 shrink-0">
                <div
                    ref={buttonRef}
                    className={`slide-btn w-full max-w-lg mx-auto flex items-center px-2 py-2 rounded-full border-2 overflow-hidden relative select-none ${isDark
                        ? 'border-gray-600 bg-gray-900/50'
                        : 'border-gray-300 bg-gray-100/50'
                        } ${isCompleted ? 'border-green-500' : ''}`}
                    style={{ touchAction: 'none' }}
                >
                    {/* Fill/Trail Effect - follows arrow */}
                    <div
                        className={`absolute left-0 top-0 bottom-0 rounded-full transition-all duration-100 ${isDark
                            ? 'bg-gradient-to-r from-yellow-500/40 via-yellow-400/20 to-transparent'
                            : 'bg-gradient-to-r from-blue-500/40 via-blue-400/20 to-transparent'
                            }`}
                        style={{ width: `${dragProgress + 10}%` }}
                    />

                    {/* Arrow Circle - Draggable */}
                    <div
                        className={`arrow-circle w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center z-10 cursor-grab active:cursor-grabbing transition-all ${isDark ? 'bg-white' : 'bg-gray-900'
                            } ${isDragging ? 'scale-110' : ''} ${isCompleted ? 'bg-green-500' : ''}`}
                        style={{
                            transform: `translateX(${(dragProgress / 100) * (buttonRef.current?.offsetWidth - 56 || 250)}px)`,
                            boxShadow: isDragging
                                ? isDark
                                    ? '0 0 20px rgba(250, 204, 21, 0.6)'
                                    : '0 0 20px rgba(59, 130, 246, 0.6)'
                                : 'none',
                            transition: isDragging ? 'none' : 'transform 0.3s ease-out, box-shadow 0.2s'
                        }}
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                    >
                        <ArrowRight className={`w-5 h-5 md:w-6 md:h-6 transition-transform ${isDark ? 'text-black' : 'text-white'
                            } ${isCompleted ? 'text-white rotate-0' : ''} ${isDragging ? 'scale-110' : ''}`} />
                    </div>

                    {/* Text - centered, fades with progress */}
                    <div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ opacity: 1 - (dragProgress / 100) }}
                    >
                        <span className={`text-sm md:text-base font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            {isCompleted ? 'Success!' : 'Slide to start →'}
                        </span>
                    </div>

                    {/* Chevrons on right side */}
                    <div
                        className="absolute right-4 flex items-center pointer-events-none"
                        style={{ opacity: 1 - (dragProgress / 50) }}
                    >
                        <ChevronRight className={`chevron-1 w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                        <ChevronRight className={`chevron-2 w-5 h-5 -ml-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <ChevronRight className={`chevron-3 w-5 h-5 -ml-3 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                    </div>
                </div>
            </div>
        </div>
    );

    // Mobile Role Selection Screen (Image 2 - with theme support)
    const MobileRoleSelection = () => (
        <div className={`w-screen h-screen flex flex-col px-5 py-10 animate-slideInRight ${isDark ? 'bg-black' : 'bg-white'
            }`}>
            {/* Header */}
            <div className="mb-10 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl font-bold">
                    <span className={isDark ? 'text-yellow-500' : 'text-blue-600'}>What's</span>
                </h1>
                <h2 className={`text-2xl sm:text-3xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                    features suits you ?
                </h2>
            </div>

            {/* Cards Container */}
            <div className="flex-1 flex flex-col justify-center gap-6 sm:gap-8 -mt-8">

                {/* Admin/Principal Card */}
                <div
                    onClick={() => navigate('/login')}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${isDark
                        ? 'bg-gray-950 border-2 border-yellow-500 hover:border-yellow-400'
                        : 'bg-gray-50 border-2 border-yellow-500 hover:border-yellow-600 shadow-lg'
                        }`}
                >
                    <div className="flex items-center gap-4 p-4 sm:p-5">
                        {/* Illustration */}
                        <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                            <img
                                src={getAsset('Principle')}
                                alt="Admin"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1">
                            <h3 className={`text-2xl sm:text-3xl font-bold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                Admin
                            </h3>
                            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                As An Admin, You Have The Power To Manage, Monitor, And Control Every Feature Seamlessly
                            </p>
                        </div>
                    </div>
                </div>

                {/* Student Card */}
                <div
                    onClick={() => navigate('/StudentPortal/login')}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${isDark
                        ? 'bg-gray-950 border-2 border-green-500 hover:border-green-400'
                        : 'bg-gray-50 border-2 border-green-500 hover:border-green-600 shadow-lg'
                        }`}
                >
                    <div className="flex items-center gap-4 p-4 sm:p-5">
                        {/* Illustration */}
                        <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                            <img
                                src={getAsset('student_login')}
                                alt="Student"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Text Content */}
                        <div className="flex-1">
                            <h3 className={`text-2xl sm:text-3xl font-bold mb-1.5 ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                Student
                            </h3>
                            <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                With A Student Account, You Can Discover New Ideas, Track Progress, And Unlock Your Potential Every Day
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-8"></div>
        </div>
    );

    // Desktop Role Selection Screen (Restored from user's previous code)
    const DesktopRoleSelection = () => (
        <div className={`w-screen h-screen relative overflow-hidden flex items-center justify-center ${isDark ? 'bg-black' : 'bg-[#F5F5F5]'
            }`}>
            {/* Main Container - Scales proportionally */}
            <div className="relative w-full h-full flex items-center justify-center">
                {/* Content Wrapper - Max width for large screens */}
                <div className="w-full h-full max-w-[1920px] max-h-[1080px] mx-auto flex items-center justify-between px-[5vw] lg:px-[8vw]">

                    {/* Left Side - 3D Avatar */}
                    <div className="hidden lg:flex lg:w-[35%] xl:w-[32%] items-center justify-center">
                        <div className="relative w-full aspect-3/4 max-w-[450px]">
                            <img
                                src={getAsset('Model')}
                                alt="3D Avatar"
                                className="w-full h-full object-contain"
                                style={{
                                    filter: isDark ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6))' : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="w-full lg:w-[65%] xl:w-[68%] flex flex-col items-center lg:items-start justify-center px-4 lg:px-0">
                        {/* Title Section */}
                        <div className="text-center lg:text-left mb-[6vh] lg:mb-[8vh]">
                            <h1 className={`text-[7vw] sm:text-[6vw] md:text-[5vw] lg:text-[3.5vw] xl:text-[3.2vw] 2xl:text-[60px] font-bold leading-tight mb-[1.5vh] ${isDark ? 'text-white' : 'text-black'
                                }`} style={{ letterSpacing: '-0.02em' }}>
                                What's Features
                            </h1>
                            <p className={`text-[4.5vw] sm:text-[3.5vw] md:text-[3vw] lg:text-[2vw] xl:text-[1.8vw] 2xl:text-[34px] ${isDark ? 'text-gray-300' : 'text-gray-700'
                                }`} style={{ letterSpacing: '-0.01em' }}>
                                That Feel Like They're Made For You ?
                            </p>
                        </div>

                        {/* Feature Cards Container */}
                        <div className="w-full max-w-[1000px] flex flex-col md:flex-row gap-[3vh] md:gap-[2.5vw] lg:gap-[3vw]">
                            {/* Principal Card */}
                            <div
                                onClick={() => navigate('/login')}
                                className={`group relative flex-1 rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden transition-all duration-300 cursor-pointer ${isDark
                                    ? 'bg-gray-900/40 border-[3px] border-yellow-500 hover:border-yellow-400 shadow-2xl hover:shadow-yellow-500/60'
                                    : 'bg-white border-[3px] border-yellow-400 hover:border-yellow-500 shadow-xl hover:shadow-yellow-400/50'
                                    } hover:scale-[1.02] backdrop-blur-md`}
                            >
                                <div className="relative p-[4vh] md:p-[3.5vh] lg:p-[4.5vh] flex flex-col items-center text-center h-full min-h-[280px] md:min-h-[32vh] lg:min-h-[36vh]">
                                    {/* Icon Container */}
                                    <div className={`w-[18vw] h-[18vw] md:w-[12vw] md:h-[12vw] lg:w-[8vw] lg:h-[8vw] xl:w-[7vw] xl:h-[7vw] 2xl:w-[130px] 2xl:h-[130px] max-w-[130px] max-h-[130px] rounded-[16px] md:rounded-[20px] flex items-center justify-center mb-[2vh] md:mb-[2.5vh] transition-all duration-300 ${isDark ? 'bg-yellow-500/25' : 'bg-yellow-100'
                                        } group-hover:scale-110`}>
                                        <img
                                            src={getAsset('Principle')}
                                            alt="Principal"
                                            className="w-[85%] h-[85%] object-contain"
                                        />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className={`text-[5.5vw] md:text-[3.5vw] lg:text-[2.2vw] xl:text-[2vw] 2xl:text-[38px] font-bold mb-[1.5vh] md:mb-[2vh] ${isDark ? 'text-yellow-400' : 'text-yellow-700'
                                            }`}>
                                            Principle
                                        </h3>
                                        <p className={`text-[3.2vw] md:text-[2vw] lg:text-[1.2vw] xl:text-[1.1vw] 2xl:text-[20px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                            }`} style={{ lineHeight: '1.6' }}>
                                            Shaping Young Minds, Building Bright Future, With Dedication And Vision, The Principal Leads Both Teachers And Students
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Student Card */}
                            <div
                                onClick={() => navigate('/StudentPortal/login')}
                                className={`group relative flex-1 rounded-[20px] md:rounded-[24px] lg:rounded-[28px] overflow-hidden transition-all duration-300 cursor-pointer ${isDark
                                    ? 'bg-gray-900/40 border-[3px] border-blue-500 hover:border-blue-400 shadow-2xl hover:shadow-blue-500/60'
                                    : 'bg-white border-[3px] border-blue-400 hover:border-blue-500 shadow-xl hover:shadow-blue-400/50'
                                    } hover:scale-[1.02] backdrop-blur-md`}
                            >
                                <div className="relative p-[4vh] md:p-[3.5vh] lg:p-[4.5vh] flex flex-col items-center text-center h-full min-h-[280px] md:min-h-[32vh] lg:min-h-[36vh]">
                                    {/* Icon Container */}
                                    <div className={`w-[18vw] h-[18vw] md:w-[12vw] md:h-[12vw] lg:w-[8vw] lg:h-[8vw] xl:w-[7vw] xl:h-[7vw] 2xl:w-[130px] 2xl:h-[130px] max-w-[130px] max-h-[130px] rounded-[16px] md:rounded-[20px] flex items-center justify-center mb-[2vh] md:mb-[2.5vh] transition-all duration-300 ${isDark ? 'bg-blue-500/25' : 'bg-blue-100'
                                        } group-hover:scale-110`}>
                                        <img
                                            src={getAsset('student_login')}
                                            alt="Student"
                                            className="w-[85%] h-[85%] object-contain"
                                        />
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <h3 className={`text-[5.5vw] md:text-[3.5vw] lg:text-[2.2vw] xl:text-[2vw] 2xl:text-[38px] font-bold mb-[1.5vh] md:mb-[2vh] ${isDark ? 'text-blue-400' : 'text-blue-700'
                                            }`}>
                                            Student
                                        </h3>
                                        <p className={`text-[3.2vw] md:text-[2vw] lg:text-[1.2vw] xl:text-[1.1vw] 2xl:text-[20px] leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'
                                            }`} style={{ lineHeight: '1.6' }}>
                                            With A Student Account, You Can Discover New Ideas, Track Progress, And Unlock Your Potential Every Day
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Avatar - Shows only on mobile (Hidden in desktop view) */}
                        <div className="lg:hidden w-full flex items-center justify-center mt-[6vh]">
                            <div className="relative w-[60vw] max-w-[300px] aspect-[3/4]">
                                <img
                                    src={getAsset('Model')}
                                    alt="3D Avatar"
                                    className="w-full h-full object-contain"
                                    style={{
                                        filter: isDark ? 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.6))' : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.1))'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Main Render - Using inline JSX instead of nested components to prevent re-creation
    // Don't render anything until we know if it's mobile or desktop
    if (isMobile === null) {
        return <div className={`w-screen h-screen ${isDark ? 'bg-black' : 'bg-white'}`} />;
    }

    return (
        <>
            {isMobile ? (
                showIntro ? (
                    // Intro Screen - Inline
                    <div className={`w-screen h-screen max-h-screen overflow-hidden flex flex-col ${isDark ? 'bg-black' : 'bg-white'
                        }`}>
                        {/* Title Section */}
                        <div className="px-6 md:px-10 pt-8 md:pt-12 shrink-0">
                            <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'
                                }`}>
                                Meet your
                            </h1>
                            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-black italic mt-1 ${isDark ? 'text-white' : 'text-gray-900'
                                }`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.02em' }}>
                                INAI
                            </h1>
                        </div>

                        {/* Avatar */}
                        <div className="flex-1 flex items-center justify-center px-4 overflow-hidden min-h-0">
                            <div className="relative max-h-full flex items-center justify-center">
                                <img
                                    src={getAsset('Model')}
                                    alt="INAI Assistant"
                                    className="w-auto max-w-[280px] sm:max-w-[320px] md:max-w-[380px] max-h-[45vh] sm:max-h-[50vh] md:max-h-[55vh] object-contain"
                                />
                                <div
                                    className="absolute bottom-0 left-0 right-0 h-20 md:h-28 pointer-events-none"
                                    style={{
                                        background: isDark
                                            ? 'linear-gradient(to bottom, transparent 0%, black 100%)'
                                            : 'linear-gradient(to bottom, transparent 0%, white 100%)'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Slide Button - Refined Design */}
                        <div className="px-6 md:px-10 pb-20 sm:pb-14 md:pb-10 shrink-0">
                            <div
                                ref={buttonRef}
                                className={`slide-btn w-full max-w-lg mx-auto flex items-center px-1.5 py-1.5 rounded-full border border-opacity-20 overflow-hidden relative select-none ${isDark
                                    ? 'border-white bg-gray-900/60 backdrop-blur-sm'
                                    : 'border-black bg-gray-100/60 backdrop-blur-sm'
                                    } ${isCompleted ? 'border-green-500 bg-green-500/10' : ''}`}
                                style={{ touchAction: 'none' }}
                            >
                                {/* Background Track Indicator - Subtle line */}
                                <div className={`absolute left-4 right-4 top-1/2 h-0.5 -translate-y-1/2 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/5'
                                    }`} />

                                {/* Fill Trail Effect - Vivid Gradient */}
                                <div
                                    className={`absolute left-0 top-0 bottom-0 rounded-full ${isDark
                                        ? 'bg-gradient-to-r from-yellow-500/50 via-yellow-400/30 to-transparent'
                                        : 'bg-gradient-to-r from-blue-500/50 via-blue-400/30 to-transparent'
                                        }`}
                                    style={{
                                        width: `${dragProgress + 5}%`,
                                        opacity: Math.max(0.3, dragProgress / 100),
                                        transition: isDragging ? 'none' : 'width 0.3s ease-out, opacity 0.3s'
                                    }}
                                />

                                {/* Arrow Circle - Premium Knob Design */}
                                <div
                                    className={`arrow-circle w-11 h-11 md:w-14 md:h-14 rounded-full flex items-center justify-center z-10 cursor-grab active:cursor-grabbing shadow-lg relative ${isDark ? 'bg-white' : 'bg-white'
                                        } ${isDragging ? 'scale-105' : ''} ${isCompleted ? 'bg-green-500' : ''}`}
                                    style={{
                                        transform: `translateX(${(dragProgress / 100) * ((buttonRef.current?.offsetWidth || 300) - 68)}px)`,
                                        boxShadow: isDragging
                                            ? isDark
                                                ? '0 0 25px rgba(250, 204, 21, 0.5), 0 4px 10px rgba(0,0,0,0.3)'
                                                : '0 0 25px rgba(59, 130, 246, 0.5), 0 4px 10px rgba(0,0,0,0.1)'
                                            : '0 4px 6px rgba(0,0,0,0.1)',
                                        border: isDark ? '2px solid rgba(250, 204, 21, 0.1)' : '2px solid rgba(59, 130, 246, 0.1)',
                                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s'
                                    }}
                                    onMouseDown={handleDragStart}
                                    onTouchStart={handleDragStart}
                                >
                                    {/* Pulse effect ring when idle */}
                                    {!isDragging && !isCompleted && (
                                        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isDark ? 'bg-yellow-400' : 'bg-blue-400'
                                            }`} style={{ animationDuration: '2s' }} />
                                    )}

                                    <ArrowRight className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isCompleted ? 'text-white scale-110' :
                                        isDark ? 'text-black' : 'text-blue-600'
                                        } ${!isDragging && !isCompleted ? 'animate-pulse' : ''}`}
                                        strokeWidth={2.5}
                                    />
                                </div>

                                {/* Text - Shimmer Effect */}
                                <div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    style={{
                                        opacity: 1 - (dragProgress / 80),
                                        transition: isDragging ? 'none' : 'opacity 0.3s'
                                    }}
                                >
                                    <span className={`text-sm md:text-base font-bold tracking-wide ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500' : 'text-gray-600'
                                        }`}
                                        style={{
                                            backgroundSize: '200% auto',
                                            animation: isDark ? 'textShimmer 3s linear infinite' : 'none'
                                        }}>
                                        {isCompleted ? 'Success!' : 'Slide to start'}
                                    </span>
                                </div>

                                {/* Chevrons - Animated Guide */}
                                <div
                                    className="absolute right-5 flex items-center pointer-events-none"
                                    style={{
                                        opacity: Math.max(0, 1 - (dragProgress / 50)),
                                        transition: isDragging ? 'none' : 'opacity 0.3s'
                                    }}
                                >
                                    <ChevronRight className={`w-4 h-4 ${isDark ? 'text-yellow-500/40' : 'text-blue-500/40'} animate-chevron1`} />
                                    <ChevronRight className={`w-4 h-4 -ml-2.5 ${isDark ? 'text-yellow-500/70' : 'text-blue-500/70'} animate-chevron2`} />
                                    <ChevronRight className={`w-4 h-4 -ml-2.5 ${isDark ? 'text-yellow-500' : 'text-blue-500'} animate-chevron3`} />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <MobileRoleSelection />
                )
            ) : (
                <DesktopRoleSelection />
            )}

            {/* Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }

                /* Text Shimmer Effect */
                @keyframes textShimmer {
                    0% { background-position: -100% 0; }
                    100% { background-position: 200% 0; }
                }

                @keyframes chevronSlide {
                    0%, 100% { transform: translateX(0); opacity: 0.5; }
                    50% { transform: translateX(4px); opacity: 1; }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }

                .animate-slideInRight {
                    animation: slideInRight 0.4s ease-out;
                }

                /* Chevron Animations with Staggered Delays */
                .animate-chevron1 {
                    animation: chevronSlide 2s ease-in-out infinite;
                }
                .animate-chevron2 {
                    animation: chevronSlide 2s ease-in-out infinite 0.2s;
                }
                .animate-chevron3 {
                    animation: chevronSlide 2s ease-in-out infinite 0.4s;
                }
                .get-started-btn:not(:disabled) .chevron-2 {
                    animation: chevronSlide 2s ease-in-out infinite 0.15s;
                }
                .get-started-btn:not(:disabled) .chevron-3 {
                    animation: chevronSlide 2s ease-in-out infinite 0.3s;
                }

                /* Stop animations on hover for better control */
                .get-started-btn:hover .arrow-icon,
                .get-started-btn:hover .chevron-1,
                .get-started-btn:hover .chevron-2,
                .get-started-btn:hover .chevron-3 {
                    animation: none;
                }
            `}</style>
        </>
    );
}

export default RoleFeatures;
