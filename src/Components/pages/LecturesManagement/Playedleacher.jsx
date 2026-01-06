import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { BACKEND_API_URL, getAsset, handlesuccess, handleerror } from "../../../utils/assets.js";
import { useNavigate } from "react-router-dom";
import { Play, ChevronLeft, Search, User, ArrowRight, X } from "lucide-react";
import axios from "axios";

// Lecture Card Component
const LectureCard = ({ lecture, isDark, onShare }) => {
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);

    return (
        <div

            className={`rounded-lg overflow-hidden ${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent h-full transition-all duration-200`}
        >
            {/* Video Thumbnail/Player Area */}
            <div className={`relative ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-[150px] mx-auto overflow-hidden`}>
                {!imgError && lecture.cover_photo_url && (
                    <img
                        src={lecture.cover_photo_url}
                        alt={lecture.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                )}

                <div
                    onClick={() => navigate("/lecture/PlayedVideo", {
                        state: {
                            lecturejson: lecture.lecture_url,
                            lectureId: lecture.lecture_id,
                            subject: lecture.language,
                            title: lecture.title,
                            video_url: lecture.video_url
                        }
                    })}
                    className="absolute cursor-pointer inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all duration-200">
                    <Play fill="white" stroke="white" className="w-12 h-12 drop-shadow-lg" />
                </div>

                {/* Duration Badge - Only show if duration exists */}
                {lecture.duration && (
                    <span className="absolute bottom-2 right-2 text-xs font-semibold px-2 py-0.5 rounded bg-black/60 text-white">
                        {lecture.duration + ":00"}
                    </span>
                )}
            </div>

            {/* Lecture Info */}
            <div className="p-3 text-sm space-y-1">
                <div className="flex items-start justify-between gap-2">
                    <p className={`${isDark ? 'text-white' : 'text-black'} font-medium line-clamp-2 flex-1 mb-2`}>
                        <span className="font-inter font-bold text-[17px] leading-[100%] tracking-normal capitalize">
                            Chapter:-
                        </span>
                        <span>      </span>
                        <span className="font-inter font-medium text-[15px] leading-[100%] tracking-normal capitalize">
                            {lecture.title}
                        </span>


                    </p>
                    {/* <img
                        src={isDark ? getAsset('sharearrow_dark') : getAsset('sharearrow_light')}
                        alt="share arrow"
                        className="w-5 h-5 shrink-0 mt-0.5 cursor-pointer"
                        onClick={(e) => {
                            e.stopPropagation();
                            onShare(lecture);
                        }}
                    /> */}
                </div>
                <p className={`${isDark ? 'text-white' : 'text-black'} text-xs`}>
                    <span className="font-inter font-bold text-[17px] leading-[100%] tracking-normal capitalize">Language:- </span>
                    <span className="font-inter font-medium text-[15px] leading-[100%] tracking-normal capitalize">  {lecture.language || 'General'}</span>
                </p>
            </div>
        </div>
    );
};

