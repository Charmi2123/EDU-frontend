
// ============================================ value colour or perfect page ======================================
import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import axios from "axios";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets.js";
import { User2Icon, UserCircle } from "lucide-react";

const toSafeNumber = (value) => {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

function AdminDashboard({ theme, isDark, toggleTheme, sidebardata }) {
    const [cardsLoading, setCardsLoading] = useState(true);
    const [cards, setCards] = useState([
        { name: "Management", value: 0, path: "" },
        { name: "Total Credits", value: `0/0`, path: "" },
        { name: "Lectures After Limit", value: 0, path: "" },
        { name: "Active Subscription", value: 0, path: "" },

    ]);

    const [chapterCount, setChapterCount] = useState(10);
    const [lectureCount, setLectureCount] = useState(10);
    const [studentCount, setStudentCount] = useState(10);
    const [progressFactor, setProgressFactor] = useState(0);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setCardsLoading(true);
                const token = localStorage.getItem('access_token') || '';
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await axios.get(`${BACKEND_API_URL}/admin-portal/dashboard`, { headers });
                const d = res?.data || {};
                const payload = d.data || {};

                const memberStats = payload.member_statistics || {};
                const hasTotalMembersValue = Object.prototype.hasOwnProperty.call(memberStats, 'total_members');
                const totalMembers = toSafeNumber(memberStats.total_members);
                const chapterMembers = toSafeNumber(memberStats.chapter_members);
                const lectureMembers = toSafeNumber(memberStats.lecture_members);
                const studentMembers = toSafeNumber(memberStats.student_members);
                const computedMembersTotal = chapterMembers + lectureMembers + studentMembers;
                const managementVal = hasTotalMembersValue ? totalMembers : computedMembersTotal;

                // Extract lecture_credits data
                const lectureCredits = payload.lecture_credits || {};
                const totalCredits = toSafeNumber(lectureCredits.total);
                const remainingCredits = toSafeNumber(lectureCredits.remaining);
                const postLimitGenerated = toSafeNumber(lectureCredits.post_limit_generated);

                // Format Total Credits as "remaining/total"
                const totalCreditsDisplay = `${remainingCredits}/${totalCredits}`;

                const activeSubsVal = payload.account_status?.days_until_expiry ?? 0;

                setCards([
                    { name: "Management", value: `${Number(managementVal)}` },
                    { name: "Total Credits", value: totalCreditsDisplay },
                    { name: "Lectures After limit", value: `${Number(postLimitGenerated)}` },
                    { name: "Active Subscription", value: `${toSafeNumber(activeSubsVal)} Days` },
                ]);

                setChapterCount(chapterMembers);
                setLectureCount(lectureMembers);
                setStudentCount(studentMembers);

            } catch (err) {
                // ignore errors for now
            } finally {
                setCardsLoading(false);
            }
        };
        fetchDashboard();

    }, []);

    const palette = isDark
        ? {
            chapter: '#9ADCF9',
            lecture: '#F3D461',
            student: '#B9B3FF',
            track: '#1f1f21'
        }
        : {
            chapter: '#BFE9FF',
            lecture: '#FBE28A',
            student: '#C7C2FF',
            track: '#E5E7EB'
        };

    const chartSegments = useMemo(() => ([
        { key: 'chapter', label: 'Chapter Management', value: chapterCount, color: palette.chapter },
        { key: 'lecture', label: 'Lecture Management', value: lectureCount, color: palette.lecture },
        { key: 'student', label: 'Student Management', value: studentCount, color: palette.student },
    ]), [chapterCount, lectureCount, studentCount, palette.chapter, palette.lecture, palette.student]);

    const baseRadius = 115;
    const ringSpacing = 30;
    const chartTotalRaw = chartSegments.reduce((acc, seg) => acc + (Number.isFinite(seg.value) ? seg.value : 0), 0);
    const chartTotal = chartTotalRaw > 0 ? chartTotalRaw : 0;

    useEffect(() => {
        if (!chartTotal) {
            setProgressFactor(0);
            return;
        }

        setProgressFactor(0);
        const raf = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setProgressFactor(1));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf);
    }, [chartTotal, chapterCount, lectureCount, studentCount]);

    let cumulativePercent = 0;
    const normalizedSegments = chartSegments.map((segment, idx) => {
        const safeValue = Number.isFinite(segment.value) ? segment.value : 0;
        const radius = baseRadius - idx * ringSpacing;
        const circumference = 2 * Math.PI * radius;
        const percent = chartTotal > 0 ? (safeValue / chartTotal) * 100 : 0;
        const rotation = cumulativePercent * 3.6; // start where previous ended
        cumulativePercent += percent;

        return {
            ...segment,
            value: safeValue,
            percent,
            radius,
            circumference,
            rotation,
        };
    });

    return (
        <div
            className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"
                } h-screen transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content */}
            <div
                className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title={`Welcome back, ${localStorage.getItem('full_name')}`}
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Section */}
                <main className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {/* ---- Stat Cards ---- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-6 auto-rows-[minmax(120px,auto)]">
                        {cardsLoading
                            ? Array.from({ length: 4 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`${isDark ? "bg-zinc-900" : "bg-white"}
                                        border border-transparent p-5 rounded-2xl  flex flex-col justify-between min-h-[120px] animate-pulse`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`${isDark ? "bg-zinc-800" : "bg-zinc-200"} w-4 h-4 rounded-full`} />
                                            <div className={`${isDark ? "bg-zinc-800" : "bg-zinc-200"} h-3 w-24 rounded-full`} />
                                        </div>
                                    </div>
                                    <div className={`${isDark ? "bg-zinc-800" : "bg-zinc-200"} h-6 mt-4 w-16 rounded-full`} />
                                </div>
                            ))
                            : cards.map((card, i) => (
                                <div
                                    key={i}
                                    className={`${isDark ? "bg-zinc-900" : "bg-white"}
                                        border border-transparent p-5 rounded-2xl  flex flex-col justify-between min-h-[120px]`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <img
                                                src={isDark ? getAsset("Eyes_dark") : getAsset("Eyes_light")}
                                                alt="Eyes"
                                                className="w-4 h-4"
                                            />
                                            <p
                                                className={`font-inter text-[15px] font-medium leading-[100%] capitalize ${isDark ? "text-white" : "text-[#696CFF]"
                                                    }`}
                                            >
                                                {card.name}
                                            </p>
                                        </div>
                                    </div>
                                    <h2 className="text-2xl mt-3 font-bold">{card.value}</h2>
                                </div>
                            ))}
                    </div>

                    {/* ---- Charts Row ---- */}
                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.6fr] gap-6">
                        <div
                            className={`${isDark
                                ? "bg-zinc-900"
                                : "bg-white"
                                } border border-transparent p-6 pb-0 rounded-2xl  flex flex-col gap-6`}
                        >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#141522]"}`}>Total Management</h3>
                                </div>
                            </div>

                            {cardsLoading ? (
                                <div className="flex flex-col xl:flex-row items-center gap-8 animate-pulse">
                                    {/* Circular placeholder */}
                                    <div className="relative w-full max-w-[220px] aspect-square mx-auto flex items-center justify-center">
                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-full w-40 h-40`} />
                                    </div>

                                    {/* Legend placeholder */}
                                    <div className="flex-1 w-full space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center justify-between rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-900/60" : "bg-zinc-50"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-10 h-10 rounded-full`} />
                                                    <div className="space-y-1">
                                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-28 rounded-full`} />
                                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-2 w-16 rounded-full`} />
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-6 rounded-full`} />
                                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-3.5 h-3.5 rounded-full`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col xl:flex-row items-center gap-8">
                                    {/* Tooltip Component */}
                                    {hoveredSegment && (
                                        <div
                                            className={`fixed z-50 pointer-events-none transition-all duration-200 ease-out`}
                                            style={{
                                                left: `${cursorPosition.x}px`,
                                                top: `${cursorPosition.y}px`,
                                                transform: 'translate(-50%, -120%)',
                                            }}
                                        >
                                            <div
                                                className={`
                                                    px-4 py-3 rounded-xl shadow-xl backdrop-blur-md
                                                    ${isDark
                                                        ? 'bg-zinc-800/95 border border-zinc-700/50 text-white'
                                                        : 'bg-white/95 border border-gray-200/80 text-zinc-900'
                                                    }
                                                    min-w-[140px]
                                                `}
                                                style={{
                                                    animation: 'tooltipFadeIn 0.2s ease-out'
                                                }}
                                            >
                                                {/* Tooltip Arrow */}
                                                <div
                                                    className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0
                                                        border-l-8 border-r-8 border-t-8
                                                        border-l-transparent border-r-transparent
                                                        ${isDark ? 'border-t-zinc-800/95' : 'border-t-white/95'}
                                                    `}
                                                />
                                                {/* Color Indicator & Label */}
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full shadow-sm"
                                                        style={{ backgroundColor: hoveredSegment.color }}
                                                    />
                                                    <span className="text-sm font-medium opacity-80">
                                                        {hoveredSegment.label}
                                                    </span>
                                                </div>
                                                {/* Value */}
                                                <div className="flex items-baseline justify-between gap-4">
                                                    <span className="text-2xl font-bold">
                                                        {hoveredSegment.value}
                                                    </span>
                                                    <span
                                                        className={`text-sm font-semibold px-2 py-0.5 rounded-full
                                                            ${isDark ? 'bg-zinc-700/80' : 'bg-gray-100'}
                                                        `}
                                                    >
                                                        {hoveredSegment.percent.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Tooltip Animation Styles */}
                                    <style>{`
                                        @keyframes tooltipFadeIn {
                                            from {
                                                opacity: 0;
                                                transform: translateY(5px);
                                            }
                                            to {
                                                opacity: 1;
                                                transform: translateY(0);
                                            }
                                        }
                                    `}</style>

                                    {/* ===== Circular Chart ===== */}
                                    <div className="relative w-full max-w-[300px] aspect-square mx-auto">
                                        <svg
                                            className="w-full h-full transform -rotate-90"
                                            viewBox="0 0 300 300"
                                            xmlns="http://www.w3.org/2000/svg"
                                            onTouchEnd={() => setTimeout(() => setHoveredSegment(null), 1500)}
                                        >
                                            {normalizedSegments.map((segment) => {
                                                const animatedDashOffset = segment.circumference - (segment.circumference * segment.percent * progressFactor) / 100;

                                                // Event handlers for hover/touch
                                                const handleMouseMove = (e) => {
                                                    setCursorPosition({ x: e.clientX, y: e.clientY });
                                                    setHoveredSegment(segment);
                                                };

                                                const handleTouchStart = (e) => {
                                                    if (e.touches && e.touches[0]) {
                                                        setCursorPosition({
                                                            x: e.touches[0].clientX,
                                                            y: e.touches[0].clientY
                                                        });
                                                        setHoveredSegment(segment);
                                                    }
                                                };

                                                return (
                                                    <g key={segment.key}>
                                                        {/* Track circle */}
                                                        <circle
                                                            cx="150"
                                                            cy="150"
                                                            r={segment.radius}
                                                            stroke={palette.track}
                                                            strokeWidth="13"
                                                            fill="none"
                                                        />
                                                        {/* Colored segment */}
                                                        <circle
                                                            cx="150"
                                                            cy="150"
                                                            r={segment.radius}
                                                            stroke={segment.color}
                                                            strokeWidth="13"
                                                            strokeLinecap="round"
                                                            fill="none"
                                                            strokeDasharray={segment.circumference}
                                                            strokeDashoffset={animatedDashOffset}
                                                            transform={`rotate(${segment.rotation} 150 150)`}
                                                            className="cursor-pointer transition-all duration-200"
                                                            style={{
                                                                transition: "stroke-dashoffset 1.1s ease, transform 1.1s ease, stroke-width 0.2s ease",
                                                                opacity: hoveredSegment && hoveredSegment.key !== segment.key ? 0.5 : 1,
                                                                strokeWidth: hoveredSegment?.key === segment.key ? 13 : 13
                                                            }}
                                                            onMouseMove={handleMouseMove}
                                                            onMouseEnter={handleMouseMove}
                                                            onMouseLeave={() => setHoveredSegment(null)}
                                                            onTouchStart={handleTouchStart}
                                                        />
                                                    </g>
                                                );
                                            })}
                                        </svg>

                                        {/* Center Text */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold">
                                                {/* {chartTotal || 0} */}
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Legend */}
                                    <div className="flex-1 w-full space-y-4">
                                        {normalizedSegments.map((segment) => (
                                            <div
                                                key={segment.key}
                                                className={`flex items-center justify-between rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-800" : "bg-[#F5F5F9]"}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold ${isDark ? 'text-white' : 'text-[#141522]'}`}>
                                                        <User2Icon className="w-full" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold">{segment.label}</p>
                                                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{segment.percent.toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-semibold">{segment.value}</span>
                                                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: segment.color }}></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
