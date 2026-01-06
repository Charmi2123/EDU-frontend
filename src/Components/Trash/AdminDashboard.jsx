
// ============================================ value colour or perfect page ======================================
import React, { useEffect, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import axios from "axios";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets.js";

function AdminDashboard({ theme, isDark, toggleTheme, sidebardata }) {
    const [cards, setCards] = useState([
        { name: "Management", value: 111 },
        { name: "Total Credits", value: 111 },
        { name: "Lectures After Limit", value: 111 },
        { name: "Active Subscription", value: 111 },
    ]);

    const [totalStaff, setTotalStaff] = useState(0);
    const [sirCount, setSirCount] = useState(0);
    const [teacherCount, setTeacherCount] = useState(0);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem('access_token') || '';
                const headers = token ? { Authorization: `Bearer ${token}` } : {};
                const res = await axios.get(`${BACKEND_API_URL}/admin/dashboard`, { headers });
                const d = res?.data || {};
                const payload = d.data || {};

                const managementVal = payload.management ?? 0;
                const TotalCreditsVal = payload.total_credits ?? 0;
                const lectureAfterLimitVal = payload.count_of_lectures_after_limit ?? 0;
                const activeSubsVal = payload.active_subscription ?? 0;
                setCards([
                    { name: "Management", value: `${Number(managementVal)}` },
                    { name: "Total Credits", value: `${Number(TotalCreditsVal)}` },
                    { name: "Lectures After limit", value: `${Number(lectureAfterLimitVal)}` },
                    { name: "Active Subscription", value: `${activeSubsVal}` },
                ]);

                const staff = payload.total_staff || {};
                const apiSir = Number(staff.sir ?? 0);
                const apiTeacher = Number(staff.teacher ?? 0);
                const sumStaff = apiSir + apiTeacher;

                setTotalStaff(sumStaff);
                setSirCount(apiSir);
                setTeacherCount(apiTeacher);

            } catch (err) {
                // ignore errors for now
            }
        };
        fetchDashboard();

    }, []);

    // Circle math
    const outerRadius = 100;
    const innerRadius = 70;
    const outerCirc = 2 * Math.PI * outerRadius;
    const innerCirc = 2 * Math.PI * innerRadius;

    // Percent values (guard against divide-by-zero)
    const sirPercent = totalStaff > 0 ? (sirCount / totalStaff) * 100 : 0;
    const teacherPercent = totalStaff > 0 ? (teacherCount / totalStaff) * 100 : 0;

    // Stroke offsets
    const outerOffset = outerCirc - (outerCirc * sirPercent) / 100;
    const innerOffset = innerCirc - (innerCirc * teacherPercent) / 100;

    // ✅ Rotation offset for teacher (in degrees)
    // Because each percent = 3.6° (360° / 100)
    const teacherRotation = (sirPercent / 100) * 360;

    return (
        <div
            className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"
                } h-screen transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content */}
            <div
                className={`flex flex-col min-h-0 h-screen w-full md:ml-20 lg:ml-72 p-7 pb-0 transition-all duration-300`}
            >
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Welcome back, John"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Section */}
                <main className="mt-6 flex-1 overflow-y-auto no-scrollbar space-y-6">
                    {/* ---- Stat Cards ---- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 auto-rows-[minmax(120px,auto)]">
                        {cards.map((card, i) => (
                            <div
                                key={i}
                                className={`${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                                    } border p-5 rounded-2xl shadow flex flex-col justify-between min-h-[120px]`}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div
                            className={`${isDark
                                ? "bg-zinc-900 border-zinc-800"
                                : "bg-white border-zinc-200"
                                } border p-6 rounded-2xl shadow flex flex-col items-center justify-center md:col-span-2 xl:col-span-1`}
                        >
                            <h3
                                className={`text-lg font-medium mb-6 self-start ${isDark ? "text-white" : "text-[#696CFF]"
                                    }`}
                            >
                                Total Staff
                            </h3>

                            {/* ===== Circular Chart ===== */}
                            <div className="relative w-[200px] h-[200px] mb-4 md:w-[220px] md:h-[220px]">
                                <svg
                                    className="w-full h-full transform -rotate-90"
                                    viewBox="0 0 220 220"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    {/* Background Circles */}
                                    <circle cx="110" cy="110" r={outerRadius} stroke={isDark ? "#27272a" : "#eef0f5"} strokeWidth="10" fill="none" />
                                    <circle cx="110" cy="110" r={innerRadius} stroke={isDark ? "#27272a" : "#f1f5f9"} strokeWidth="10" fill="none" />

                                    {/* Sir (Outer) */}
                                    <circle
                                        cx="110"
                                        cy="110"
                                        r={outerRadius}
                                        stroke={isDark ? "#9BDCF2" : "#C3EBFA"}
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        fill="none"
                                        strokeDasharray={outerCirc}
                                        strokeDashoffset={outerOffset}
                                        style={{ transition: "stroke-dashoffset 1s ease" }}
                                    />

                                    {/* Teacher (Inner) — starts after Sir */}
                                    <circle
                                        cx="110"
                                        cy="110"
                                        r={innerRadius}
                                        stroke={isDark ? "#F7D64A" : "#FEE55A"}
                                        strokeWidth="10"
                                        strokeLinecap="round"
                                        fill="none"
                                        strokeDasharray={innerCirc}
                                        strokeDashoffset={innerOffset}
                                        style={{ transition: "stroke-dashoffset 1s ease" }}
                                        transform={`rotate(${teacherRotation} 110 110)`} // 👈 important
                                    />
                                </svg>


                                {/* Center Text */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <h2 className="text-2xl font-bold">
                                        {totalStaff}
                                    </h2>
                                    <p className="text-sm opacity-75">Total</p>
                                </div>
                            </div>

                            {/* Legend */}
                            <div className="flex items-center justify-center gap-4">
                                <div
                                    className={`flex items-center justify-between rounded-md px-3 py-1.5 w-[75px] border ${isDark
                                        ? "bg-zinc-900 border-zinc-700"
                                        : "bg-zinc-100 border-zinc-200"
                                        }`}
                                >
                                    <div
                                        className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-zinc-700"
                                            }`}
                                    >
                                        <span>Sir</span>
                                        <span
                                            className={`${isDark ? "text-white" : "text-black"} font-light`}
                                        >
                                            |
                                        </span>
                                    </div>
                                    <div className="w-3 h-3 rounded-full bg-sky-300"></div>
                                </div>

                                <div
                                    className={`flex items-center justify-between rounded-md px-3 py-1.5 w-[110px] border ${isDark
                                        ? "bg-zinc-900 border-zinc-700"
                                        : "bg-zinc-100 border-zinc-200"
                                        }`}
                                >
                                    <div
                                        className={`flex items-center gap-2 text-sm ${isDark ? "text-gray-300" : "text-zinc-700"
                                            }`}
                                    >
                                        <span>Teacher</span>
                                        <span
                                            className={`${isDark ? "text-white" : "text-black"} font-light`}
                                        >
                                            |
                                        </span>
                                    </div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-300"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default AdminDashboard;
