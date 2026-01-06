import React, { useEffect, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL, handleerror } from "../../../utils/assets.js";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import axios from "axios";

function StudentDashboard({ isDark, toggleTheme, sidebardata }) {
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminPath = /^\/admin\//i.test(pathname);

    const navigate = useNavigate();

    // Circle math (match AdminDashboard)
    const outerRadius = 115;
    const innerRadius = 85;
    const outerCirc = 2 * Math.PI * outerRadius;
    const innerCirc = 2 * Math.PI * innerRadius;

    const [totalStudent, setTotalStudent] = useState(0);
    const [totalWatchedLecture, setTotalWatchedLecture] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [watchedLectureCount, setWatchedLectureCount] = useState(0);
    const [activeStudentCount, setActiveStudentCount] = useState(0);
    const [progressPercentage, setProgressPercentage] = useState(0);
    const [activePercentage, setActivePercentage] = useState(0);

    const [progressFactor, setProgressFactor] = useState(0); // Initialize to 0, not undefined
    const [loading, setLoading] = useState(true);
    const [hoveredSegment, setHoveredSegment] = useState(null);
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const token = localStorage.getItem("access_token") || localStorage.getItem("token") || localStorage.getItem("admin_token");
        if (!token) {
            console.warn("Access token not found in localStorage");
            return;
        }

        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const primaryUrl = isAdminPath
                    ? `${BACKEND_API_URL}/admin-portal/student-management/dashboard`
                    : `${BACKEND_API_URL}/dashboard/student`;

                const fallbackUrl = isAdminPath
                    ? `${BACKEND_API_URL}/dashboard/student`
                    : null;

                let res;
                try {
                    res = await axios.get(primaryUrl, {
                        headers: {
                            accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    });
                } catch (err) {
                    if (fallbackUrl) {
                        res = await axios.get(fallbackUrl, {
                            headers: {
                                accept: "application/json",
                                Authorization: `Bearer ${token}`,
                            },
                        });
                    } else {
                        throw err;
                    }
                }

                // Handle the new API response structure
                const root = res.data || {};
                const data = root.data || {};

                // API response has student_metrics at root.data level based on new JSON structure
                const metrics = data.student_metrics || {};
                const progress = metrics.progress || {};

                // Extract values directly from metrics object based on the new JSON structure
                const total_students_val = metrics.total_students ?? 0;
                const total_lectures_val = metrics.total_lectures ?? 0;
                const total_paid_val = metrics.total_paid ?? 0;

                const progressPercent = progress.progress_percentage ?? 0;
                const activePercent = progress.active_percentage ?? 0;

                setTotalStudent(Number(total_students_val));
                setTotalWatchedLecture(Number(total_lectures_val));
                setTotalPaid(Number(total_paid_val));

                setWatchedLectureCount(Number(progress.watched_lecture_count ?? 0));
                setActiveStudentCount(Number(progress.active_student_count ?? 0));
                setProgressPercentage(Number(progressPercent));
                setActivePercentage(Number(activePercent));
            } catch (error) {
                console.error("Failed to fetch student dashboard", error);
                handleerror("Failed to load student dashboard");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [isAdminPath]);

    useEffect(() => {
        setProgressFactor(0);
        const raf = requestAnimationFrame(() => {
            const raf2 = requestAnimationFrame(() => setProgressFactor(1));
            return () => cancelAnimationFrame(raf2);
        });
        return () => cancelAnimationFrame(raf);
    }, [progressPercentage, activePercentage]);

    const clampPercent = (n) => {
        const v = Number.isFinite(Number(n)) ? Number(n) : 0;
        return Math.max(0, Math.min(100, v));
    };

    const minVisiblePercent = (n) => {
        const v = clampPercent(n);
        return v === 0 ? 1 : v;
    };

    const outerDisplayedPercent = minVisiblePercent(progressPercentage);
    const innerDisplayedPercent = minVisiblePercent(activePercentage);

    const outerOffset = outerCirc - (outerCirc * outerDisplayedPercent * progressFactor) / 100;
    const innerOffset = innerCirc - (innerCirc * innerDisplayedPercent * progressFactor) / 100;
    const innerRotation = (clampPercent(progressPercentage) / 100) * 360; // start inner after outer arc

    // Chart segments for hover tooltip
    const chartSegments = [
        {
            key: 'outer',
            label: 'Student Progress',
            percent: clampPercent(progressPercentage),
            radius: outerRadius,
            circumference: outerCirc,
            offset: outerOffset,
            rotation: 0,
            color: isDark ? '#9BDCF2' : '#C3EBFA'
        },
        {
            key: 'inner',
            label: 'Student Active',
            percent: clampPercent(activePercentage),
            radius: innerRadius,
            circumference: innerCirc,
            offset: innerOffset,
            rotation: innerRotation,
            color: isDark ? '#F7D64A' : '#FEE55A'
        }
    ];
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
                    <Header title="Student Management" isDark={isDark} toggleTheme={toggleTheme}
                        isBack={isAdminPath}
                        backValue={isAdminPath ? -1 : 0}
                    />
                </div>

                {/* ===== Main Section (scrollable) ===== */}
                <main className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {/* ---- Stat Cards (Top Row) ---- */}
                    <div className={`grid grid-cols-2 md:grid-cols-2 gap-6 auto-rows-[minmax(90px,auto)] ${isAdminPath ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
                        {loading ? (
                            // Loading skeleton cards
                            [...Array(isAdminPath ? 3 : 4)].map((_, i) => (
                                <div key={`skeleton-${i}`} className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] animate-pulse`}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        <div className={`h-3 w-24 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                    </div>
                                    <div className={`mt-4 h-6 w-16 rounded-full ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                </div>
                            ))
                        ) : (
                            [
                                { title: 'Total Student', value: totalStudent, to: '/student/list' },
                                { title: 'Total Lectures List', value: totalWatchedLecture, to: '/student/lectures' },
                                { title: 'Total Paid', value: totalPaid, to: '/student/paid' },
                                ...(isAdminPath ? [] : [{ title: 'Add Student', value: 'none', to: '/student/Add' }]),
                            ].map((card, i) => {
                                const cardClass = `${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent rounded-2xl p-5 flex flex-col justify-between min-h-[120px] transition ${isAdminPath ? 'cursor-default' : 'cursor-pointer'}`;
                                const content = (
                                    <>
                                        <div className="flex items-center gap-2">
                                            <img src={isDark ? getAsset('Eyes_dark') : getAsset('Eyes_light')} alt="icon" className="w-4 h-4" />
                                            <div className={`text-[12px] md:text-sm font-medium ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>{card.title}</div>
                                        </div>
                                        {card.value !== 'none'
                                            ? <div className={`mt-3 text-2xl md:text-3xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{card.value}</div>
                                            :
                                            <div className="mt-3">
                                                <UserPlus className={`w-6 h-6 ${isDark ? 'text-white' : 'text-zinc-900'}`} />
                                            </div>
                                        }
                                    </>
                                );

                                if (isAdminPath) {
                                    return (
                                        <div key={i} className={cardClass}>
                                            {content}
                                        </div>
                                    );
                                }

                                return (
                                    <div onClick={() => navigate(card.to)} key={i} className={cardClass}>
                                        {content}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* ---- Total Lecture Chart (Second Row) ---- */}
                    <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#141522]"}`}>History</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.1fr_0.6fr_0.5fr] gap-2 mb-2">
                        <div className={`${isDark ? "bg-zinc-900" : "bg-white"} border border-transparent p-6 pb-0 rounded-2xl flex flex-col gap-0 md:col-span-2 xl:col-span-1`}>
                            <h3 className={`text-2xl font-semibold ${isDark ? "text-white" : "text-[#141522]"}`}>Student progress</h3>

                            {/* Chart Container */}
                            <div className="grid place-items-center mt-4">
                                {loading ? (
                                    <div className="flex flex-col items-center w-full animate-pulse">
                                        <div className={`rounded-full w-40 h-40 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                                        <div className="w-full mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {Array.from({ length: 2 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`flex items-center w-fit justify-between gap-4 rounded-2xl px-4 py-3 border border-transparent ${isDark ? "bg-zinc-800" : "bg-[#F5F5F9]"}`}
                                                >
                                                    <div className="flex items-center gap-2 text-sm font-medium">
                                                        <span className={`w-8 h-8 rounded-full grid place-items-center ${isDark ? 'bg-zinc-800' : 'bg-white'}`}>
                                                            <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} w-4 h-4 rounded-full`} />
                                                        </span>
                                                        <div className={`${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-3 w-20 rounded-full`} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full">
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

                                        <div className="relative w-full max-w-[300px] aspect-square mx-auto">
                                            <svg
                                                className="w-full h-full transform -rotate-90"
                                                viewBox="0 0 300 300"
                                                xmlns="http://www.w3.org/2000/svg"
                                                onTouchEnd={() => setTimeout(() => setHoveredSegment(null), 1500)}
                                            >
                                                {/* Track circles */}
                                                <circle cx="150" cy="150" r={outerRadius} stroke={isDark ? '#3f3f46' : '#e4e4e7'} strokeWidth="14" fill="none" />
                                                <circle cx="150" cy="150" r={innerRadius} stroke={isDark ? '#3f3f46' : '#e4e4e7'} strokeWidth="14" fill="none" />

                                                {/* Colored segments with hover events */}
                                                {chartSegments.map((segment) => {
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
                                                        <circle
                                                            key={segment.key}
                                                            cx="150"
                                                            cy="150"
                                                            r={segment.radius}
                                                            stroke={segment.color}
                                                            strokeWidth="14"
                                                            strokeLinecap="round"
                                                            fill="none"
                                                            strokeDasharray={segment.circumference}
                                                            strokeDashoffset={segment.offset}
                                                            transform={`rotate(${segment.rotation} 150 150)`}
                                                            className="cursor-pointer transition-all duration-200"
                                                            style={{
                                                                transition: 'stroke-dashoffset 1s ease, stroke-width 0.2s ease',
                                                                opacity: hoveredSegment && hoveredSegment.key !== segment.key ? 0.5 : 1,
                                                                strokeWidth: hoveredSegment?.key === segment.key ? 14 : 14
                                                            }}
                                                            onMouseMove={handleMouseMove}
                                                            onMouseEnter={handleMouseMove}
                                                            onMouseLeave={() => setHoveredSegment(null)}
                                                            onTouchStart={handleTouchStart}
                                                        />
                                                    );
                                                })}
                                            </svg>
                                        </div>

                                        {/* Bottom Labels */}
                                        <div className="w-full my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {[
                                                {
                                                    key: 'pending',
                                                    label: 'Student Progress',
                                                    icon: isDark ? getAsset('student_progress_dark') : getAsset('student_progress_light'),
                                                    value: watchedLectureCount,
                                                },
                                                {
                                                    key: 'all',
                                                    label: 'Student Active',
                                                    icon: isDark ? getAsset('student_active_dark') : getAsset('student_active_light'),
                                                    value: activeStudentCount,
                                                },
                                            ].map((chip) => (
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
                                                    <div className={`hidden sm:block ${isDark ? 'text-white/50' : 'text-zinc-900'}`}>|</div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>{chip.value}</span>
                                                        <div className={`w-3.5 h-3.5 rounded-full ${legendDotColors[chip.key]}`}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* placeholders only on large screens to balance grid */}
                        <div className="hidden lg:block"></div>
                        <div className="hidden lg:block"></div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default StudentDashboard;
