import React, { useState, useEffect } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { Handbag, ArrowLeft, MessageSquare, X, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { BACKEND_API_URL, handleerror } from "../../../utils/assets.js";
import axios from "axios";

// --- LectureSummaryModal Component (Updated to use API data) ---
const LectureSummaryModal = ({ lecture, isDark, onClose }) => {
    if (!lecture) return null;

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg p-6 md:p-6 rounded-2xl shadow-2xl ${isDark ? 'bg-zinc-900 text-gray-100' : 'bg-white text-zinc-900'
                    } border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-5">
                    <h2 className="text-[20px] md:text-[22px] font-bold leading-tight tracking-[-0.01em]">
                        {lecture.title}
                    </h2>
                    <button onClick={onClose} className={`p-1 rounded-md transition-colors cursor-pointer ${isDark ? 'text-gray-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-800'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Meta grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-10">
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Subject:</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.subject}</div>
                    </div>
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Chapter</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.chapter}</div>
                    </div>
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Progress</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.progress}</div>
                    </div>
                    <div>
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Watched</div>
                        <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white' : 'text-zinc-900'}`}>{lecture.date}</div>
                    </div>
                </div>

                <hr className={`${isDark ? 'border-zinc-800' : 'border-zinc-200'} my-5`} />

                <div className="space-y-2">
                    <div className={`${isDark ? 'text-gray-400' : 'text-zinc-600'} text-[14px] md:text-[15px] font-semibold`}>Summary</div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-zinc-700'} text-[12px] md:text-[13px] leading-6 text-justify`}>
                        {lecture.summary}
                    </p>
                </div>
            </div>
        </div>
    );
};
// --- End LectureSummaryModal Component ---

// --- TransactionDetailsModal Component (No changes needed here) ---
const TransactionDetailsModal = ({ transaction, isDark, onClose }) => {
    if (!transaction) return null;

    return (
        <div
            // Updated overlay with dark color and backdrop blur
            className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-lg p-6 rounded-2xl shadow-2xl ${isDark ? "bg-zinc-900 text-gray-100" : "bg-white text-zinc-900"
                    } border ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-start mb-5">
                    <h2 className="text-[20px] md:text-[22px] font-semibold leading-tight tracking-[-0.01em]">Transaction Details</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="text-[13px] md:text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Transaction ID</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.transactionID}</div>
                        </div>
                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Status</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] font-semibold ${transaction.status === 'Completed' ? 'text-[#0CFF00]' : 'text-red-500'}`}>{transaction.status}</div>
                        </div>

                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Date & Time</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.date} at {transaction.time}</div>
                        </div>
                        <div>
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Payment Method</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.status === 'Completed' ? 'Credit Card' : 'N/A'}</div>
                        </div>

                        <div className="sm:col-span-2">
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[12px] md:text-[13px] font-medium`}>Transaction Type</div>
                            <div className={`mt-1 text-[13px] md:text-[14px] ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.transactionType}</div>
                        </div>

                        <div className="sm:col-span-2">
                            <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} font-medium`}>Description</div>
                            <div className={`mt-1 ${isDark ? 'text-white/90' : 'text-zinc-900/90'}`}>{transaction.description}</div>
                        </div>
                    </div>

                    <hr className={`${isDark ? 'border-zinc-800' : 'border-zinc-200'} my-5`} />

                    <div className="flex items-center justify-between">
                        <div className={`${isDark ? 'text-gray-400' : 'text-zinc-500'} text-[14px] md:text-[15px] font-semibold`}>Total Amount Paid</div>
                        <div className="text-lg md:text-xl font-bold text-[#0CFF00]">{transaction.amount}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// --- End TransactionDetailsModal Component ---


