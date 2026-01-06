// export default FilterLecture;
import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import {Pencil, Trash2, Clock } from "lucide-react";
import { NavLink } from "react-router-dom";
import { getAsset } from "../../../utils/assets";

function FilterLecture({ isDark, toggleTheme, sidebardata, addchapter }) {
    const [openMenu, setOpenMenu] = useState(null);
    const [currentPage, setCurrentPage] = useState(0); // 0-based page index
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const videos = [
        {
            title: "Advanced Chemistry",
            size: "1.2GB",
            subject: "Chemistry",
            chapterName: "Organic Compounds",
            chapterNumber: "2",
            topic: "Hydrocarbons",
            duration: "42:15",
        },
        {
            title: "Advanced Chemistry",
            size: "1.2GB",
            subject: "Chemistry",
            chapterName: "Organic Compounds",
            chapterNumber: "2",
            topic: "Hydrocarbons",
            duration: "42:15",
        },
        {
            title: "Advanced Chemistry",
            size: "1.2GB",
            subject: "Chemistry",
            chapterName: "Organic Compounds",
            chapterNumber: "2",
            topic: "Hydrocarbons",
            duration: "42:15",
        },
        {
            title: "Advanced Chemistry",
            size: "1.2GB",
            subject: "Chemistry",
            chapterName: "Organic Compounds",
            chapterNumber: "2",
            topic: "Hydrocarbons",
            duration: "42:15",
        },
        {
            title: "Extra Video",
            size: "900MB",
            subject: "Physics",
            chapterName: "Kinematics",
            chapterNumber: "3",
            topic: "Motion",
            duration: "36:00",
        },
        {
            title: "Extra Video 2",
            size: "850MB",
            subject: "Maths",
            chapterName: "Algebra",
            chapterNumber: "1",
            topic: "Equations",
            duration: "28:30",
        },
        {
            title: "Extra Video 2",
            size: "850MB",
            subject: "Maths",
            chapterName: "Algebra",
            chapterNumber: "1",
            topic: "Equations",
            duration: "28:30",
        },
        {
            title: "Extra Video 2",
            size: "850MB",
            subject: "Maths",
            chapterName: "Algebra",
            chapterNumber: "1",
            topic: "Equations",
            duration: "28:30",
        },
        {
            title: "Extra Video 2",
            size: "850MB",
            subject: "Maths",
            chapterName: "Algebra",
            chapterNumber: "1",
            topic: "Equations",
            duration: "28:30",
        },
        {
            title: "Extra Video 2",
            size: "850MB",
            subject: "Maths",
            chapterName: "Algebra",
            chapterNumber: "1",
            topic: "Equations",
            duration: "28:30",
        },
        {
            title: "Extra Video 2",
            size: "850MB",
            subject: "Maths",
            chapterName: "Algebra",
            chapterNumber: "1",
            topic: "Equations",
            duration: "28:30",
        },
    ];

    const totalVideos = videos.length;
    const startIndex = currentPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedVideos = videos.slice(startIndex, endIndex);

    const handleChangeRowsPerPage = (e) => {
        const value = Number(e.target.value);
        setRowsPerPage(value);
        setCurrentPage(0);
    };

    const handlePrevPage = () => {
        setCurrentPage((prev) => (prev > 0 ? prev - 1 : prev));
    };

    const handleNextPage = () => {
        const maxPage = Math.max(Math.ceil(totalVideos / rowsPerPage) - 1, 0);
        setCurrentPage((prev) => (prev < maxPage ? prev + 1 : prev));
    };

    return (
        <div
            className={`flex ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
                } h-screen overflow-x-hidden overflow-y-hidden transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 min-w-0 w-full md:ml-20 lg:ml-72 px-3 sm:px-4 md:px-6 pt-6 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Chapter Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={`mt-6 flex-1 transition-colors duration-300 ${isDark ? "bg-black" : "bg-zinc-50"
                        }`}
                >
                    <div
                        className={`min-h-screen flex flex-col ${isDark ? "bg-black text-gray-200" : "bg-white text-[#696CFF]"
                            }`}
                    >
                        {/* Top Table Container */}
                        <div className={`w-full max-w-none rounded pb-6 p-3 md:px-5 lg:px-6 overflow-x-auto no-scrollbar transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border`}>
 
                            {/* Top Row */}

                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                <h2 className={`font-medium header-3 transition-colors duration-300 ${isDark ? "text-white" : "text-[#696CFF]"}`}>Chapter Management</h2>
                            </div>

                            {/* FilterLecture bar removed as per design */}

                            {/* Video Table — SCROLLABLE Y */}
                            {/* md: 4 rows approx, mobile: 3 rows approx */}
                            {videos.length != 0 &&
                                (
                                    <div
                                        className="overflow-x-auto no-scrollbar h-[70vh]"
                                    >
                                        {/* Scroll area added here */}
                                        <div className="overflow-y-auto no-scrollbar h-[70vh]">
                                            <table className={`w-full min-w-[800px] header-4 leading-none font-inter transition-colors duration-300 ${isDark ? 'border-zinc-800 text-white bg-zinc-900' : 'border-blue-100 text-[#696CFF] bg-zinc-50'}`}>
                                                <thead className={`sticky -top-px z-100 
                                                    transition-colors duration-300 rounded-sm ${isDark ? 'bg-zinc-800' : 'bg-blue-50'}`}>
                                                    <tr className={`text-left transition-colors 
                                                        text-[15px] duration-300`}>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "books_dark" : "books_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Book icon"
                                                                />
                                                                <span>Book</span>
                                                            </div>
                                                        </th>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "subject_dark" : "subject_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Subject icon"
                                                                />
                                                                <span>Subject</span>
                                                            </div>
                                                        </th>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "book_name_dark" : "book_name_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Book name icon"
                                                                />
                                                                <span>Book Name</span>
                                                            </div>
                                                        </th>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "uploadbook_dark" : "uploadbook_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Upload book icon"
                                                                />
                                                                <span>Upload Book</span>
                                                            </div>
                                                        </th>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "chaptername_dark" : "chaptername_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Chapter name icon"
                                                                />
                                                                <span>Chapter Name</span>
                                                            </div>
                                                        </th>
                                                        
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "topics_dark" : "topics_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Topic icon"
                                                                />
                                                                <span>Topic</span>
                                                            </div>
                                                        </th>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <img
                                                                    src={getAsset(isDark ? "clock_dark" : "clock_light")}
                                                                    width={20}
                                                                    height={20}
                                                                    alt="Clock icon"
                                                                />
                                                                <span>Video Time Duration</span>
                                                            </div>
                                                        </th>
                                                        <th className={`px-4 py-3 font-semibold transition-colors duration-300 ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>
                                                            
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-base md:text-[17px]">
                                                    {paginatedVideos.map((video, i) => (
                                                        <tr
                                                            key={i}
                                                            className={`transition-colors duration-300 
                                                                ${isDark
                                                                    ? `${i % 2 !== 1 ? 'bg-[#FFFFFF0D]' : 'bg-[#FFFFFF00]'} border-zinc-800`
                                                                    : `${i % 2 === 1 ? 'bg-white' : 'bg-zinc-50'} border-zinc-200`
                                                                }`}
                                                        >
                                                            {/* Book (thumbnail) */}
                                                            <td className="px-4 py-3">
                                                                <div className={`w-[150px] h-[75px] rounded-md transition-colors duration-300 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`}></div>
                                                            </td>
                                                            {/* Subject */}
                                                            <td className={`px-4 py-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{video.subject}</td>
                                                            {/* Book Name (video title) */}
                                                            <td className={`px-4 py-3 text-[17px] transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{video.title}</td>
                                                            {/* Upload Book (size) */}
                                                            <td className={`px-4 py-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{video.size}</td>
                                                            {/* Chapter Name */}
                                                            <td className={`px-4 py-3 transition-colors text-base duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{video.chapterName}</td>
                                                            {/* Topic */}
                                                            <td className={`px-4 py-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{video.topic}</td>
                                                            {/* Video Time Duration */}
                                                            <td className={`px-4 py-3 transition-colors duration-300 ${isDark ? 'text-white' : 'text-black'}`}>{video.duration}</td>
                                                            {/* Actions */}
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-3">
                                                                    <button
                                                                        className={`p-1 rounded-sm cursor-pointer transition-colors duration-300 ${isDark ? 'text-gray-200 hover:bg-zinc-700' : 'text-zinc-700 hover:bg-zinc-200'}`}
                                                                    >
                                                                        <Pencil fill={isDark ? 'white' : '#696CFF'} color={isDark ? 'white' : '#696CFF'} size={22} />
                                                                    </button>
                                                                    <button
                                                                        className={`p-1 rounded-sm cursor-pointer transition-colors duration-300 ${isDark ? 'text-red-400 hover:bg-zinc-700' : 'text-red-500 hover:bg-zinc-200'}`}
                                                                    >
                                                                        <Trash2 fill={isDark ? 'white' : '#696CFF'} color={isDark ? 'white' : '#696CFF'} size={22} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                        </div>

                        {/* Outside click overlay to close menus */}
                        {openMenu !== null && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setOpenMenu(null)}
                                aria-hidden="true"
                            />
                        )}

                        {totalVideos === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-33">
                                <h2 className={`text-lg font-semibold mb-2 transition-colors duration-300 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Uploaded Your First Video</h2>
                                <p className={`text-sm mb-6 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Make This Space Your Own</p>
                                <NavLink
                                    to={addchapter}
                                    className={`px-5 py-2 cursor-pointer rounded font-medium transition-colors duration-300 ${isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    Add Chapters
                                </NavLink>
                            </div>
                        ) : (

                            <div className={`flex justify-between items-center text-sm mt-4 px-4 transition-colors duration-300 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                <div>
                                    {totalVideos > 0 && (
                                        <span>
                                            {startIndex + 1} - {Math.min(endIndex, totalVideos)} of {totalVideos}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span>Rows per page:</span>
                                    <select
                                        className={`rounded px-2 py-1 outline-none cursor-pointer transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-700 text-gray-200' : 'bg-white border-zinc-300 text-black'} border`}
                                        value={rowsPerPage}
                                        onChange={handleChangeRowsPerPage}
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                    <button
                                        className={`px-2 cursor-pointer transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-600 hover:text-[#696CFF]'}`}
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 0}
                                    >&lt;</button>
                                    
                                    <button
                                        className={`px-2 cursor-pointer transition-colors duration-300 ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-zinc-600 hover:text-[#696CFF]'}`}
                                        onClick={handleNextPage}
                                        disabled={(currentPage + 1) * rowsPerPage >= totalVideos}
                                    >&gt;</button>
                                </div>
                            </div>
                        )}

                    </div>
                </main>
            </div>
        </div>
    );
}

export default FilterLecture;
