
// this is with board system wuthout full screen
import React, { useEffect, useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset } from "../../../utils/assets.js";
import UnrealVideo from "../Startup/UnrealVideo.jsx";
import { useLocation } from "react-router-dom";

function LectureVideo({ theme, isDark, toggleTheme, sidebardata }) {
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [shareClass, setShareClass] = useState("");
    const [lecturejson, setLecturejson] = useState("");
    const location = useLocation();

    useEffect(() => {
        if (location.state?.lecturejson) {
            setLecturejson(location.state?.lecturejson);
            console.log(lecturejson);
        }
    }, [location, location.state?.lecturejson]);

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-20 lg:ml-72 p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {/* Top action bar (Start New Lecture + actions) */}
                    <div className={`w-full rounded ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"} px-3 py-2 md:px-4 md:py-3 text-sm md:text-base flex items-center justify-between mb-5`}>
                        <span className={`cursor-default px-3 py-1.5 rounded font-inter font-medium text-[18px] leading-[100%] capitalize ${isDark ? "text-gray-200" : " text-zinc-800"}`}>
                            Lecture
                        </span>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsShareOpen(true)}
                                className={`w-full md:w-auto cursor-pointer font-medium px-3 py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-2 ${isDark ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-[#696CFF] text-white hover:bg-[#5a5de6]"}`}
                            >
                                <span>Share With Student</span>
                                <img src={getAsset(isDark ? 'share__dark' : 'share_dark')} alt="share" className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* ===== Video Card ===== */}
                    <section className="flex-1 overflow-y-auto no-scrollbar relative">
                        <div className={`max-w-4xl w-full mx-auto transition filter ${isShareOpen ? 'blur-sm' : 'blur-0'}`}>
                            <div className={`${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"} rounded-lg shadow overflow-hidden`}>
                                {/* Header */}
                                <div className="px-4 pt-3">
                                    <h2 className={`${isDark ? "text-gray-200" : "text-zinc-900"} text-sm md:text-[15px] font-medium`}>
                                        Introduction TO Quantum Physics
                                    </h2>
                                    <p className={`${isDark ? "text-zinc-400" : "text-zinc-500"} text-[11px] mt-1`}>
                                        Dr Evelyn Reed
                                    </p>
                                </div>
                                {/* Player surface - using UnrealVideo component */}
                                <div className={`${isDark ? "bg-zinc-800" : "bg-zinc-100"} mx-4 my-3 rounded-md overflow-hidden`}>
                                    <div className="relative w-full h-[400px] rounded-md overflow-hidden">
                                        <UnrealVideo fullScreen={false} lecturejson={lecturejson} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {isShareOpen && (
                            <div
                                className="fixed inset-0 z-40 flex items-center justify-center px-4 bg-black/40"
                                onClick={() => setIsShareOpen(false)}
                            >
                                <div
                                    className={`${isDark ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'} w-full max-w-md rounded-lg shadow-xl border ${isDark ? 'border-zinc-800' : 'border-zinc-200'} px-6 py-5`}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <h3 className="text-sm md:text-base font-semibold">
                                            Share With Student Enter Class Number
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setIsShareOpen(false)}
                                            className={`cursor-pointer inline-flex h-6 w-6 items-center justify-center text-sm ${isDark ? 'text-zinc-300 hover:bg-zinc-800 rounded-sm' : 'text-zinc-500 hover:bg-zinc-100 rounded-sm'}`}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <label className={`block text-xs mb-1.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                                        Class
                                    </label>
                                    <input
                                        type="text"
                                        value={shareClass}
                                        onChange={(e) => setShareClass(e.target.value)}
                                        placeholder="Enter Your Class"
                                        className={`w-full rounded-md px-3 py-2 text-sm outline-none border ${isDark
                                            ? 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500'
                                            : 'bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500'
                                            }`}
                                    />

                                    <div className="mt-4 flex justify-center">
                                        <button
                                            type="button"
                                            className={`cursor-pointer inline-flex items-center gap-2 px-5 py-1.5 rounded text-xs md:text-sm font-medium ${isDark ? 'bg-white text-zinc-900 hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#575BFF]'}`}
                                        >
                                            <span>Share</span>
                                            <img src={getAsset(isDark ? 'share__dark' : 'share_dark')} alt="share" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
}

export default LectureVideo;