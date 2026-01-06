
import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets.js";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";

function LectureDashboard({ theme, isDark, toggleTheme, sidebardata }) {

    const navigate = useNavigate();
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);

    // State for dashboard data
    const [dashboardData, setDashboardData] = useState({
        total_lectures: 10,
        played_lectures: 10,
        shared_lectures: 10,
        pending_lectures: 10,
        qa_sessions: 10
    });
    const [isLoading, setIsLoading] = useState(true);

    // Fetch dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('access_token') || '';
                const headers = token ? { Authorization: `Bearer ${token}` } : {};

                // Determine API endpoint based on role/path
                const apiEndpoint = isAdminPath
                    ? `${BACKEND_API_URL}/dashboard/admin/lectures`
                    : `${BACKEND_API_URL}/dashboard/lecture`;

                const response = await axios.get(apiEndpoint, { headers });

                if (response.data?.status && response.data?.data) {
                    // Admin API returns data nested in 'totals', User API returns distinct fields directly
                    const dataToSet = isAdminPath
                        ? response.data.data.totals
                        : response.data.data;

                    setDashboardData(dataToSet);
                }
            } catch (error) {
                console.error('Error fetching lecture dashboard:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [isAdminPath]);

    // Color palette
    const palette = isDark
        ? {
            all: '#F7D64A',      // Yellow for All Lecture (outer)
            pending: '#9BDCF2',  // Blue for Pending Lecture (inner)
            track: '#3f3f46'
        }
        : {
            all: '#FEE55A',
            pending: '#C3EBFA',
            track: '#e4e4e7'
        };

    // Chart segments - All Lecture and Pending Lecture
    const chartSegments = useMemo(() => ([
        {
            key: 'all',
            label: 'All Lecture',
            value: dashboardData.total_lectures || 0,
            color: palette.all
        },
        {
            key: 'pending',
            label: 'Pending Lecture',
            value: dashboardData.pending_lectures || 0,
            color: palette.pending
        },
    ]), [dashboardData.total_lectures, dashboardData.pending_lectures, palette.all, palette.pending]);

    // Circle math
    const baseRadius = 115;
    const ringSpacing = 30;
    const chartTotalRaw = chartSegments.reduce((acc, seg) => acc + (Number.isFinite(seg.value) ? seg.value : 0), 0);
    const chartTotal = chartTotalRaw > 0 ? chartTotalRaw : 1; // Use 1 instead of 0 to avoid division by zero

    // Progress animation - Always animate
    const [progressFactor, setProgressFactor] = useState(0);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
    useEffect(() => {
        setProgressFactor(0);
        const raf = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setProgressFactor(1));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf);
    }, [chartTotalRaw, dashboardData.played_lectures, dashboardData.shared_lectures]);

    // Normalize segments with cumulative rotation
    let cumulativePercent = 0;
    const normalizedSegments = chartSegments.map((segment, idx) => {
        const safeValue = Number.isFinite(segment.value) ? segment.value : 0;
        const radius = baseRadius - idx * ringSpacing;
        const circumference = 2 * Math.PI * radius;
        const percent = chartTotalRaw > 0 ? (safeValue / chartTotalRaw) * 100 : 0;
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

    // Debug: Log chart data
    console.log('LectureDashboard Chart Data:', {
        dashboardData,
        chartTotalRaw,
        normalizedSegments,
        progressFactor
    });

    const lectureCardClass = isDark
        ? "bg-[#0F1014] border-[#1e1f25] text-white"
        : "bg-white border-[#EAECF5] text-[#141522]";
    const legendCardClass = isDark
        ? "bg-[#1B1C22] border border-[#2A2B32] text-white"
        : "bg-[#F6F7FC] border border-[#E4E7F2] text-[#141522]";
    const legendDotColors = {
        pending: 'bg-[#9BDCF2]',
        all: 'bg-[#F6D96F]',
    };

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme}
                        isBack={isAdminPath ? true : false}
                        backValue={isAdminPath ? -1 : 0}
                    />
                </div>

                {/* ===== Main Section (scrollable) ===== */}
                <main className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {/* ---- Stat Cards (Top Row) ---- */}
                    <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-${isAdminPath ? 4 : 3} gap-6 auto-rows-[minmax(90px,auto)]`}>
                        {isLoading
                            ? Array.from({ length: isAdminPath ? 4 : 3 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] animate-pulse`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-4 h-4 rounded-full`} />
                                            <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-24 rounded-full`} />
                                        </div>
                                    </div>
                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} mt-4 h-6 w-16 rounded-full`} />
                                </div>
                            ))
                            : isAdminPath
                                ? [
                                    {
                                        name: "Played Lectures",
                                        value: dashboardData.played_lectures,
                                        to: "/lecture/Playedlecture"
                                    },
                                    {
                                        name: "Shared Lectures",
                                        value: dashboardData.shared_lectures,
                                        to: "/lecture/Sharedlecture"
                                    },
                                    {
                                        name: "Q & A Section",
                                        value: dashboardData.qa_sessions,
                                        to: "/lecture/QandA"
                                    },
                                    {
                                        name: "Watch Lecture",
                                        value: dashboardData.total_lectures,
                                        to: "/Admin/lecture/Allectures"
                                    }
                                ].map((items, i) => {
                                    const isLastCard = i === 3;
                                    return (
                                        <div
                                            key={i}
                                            onClick={() => {
                                                if (isLastCard && items.to) {
                                                    navigate(items.to);
                                                }
                                            }}
                                            className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] ${isLastCard ? 'cursor-pointer' : 'cursor-default'}`}>
                                            <div
                                                className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={isDark ? getAsset('Eyes_dark') : getAsset('Eyes_light')}
                                                        alt="Eyes"
                                                        className={"w-4 h-4"}
                                                    />
                                                    <div
                                                        className={`text-[12px] md:text-sm font-medium ${isDark ? 'text-white' : 'text-[#696CFF]'}`}
                                                    >{items.name}</div>
                                                </div>
                                            </div>
                                            <h2 className={`mt-3 text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{items.value}</h2>
                                        </div>
                                    );
                                })
                                : [
                                    {
                                        name: "Played Lectures",
                                        value: dashboardData.played_lectures,
                                        to: "/lecture/Playedlecture"
                                    },
                                    {
                                        name: "Shared Lectures",
                                        value: dashboardData.shared_lectures,
                                        to: "/lecture/Sharedlecture"
                                    },
                                    {
                                        name: "Generate lecture",
                                        value: dashboardData.total_lectures,

                                    }
                                ].map((items, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            navigate(items.to);
                                        }}
                                        className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] cursor-pointer`}>
                                        <div
                                            className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={isDark ? getAsset('Eyes_dark') : getAsset('Eyes_light')}
                                                    alt="Eyes"
                                                    className={"w-4 h-4"}
                                                />
                                                <div
                                                    className={`text-[12px] md:text-sm font-medium ${isDark ? 'text-white' : 'text-[#696CFF]'}`}
                                                >{items.name}</div>
                                            </div>
                                        </div>
                                        <h2 className={`mt-3 text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{items.value}</h2>
                                    </div>
                                ))}
                    </div>

                    {/* ---- Total Lecture Chart (Second Row) ---- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.6fr_0.5fr] gap-6">
                        <div className={`${isDark ? "bg-zinc-900" : "bg-white"} border border-transparent p-6 pb-0 rounded-2xl flex flex-col gap-0 md:col-span-2 xl:col-span-1`}>
                            <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#141522]"}`}>Total Lecture</h3>

                            {isLoading ? (
                                <div className="grid place-items-center animate-pulse">
                                    <div className="relative w-full max-w-[220px] aspect-square mx-auto flex items-center justify-center">
                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-full w-40 h-40`} />
                                    </div>
                                    <div className="w-full mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {Array.from({ length: 2 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`flex items-center w-fit justify-between gap-4 rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-900" : "bg-[#F5F5F9]"}`}
                                            >
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <span className={`w-8 h-8 rounded-full grid place-items-center ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-4 h-4 rounded-full`} />
                                                    </span>
                                                    <div className={`${isDark ? 'bg-zinc-800 ' : 'bg-zinc-200'} h-3 w-20 rounded-full`} />
                                                </div>
                                                <div className={`${isDark ? 'text-white/50' : 'text-zinc-900'}`}>|</div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-6 rounded-full`} />
                                                    <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-3.5 h-3.5 rounded-full`} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <>
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

                                    {/* SVG Rounded Rings (Admin style) */}
                                    <div className="relative w-full max-w-[300px] aspect-square mx-auto">
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <h2 className="text-3xl md:text-4xl font-semibold">
                                                {dashboardData.total_lectures || 0}
                                            </h2>
                                        </div>
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
                                                            strokeWidth="14"
                                                            fill="none"
                                                            opacity="1"
                                                        />
                                                        {/* Colored segment */}
                                                        <circle
                                                            cx="150"
                                                            cy="150"
                                                            r={segment.radius}
                                                            stroke={segment.color}
                                                            strokeWidth="14"
                                                            strokeLinecap="round"
                                                            fill="none"
                                                            strokeDasharray={segment.circumference}
                                                            strokeDashoffset={animatedDashOffset}
                                                            transform={`rotate(${segment.rotation} 150 150)`}
                                                            className="cursor-pointer transition-all duration-200"
                                                            style={{
                                                                transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke-width 0.2s ease",
                                                                opacity: hoveredSegment && hoveredSegment.key !== segment.key ? 0.5 : 1,
                                                                strokeWidth: hoveredSegment?.key === segment.key ? 14 : 14
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
                                    </div>

                                    {/* Bottom Labels */}
                                    <div className="w-full my-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        {[{
                                            key: 'pending',
                                            label: 'Pending Lecture',
                                            value: dashboardData.pending_lectures || 0,
                                            icon: isDark ? getAsset('pending_lecture_dark') : getAsset('pending_lecture_light'),
                                        }, {
                                            key: 'all',
                                            label: 'All Lecture',
                                            value: dashboardData.total_lectures || 0,
                                            icon: isDark ? getAsset('all_lecture_dark') : getAsset('all_lecture_light'),
                                        }].map((chip) => (
                                            <div
                                                key={chip.key}
                                                className={`flex items-center justify-between rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-800" : "bg-[#F5F5F9]"}`}
                                            >
                                                <div className="flex items-center gap-2 text-sm font-medium">
                                                    <span className={`w-8 h-8 rounded-full grid place-items-center ${isDark ? 'bg-[#262732]' : 'bg-white'}`}>
                                                        <img src={chip.icon} alt={chip.label} className="w-4 h-4" />
                                                    </span>
                                                    <span>{chip.label}</span>
                                                </div>
                                                <div className="flex items-center gap-10">
                                                    <div className={`${isDark ? 'text-white/50' : 'text-zinc-900'}`}>|</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-semibold">{chip.value}</span>
                                                        <div className={`w-3.5 h-3.5 rounded-full ${legendDotColors[chip.key]}`}></div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        {/* placeholders to keep grid alignment on xl */}
                        <div className="hidden xl:block"></div>
                        <div className="hidden xl:block"></div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default LectureDashboard;