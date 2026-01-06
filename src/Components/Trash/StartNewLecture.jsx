import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset } from "../../../utils/assets.js";
import { BookOpen, Play, Share2, Trash2 } from "lucide-react";

function StartNewLecture({ theme, isDark, toggleTheme, sidebardata }) {
    const [lectures, setLectures] = useState([
        {
            id: 1,
            title: "Introduction to Modern Web Development",
            subtitle: "Learn the fundamentals of building modern web apps",
            tags: ["3 Chapters", "8 Topics"],
            cover: getAsset("Model"),
            sections: [
                {
                    id: 11,
                    title: "Getting Started",
                    lessons: [
                        { id: 111, title: "Getting Started", duration: "12:40" },
                        { id: 112, title: "Introduction to Web Environment", duration: "07:25" },
                        { id: 113, title: "React Fundamentals", duration: "10:12" },
                    ],
                },
                {
                    id: 12,
                    title: "React Fundamentals",
                    lessons: [
                        { id: 121, title: "Components & Props", duration: "08:45" },
                        { id: 122, title: "State & Effects", duration: "09:15" },
                    ],
                },
                {
                    id: 13,
                    title: "Advanced Concepts",
                    lessons: [
                        { id: 131, title: "Context", duration: "06:40" },
                        { id: 132, title: "Performance", duration: "05:55" },
                    ],
                },
            ],
            expanded: false,
            expandedSections: {},
        },
        {
            id: 2,
            title: "Introduction to Modern Web Development",
            subtitle: "Learn the fundamentals of building modern web apps",
            tags: ["3 Chapters", "8 Topics"],
            cover: getAsset("Model"),
            sections: [
                {
                    id: 21,
                    title: "Basics",
                    lessons: [
                        { id: 211, title: "HTML & CSS", duration: "11:22" },
                        { id: 212, title: "JavaScript Intro", duration: "08:05" },
                    ],
                },
                {
                    id: 22,
                    title: "Framework Intro",
                    lessons: [
                        { id: 221, title: "Why React?", duration: "10:45" },
                    ],
                },
            ],
            expanded: false,
            expandedSections: {},
        },
        {
            id: 3,
            title: "Introduction to Modern Web Development",
            subtitle: "Learn the fundamentals of building modern web apps",
            tags: ["3 Chapters", "8 Topics"],
            cover: getAsset("Model"),
            sections: [
                {
                    id: 31,
                    title: "Setup",
                    lessons: [
                        { id: 311, title: "Node & npm", duration: "12:02" },
                    ],
                },
                {
                    id: 32,
                    title: "Tooling",
                    lessons: [
                        { id: 321, title: "Vite", duration: "07:59" },
                        { id: 322, title: "ESLint & Prettier", duration: "06:10" },
                    ],
                },
                {
                    id: 33,
                    title: "React Essentials",
                    lessons: [
                        { id: 331, title: "JSX", duration: "10:00" },
                        { id: 332, title: "Hooks", duration: "09:10" },
                    ],
                },
                {
                    id: 34,
                    title: "Advanced",
                    lessons: [
                        { id: 341, title: "Code Splitting", duration: "09:44" },
                    ],
                },
            ],
            expanded: false,
            expandedSections: {},
        },

    ]);

    const toggleChapters = (id) => {
        setLectures((prev) =>
            prev.map((lecture) =>
                lecture.id === id ? { ...lecture, expanded: !lecture.expanded } : lecture
            )
        );
    };

    const toggleSection = (lectureId, sectionId) => {
        setLectures((prev) =>
            prev.map((lecture) => {
                if (lecture.id !== lectureId) return lecture;
                const isOpen = lecture.expandedSections?.[sectionId];
                return {
                    ...lecture,
                    expandedSections: {
                        ...lecture.expandedSections,
                        [sectionId]: !isOpen,
                    },
                };
            })
        );
    };

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-20 lg:ml-72 p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} isSearchbar={true} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {/* Top action bar */}
                    <div className={`w-full rounded px-3 py-2 md:px-4 md:py-3 text-sm md:text-base flex items-center justify-between mb-4 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
                        <div
                            className={`${isDark ? "text-white" : "text-[#1d1f3b]"
                                } text-base sm:text-lg font-medium`}
                        >
                            Start New Lecture
                        </div>
                        {/* <button className={`cursor-pointer font-medium px-3 py-1.5 rounded text-xs md:text-sm flex items-center gap-2 ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'}`}>
                            <span>Start Lecture</span>
                        </button> */}
                    </div>

                    {/* Cards grid / Empty state */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {lectures.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <p className={`${isDark ? 'text-white' : 'text-zinc-900'} text-sm sm:text-base md:text-lg font-semibold tracking-wide`}>
                                        No Lecture According To The Information
                                    </p>
                                    <p className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-1 text-[11px] sm:text-xs font-medium`}>
                                        Make This Space Your Own
                                    </p>
                                </div>
                            </div>
                        ) : (
                        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                            {lectures.map((lec) => (
                                <div key={lec.id} className="break-inside-avoid">
                                    <div className={`${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'} rounded-md overflow-hidden shadow transition-transform duration-150 hover:-translate-y-px hover:shadow-lg`}>
                                        {/* Cover */}
                                        <div className={`relative aspect-video ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                            {lec.cover ? (
                                                <img src={getAsset("Model")} alt="cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                    <img src={getAsset("lecture")} alt="lecture" className="w-10 h-10 opacity-70" />
                                                </div>
                                            )}

                                            {/* Small top-right indicators */}
                                            {/* <div className="absolute top-2 right-2 flex gap-2">
                                                <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                                                <span className="h-2 w-2 rounded-full bg-zinc-600"></span>
                                            </div> */}

                                        </div>

                                        {/* Body */}
                                        <div className="p-3">
                                            <h3 className={`text-[13px] md:text-sm font-semibold line-clamp-2 ${isDark ? 'text-gray-100' : 'text-zinc-800'}`}>{lec.title}</h3>
                                            <p className={`text-[12px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>{lec.subtitle}</p>

                                            {/* Badges with icons (3 Chapters, 8 Topics) */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] rounded px-1.5 py-0.5 ${isDark ? 'text-gray-200 bg-zinc-800 border border-zinc-700' : 'text-zinc-700 bg-zinc-100 border border-zinc-200'}`}>
                                                    {/* <img src={getAsset("book_dark")} alt="book" className="w-4 h-4" /> */}
                                                    <BookOpen size={16} />
                                                    <span>3</span>Chapters
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 text-[11px] rounded px-1.5 py-0.5 ${isDark ? 'text-gray-200 bg-zinc-800 border border-zinc-700' : 'text-zinc-700 bg-zinc-100 border border-zinc-200'}`}>
                                                    <span>8</span> Topics
                                                </span>
                                            </div>

                                            {/* View Chapter toggle */}
                                            <button
                                                onClick={() => toggleChapters(lec.id)}
                                                className={`cursor-pointer mt-3 w-full text-left px-3 py-2 text-[12px] flex items-center justify-between text-bold ${isDark ? 'text-gray-200' : 'text-zinc-700'}`}
                                            >
                                                <span className="font-inter font-semibold text-[17px] leading-[100%] tracking-normal">
                                                    View Chapter
                                                </span>

                                                <svg width="16" height="16" viewBox="0 0 24 24" className={`transition-transform ${lec.expanded ? 'rotate-180' : ''}`} fill="none">
                                                    <path d="M6 9l6 6 6-6" stroke={isDark ? '#d4d4d8' : '#52525b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>

                                            {/* Dynamic Sections list */}
                                            {lec.expanded && (
                                                <div className={`mt-2 rounded-lg overflow-hidden shadow-inner ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                                    {lec.sections.map((section, idx) => (
                                                        <div key={section.id} className={`${isDark ? 'border-zinc-700' : 'border-zinc-200'} last:border-b-0`}>
                                                            <button
                                                                onClick={() => toggleSection(lec.id, section.id)}
                                                                className={`cursor-pointer w-full text-left px-3 py-2 text-[12px] flex items-center justify-between ${isDark ? 'text-gray-200 hover:bg-zinc-700/60' : 'text-zinc-700 hover:bg-zinc-200/70'}`}
                                                            >
                                                                <div className="font-inter font-semibold text-[14px] leading-[100%]">
                                                                    <span className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} mr-2`}>{idx + 1}.</span>
                                                                    {section.title}
                                                                </div>

                                                                <svg
                                                                    width="14"
                                                                    height="14"
                                                                    viewBox="0 0 24 24"
                                                                    className={`${lec.expandedSections?.[section.id] ? "rotate-90" : ""}`}
                                                                    fill="none"
                                                                >
                                                                    <path d="M9 6l6 6-6 6" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </button>
                                                            {lec.expandedSections?.[section.id] && (
                                                                <ul className="px-3 pb-2 space-y-1">
                                                                    {section.lessons.map((lesson) => (
                                                                        <li key={lesson.id} className={`${isDark ? 'text-zinc-300' : 'text-zinc-700'} flex items-center opacity-80`}>
                                                                            <span className={`flex-1 pl-6 ${isDark ? 'text-[#AAAAAA]' : 'text-zinc-600'}`}>{lesson.title}</span>
                                                                            <span className={`${isDark ? 'text-[#AAAAAA]' : 'text-zinc-600'}`}>{lesson.duration}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Persistent footer actions (shown in both collapsed/expanded) */}
                                            <div className={`flex items-center gap-2 p-2 mt-2 ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
                                                <button className={`cursor-pointer flex-1 rounded-md text-sm py-1.5 font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'}`}>
                                                    {/* <Play fill={isDark ? "#000" : "#fff"} size={14} /> */}
                                                    <span>Start Lecture</span>
                                                </button>
                                                <button className={`cursor-pointer rounded-md p-2 border ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
                                                    {/* <img src={getAsset(isDark ? "share_dark" : "share__dark")} alt="share" className="w-4 h-4" /> */}
                                                    <Share2 size={16} />
                                                </button>
                                                <button className={`cursor-pointer rounded-md p-2 border ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}>
                                                    {/* <img src={getAsset(isDark ? "delete_tranperant_dark" : "delete_light")} alt="delete" className="w-4 h-4" /> */}
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        )}
                    </section>
                </main>
            </div >
        </div >
    );
}

export default StartNewLecture;