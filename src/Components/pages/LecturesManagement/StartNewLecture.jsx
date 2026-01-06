import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets.js";
import { BookOpen, ChevronDown, ChevronRight, Play, Share2, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

function StartNewLecture({ theme, isDark, toggleTheme, sidebardata }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { lectureId, lecturejson } = location.state || {};
    const [loading, setLoading] = useState(true);
    const [lectures, setLectures] = useState([]);

    useEffect(() => {
        const fetchLectureDetails = async () => {
            if (!lectureId) {
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("access_token");
                const response = await axios.get(
                    `${BACKEND_API_URL}/api/lectures/${lectureId}/play`,
                    {
                        headers: {
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        }
                    }
                );

                const data = response.data;

                // Transform API data to component structure
                const newLecture = {
                    id: data.lecture_id,
                    title: data.title,
                    subtitle: `${data.metadata.std}th Grade - ${data.metadata.subject}`,
                    tags: ["1 Chapter", `${data.playback.segments.length} Topics`],
                    cover: getAsset("Model"), // Placeholder or if API provides one
                    sections: [
                        {
                            id: 1,
                            title: data.metadata.chapter_title || "Chapter 1",
                            lessons: data.playback.segments.map((seg, index) => ({
                                id: index,
                                title: seg.title,
                                duration: "05:00" // Placeholder duration as it's not in API
                            }))
                        }
                    ],
                    expanded: true,
                    expandedSections: { 1: true } // Open the first section by default
                };

                setLectures([newLecture]);
            } catch (error) {
                console.error("Error fetching lecture details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLectureDetails();
    }, [lectureId]);

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

            {/* Main Content */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-4 sm:p-6 lg:p-7 pb-0 transition-all duration-300`}>
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* Main Section */}
                <main className="mt-4 sm:mt-6 flex-1 flex flex-col min-h-0">
                    {/* Title Bar */}
                    <div className={`w-full rounded-xl px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between mb-4 sm:mb-6 ${isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-zinc-200'}`}>
                        <h2 className={`text-base sm:text-lg lg:text-xl font-semibold ${isDark ? "text-white" : "text-zinc-900"}`}>
                            Start New Lecture
                        </h2>
                    </div>

                    {/* Content Area */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {loading ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                            </div>
                        ) : lectures.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <p className={`${isDark ? 'text-white' : 'text-zinc-900'} text-sm sm:text-base lg:text-lg font-semibold`}>
                                        No Lecture According To The Information
                                    </p>
                                    <p className={`${isDark ? 'text-zinc-400' : 'text-zinc-500'} mt-1 text-xs sm:text-sm`}>
                                        Make This Space Your Own
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="pb-6">
                                {lectures.map((lec) => (
                                    <div key={lec.id} className="w-full">
                                        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col lg:flex-row`}>
                                            {/* Cover Image */}
                                            <div className={`relative w-full lg:w-2/5 flex justify-center items-center aspect-video lg:aspect-auto lg:min-h-[500px] ${isDark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
                                                {lec.cover ? (
                                                    <img
                                                        src={lec.cover}
                                                        alt="Lecture cover"
                                                        className="w-fit h-fit object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <BookOpen className={`w-12 h-12 ${isDark ? 'text-zinc-600' : 'text-zinc-300'}`} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-4 sm:p-5 lg:p-6 flex-1">
                                                {/* Title & Subtitle */}
                                                <h3 className={`text-sm sm:text-base lg:text-lg font-semibold line-clamp-2 ${isDark ? 'text-gray-100' : 'text-zinc-900'}`}>
                                                    {lec.title}
                                                </h3>
                                                <p className={`text-xs sm:text-sm mt-1 sm:mt-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                                    {lec.subtitle}
                                                </p>

                                                {/* Badges */}
                                                <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4">
                                                    {lec.tags.map((tag, i) => (
                                                        <span key={i} className={`inline-flex items-center gap-1.5 text-xs sm:text-sm rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 ${isDark ? 'text-gray-200 bg-zinc-800 border border-zinc-700' : 'text-zinc-700 bg-zinc-50 border border-zinc-200'}`}>
                                                            {i === 0 && <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                                                            <span className="font-medium">{tag}</span>
                                                        </span>
                                                    ))}
                                                </div>

                                                {/* View Chapter Toggle */}
                                                <button
                                                    onClick={() => toggleChapters(lec.id)}
                                                    className={`w-full mt-4 sm:mt-5 px-4 py-3 flex items-center justify-between rounded-xl transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-50'}`}
                                                >
                                                    <span className={`text-sm sm:text-base font-semibold ${isDark ? 'text-gray-100' : 'text-zinc-900'}`}>
                                                        View Chapter
                                                    </span>
                                                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${lec.expanded ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-zinc-500'}`} />
                                                </button>

                                                {/* Sections List */}
                                                {lec.expanded && (
                                                    <div className={`mt-3 sm:mt-4 rounded-xl overflow-hidden ${isDark ? 'bg-zinc-800/50' : 'bg-zinc-50'}`}>
                                                        {lec.sections.map((section, idx) => (
                                                            <div key={section.id} className={`${idx !== 0 ? (isDark ? 'border-t border-zinc-700' : 'border-t border-zinc-200') : ''}`}>
                                                                {/* Section Header */}
                                                                <button
                                                                    onClick={() => toggleSection(lec.id, section.id)}
                                                                    className={`w-full px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-700/50' : 'hover:bg-zinc-100/70'}`}
                                                                >
                                                                    <div className="flex items-center gap-2 sm:gap-3">
                                                                        <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                                            {idx + 1}.
                                                                        </span>
                                                                        <span className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>
                                                                            {section.title}
                                                                        </span>
                                                                    </div>
                                                                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${lec.expandedSections?.[section.id] ? 'rotate-90' : ''} ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
                                                                </button>

                                                                {/* Lessons List */}
                                                                {lec.expandedSections?.[section.id] && (
                                                                    <ul className="px-4 pb-3 space-y-2">
                                                                        {section.lessons.map((lesson) => (
                                                                            <li key={lesson.id} className={`flex items-center justify-between pl-6 sm:pl-8 text-xs sm:text-sm ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                                                                                <span className="flex-1 pr-2">{lesson.title}</span>
                                                                                <span className="font-medium">{lesson.duration}</span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-5">
                                                    <button
                                                        onClick={() => navigate("/lecture/LectureVideo", { state: { lectureId: lec.id, lecturejson: lecturejson } })}
                                                        className={`flex-1 rounded-xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                                                        <Play className="w-4 h-4" fill={isDark ? "#18181b" : "#fff"} />
                                                        <span>Play</span>
                                                    </button>
                                                    <button className={`rounded-xl p-2.5 sm:p-3 border transition-colors cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                                                        <Share2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
                                                    </button>
                                                    <button className={`rounded-xl p-2.5 sm:p-3 border transition-colors cursor-pointer ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                                                        <Trash2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
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
            </div>
        </div>
    );
}

export default StartNewLecture;