function Playedleacher({ theme, isDark, toggleTheme, sidebardata }) {
    const resolvedDark = typeof isDark === 'boolean' ? isDark : theme === 'dark';
    const [lectureData, setLectureData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    // Search state for header search bar
    const [searchValue, setSearchValue] = useState("");

    // Share Drawer State
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [selectedLectureForShare, setSelectedLectureForShare] = useState(null);
    const [studentSearch, setStudentSearch] = useState("");
    const [selectedStudents, setSelectedStudents] = useState([]);

    const handleShareClick = (lecture) => {
        setSelectedLectureForShare(lecture);
        setIsShareOpen(true);
        setSelectedStudents([]); // Reset selection on new share
        setStudentSearch("");
    };

    const handleShareSubmit = async () => {
        if (selectedStudents.length === 0) {
            alert("Please select at least one student");
            return;
        }

        if (!selectedLectureForShare) return;

        try {
            const token = localStorage.getItem("access_token") || localStorage.getItem("token");
            const response = await axios.post(
                `${BACKEND_API_URL}/lectures/${selectedLectureForShare.lecture_id}/share`,
                { students: selectedStudents },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            setIsShareOpen(false);
            setSelectedStudents([]);
            handlesuccess(response?.data?.message || "Lecture shared successfully!");
        } catch (error) {
            console.error("Error sharing lecture:", error);
            handleerror("Failed to share lecture. Please try again.");
        }
    };

    // Fetch played lectures from API
    const fetchPlayedLectures = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.get(`${BACKEND_API_URL}/lectures/public_lecture/played`, {
                headers: {
                    'Accept': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (response.data?.status && response.data?.data) {
                const { lectures, count } = response.data.data;
                setLectureData(lectures || []);
                setTotalCount(count || 0);
            } else {
                setLectureData([]);
                setTotalCount(0);
            }
        } catch (error) {
            console.error("Error fetching played lectures:", error);
            setLectureData([]);
            setTotalCount(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch lectures on component mount
    useEffect(() => {
        fetchPlayedLectures();
    }, []);

    // Filter lectures based on search (title + subject)
    const filteredLectures = React.useMemo(() => {
        const query = searchValue.trim().toLowerCase();
        if (!query) return lectureData;

        return lectureData.filter((lecture) => {
            const title = (lecture.title || "").toLowerCase();
            const subject = (lecture.language || "").toLowerCase();

            return title.includes(query) || subject.includes(query);
        });
    }, [searchValue, lectureData]);

    return (
        <div className={`flex ${resolvedDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={resolvedDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Lecture Management"
                        isDark={resolvedDark}
                        toggleTheme={toggleTheme}
                        isSearchbar={true}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                    />
                </div>

                {/* ===== Main Section (only grid scrolls) ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {/* Played Lecture Heading (non-scrolling) */}
                    <div className={`shrink-0 text-base md:text-lg w-full font-semibold px-4 py-3 inline-flex items-center justify-between border border-transparent rounded ${resolvedDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-700'} mb-5`}>
                        <span>Played Lectures</span>
                        {totalCount > 0 && (
                            <span className={`text-sm font-normal ${resolvedDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                Total: {totalCount}
                            </span>
                        )}
                    </div>

                    {/* Lecture Grid (scrollable) */}
                    <section className="flex-1 overflow-y-auto no-scrollbar">
                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[1fr] items-stretch">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index} className={`rounded-lg overflow-hidden ${resolvedDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent h-full animate-pulse`}>
                                        <div className={`${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'} h-[150px]`}></div>
                                        <div className="p-3 space-y-2">
                                            <div className={`h-4 w-3/4 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                            <div className={`h-3 w-1/2 rounded ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredLectures.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className={`w-20 h-20 rounded-full mb-4 flex items-center justify-center ${resolvedDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}>
                                    <Play className={`w-10 h-10 ${resolvedDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                                </div>
                                <p className={`text-lg font-semibold ${resolvedDark ? 'text-gray-300' : 'text-zinc-700'}`}>No Played Lectures</p>
                                <p className={`text-sm ${resolvedDark ? 'text-gray-500' : 'text-zinc-500'}`}>Start watching lectures to see them here</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[1fr] items-stretch">
                                {filteredLectures.map((lecture) => (
                                    <LectureCard
                                        key={lecture.lecture_id}
                                        lecture={lecture}
                                        isDark={resolvedDark}
                                        onShare={handleShareClick}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </main>
            </div>

            {/* Share Drawer (Right Side) */}
            <div
                className={`fixed inset-0 z-50 transition-opacity duration-300 ${isShareOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
            >
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setIsShareOpen(false)}
                />

                {/* Drawer Content */}
                <div
                    className={`absolute top-0 right-0 h-full w-full max-w-[400px] transition-transform duration-500 ease-out transform ${isShareOpen ? 'translate-x-0' : 'translate-x-full'
                        } ${resolvedDark ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}
                >
                    <div className="flex flex-col h-full relative">
                        {/* Drawer Header */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsShareOpen(false)}
                                    className={`p-2 rounded-full cursor-pointer transition-colors ${resolvedDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                                >
                                    <ChevronLeft size={24} />
                                </button>
                                <h2 className="text-xl font-bold">Forward</h2>
                            </div>
                        </div>

                        {/* Search Bar Container */}
                        <div className="px-5 py-2">
                            <div className={`relative flex items-center rounded-xl px-4 py-3 transition-all ${resolvedDark ? 'bg-zinc-900' : 'bg-[#F2F2F2]'}`}>
                                <Search size={18} className="text-zinc-400 mr-2" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    className="bg-transparent w-full outline-none text-[15px] placeholder:text-zinc-400"
                                />
                            </div>
                        </div>

                        {/* Student List */}
                        <div className="flex-1 overflow-y-auto mt-4 px-2 no-scrollbar">
                            {[
                                { id: 1, name: 'Ramesh', avatar: '' },
                                { id: 2, name: 'Sonal', avatar: '' },
                                { id: 3, name: 'Riya', avatar: '' },
                                { id: 4, name: 'Tina', avatar: '' },
                                { id: 5, name: 'Mahesh', avatar: '' },
                                { id: 6, name: 'Sanjay', avatar: '' },
                                { id: 7, name: 'Rahul', avatar: '' },
                            ]
                                .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                                .map((student) => (
                                    <div
                                        key={student.id}
                                        onClick={() => {
                                            setSelectedStudents(prev =>
                                                prev.includes(student.id)
                                                    ? prev.filter(id => id !== student.id)
                                                    : [...prev, student.id]
                                            );
                                        }}
                                        className={`flex items-center justify-between px-4 py-4 cursor-pointer border-b transition-colors ${resolvedDark ? 'border-zinc-800 hover:bg-zinc-900/50' : 'border-zinc-100 hover:bg-zinc-50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-linear-to-tr from-[#FF9F43] to-[#FF6B6B] flex items-center justify-center text-white font-bold p-0.5 border border-transparent overflow-hidden">
                                                <User fill="white" className="w-6 h-6 opacity-80" />
                                            </div>
                                            <span className="font-semibold text-base">{student.name}</span>
                                        </div>
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedStudents.includes(student.id)
                                            ? (resolvedDark ? 'bg-white border-white' : 'bg-[#696CFF] border-[#696CFF]')
                                            : 'border-zinc-300'
                                            }`}>
                                            {selectedStudents.includes(student.id) && (
                                                <svg viewBox="0 0 24 24" fill="none" stroke={resolvedDark ? "black" : "white"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                ))}
                        </div>

                        {/* Floating Action Button (FAB) */}
                        <div className="absolute bottom-10 right-6">
                            <button
                                onClick={handleShareSubmit}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all transform active:scale-95 duration-200 ${selectedStudents.length > 0
                                    ? (resolvedDark ? 'bg-white hover:bg-zinc-200' : 'bg-[#333] hover:bg-black') + ' scale-100'
                                    : (resolvedDark ? 'bg-zinc-500' : 'bg-zinc-400') + ' scale-90 opacity-50 cursor-not-allowed'
                                    }`}
                                disabled={selectedStudents.length === 0}
                            >
                                <ArrowRight size={28} className={resolvedDark && selectedStudents.length > 0 ? "text-black" : "text-white"} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Playedleacher;