function StudentDetails({ theme, isDark, toggleTheme, sidebardata }) {
    const location = useLocation();
    const navigate = useNavigate();
    const stateFirstName = location.state?.firstName;
    const stateLastName = location.state?.lastName;
    const [activeTab, setActiveTab] = useState("history");

    const [selectedTransaction, setSelectedTransaction] = useState(null); // State for Transaction Details modal
    const [selectedLecture, setSelectedLecture] = useState(null); // **NEW State for Lecture Summary modal**
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentsError, setCommentsError] = useState(null);
    const [deletingCommentId, setDeletingCommentId] = useState(null);
    const [comments, setComments] = useState([
        {
            id: 1,
            commentId: 1,
            user: "Priya Patel",
            time: "Last ago",
            text: "Great explanation! This really helped me understand the concept clearly."
        },
        {
            id: 2,
            commentId: 2,
            user: "Priya Patel",
            time: "Last ago",
            text: "Can you please explain the second part again? I didn't quite get it."
        },
        {
            id: 3,
            commentId: 3,
            user: "Priya Patel",
            time: "Last ago",
            text: "Excellent content! Looking forward to more videos on this topic."
        }
    ]);

    // Lecture stats / ratio data (now driven by API summary)
    const defaultProgressData = {
        overallProgress: 0,
        totalLectures: 0,
        watchedMinutes: 0,
        totalMinutes: 0,
        completion: '-',
    };
    const [progressData, setProgressData] = useState(defaultProgressData);

    // Lecture list data (will be fetched from API)
    const [lectures, setLectures] = useState([]);
    const [lecturesLoading, setLecturesLoading] = useState(true);
    const [lecturesError, setLecturesError] = useState(null);

    // Purchase history data (unchanged)
    const [purchaseHistory] = useState([
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143001",
            transactionType: "Course Purchase",
            description: "Complete 10th Grade Science Course Package",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143002",
            transactionType: "Study Material",
            description: "Advanced Physics eBook and Notes",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143003",
            transactionType: "Test Series",
            description: "Monthly Mock Test Subscription",
            amount: "3,999",
            status: "Not Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143004",
            transactionType: "Course Purchase",
            description: "Advanced Mathematics Module",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143005",
            transactionType: "Test Series",
            description: "Premium Test Series Subscription",
            amount: "3,999",
            status: "Not Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143006",
            transactionType: "Course Purchase",
            description: "English Grammar & Writing Course",
            amount: "2,999",
            status: "Completed",
        },
        {
            date: "25-10-2025",
            time: "14:30",
            transactionID: "TXN20251025143007",
            transactionType: "Live Class",
            description: "Weekly Doubt Clearing Session Pass",
            amount: "2,999",
            status: "Not Completed",
        },
    ]);

    const totalAmount = purchaseHistory
        .filter(p => p.status === "Completed")
        .reduce((sum, p) => sum + parseInt(p.amount.replace(/[₹,]/g, "")), 0);

    const fetchLectureWatchRatio = async (enrollmentNumber, std) => {
        const safeEnrollment = enrollmentNumber ? String(enrollmentNumber) : '';
        const safeStd = std ?? '';

        if (!safeEnrollment || safeStd === '') {
            setProgressData(defaultProgressData);
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setProgressData(defaultProgressData);
                return;
            }

            const response = await axios.get(
                `${BACKEND_API_URL}/school-portal/watched-lectures/ratio?enrollment_number=${encodeURIComponent(safeEnrollment)}&std=${encodeURIComponent(String(safeStd))}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const summary = response.data?.data?.summary;
            const totalLectures = Number(summary?.total_lectures) || 0;
            const completionRatio = Number(summary?.completion_ratio) || 0;

            const watchedText = String(summary?.watched_duration_text || '0/0');
            const match = watchedText.match(/(\d+)\s*\/\s*(\d+)/);
            const watchedMinutes = match ? Number(match[1]) || 0 : 0;
            const totalMinutes = match ? Number(match[2]) || 0 : 0;

            const completionTextRaw = summary?.completion;
            const completionText = completionTextRaw === 0
                ? '0'
                : completionTextRaw
                    ? String(completionTextRaw)
                    : '-';

            setProgressData({
                overallProgress: completionRatio,
                totalLectures,
                watchedMinutes,
                totalMinutes,
                completion: completionText,
            });
        } catch (error) {
            console.error('Failed to fetch lecture watch ratio:', error);
            setProgressData(defaultProgressData);
        }
    };

    const fetchComments = async (videoId) => {
        if (!videoId && videoId !== 0) {
            setComments([]);
            return;
        }

        setCommentsLoading(true);
        setCommentsError(null);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setCommentsError('No authentication token found');
                setComments([]);
                return;
            }

            const response = await axios.get(
                `${BACKEND_API_URL}/student-management/comment?video_id=${encodeURIComponent(String(videoId))}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const apiComments = response.data?.data?.comments;
            if (response.data?.status === true && Array.isArray(apiComments)) {
                const formatted = apiComments.map((c, idx) => {
                    const rawPath = c?.photo_path ? String(c.photo_path) : '';
                    const trimmed = rawPath.trim();
                    const isAbsoluteUrl = /^https?:\/\//i.test(trimmed);
                    const photoUrl = isAbsoluteUrl ? trimmed : null;

                    const commentId = c?.comment_id ?? c?.id ?? c?.commentId;

                    return {
                        id: idx,
                        commentId,
                        user: c?.student_name || 'Unknown',
                        time: c?.commented_time_ago || '',
                        text: c?.comment || '',
                        photoUrl,
                    };
                });

                setComments(formatted);
            } else {
                setComments([]);
                setCommentsError(response.data?.message || 'Failed to fetch comments');
            }
        } catch (error) {
            console.error('Failed to fetch comments:', error);
            setComments([]);
            setCommentsError(error.response?.data?.message || error.message || 'Failed to fetch comments');
        } finally {
            setCommentsLoading(false);
        }
    };

    const handleDeleteComment = async (comment) => {
        const commentId = comment?.commentId;
        if (!commentId && commentId !== 0) {
            setCommentsError('Comment id not found');
            return;
        }

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setCommentsError('No authentication token found');
                return;
            }

            setDeletingCommentId(commentId);
            setCommentsError(null);

            const response = await axios.delete(
                `${BACKEND_API_URL}/student-management/comment/delete/${encodeURIComponent(String(commentId))}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status === true) {
                setComments((prev) => prev.filter((c) => c.commentId !== commentId));
            } else {
                setCommentsError(response.data?.message || 'Failed to delete comment');
            }
        } catch (error) {
            console.error('Failed to delete comment:', error);
            setCommentsError(error.response?.data?.message || error.message || 'Failed to delete comment');
        } finally {
            setDeletingCommentId(null);
        }
    };

    const fetchWatchedLectures = async (enrollmentNumber) => {
        setLecturesLoading(true);
        setLecturesError(null);

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLecturesError('No authentication token found');
                setLecturesLoading(false);
                return;
            }

            const response = await axios.get(
                `${BACKEND_API_URL}/student-management/watched-lectures/cards?enrollment_number=${encodeURIComponent(enrollmentNumber)}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            const apiLectures = response.data?.data?.lectures ?? response.data?.lectures;

            if (response.data?.status && Array.isArray(apiLectures)) {
                const formattedLectures = apiLectures.map((lecture) => {
                    const progressText = String(lecture?.progress ?? '0/0 Min');
                    const match = progressText.match(/(\d+)\s*\/\s*(\d+)/);
                    const watched = match ? Number(match[1]) || 0 : 0;
                    const total = match ? Number(match[2]) || 0 : 0;
                    const progressPercentage = total > 0 ? Math.round((watched / total) * 100) : 0;

                    return {
                        id: lecture?.video_id ?? lecture?.lecture_title ?? `${lecture?.subject || 'lecture'}-${lecture?.watched_date || ''}`,
                        title: lecture?.lecture_title || '-',
                        subject: lecture?.subject || '-',
                        chapter: lecture?.chapter || '-',
                        progress: `${progressPercentage}%`,
                        progressText,
                        date: lecture?.watched_date || '-',
                        watchDuration: watched,
                        totalDuration: total,
                        summary: lecture?.summary || '-',
                    };
                });

                setLectures(formattedLectures);
            } else {
                setLecturesError('No watched lectures data found');
                setLectures([]);
            }
        } catch (error) {
            console.error('Failed to fetch watched lectures:', error);
            setLecturesError(error.response?.data?.message || 'Failed to fetch watched lectures');
            setLectures([]);
        } finally {
            setLecturesLoading(false);
        }
    };

    const fetchStudentDetails = async (enrollmentNumber) => {
        if (!enrollmentNumber) {
            handleerror('No enrollment number provided');
            navigate('/Student/StudentsList');
            return;
        }

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
                const students = response.data.data.students;
                const foundStudent = students.find(s => s.enrollment_number === enrollmentNumber);

                if (foundStudent) {
                    setStudent({
                        name: `${stateFirstName || foundStudent.roster_first_name || ''} ${stateLastName || foundStudent.roster_last_name || ''}`.replace(/\s+/g, ' ').trim() || foundStudent.enrollment_number || 'Unknown',
                        enrollment: foundStudent.enrollment_number,
                        class: `${foundStudent.std || ''} - Division ${foundStudent.roster_division || ''}`,
                        std: foundStudent.std,
                    });

                    fetchLectureWatchRatio(foundStudent.enrollment_number, foundStudent.std);
                } else {
                    handleerror('Student not found');
                    navigate('/Student/StudentsList');
                }
            } else {
                handleerror('Failed to fetch student data');
                navigate('/Student/StudentsList');
            }
        } catch (error) {
            console.error('Error fetching student details:', error);
            handleerror(error.response?.data?.message || error.message || 'Failed to fetch student details');
            navigate('/Student/StudentsList');
        } finally {
            setLoading(false);
        }
    };

    // Fetch student details on component mount
    useEffect(() => {
        const enrollmentNumber = location.state?.enrollmentNumber;
        if (enrollmentNumber) {
            fetchStudentDetails(enrollmentNumber);
            fetchWatchedLectures(enrollmentNumber); // Fetch watched lectures for specific student
        } else {
            handleerror('No enrollment number provided');
            navigate('/Student/StudentsList');
        }
    }, [location.state?.enrollmentNumber, navigate]);

    useEffect(() => {
        if (!isCommentsOpen) return;
        if (selectedVideoId == null) return;
        fetchComments(selectedVideoId);
    }, [isCommentsOpen, selectedVideoId]);

    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setSelectedTransaction(null);
        setSelectedLecture(null);
        setIsCommentsOpen(false);
        setSelectedVideoId(null);
        setCommentsError(null);
        document.body.style.overflow = 'auto';
    };

    const handleViewSummary = (lecture) => {
        setSelectedLecture(lecture);
        document.body.style.overflow = 'hidden';
    };

    const handleOpenComments = (lecture) => {
        setSelectedVideoId(lecture?.id ?? lecture?.video_id ?? null);
        setIsCommentsOpen(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseComments = () => {
        setIsCommentsOpen(false);
        setSelectedVideoId(null);
        setCommentsError(null);
        document.body.style.overflow = 'auto';
    };

    const isModalOpen = selectedTransaction || selectedLecture || isCommentsOpen;

    return (
        <div
            className={`flex overflow-x-hidden ${isDark
                ? "bg-zinc-950 text-gray-100"
                : "bg-zinc-50 text-zinc-900"
                } h-screen transition-colors duration-300`}
        >
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Content Area - Apply blur when modal is active */}
            <div
                className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 overflow-x-hidden transition-all duration-300 ${isModalOpen ? 'backdrop-blur-sm pointer-events-none' : '' // Use isModalOpen
                    }`}
            >
                <div className="pointer-events-auto"> {/* Header remains clickable */}
                    <Header
                        title="Student Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Content */}
                <main className="mt-6 flex-1 overflow-y-auto overflow-x-hidden no-scrollbar space-y-6">
                    {/* Student Details */}
                    {loading ? (
                        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-gray-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'} border rounded-xl p-6`}>
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-3 text-sm">Loading student details...</span>
                            </div>
                        </div>
                    ) : student ? (
                        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-gray-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'} border rounded-xl p-6`}>
                            <div className="flex items-center -mt-3.5 -ml-3 mb-3">
                                <button
                                    onClick={() => navigate(-1)}
                                    className={`p-2 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-gray-300' : 'hover:bg-zinc-100 text-zinc-700'}`}
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <h2 className="ml-2 font-inter text-[22px] font-medium leading-none tracking-normal capitalize">
                                    Student Details
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] md:text-sm">
                                <div>
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Name:</span>{" "}
                                    {student.name}
                                </div>
                                <div>
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                                        Enrollment Number:
                                    </span>{" "}
                                    {student.enrollment}
                                </div>
                                <div>
                                    <span className={`${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Class:</span>{" "}
                                    {student.class}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Tabs */}
                    <div className={`flex items-center justify-between ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} p-2 border-b rounded-4xl`}>
                        <div className="relative flex w-full text-[13px] md:text-sm font-medium">
                            <div
                                className={`absolute cursor-pointer inset-y-0 w-1/2 ${isDark ? 'bg-zinc-800' : 'bg-[#696CFF]'} rounded-full transition-transform duration-300 ease-in-out`}
                                style={{
                                    transform:
                                        activeTab === "history"
                                            ? "translateX(0%)"
                                            : "translateX(100%)",
                                }}
                            />

                            <button
                                onClick={() => setActiveTab("history")}
                                className={`relative flex-1 px-4 py-2 rounded-full transition-colors z-10 cursor-pointer ${activeTab === 'history'
                                    ? `${isDark ? 'text-white' : 'text-white'}`
                                    : `${isDark ? 'text-gray-400' : 'text-black'}`
                                    }`}
                            >
                                History
                            </button>
                            <button
                                onClick={() => setActiveTab("old")}
                                className={`relative flex-1 px-4 py-2 rounded-full transition-colors z-10 cursor-pointer ${activeTab === 'old'
                                    ? `${isDark ? 'text-white' : 'text-white'}`
                                    : `${isDark ? 'text-gray-400' : 'text-black'}`
                                    }`}
                            >
                                Old Purchase
                            </button>
                        </div>
                    </div>

                    {/* History Tab Content */}
                    {activeTab === "history" && (
                        <>
                            {/* Lecture Watching Ratio */}
                            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 text-gray-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-sm'} rounded-xl p-6 border`}>
                                <h2 className="text-base md:text-lg font-semibold mb-4">
                                    Lecture Watching Ratio
                                </h2>

                                <div className="flex justify-between items-center text-[13px] md:text-sm mb-4">
                                    <span className={`${isDark ? 'text-[#AAAAAA]' : 'text-zinc-500'}`}>
                                        Overall Progress
                                    </span>
                                    <span className={`text-lg md:text-xl font-bold ${isDark ? 'text-white' : 'text-[#3498db]'}`}>
                                        {progressData.overallProgress.toFixed(2)}%
                                    </span>
                                </div>

                                <div className={`h-2 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-full mb-6`}>
                                    <div
                                        className={`h-2 ${isDark ? 'bg-white' : 'bg-[#696CFF]'} rounded-full`}
                                        style={{
                                            width: `${progressData.overallProgress}%`,
                                        }}
                                    ></div>
                                </div>

                                <div className={`grid grid-cols-3 text-[13px] md:text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>
                                    <div>
                                        <div className={`font-semibold ${isDark ? 'text-white/70' : 'text-zinc-900'}`}>
                                            Total Lecture
                                        </div>
                                        <span className={`${isDark ? 'text-white' : 'text-zinc-900'}`}>{progressData.totalLectures}</span>
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${isDark ? 'text-white/70' : 'text-zinc-900'}`}>
                                            Watched Minutes
                                        </div>
                                        <span className={`${isDark ? 'text-white' : 'text-zinc-900'}`}>{progressData.watchedMinutes}/
                                        {progressData.totalMinutes || '-'} min</span>
                                    </div>
                                    <div>
                                        <div className={`font-semibold ${isDark ? 'text-white/70' : 'text-zinc-900'}`}>
                                            Completion
                                        </div>
                                        <span className={`${isDark ? 'text-white' : 'text-zinc-900'}`}>{progressData.completion}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Lecture List Table */}
                            <div className={`overflow-hidden mb-6 ${isDark ? '' : 'bg-white'}`}>
                                <div className={`${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} p-4 mb-3`}>
                                    <h2 className={`text-base md:text-[17px] font-semibold ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        List Of Watched Lecture
                                    </h2>
                                </div>

                                <div className="overflow-x-auto no-scrollbar">
                                    <table className="w-full text-[13px] md:text-sm text-left border-collapse" style={{ minWidth: 960 }}>
                                        <thead className={`${isDark ? 'text-white' : 'text-zinc-800'}`}>
                                            <tr>
                                                <th className="pb-3 px-6 font-medium whitespace-nowrap">
                                                    Lecture Title
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Subject
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Chapter
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Progress
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Watched Date
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Summary
                                                </th>
                                                <th className="pb-3 px-4 font-medium whitespace-nowrap">
                                                    Comment
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className={`${isDark ? 'text-white' : 'text-zinc-900/80'}`}>
                                            {lecturesLoading ? (
                                                <tr>
                                                    <td colSpan="7" className="py-8 text-center">
                                                        <div className="flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
                                                            <span className="text-sm">Loading watched lectures...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : lecturesError ? (
                                                <tr>
                                                    <td colSpan="7" className="py-8 text-center">
                                                        <div className="text-sm text-red-500">{lecturesError}</div>
                                                    </td>
                                                </tr>
                                            ) : lectures.length === 0 ? (
                                                <tr>
                                                    <td colSpan="7" className="py-8 text-center">
                                                        <div className="text-sm opacity-60">No watched lectures found</div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                lectures.map((lec, i) => (
                                                    <tr
                                                        key={lec.id || i}
                                                        className={`border-b ${isDark ? 'border-gray-700' : 'border-zinc-200'}`}
                                                    >
                                                        <td className="py-3 md:py-4 px-6 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.title}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.subject}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.chapter}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-32 h-1.5 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'} rounded-full overflow-hidden`}>
                                                                    <div
                                                                        className={`h-full ${isDark ? 'bg-blue-500' : 'bg-[#696CFF]'} rounded-full`}
                                                                        style={{
                                                                            width: `${parseInt(lec.progress) || 0}%`,
                                                                        }}
                                                                    ></div>
                                                                </div>
                                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>
                                                                    {lec.progressText || `${lec.watchDuration}/${lec.totalDuration} Min`}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4 whitespace-nowrap overflow-hidden text-ellipsis">
                                                            {lec.date}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-4">
                                                            <button
                                                                onClick={() => handleViewSummary(lec)}
                                                                className={`flex items-center gap-1 cursor-pointer transition-colors pointer-events-auto ${isDark ? 'text-white' : 'text-zinc-900'} hover:opacity-80`}
                                                            >
                                                                <svg
                                                                    className="w-5 h-5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                    />
                                                                </svg>
                                                                Summary
                                                            </button>
                                                        </td>
                                                        <td className="py-2 mt-1 md:py-4 px-4 flex justify-end items-center">
                                                            <button
                                                                onClick={() => handleOpenComments(lec)}
                                                                className={`cursor-pointer transition-colors pointer-events-auto ${isDark ? 'text-white' : 'text-zinc-900'} hover:opacity-80`}
                                                            >
                                                                <svg
                                                                    className="w-5 h-5"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Old Purchase Tab Content */}
                    {activeTab === "old" && (
                        <div className={`rounded-lg overflow-hidden mb-6 ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white shadow-sm'}`}>
                            {/* Header */}
                            <div className={`${isDark ? 'bg-zinc-900' : 'bg-zinc-100'} p-4 flex items-center justify-between`}>
                                <div className="flex items-center gap-2">
                                    <Handbag className={`w-6 h-6 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`} />
                                    <h2 className="text-base md:text-lg font-semibold">
                                        Purchase History
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>Total Transaction Ammount</div>
                                    <div className="text-sm font-semibold text-[#0CFF00]">₹{totalAmount.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-[13px] md:text-sm text-left border-collapse" style={{ minWidth: 960 }}>
                                    <thead className={`${isDark ? 'text-white' : 'text-zinc-900/80'} border-b ${isDark ? 'border-zinc-800/50' : 'border-zinc-200'}`}>
                                        <tr>
                                            <th className="py-3 px-6 font-medium whitespace-nowrap">Date</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Time</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Transaction Type</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Amount</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Status</th>
                                            <th className="py-3 px-4 font-medium whitespace-nowrap">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`${isDark ? 'text-[#AAAAAA]/90' : 'text-zinc-900/70'}`}>
                                        {purchaseHistory.map((purchase, i) => (
                                            <tr
                                                key={i}
                                                className={`border-b transition-colors ${isDark ? 'border-zinc-800/50 hover:bg-zinc-900/30' : 'border-zinc-200 hover:bg-zinc-50'}`}
                                            >
                                                <td className="py-3 md:py-4 px-6 whitespace-nowrap">{purchase.date}</td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">{purchase.time}</td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">{purchase.transactionType}</td>
                                                <td className="py-3 md:py-4 px-4 font-medium whitespace-nowrap">₹{purchase.amount}</td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">
                                                    <span
                                                        className={`${purchase.status === "Completed"
                                                            ? "text-[#0CFF00]"
                                                            : "text-white"
                                                            }`}
                                                    >
                                                        {purchase.status}
                                                    </span>
                                                </td>
                                                <td className="py-3 md:py-4 px-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleViewDetails(purchase)}
                                                        className={`cursor-pointer transition-colors pointer-events-auto ${isDark ? 'text-white' : 'text-[#696CFF] hover:opacity-80'}`}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Transaction Details Modal Component */}
            <TransactionDetailsModal
                transaction={selectedTransaction}
                isDark={isDark}
                onClose={handleCloseModal}
            />

            {/* **NEW Lecture Summary Modal Component** */}
            <LectureSummaryModal
                lecture={selectedLecture}
                isDark={isDark}
                onClose={handleCloseModal}
            />

            {/* Comments Sidebar */}
            <div className={`fixed top-0 right-0 h-full w-full sm:w-[480px] shadow-2xl transform transition-transform duration-300 z-60 ${
                isCommentsOpen ? 'translate-x-0' : 'translate-x-full'
            } ${isDark ? 'bg-zinc-900 text-gray-100' : 'bg-white text-zinc-900'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                        <div>
                            <h2 className="text-xl font-bold">Comment</h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>Join The Discussion About This Video</p>
                        </div>
                        <button
                            onClick={handleCloseComments}
                            className={`p-2 cursor-pointer rounded-lg transition ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-100'}`}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 6 6 18"></path>
                                <path d="m6 6 12 12"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Comments Count */}
                    <div className={`px-6 py-2 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                        <p className="font-semibold">{comments.length} Comment</p>
                    </div>

                    {/* Comments List */}
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {commentsLoading ? (
                            <div className="px-6 py-8 text-sm opacity-70">Loading comments...</div>
                        ) : commentsError ? (
                            <div className="px-6 py-8 text-sm text-red-500">{commentsError}</div>
                        ) : comments.length === 0 ? (
                            <div className="px-6 py-8 text-sm opacity-70">No comments found</div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className={`px-6 py-3 ${isDark ? 'hover:bg-zinc-800/30' : 'hover:bg-zinc-50'} transition`}>
                                    <div className="flex items-start gap-3">
                                        {comment.photoUrl ? (
                                            <img
                                                src={comment.photoUrl}
                                                alt={comment.user}
                                                className="w-10 h-10 rounded-full object-cover shrink-0"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
                                                {String(comment.user || 'U').charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-sm">{comment.user}</h3>
                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>{comment.time}</span>
                                            </div>
                                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteComment(comment)}
                                            disabled={deletingCommentId === comment.commentId}
                                            className={`group p-2 rounded-lg transition cursor-pointer hover:bg-transparent ${deletingCommentId === comment.commentId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Trash2 size={16} className={`${isDark ? 'text-white/70' : 'text-black/60'} group-hover:text-white transition-colors`} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop */}
            {isCommentsOpen && (
                <div
                    className="fixed inset-0 backdrop-blur-md bg-black/20 z-50"
                    onClick={handleCloseComments}
                ></div>
            )}
        </div>
    );

}

export default StudentDetails;