import React, { useEffect, useState } from 'react'
import { Search, Bell, Sun, Moon, User, ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from 'react-router-dom';

import { checkType, checkTypeAsync, BACKEND_API_URL, studentPortalAuth, studentPortalAuthAsync } from '../../utils/assets';
import axios from 'axios';

const Header = ({ title, isDark, toggleTheme, searchValue, setSearchValue, isSearchbar = false, isBack = false, backValue = "" }) => {
    const location = useLocation();
    const pathname = location.pathname || "";
    const isAdminDashboard = /^\/admin\/dashboard$/i.test(pathname);
    const isAdminPath = /^\/admin\//i.test(pathname);
    const isLecturePath = /^\/lecture\//i.test(pathname);
    const isStudentPath = /^\/student\//i.test(pathname);
    const isChapterPath = /^\/chapter\//i.test(pathname);
    const isStudentPortalPath = /^\/StudentPortal\//i.test(pathname);
    const navigate = useNavigate();

    const [isMobile, setIsMobile] = useState(false);
    const [adminProfileImage, setAdminProfileImage] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) {
                setIsMobile(true);
            } else {
                setIsMobile(false);
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!isAdminPath) return;
        if (typeof window === 'undefined') return;

        const stored = localStorage.getItem('admin_profile_image');
        if (stored && localStorage.getItem('full_name')) {
            setAdminProfileImage(stored);
        } else {
            fetchProfile();
        }
    }, [isAdminPath]);

    useEffect(() => {
        validation();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const handleNotificationPath = () => {
        // if (isLecturePath) {
        //     return "/lecture/Notification";
        // } else if (isAdminPath) {
        //     return "/Admin/Notification";
        // } else if (isStudentPath) {
        //     return "/student/Notification";
        // } else if (isChapterPath) {
        //     return "/chapter/Notification";
        // }
        console.log("Notification Coming Soon...");
    }

    const fetchProfile = async () => {
        try {
            const response = await axios.get(`${BACKEND_API_URL}/admin-portal/profile`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                },
            });
            const profileData = response.data.data.profile;
            if (profileData && profileData.photo) {
                const normalizedPhoto = profileData.photo.replace(/\\/g, '/');
                localStorage.setItem('admin_profile_image', normalizedPhoto);
                localStorage.setItem('full_name', profileData.full_name);
                setAdminProfileImage(normalizedPhoto);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    }

    const validation = async () => {
        // Admin area: only admins allowed
        if (isAdminPath) {
            const ok = await checkTypeAsync('admin');
            if (!ok) {
                navigate('/login');
            }
            return;
        }

        // Member areas: lecture, student, chapter
        if (isLecturePath || isStudentPath || isChapterPath) {
            const ok = await checkTypeAsync('member');
            if (!ok) {
                navigate('/login');
            }
        }

        // Student portal areas: student portal
        if (isStudentPortalPath) {
            const ok = await studentPortalAuthAsync("student");
            if (!ok) {
                navigate('/StudentPortal/Login');
            }
        }
    }

    const handleProfilePath = () => {
        if (isAdminPath) {
            return "/Admin/Profile";
        } else if (isLecturePath) {
            return "/lecture/Profile";
        }
        return "/Admin/Profile";
    }

    return (
        <header className={`${isDark ? 'bg-zinc-900' : 'bg-white'} border border-transparent flex items-center ${isMobile && !isSearchbar && !isBack ? 'justify-end' : 'justify-between'} p-4 border-b transition-colors duration-300 rounded-md`}>
            {/* Left: Title & Back */}
            <div className="flex items-center">
                {isBack && !isMobile && (
                    <button
                        onClick={() => navigate(backValue)}
                        className={`mr-3 p-1 rounded-full transition-all ${isMobile && "ml-[30px]"} cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                )}
                {!isMobile && (
                    <h1 className={`header-1 font-semibold ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>{title}</h1>
                )}
            </div>

            {/* Center: Search Bar */}
            {isSearchbar && (
                <div className={`flex-1 max-w-lg ${isMobile && 'ml-[45px]'} border rounded-lg ${isDark ? 'border-white/20' : 'border-[#33333333]'} mx-4 relative`}>
                    <input
                        type="text"
                        placeholder="Search"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className={`w-full ${isDark ? 'bg-zinc-800 text-gray-200 focus:ring-zinc-600' : 'bg-zinc-100 text-zinc-700 focus:ring-zinc-300'} text-[15px] pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-1 transition-colors duration-300`}
                    />
                    <Search
                        size={18}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-zinc-400'} transition-colors duration-300`}
                    />
                </div>
            )}

            {/* Right: Icons */}
            <div
                className={`flex items-center space-x-2`}
            >
                {/* Dark / Light toggle */}
                <button onClick={toggleTheme} className={`p-2 rounded-lg transition cursor-pointer ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`} aria-label="Toggle theme">
                    {isDark
                        ? <Moon size={18} className="text-gray-300" />
                        : <Sun size={18} className="text-zinc-700" />
                    }
                </button>

                {/* Notifications - only navigates on lecture routes */}
                {/* <button
                    type="button"
                    onClick={() => navigate(handleNotificationPath())}
                    className={`relative cursor-pointer p-2 rounded-lg transition ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                >
                    <Bell size={18} className={`${isDark ? 'text-gray-300' : 'text-zinc-700'} transition-colors duration-300`} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button> */}

                {/* Profile Avatar */}
                {isAdminPath && (
                    <button
                        type="button"
                        onClick={() => navigate(handleProfilePath())}
                        className="relative cursor-pointer"
                    >
                        {adminProfileImage
                            ? <img
                                src={adminProfileImage}
                                onError={() => setAdminProfileImage(null)}
                                alt="User Avatar"
                                className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-zinc-700' : 'border-zinc-300'} transition-colors duration-300`}
                            />
                            : <User size={32} className="text-gray-300" />
                        }
                        <span className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border ${isDark ? 'border-zinc-900' : 'border-white'} transition-colors duration-300`}></span>
                    </button>
                )}
            </div>
        </header>
    )
}

export default Header