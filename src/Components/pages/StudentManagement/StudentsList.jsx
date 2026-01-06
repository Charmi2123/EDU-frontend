import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { BACKEND_API_URL, getAsset, handleerror, handlesuccess } from "../../../utils/assets.js";
import axios from "axios";
import { Inbox, Loader2, ArrowLeft, MoveLeft, ChevronDown } from 'lucide-react';
import { NavLink, useNavigate, useLocation } from "react-router-dom";

function StudentsList({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [showFilters, setShowFilters] = useState(false);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [highlightedRows, setHighlightedRows] = useState([]);

    // Initialize filter states with defaults
    const [selectedClass, setSelectedClass] = useState('All Classes');
    const [selectedDivision, setSelectedDivision] = useState('All Division');
    const [searchValue, setSearchValue] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState({ enrollmentNumber: '', name: '' });



    // Handle class change to update available divisions
    const handleClassChange = (className) => {
        setSelectedClass(className);
        // Reset division when class changes
        setSelectedDivision('All Division');
    };

    // Fetch all students from API
    const fetchStudents = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const config = {
                headers: {
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                }
            };

            const response = await axios.get(
                `${BACKEND_API_URL}/student-management/students`,
                config
            );

            if (response.data?.status === true && Array.isArray(response.data?.data?.students)) {
                const apiStudents = response.data.data.students;

                const mapped = apiStudents.map((s, index) => ({
                    sid: s.profile_id ?? index,
                    roster_first_name: s.roster_first_name || '',
                    roster_middle_name: s.roster_middle_name || '',
                    roster_last_name: s.roster_last_name || '',
                    name: `${s.roster_first_name || ''} ${s.roster_middle_name || ''} ${s.roster_last_name || ''}`.trim() || s.enrollment_number || 'Unknown',
                    enrollment_number: s.enrollment_number || s.profile_id?.toString() || index.toString(),
                    class_name: s.std || s.std || '',
                    division: s.profile_division || s.roster_division || '',
                    father_name: s.roster_middle_name || '',
                    mobile_number: s.mobile_number || s.parents_number || '',
                    email: s.email || '',
                    class_head: s.class_head || '',
                    profile_complete: s.profile_complete || false,
                    profile_created_at: s.profile_created_at || '',
                    photo_path: s.photo_path || null,
                    purchases: s.purchases || []
                }));

                setStudents(mapped);
            } else {
                setStudents([]);
                handleerror('Invalid response format from server');
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            handleerror(error.response?.data?.message || error.message || 'Failed to fetch students');
            setStudents([]);
        } finally {
            setLoading(false);
        }
    };

    // Delete student function
    const deleteStudent = async (enrollmentNumber, studentName) => {
        const token = localStorage.getItem('access_token');

        try {
            const response = await axios.delete(
                `${BACKEND_API_URL}/student-management/roster/${encodeURIComponent(enrollmentNumber)}`,
                {
                    headers: {
                        accept: 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            // Remove the deleted student from the state
            setStudents(prevStudents =>
                prevStudents.filter(student => student.enrollment_number !== enrollmentNumber)
            );

            handlesuccess(response.data?.message || 'Delete successfully');
        } catch (error) {
            console.error('Error deleting student:', error);
            handleerror(error.response?.data?.message || error.message || 'Failed to delete student');
        }
    };

    const openDeleteModal = (enrollmentNumber, studentName) => {
        setDeleteTarget({ enrollmentNumber: enrollmentNumber || '', name: studentName || '' });
        setShowDeleteModal(true);
    };

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
        setDeleteTarget({ enrollmentNumber: '', name: '' });
    };

    const handleConfirmDelete = () => {
        if (!deleteTarget.enrollmentNumber) {
            setShowDeleteModal(false);
            return;
        }
        setShowDeleteModal(false);
        deleteStudent(deleteTarget.enrollmentNumber, deleteTarget.name);
    };

    // Filter options from API
    const [filterOptions, setFilterOptions] = useState({
        classes: [],
        divisions: []
    });

    // Fetch filter options from API
    const fetchFilterOptions = async () => {
        try {
            const token = localStorage.getItem('access_token') || localStorage.getItem('token') || '';

            if (!token) {
                console.warn('No token found for filter options');
                return;
            }

            const response = await axios.get(
                `${BACKEND_API_URL}/student-management/students/filters`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data?.status === true) {
                const { classes, divisions } = response.data.data || {};

                setFilterOptions({
                    classes: Array.isArray(classes) ? classes : [],
                    divisions: Array.isArray(divisions) ? divisions : []
                });

                console.log('Filter options fetched:', { classes, divisions });
            } else {
                console.warn('Failed to fetch filter options');
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
            // Fallback to empty arrays if API fails
            setFilterOptions({
                classes: [],
                divisions: []
            });
        }
    };

    // Get unique classes - only from students data, sorted numerically
    const uniqueClasses = React.useMemo(() => {
        // Only show classes that actually have students
        const studentClasses = students.map(s => s.class_name).filter(Boolean);
        const allClasses = [...new Set(studentClasses)];

        // Sort classes numerically (1, 2, 3, 4, 10, 11, 12...)
        allClasses.sort((a, b) => {
            const numA = parseInt(a) || 0;
            const numB = parseInt(b) || 0;
            return numA - numB;
        });

        return allClasses;
    }, [students]);

    // Get unique divisions - only from students data for selected class
    const uniqueDivisions = React.useMemo(() => {
        // Only show divisions that have students in the selected class
        const base = selectedClass === 'All Classes'
            ? students
            : students.filter(student => {
                const studentClass = String(student.class_name || '').trim();
                const selectedClassClean = String(selectedClass || '').trim();
                return studentClass === selectedClassClean;
            });
        const studentDivisions = base.map(s => s.division).filter(Boolean);

        const allDivisions = [...new Set(studentDivisions)];
        return allDivisions.sort();
    }, [students, selectedClass]);
    const filteredStudents = React.useMemo(() => {
        // console.log("=== DEBUGGING FILTER ===");
        // console.log("selectedClass:", JSON.stringify(selectedClass));
        // console.log("selectedDivision:", JSON.stringify(selectedDivision));
        // console.log("Total students:", students.length);

        // First filter by class if selected
        let result = [...students];

        if (selectedClass !== 'All Classes') {
            // console.log("Applying class filter for:", JSON.stringify(selectedClass));
            result = result.filter(student => {
                const studentClass = String(student.class_name || '').trim();
                const selectedClassClean = String(selectedClass || '').trim();
                console.log(`Student: ${student.name} | class: "${studentClass}" | comparing to: "${selectedClassClean}" | match: ${studentClass === selectedClassClean}`);
                return studentClass === selectedClassClean;
            });
            // console.log("Students after class filter:", result.length);
        }

        // Then filter by division if selected
        if (selectedDivision !== 'All Division') {
            // console.log("Applying division filter for:", JSON.stringify(selectedDivision));
            result = result.filter(student => {
                const studentDivision = String(student.division || '').trim();
                const selectedDivisionClean = String(selectedDivision || '').trim();
                console.log(`Student: ${student.name} | division: "${studentDivision}" | comparing to: "${selectedDivisionClean}" | match: ${studentDivision === selectedDivisionClean}`);
                return studentDivision === selectedDivisionClean;
            });
            // console.log("Students after division filter:", result.length);
        }

        // Finally apply search query if any
        const searchQuery = (searchValue || '').trim().toLowerCase();
        if (searchQuery) {
            console.log("Applying search for:", searchQuery);
            result = result.filter(student => {
                const searchFields = [
                    student.roster_first_name,
                    student.roster_middle_name,
                    student.roster_last_name,
                    student.enrollment_number,
                    student.mobile_number,
                    student.email
                ];

                return searchFields.some(field =>
                    field && String(field).toLowerCase().includes(searchQuery)
                );
            });
            // console.log("Students after search filter:", result.length);
        }

        // console.log("Final filtered students:", result.length);
        // console.log("=== END DEBUG ===");
        return result;
    }, [students, selectedClass, selectedDivision, searchValue]);


    // Reset division filter if current selection no longer available
    useEffect(() => {
        if (selectedDivision !== 'All Division' && !uniqueDivisions.includes(selectedDivision)) {
            setSelectedDivision('All Division');
        }
    }, [uniqueDivisions, selectedDivision]);

    // Update search value (accept any characters to support IDs, numbers, etc.)
    const handleNameChange = (e) => {
        const next = e.target.value ?? '';
        setSearchValue(next);
    };


    // Check for location state to highlight newly added students
    useEffect(() => {
        if (location.state?.highlightedEnrollments) {
            setHighlightedRows(location.state.highlightedEnrollments);
            // Clear the state after using it
            navigate(location.pathname, { replace: true, state: {} });

            // Remove highlight after 20 seconds
            setTimeout(() => {
                setHighlightedRows([]);
            }, 20000);
        }
    }, [location.state, location.pathname, navigate]);

    // Fetch students and filter options on component mount
    useEffect(() => {
        fetchStudents();
        fetchFilterOptions();
    }, []);

    // Update filtered students when class or division changes
    useEffect(() => {
        // The filteredStudents will be automatically updated due to the useMemo
        // This effect can be used for any side effects when filters change
    }, [selectedClass, selectedDivision]);

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen transition-colors duration-300 overflow-x-hidden`}>
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                <div className="sticky top-0 z-20">
                    <Header title="Student Management" isDark={isDark} toggleTheme={toggleTheme} searchValue={searchValue} setSearchValue={setSearchValue} isSearchbar={true} />
                </div>

                <main className="mt-6 flex-1 no-scrollbar space-y-4 overflow-y-auto">
                    {/* ===== Students List Section ===== */}
                    {/* Filters Section */}
                    <div className="w-full mx-auto">
                        {/* Toggle Button - only visible on mobile/tablet */}
                        <div className={`fixed top-20 left-0 right-0 md:hidden flex justify-end p-3 z-2 ${isDark ? 'bg-zinc-950' : 'bg-zinc-50'}`}>  <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="bg-white text-black hover:bg-white cursor-pointer px-4 py-2 rounded-md text-sm shadow transition"
                        >
                            {showFilters ? "Hide Filters" : "Show Filters"}
                        </button>
                        </div>

                        {/* Desktop Filter Panel (always visible) */}
                        <div className={`hidden md:block w-full p-3 md:p-4 rounded-xl ${isDark ? 'bg-zinc-900 text-gray-100' : 'bg-white text-zinc-800'}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <button
                                    onClick={() => navigate("/Student/Dashboard")}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-gray-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2
                                    className={`text-[22px] font-medium leading-none tracking-normal capitalize ${isDark ? 'text-gray-100' : 'text-black'
                                        }`}
                                >
                                    Students List
                                </h2></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8" style={{ maxWidth: '600px' }}>
                                {/* Class/Stream */}
                                <div className="flex flex-col space-y-1">
                                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Class/Stream</label>
                                    <div>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const classDropdown = document.getElementById('class-dropdown');
                                                    const divisionDropdown = document.getElementById('division-dropdown');

                                                    // Close division dropdown if open
                                                    if (!divisionDropdown.classList.contains('hidden')) {
                                                        divisionDropdown.classList.add('hidden');
                                                    }

                                                    // Toggle class dropdown
                                                    classDropdown.classList.toggle('hidden');
                                                }}
                                                className={`${isDark
                                                    ? "w-full rounded-md border border-zinc-900 bg-zinc-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-[#696CFF] text-left cursor-pointer"
                                                    : "w-full rounded-md border-0 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-[#696CFF] text-left cursor-pointer"
                                                    }`}
                                            >
                                                {selectedClass}
                                                <ChevronDown className={`float-right ${isDark ? 'text-white' : 'text-zinc-900'}`} size={20} />
                                            </button>
                                            <div id="class-dropdown" className={`hidden absolute w-full z-50 mt-1 rounded-md border ${isDark ? 'border-zinc-800 bg-zinc-800' : 'border-zinc-200 bg-white'} shadow-lg max-h-60 overflow-y-auto no-scrollbar`}>
                                                <div
                                                    onClick={() => {
                                                        handleClassChange('All Classes');
                                                        document.getElementById('class-dropdown').classList.add('hidden');
                                                    }}
                                                    className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedClass === 'All Classes' ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                >
                                                    All Classes
                                                </div>
                                                {uniqueClasses.map((clsname, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => {
                                                            handleClassChange(clsname);
                                                            document.getElementById('class-dropdown').classList.add('hidden');
                                                        }}
                                                        className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedClass === clsname ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                    >
                                                        {clsname}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {/* <select
                                        value={selectedClass}
                                        onChange={(e) => handleClassChange(e.target.value)}
                                    // className={`${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-zinc-100 text-black'} p-2 rounded-md w-full focus:outline-none border cursor-pointer ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`}
                                    >
                                        <option
                                            value="All Classes"
                                            className={`${isDark
                                                ? "w-full rounded-md border border-zinc-800 bg-[#696CFF] px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-[#696CFF]"
                                                : "w-full rounded-md border border-zinc-300 bg-[#696CFF] px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-1 focus:ring-[#696CFF]"
                                                }`}
                                        >
                                            All Classes
                                        </option>

                                        {uniqueClasses.map((clsname, index) => (
                                            <option
                                                key={index}
                                                value={clsname}
                                            >{clsname}</option>
                                        ))}
                                    </select> */}
                                </div>

                                {/* Division */}
                                <div className="flex flex-col space-y-1">
                                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Division</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const divisionDropdown = document.getElementById('division-dropdown');
                                                const classDropdown = document.getElementById('class-dropdown');

                                                // Close class dropdown if open
                                                if (!classDropdown.classList.contains('hidden')) {
                                                    classDropdown.classList.add('hidden');
                                                }

                                                // Toggle division dropdown
                                                divisionDropdown.classList.toggle('hidden');
                                            }}
                                            className={`${isDark
                                                ? "w-full rounded-md border border-zinc-800 bg-zinc-800 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-[#696CFF] text-left cursor-pointer"
                                                : "w-full rounded-md border-0 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-[#696CFF] text-left cursor-pointer"
                                                }`}
                                        >
                                            {selectedDivision}
                                            <ChevronDown className={`float-right ${isDark ? 'text-white' : 'text-zinc-900'}`} size={20} />
                                        </button>
                                        <div id="division-dropdown" className={`hidden absolute w-full z-50 mt-1 rounded-md border ${isDark ? 'border-zinc-800 bg-zinc-800' : 'border-zinc-200 bg-white'} shadow-lg max-h-60 overflow-y-auto no-scrollbar`}>
                                            <div
                                                onClick={() => {
                                                    setSelectedDivision('All Division');
                                                    document.getElementById('division-dropdown').classList.add('hidden');
                                                }}
                                                className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedDivision === 'All Division' ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                            >
                                                All Division
                                            </div>
                                            {uniqueDivisions.map((division, index) => (
                                                <div
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedDivision(division);
                                                        document.getElementById('division-dropdown').classList.add('hidden');
                                                    }}
                                                    className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedDivision === division ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                >
                                                    {division}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mobile/Tablet Popup (with blur background) */}
                        {showFilters && (
                            <div onClick={() => setShowFilters(false)} className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 md:hidden transition-all">
                                <div onClick={(e) => e.stopPropagation()} className={`${isDark ? 'bg-zinc-900 text-gray-100' : 'bg-white text-zinc-900'} p-6 rounded-xl shadow-2xl w-11/12 max-w-md relative animate-fadeIn border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                                    <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-100' : 'text-[#696CFF]'}`}>Students List</h2>

                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Class/Stream */}
                                        <div className="flex flex-col space-y-1 cursor-pointer">
                                            <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Class/Stream</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const mobileClassDropdown = document.getElementById('mobile-class-dropdown');
                                                        const mobileDivisionDropdown = document.getElementById('mobile-division-dropdown');

                                                        // Close division dropdown if open
                                                        if (!mobileDivisionDropdown.classList.contains('hidden')) {
                                                            mobileDivisionDropdown.classList.add('hidden');
                                                        }

                                                        // Toggle class dropdown
                                                        mobileClassDropdown.classList.toggle('hidden');
                                                    }}
                                                    className={`${isDark
                                                        ? "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-[#696CFF] text-left"
                                                        : "w-full rounded-md border-0 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-[#696CFF] text-left"
                                                        }`}
                                                >
                                                    {selectedClass}
                                                    <ChevronDown className={`float-right ${isDark ? 'text-white' : 'text-zinc-900'}`} size={20} />
                                                </button>
                                                <div id="mobile-class-dropdown" className={`hidden absolute w-full z-50 mt-1 rounded-md border ${isDark ? 'border-zinc-800 bg-zinc-800' : 'border-zinc-200 bg-white'} shadow-lg`}>
                                                    <div
                                                        onClick={() => {
                                                            handleClassChange('All Classes');
                                                            document.getElementById('mobile-class-dropdown').classList.add('hidden');
                                                        }}
                                                        className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedClass === 'All Classes' ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                    >
                                                        All Classes
                                                    </div>
                                                    {uniqueClasses.map((className, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => {
                                                                handleClassChange(className);
                                                                document.getElementById('mobile-class-dropdown').classList.add('hidden');
                                                            }}
                                                            className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedClass === className ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                        >
                                                            {className}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Division */}
                                        <div className="flex flex-col space-y-1">
                                            <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Division</label>
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const mobileDivisionDropdown = document.getElementById('mobile-division-dropdown');
                                                        const mobileClassDropdown = document.getElementById('mobile-class-dropdown');

                                                        // Close class dropdown if open
                                                        if (!mobileClassDropdown.classList.contains('hidden')) {
                                                            mobileClassDropdown.classList.add('hidden');
                                                        }

                                                        // Toggle division dropdown
                                                        mobileDivisionDropdown.classList.toggle('hidden');
                                                    }}
                                                    className={`${isDark
                                                        ? "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-[#696CFF] text-left"
                                                        : "w-full rounded-md border-0 bg-zinc-100 px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-[#696CFF] text-left"
                                                        }`}
                                                >
                                                    {selectedDivision}
                                                    <ChevronDown className={`float-right ${isDark ? 'text-white' : 'text-zinc-900'}`} size={20} />
                                                </button>
                                                <div id="mobile-division-dropdown" className={`hidden absolute w-full z-50 mt-1 rounded-md border ${isDark ? 'border-zinc-800 bg-zinc-800' : 'border-zinc-200 bg-white'} shadow-lg max-h-60 overflow-y-auto no-scrollbar`}>
                                                    <div
                                                        onClick={() => {
                                                            setSelectedDivision('All Division');
                                                            document.getElementById('mobile-division-dropdown').classList.add('hidden');
                                                        }}
                                                        className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedDivision === 'All Division' ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                    >
                                                        All Division
                                                    </div>
                                                    {uniqueDivisions.map((division, index) => (
                                                        <div
                                                            key={index}
                                                            onClick={() => {
                                                                setSelectedDivision(division);
                                                                document.getElementById('mobile-division-dropdown').classList.add('hidden');
                                                            }}
                                                            className={`px-3 py-2 text-sm cursor-pointer ${isDark ? 'text-gray-100' : 'text-zinc-900'} ${selectedDivision === division ? (isDark ? 'bg-[#696CFF]' : 'bg-[#696CFF] text-white') : (isDark ? '' : 'bg-zinc-100')}`}
                                                        >
                                                            {division}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex justify-end gap-3 mt-6">
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className={`${isDark ? 'bg-zinc-800 text-gray-200 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-300'} px-4 py-2 rounded-md text-sm cursor-pointer`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => setShowFilters(false)}
                                            className="px-4 py-2 rounded-md text-sm cursor-pointer bg-[#696CFF] text-white hover:bg-[#5a5bdb]"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    {/* Close Icon */}
                                    <button
                                        onClick={() => setShowFilters(false)}
                                        className="absolute top-3 right-3 text-gray-400 hover:text-white"
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Mobile Card View */}
                    <div className="md:hidden w-full mt-4 mb-6 space-y-3">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16">
                                <Loader2 className={`${isDark ? 'text-gray-300' : 'text-zinc-600'} h-6 w-6 animate-spin`} aria-label="Loading" />
                                <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-sm`}>Loading students...</div>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-12">
                                <div className={`${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-zinc-100 text-zinc-600'} rounded-full p-3`}>
                                    <Inbox size={28} />
                                </div>
                                <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>No students found</div>
                                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>Try adjusting your search query.</div>
                            </div>
                        ) : (
                            filteredStudents.map((s, i) => (
                                <div
                                    key={`${s.enrollment_number}-${i}`}
                                    className={`p-4 mt-10 rounded-lg border transition-colors ${highlightedRows.includes(s.enrollment_number)
                                        ? isDark
                                            ? 'bg-blue-900/50 border-blue-500'
                                            : 'bg-blue-50 border-blue-500'
                                        : isDark
                                            ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                                            : 'bg-white border-zinc-200 hover:bg-zinc-50'
                                        }`}
                                >
                                    <div className="space-y-5">
                                        <div>
                                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Name</p>
                                            <NavLink
                                                to={`/Student/getdetails`}
                                                state={{ enrollmentNumber: s.enrollment_number }}
                                                target="_self"
                                                onClick={(e) => {
                                                    if (!s.enrollment_number) {
                                                        e.preventDefault();
                                                        handleerror('Invalid enrollment number for this student');
                                                        console.log('Student data:', s);
                                                    }
                                                }}
                                                onContextMenu={(e) => e.preventDefault()}
                                            >
                                                <p className={`font-semibold cursor-pointer hover:underline ${isDark ? 'text-blue-400' : 'text-[#696CFF]'}`}>{s.roster_first_name} {s.roster_last_name}</p>
                                            </NavLink>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Father Name</p>
                                                <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{s.roster_middle_name}</p>
                                            </div>
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Class</p>
                                                <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{s.class_name}</p>
                                            </div>
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Mobile</p>
                                                <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{s.mobile_number}</p>
                                            </div>
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Division</p>
                                                <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{s.division}</p>
                                            </div>
                                            <div>
                                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Enrollment</p>
                                                <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-zinc-800'}`}>{s.enrollment_number}</p>
                                            </div>
                                        </div>



                                        <div className="flex justify-end gap-3 pt-2 border-t" style={{ borderColor: isDark ? '#27272a' : '#e4e4e7' }}>
                                            <button
                                                onClick={() => {
                                                    if (!s.mobile_number || s.mobile_number.trim() === '') {
                                                        handleerror("The student's details are still pending, so it cannot be updated yet.");
                                                        return;
                                                    }
                                                    navigate('/Student/UpdateStudentDetails', { state: { enrollmentNumber: s.enrollment_number } });
                                                }}
                                                className={`${isDark ? 'opacity-80 hover:opacity-100' : 'opacity-80 hover:opacity-60'} cursor-pointer`}
                                                aria-label="Edit"
                                            >
                                                <img
                                                    src={getAsset(isDark ? 'edit_dark' : 'edit_light')}
                                                    alt="Edit"
                                                    width={16}
                                                    height={16}
                                                />
                                            </button>
                                            <button
                                                onClick={() => openDeleteModal(s.enrollment_number, s.name)}
                                                className={`${isDark ? 'opacity-80 hover:opacity-100' : 'opacity-80 hover:opacity-60'} cursor-pointer`}
                                                aria-label="Delete"
                                            >
                                                <img
                                                    src={getAsset(isDark ? 'delete_dark' : 'delete_light')}
                                                    alt="Delete"
                                                    width={16}
                                                    height={16}
                                                />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop Table View */}
                    <div className={`hidden md:block w-full mx-auto ${filteredStudents.length === 0 ? 'mt-8 mb-8 h-auto border border-transparent bg-transparent shadow-none' : 'h-[89%] md:h-[68%] mt-4 md:mt-5 mb-6 overflow-hidden border-0 '} ${filteredStudents.length === 0 ? '' : (isDark ? 'bg-zinc-950 shadow-none' : 'bg-transparent shadow-none')}`}>
                        <div className={`overflow-x-auto no-scrollbar ${filteredStudents.length === 0 ? '' : 'h-full'}`}>
                            <div className={`${filteredStudents.length === 0 && "h-full w-full justify-center items-center"}`} style={{ scrollbarWidth: 'none' }}>
                                <table className="w-full pr-10 md:pr-5 lg:pr-7 table-fixed text-[13px] md:text-sm h-full">
                                    {filteredStudents.length > 0 && (
                                        <thead className={`${isDark ? 'bg-zinc-900 text-gray-200' : 'bg-white text-[#696CFF]'}  sticky top-0 z-10`}>
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap  text-ellipsis w-16">Sr No</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Name</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Enrollment Number</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Class</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Division</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Father Name</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Mobile Number</th>
                                                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap overflow-hidden text-ellipsis"></th>
                                            </tr>
                                        </thead>
                                    )}
                                    <tbody className={`${isDark ? 'divide-y divide-zinc-800 text-gray-200' : 'divide-y divide-zinc-200 text-zinc-800'} overflow-y-auto no-scrollbar`}>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-16">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Loader2 className={`${isDark ? 'text-gray-300' : 'text-zinc-600'} h-6 w-6 animate-spin`} aria-label="Loading" />
                                                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-sm`}>Loading students...</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : filteredStudents.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="px-4 py-12">
                                                    <div className="flex flex-col items-center justify-center gap-3 align-middle">
                                                        <div className={`${isDark ? 'bg-zinc-800 text-gray-300' : 'bg-zinc-100 text-zinc-600'} rounded-full p-3`}>
                                                            <Inbox size={28} />
                                                        </div>
                                                        <div className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>No students found</div>
                                                        <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>Try adjusting your search query.</div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredStudents.map((s, i) => (
                                                <tr
                                                    key={`${s.enrollment_number}-${i}`}
                                                    className={`transition-colors ${isDark ? 'border-b border-zinc-800' : 'border-b border-zinc-200'} ${highlightedRows.includes(s.enrollment_number)
                                                        ? isDark
                                                            ? 'bg-blue-900/50 border-l-4 border-l-blue-500'
                                                            : 'bg-blue-50 border-l-4 border-l-blue-500'
                                                        : ''
                                                        }`}
                                                >
                                                    <td className={`px-4 py-3 h-12 align-middle whitespace-nowrap text-center font-medium`}>
                                                        {i + 1}
                                                    </td>
                                                    <td className={`px-4 py-3 h-12 align-middle cursor-pointer hover:underline whitespace-nowrap overflow-hidden text-ellipsis ${isDark ? 'text-blue-400' : 'text-[#0098FF]'}`}>
                                                        <NavLink
                                                            to={`/Student/getdetails`}
                                                            state={{
                                                                enrollmentNumber: s.enrollment_number,
                                                                firstName: s.roster_first_name,
                                                                middleName: s.roster_middle_name,
                                                                lastName: s.roster_last_name,
                                                            }}
                                                            target="_self"
                                                            onClick={(e) => {
                                                                if (!s.enrollment_number) {
                                                                    e.preventDefault();
                                                                    handleerror('Invalid enrollment number for this student');
                                                                    console.log('Student data:', s);
                                                                }
                                                            }}
                                                            onContextMenu={(e) => e.preventDefault()}
                                                        >
                                                            {s.roster_first_name} {s.roster_last_name}
                                                        </NavLink>
                                                    </td>
                                                    <td className="px-4 py-3 h-12 align-middle whitespace-nowrap overflow-hidden text-ellipsis 
               font-inter font-semibold text-[12px] leading-none tracking-normal capitalize">
                                                        {s.enrollment_number}
                                                    </td>

                                                    <td className="px-4 py-3 h-12 align-middle whitespace-nowrap overflow-hidden text-ellipsis 
               font-inter font-semibold text-[12px] leading-none tracking-normal capitalize">
                                                        {s.class_name}
                                                    </td>

                                                    <td className="px-4 py-3 h-12 align-middle whitespace-nowrap overflow-hidden text-ellipsis 
               font-inter font-semibold text-[12px] leading-none tracking-normal capitalize">
                                                        {s.division}
                                                    </td>

                                                    <td className="px-4 py-3 h-12 align-middle whitespace-nowrap overflow-hidden text-ellipsis 
               font-inter font-semibold text-[12px] leading-none tracking-normal capitalize">
                                                        {s.father_name}
                                                    </td>

                                                    <td className="px-4 py-3 h-12 align-middle whitespace-nowrap overflow-hidden text-ellipsis 
               font-inter font-semibold text-[12px] leading-none tracking-normal capitalize">
                                                        {s.mobile_number}
                                                    </td>

                                                    <td className="px-4 py-3 h-12 align-middle text-center whitespace-nowrap overflow-hidden text-ellipsis">
                                                        <div className="inline-flex items-center gap-3">
                                                            <button
                                                                onClick={() => {
                                                                    if (!s.mobile_number || s.mobile_number.trim() === '') {
                                                                        handleerror("The student's details are still pending, so it cannot be updated yet.");
                                                                        return;
                                                                    }
                                                                    navigate('/Student/UpdateStudentDetails', { state: { enrollmentNumber: s.enrollment_number } });
                                                                }}
                                                                className={`${isDark ? 'opacity-80 hover:opacity-100' : 'opacity-80 hover:opacity-60'} cursor-pointer`}
                                                                aria-label="Edit"
                                                            >
                                                                <img
                                                                    src={getAsset(isDark ? 'edit_dark' : 'edit_light')}
                                                                    alt="Edit"
                                                                    width={16}
                                                                    height={16}
                                                                    className={!isDark ? 'brightness-0 contrast-100' : ''}
                                                                    style={!isDark ? { filter: 'brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)' } : {}}
                                                                />
                                                            </button>
                                                            <button
                                                                onClick={() => openDeleteModal(s.enrollment_number, s.name)}
                                                                className={`${isDark ? 'opacity-80 hover:opacity-100' : 'opacity-80 hover:opacity-60'} cursor-pointer`}
                                                                aria-label="Delete"
                                                            >
                                                                <img
                                                                    src={getAsset(isDark ? 'delete_dark' : 'delete_light')}
                                                                    alt="Delete"
                                                                    width={16}
                                                                    height={16}
                                                                    className={!isDark ? 'brightness-0 contrast-100' : ''}
                                                                    style={!isDark ? { filter: 'brightness(0) saturate(100%) invert(20%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(95%) contrast(95%)' } : {}}
                                                                />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    {/* </div> */}
                </main>
            </div>
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40">
                    <div className={`${isDark ? 'bg-zinc-900 text-gray-100 border-zinc-800' : 'bg-white text-zinc-900 border-zinc-200'} w-[420px] max-w-md rounded-xl shadow-2xl p-6 border`}>
                        <h2 className="text-lg font-semibold mb-2">Confirm Delete</h2>
                        <p className={`${isDark ? 'text-gray-300' : 'text-zinc-600'} text-sm mb-6`}>
                            Are you sure you want to delete {deleteTarget.name || 'this student'}?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleCancelDelete}
                                className={`${isDark ? 'bg-zinc-800 text-gray-200 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-300'} px-4 py-2 rounded-md text-sm cursor-pointer`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="px-4 py-2 rounded-md text-sm cursor-pointer bg-red-600 text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StudentsList;
