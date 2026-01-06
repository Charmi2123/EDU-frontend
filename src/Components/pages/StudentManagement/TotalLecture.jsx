import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { ChevronDown, RotateCcw, MoreVertical, ArrowLeft, ArrowRight } from "lucide-react";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";

function TotalLecture({ isDark, toggleTheme, sidebardata, addchapter }) {
    const navigate = useNavigate();
    // State for lectures data
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Responsive state
    const [isMobile, setIsMobile] = useState(false);

    // Search state
    const [searchValue, setSearchValue] = useState('');
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const totalRows = lectures.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = totalRows === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalRows);
    const pageStart = (currentPage - 1) * rowsPerPage;
    const pageEnd = pageStart + rowsPerPage;

    // Fetch lectures from API
    const fetchLectures = async () => {
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setError('No authentication token found');
                setLoading(false);
                return;
            }

            const response = await axios.get(
                `${BACKEND_API_URL}/student-management/lectures`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status && response.data?.data?.lectures) {
                const formattedLectures = response.data.data.lectures.map(lecture => ({
                    title: lecture.lecture_title || 'Unknown Title',
                    subject: lecture.subject || 'Unknown Subject',
                    chapter: lecture.chapter || '-',
                    class: lecture.class ?? 'N/A',
                    date: lecture.date || '-',
                }));
                setLectures(formattedLectures);
            } else {
                setError('Invalid response format');
            }
        } catch (error) {
            console.error('Failed to fetch lectures:', error);
            setError(error.response?.data?.message || 'Failed to fetch lectures');
        } finally {
            setLoading(false);
        }
    };

    // Responsive detection
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768); // md breakpoint
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Search handler
    const handleNameChange = (e) => {
        const next = e.target.value;
        setSearchValue(next);
    };

    // Filter data based on search
    const filteredData = lectures.filter(lecture => {
        const searchQuery = (searchValue || '').trim().toLowerCase();
        if (!searchQuery) return true;
        
        const searchFields = [
            lecture.title,
            lecture.subject,
            lecture.chapter,
            lecture.class
        ];
        
        return searchFields.some(field => 
            field && String(field).toLowerCase().includes(searchQuery)
        );
    });

    // Update pagination to use filtered data
    const filteredTotalRows = filteredData.length;
    const filteredTotalPages = Math.max(1, Math.ceil(filteredTotalRows / rowsPerPage));
    const filteredStartIndex = filteredTotalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const filteredEndIndex = filteredTotalRows === 0 ? 0 : Math.min(currentPage * rowsPerPage, filteredTotalRows);
    const filteredPageStart = (currentPage - 1) * rowsPerPage;
    const filteredPageEnd = filteredPageStart + rowsPerPage;
    const paginatedData = filteredData.slice(filteredPageStart, filteredPageEnd);

    // Fetch data on component mount
    useEffect(() => {
        fetchLectures();
    }, []);

    // Reset page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchValue]);

    // Tailwind CSS classes for alternating colors per theme
    const oddRowClass = isDark ? 'bg-zinc-900' : 'bg-white';
    const evenRowClass = isDark ? 'bg-zinc-800' : 'bg-zinc-50';
    const hoverClass = isDark ? 'hover:bg-zinc-700' : 'hover:bg-zinc-100';

    return (
        <div
            className={`flex ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
                } h-screen overflow-hidden transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Total Lecture"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        isSearchbar={true}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={`mt-6 flex-1 no-scroller transition-colors duration-300 ${isDark ? "bg-black" : "bg-zinc-50"
                        }`}
                >
                    <div
                        className={`flex flex-col ${isDark ? "bg-black text-gray-200" : "bg-white text-zinc-800"
                            }`}
                    >

                        {/* Table Container - matching the main dark background panel */}
                        <div className={`w-full rounded p-0 md:px-0 lg:px-0 overflow-x-auto transition-colors duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} border-none`}>

                            {/* Table Header/Title */}
                            <div className={`flex items-center gap-3 pl-6 pt-6`}>
                                <button
                                    onClick={() => navigate('/Student/Dashboard')}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-gray-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                
<h2
                                    className={`text-[22px] font-medium leading-none tracking-normal capitalize ${isDark ? 'text-gray-100' : 'text-black'
                                        }`}
                                >
                                    Lecture List
                                </h2>
                            </div>

                            {/* Table itself */}
                            <div className="p-6 pt-0 mt-3 max-h-[calc(100vh-245px)] overflow-y-auto overflow-x-auto no-scrollbar">
                                <table className={`min-w-full divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-200'}`}>
                                   <thead
  className={`text-[12px] font-semibold leading-none tracking-normal capitalize ${
    isDark ? 'bg-zinc-800 text-white' : 'bg-blue-50 text-zinc-700'
  } sticky top-0 z-10`}
>   <tr className={`text-left text-xs font-semibold leading-none capitalize`}>
                                            <th className="px-6 py-3 tracking-wider">Lecture Title</th>
                                            <th className="px-6 py-3 tracking-wider">Subject</th>
                                            <th className="px-6 py-3 tracking-wider">Chapter Name</th>
                                            <th className="px-6 py-3 tracking-wider">Class</th>
                                            <th className="px-6 py-3 tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDark ? 'divide-zinc-800' : 'divide-zinc-200'} text-xs font-normal leading-none`}>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center">
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                        <span className="text-sm">Loading lectures...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center">
                                                    <div className="text-sm text-red-500">{error}</div>
                                                </td>
                                            </tr>
                                        ) : filteredData.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="px-6 py-8 text-center">
                                                    <div className="text-sm opacity-60">No lectures found</div>
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedData.map((lecture, index) => (
                                                <tr
                                                    key={index}
                                                    className={`${index % 2 === 0 ? oddRowClass : evenRowClass}`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">{lecture.title}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{lecture.subject}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{lecture.chapter}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{lecture.class}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">{lecture.date}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Section */}
                        <div className="flex justify-between items-center w-full max-w-7xl mt-2 px-0 md:px-0 lg:px-0 text-sm">
                            <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                                {filteredStartIndex}-{filteredEndIndex} of {filteredTotalRows}
                            </span>
                            <div className="flex items-center space-x-4">
                                <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                    <span>Rows per page:</span>
                                    <div className="relative inline-block">
                                        <select
                                            className={`cursor-pointer appearance-none rounded-md pl-3 pr-8 py-1 focus:outline-none focus:ring-1 ${isDark ? 'bg-black border border-zinc-700 text-white focus:ring-blue-500' : 'bg-white border border-zinc-300 text-zinc-900 focus:ring-blue-500'}`}
                                            value={rowsPerPage}
                                            onChange={(e) => {
                                                const next = parseInt(e.target.value, 10) || 10;
                                                setRowsPerPage(next);
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <option value="10" >10</option>
                                            <option value="20">20</option>
                                            <option value="50">50</option>
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        className={`p-2 border rounded-md cursor-pointer ${isDark ? 'border-zinc-700 text-gray-400 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'} disabled:opacity-50`}
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <button
                                        className={`p-2 border rounded-md cursor-pointer ${isDark ? 'border-zinc-700 text-gray-400 hover:bg-zinc-800' : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'} disabled:opacity-50`}
                                        onClick={() => setCurrentPage((prev) => Math.min(filteredTotalPages, prev + 1))}
                                        disabled={filteredEndIndex >= filteredTotalRows}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default TotalLecture;
