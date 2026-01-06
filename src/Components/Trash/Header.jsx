import React, { useEffect, useState } from 'react'
import { Search, Bell, Sun, Moon } from "lucide-react";
import { useLocation } from 'react-router-dom';

const Header = ({ title, isDark, toggleTheme, searchValue, setSearchValue }) => {
    const location = useLocation();
    const isDashboard = location.pathname === '/dashboard' || location.pathname === '/Dashboard';

    const [isMobile, setIsMobile] = useState(false);

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

    return (
        <header className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} flex items-center justify-between p-4 border-b transition-colors duration-300 rounded-md`}>
            {/* Left: Title */}
            {!isMobile && (
                <h1 className={`header-1 font-semibold ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>{title}</h1>
            )}

            {/* Center: Search Bar */}
            <div className={`flex-1 max-w-lg ${isMobile && 'ml-[45px]'} border rounded-lg ${isDark ? 'border-white/20' :'border-[#33333333]'} mx-4 relative`}>
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

            {/* Right: Icons */}
            <div className="flex items-center space-x-4">
                {/* Credit Text in White Badge/Box */}
                {isDashboard && !isMobile && (
                    <div className={`${isDark ? 'bg-white text-black' : 'bg-[#696CFF] text-white'} rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-sm`}>
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                            Credit:-10
                        </span>
                    </div>
                )}
                {/* Dark / Light toggle */}
                <button onClick={toggleTheme} className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`} aria-label="Toggle theme">
                    {isDark ? <Sun size={18} className="text-gray-300" /> : <Moon size={18} className="text-zinc-700" />}
                </button>

                {/* Notifications */}
                <button className={`relative p-2 rounded-lg transition ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}>
                    <Bell size={18} className={`${isDark ? 'text-gray-300' : 'text-zinc-700'} transition-colors duration-300`} />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Profile Avatar */}
                <div className="relative">
                    <img
                        src="https://i.pravatar.cc/32"
                        alt="User Avatar"
                        className={`w-8 h-8 rounded-full border-2 ${isDark ? 'border-zinc-700' : 'border-zinc-300'} transition-colors duration-300`}
                    />
                    <span className={`absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full border ${isDark ? 'border-zinc-900' : 'border-white'} transition-colors duration-300`}></span>
                </div>

                {isDashboard && isMobile && (
                    <div className={`${isDark ? 'bg-white text-black' : 'bg-[#696CFF] text-white'} rounded-lg px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-sm`}>
                        <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                            Credit:-10
                        </span>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header