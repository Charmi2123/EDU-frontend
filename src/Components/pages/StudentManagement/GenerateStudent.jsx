
import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { ChevronDown, ArrowLeft, ArrowRight, User, LockKeyhole, Hash, Copy } from "lucide-react";
import { getAsset, BACKEND_API_URL } from "../../../utils/assets";

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-5px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
if (!document.head.querySelector('style[data-fade-in]')) {
    style.setAttribute('data-fade-in', 'true');
    document.head.appendChild(style);
}

function GenerateStudent({ isDark, toggleTheme, sidebardata }) {
    // API states
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Search state
    const [searchValue, setSearchValue] = useState('');

    // Copy message state
    const [copyMessage, setCopyMessage] = useState('');
    const [copyMessageIndex, setCopyMessageIndex] = useState(null);

    // Copy function with mobile fallback
    const handleCopyPassword = async (password, index) => {
        console.log('Copy clicked for index:', index); // Debug log
        try {
            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(password);
            } else {
                // Fallback for mobile and older browsers
                const textArea = document.createElement('textarea');
                textArea.value = password;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (!successful) {
                    throw new Error('Copy command failed');
                }
            }
            
            setCopyMessage('Copied!');
            setCopyMessageIndex(index);
            setTimeout(() => {
                setCopyMessage('');
                setCopyMessageIndex(null);
            }, 2000); // Hide after 2 seconds
        } catch (err) {
            console.log('Copy failed:', err); // Debug log
            setCopyMessage('Failed');
            setCopyMessageIndex(index);
            setTimeout(() => {
                setCopyMessage('');
                setCopyMessageIndex(null);
            }, 2000);
        }
    };

    // Fetch student credentials from API
    useEffect(() => {
        const fetchStudentCredentials = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('access_token');
                
                if (!token) {
                    setError('No authentication token found');
                    setLoading(false);
                    return;
                }

                const response = await axios.get(
                    `${BACKEND_API_URL}/student-management/roster/credentials`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status && response.data?.data?.students) {
                    // Transform API data to match component structure
                    const transformedData = response.data.data.students.map(student => ({
                        username: student.enrollment_number,
                        password: student.password
                    }));
                    setUserData(transformedData);
                } else {
                    setError('Invalid response format');
                }
            } catch (err) {
                console.error('Failed to fetch student credentials:', err);
                setError(err.response?.data?.message || 'Failed to fetch student credentials');
            } finally {
                setLoading(false);
            }
        };
        fetchStudentCredentials();
    }, []);

    // Search handler
    const handleNameChange = (e) => {
        const next = e.target.value;
        setSearchValue(next);
    };
    
    // Filter data based on search
    const filteredData = userData.filter(student => {
        const searchQuery = (searchValue || '').trim().toLowerCase();
        if (!searchQuery) return true;
        return (
            student.username.toLowerCase().includes(searchQuery)
        );
    });

    // Pagination (align with TotalPaid / TotalLecture, but use real data length)
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalRows = filteredData.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
    const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
    const endIndex = totalRows === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalRows);
    const pageStart = (currentPage - 1) * rowsPerPage;
    const pageEnd = pageStart + rowsPerPage;

    const paginatedData = filteredData.slice(pageStart, pageEnd);

    // Responsive condition check
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768); // md breakpoint
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Row styles (theme-aware, tuned for screenshot theme)
    const oddRowClass = isDark ? "bg-zinc-900" : "bg-white";
    const hoverClass = isDark ? "hover:bg-zinc-700" : "hover:bg-[#E5E7FF]";
    const evenRowClass = isDark ? "bg-zinc-800" : "bg-zinc-50";

    return (
        <div
            className={`flex h-screen overflow-y-auto overflow-x-hidden transition-colors duration-300 ${isDark ? "bg-black text-white" : "bg-[#F5F5FF] text-[#111827]"
                }`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Generate Student"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                        searchValue={searchValue}
                        setSearchValue={setSearchValue}
                        isSearchbar={true}
                    />
                </div>

                <main
                    className={`flex-1 overflow-y-hidden ${isDark ? "bg-black" : "bg-zinc-50"
                        } transition-colors duration-300`}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin"></div>
                                <div className="text-sm opacity-60">Loading student credentials...</div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center h-32">
                            <div className="text-sm text-red-500">{error}</div>
                        </div>
                    ) : (
                        <div
                            className={`flex flex-col mt-6 h-full ${isDark ? "bg-black text-gray-200" : "bg-transparent text-zinc-800"
                                }`}
                        >
                        {/* ✅ Desktop/Tablet Layout (Table View) */}
                        {!isMobile && (
                            <>
                                <div
                                    className={`w-full rounded-2xl overflow-hidden ${isDark
                                        ? "bg-zinc-900 border border-zinc-800"
                                        : "bg-white border-none shadow-sm"
                                        } transition-colors duration-300`}
                                >
                                    <h2
                                        className={`text-base font-medium pl-6 pt-6 mb-2 ${isDark ? "text-white" : "text-[#4F46E5]"
                                            }`}
                                    >
                                        Generate Student
                                    </h2>

                                    {/* Scroll area aligned with TotalLecture/TotalPaid */}
                                    <div className="p-6 pt-0 mt-3 max-h-[calc(100vh-220px)] overflow-y-auto overflow-x-auto no-scrollbar">
                                        <table
                                            className={`table-fixed divide-y text-sm ${isDark ? 'divide-zinc-800' : 'divide-zinc-200'
                                                }`}
                                            style={{ columnGap: '60px', width: 'auto' }}
                                        >
                                            <thead
                                                className={`${isDark
                                                    ? 'bg-zinc-800 text-white'
                                                    : 'bg-[#EEF0FF] text-[#4F46E5]'
                                                    } text-left text-xs font-semibold sticky top-0 z-10`}
                                            >
                                                <tr>
                                                    <th className="px-4 py-3" style={{ width: '200px' }}>
                                                        <div className="flex items-center space-x-2">
                                                            <Hash className="h-4 w-4" />
                                                            <span>Enrolment Number</span>
                                                        </div>
                                                    </th>
                                                    <th className="px-4 py-3" style={{ width: '150px' }}>
                                                        <div className="flex items-center space-x-2">
                                                            <LockKeyhole className="h-4 w-4" />
                                                            <span>Password</span>
                                                        </div>
                                                    </th>
                                                    <th className="px-4 py-3" style={{ width: '150px' }}>

                                                    </th>
                                                    
                                                </tr>
                                            </thead>

                                            <tbody
                                                className={`divide-y text-xs font-normal ${isDark
                                                    ? 'divide-zinc-800 text-gray-300'
                                                    : 'divide-[#E5E7FF] text-zinc-700'
                                                    }`}
                                            >
                                                {paginatedData.map((user, index) => (
                                                    <tr
                                                        key={index}
                                                        className={`${index % 2 === 0
                                                            ? oddRowClass
                                                            : evenRowClass
                                                            } ${hoverClass}`}
                                                    >
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            <div className="flex items-center gap-2">
                                                                
                                                                <Hash className="h-4 w-4" />
                                                                <span className="text-[13px] md:text-sm">
                                                                    {user.username}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-[13px] md:text-sm">
                                                            <span className="text-[13px] md:text-sm">
                                                                {"*".repeat(user.password?.length || 6)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-[13px] md:text-sm">
                                                            <div className="flex items-center gap-2 relative justify-end">
                                                                <button
                                                                    onClick={() => handleCopyPassword(user.password, index)}
                                                                    className={`p-1 rounded transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-700 text-gray-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700'}`}
                                                                    title="Copy password"
                                                                >
                                                                    <Copy className="h-4 w-4" />
                                                                </button>
                                                                {copyMessageIndex === index && (
                                                                    <span 
                                                                        className={`absolute top-0 left-full ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                                                            copyMessage === 'Copied!' 
                                                                                ? 'bg-green-500 text-white' 
                                                                                : 'bg-red-500 text-white'
                                                                        }`}
                                                                        style={{
                                                                            animation: 'fadeIn 0.3s ease-in-out',
                                                                            minWidth: '60px',
                                                                            textAlign: 'center',
                                                                            fontSize: '11px'
                                                                        }}
                                                                    >
                                                                        {copyMessage}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Pagination - match TotalPaid/TotalLecture styling */}
                                <div className="flex justify-between items-center w-full max-w-none mb-2 text-sm p-1">
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                                        {startIndex}-{endIndex} of {totalRows}
                                    </span>

                                    <div className="flex items-center space-x-4">
                                        <div className={`flex items-center space-x-2 ${isDark ? 'text-gray-400' : 'text-zinc-600'}`}>
                                            <span>Rows per page:</span>
                                            <div className="relative inline-block">
                                                <select
                                                    className={`cursor-pointer appearance-none border rounded-md pl-3 pr-8 py-1 focus:outline-none ${isDark
                                                        ? "bg-zinc-900 border-zinc-800 text-white"
                                                        : "bg-white border-zinc-300 text-zinc-900"
                                                        }`}
                                                    value={rowsPerPage}
                                                    onChange={(e) => {
                                                        const next = parseInt(e.target.value, 10) || 10;
                                                        setRowsPerPage(next);
                                                        setCurrentPage(1);
                                                    }}
                                                >
                                                    <option value="10">10</option>
                                                    <option value="20">20</option>
                                                    <option value="50">50</option>
                                                </select>
                                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div className="flex space-x-2 mr-2">
                                            <button
                                                className={`p-2 border rounded-md cursor-pointer ${isDark
                                                    ? 'border-zinc-700 text-gray-400 hover:bg-zinc-800'
                                                    : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                                                    } disabled:opacity-50`}
                                                disabled={currentPage === 1}
                                                onClick={() =>
                                                    setCurrentPage((prev) => Math.max(1, prev - 1))
                                                }
                                            >
                                                <ArrowLeft className="h-4 w-4" />
                                            </button>

                                            <button
                                                className={`p-2 border rounded-md cursor-pointer ${isDark
                                                    ? 'border-zinc-700 text-gray-400 hover:bg-zinc-800'
                                                    : 'border-zinc-300 text-zinc-600 hover:bg-zinc-100'
                                                    } disabled:opacity-50`}
                                                disabled={endIndex >= totalRows}
                                                onClick={() =>
                                                    setCurrentPage((prev) =>
                                                        Math.min(totalPages, prev + 1)
                                                    )
                                                }
                                            >
                                                <ArrowRight className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ✅ Mobile Layout (Card/List View) */}
                        {isMobile && (
                            <div className="flex flex-col space-y-3 h-full">
                                <div
                                    className={`sticky top-0 z-10 pb-2 ${
                                        isDark ? 'bg-black' : 'bg-zinc-50'
                                    }`}
                                >
                                    <h1 className="text-xl font-bold">Generate Student</h1>
                                </div>

                                <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pt-1">
                                    {userData.map((user, index) => (
                                        <div
                                            key={index}
                                            className={`p-4 rounded-2xl shadow-md ${isDark ? 'bg-zinc-800' : 'bg-white'}`}
                                        >
                                            <div className="grid grid-cols-2 gap-y-1 text-sm">
                                                <div className={`font-medium truncate ${isDark ? "text-white" : "text-zinc-900"}`}>Username:</div>
                                                <div className={`${isDark ? 'text-white/70' : 'text-zinc-900/70'}`}>
                                                    {user.username}
                                                </div>
                                                <div className={`font-medium truncate ${isDark ? "text-white" : "text-zinc-900"}`}>Password:</div>
                                                <div className={`${isDark ? 'text-white/70' : 'text-zinc-900/70'} flex items-center gap-2`}>
                                                    <span>{"•".repeat(user.password?.length || 6)}</span>
                                                    <div className="relative">
                                                        <button
                                                            onClick={() => handleCopyPassword(user.password, index)}
                                                            className={`p-1 rounded transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-700 text-gray-400 hover:text-white' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700'}`}
                                                            title="Copy password"
                                                        >
                                                            <Copy className="h-4 w-4" />
                                                        </button>
                                                        {copyMessageIndex === index && (
                                                            <span 
                                                                className={`absolute top-0 left-full ml-2 text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                                                                    copyMessage === 'Copied!' 
                                                                        ? 'bg-green-500 text-white' 
                                                                        : 'bg-red-500 text-white'
                                                                }`}
                                                                style={{
                                                                    animation: 'fadeIn 0.3s ease-in-out',
                                                                    minWidth: '60px',
                                                                    textAlign: 'center',
                                                                    fontSize: '11px'
                                                                }}
                                                            >
                                                                {copyMessage}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default GenerateStudent;
