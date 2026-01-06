
// ==========================perfect==============================
import React from "react";
import { useNavigate } from "react-router-dom";
// Assuming getAsset is correctly defined in this path
import { getAsset } from "../../../utils/assets.js";

function RoleFeatures({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    return (
        <div className={`w-full h-screen ${isDark ? "bg-black text-gray-100" : "bg-white text-zinc-900"} transition-colors duration-300 overflow-hidden`}>
            {/* ===== Mobile/Tablet (Model background with overlayed content) ===== */}
            <div className="lg:hidden relative w-full h-full">
                <img
                    src={getAsset('Model')}
                    alt="3D Avatar"
                    className="absolute inset-0 w-full h-full object-center min-[890px]:object-bottom opacity-90"
                />
                <div className={`absolute inset-0 ${isDark ? 'bg-linear-to-t from-black via-black/60 to-black/10' : 'bg-linear-to-t from-white via-white/70 to-white/20'}`} />
                <div className="relative z-10 h-full w-full flex flex-col items-center justify-end px-4 pb-10 md:pb-14 min-[890px]:pb-20 space-y-6 ">
                    <div className="text-center">
                        <h1 className={`${isDark ? 'text-white' : 'text-zinc-900'} text-3xl min-[890px]:text-4xl font-bold tracking-tight`}>What's Features</h1>
                        <h2 className={`${isDark ? 'text-white/90' : 'text-zinc-800'} text-xl min-[890px]:text-2xl mt-1 font-semibold`}>That Feel Like They're Made For You ?</h2>
                    </div>
                    <div className="w-full max-w-xl space-y-4">
                        {/* Principle Card */}
                        <div onClick={() => navigate('/login')} className={`relative rounded-2xl overflow-hidden border ${isDark ? 'bg-zinc-900/70 border-yellow-400' : 'bg-white border-yellow-500'} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer`}>
                            <div className="flex items-center gap-4">
                                <img src={getAsset('Principle')} alt="Principal" className="w-20 h-20 object-contain" />
                                <div className="min-w-0">
                                    <h3 className={`text-[16px] sm:text-[17px] font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>Principle</h3>
                                    <p className={`text-[12px] sm:text-[13px] mt-1 ${isDark ? 'text-gray-300' : 'text-zinc-600'} leading-[1.6] wrap-break-word`}>Shaping Young Minds, Building Bright Future, With Dedication And Vision, The Principal Leads Both Teachers And Students</p>
                                </div>
                            </div>
                        </div>
                        {/* Student Card */}
                        <div onClick={() => navigate('/StudentPortal/login')} className={`relative rounded-2xl overflow-hidden border ${isDark ? 'bg-zinc-900/70 border-blue-400' : 'bg-white border-blue-500'} p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer`}>
                            <div className="flex items-center gap-4">
                                <img src={getAsset('student_login')} alt="Student" className="w-20 h-20 object-contain" />
                                <div className="min-w-0">
                                    <h3 className={`text-[16px] sm:text-[17px] font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>Student</h3>
                                    <p className={`text-[12px] sm:text-[13px] mt-1 ${isDark ? 'text-gray-300' : 'text-zinc-600'} leading-[1.6] wrap-break-words`}>With A Student Account, You Can Discover New Ideas, Track Progress, And Unlock Your Potential Every Day</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ===== Desktop (two-column) - REVISED TO MATCH IMAGE LAYOUT ===== */}
            <div className={`hidden lg:flex lg:flex-row w-full min-h-screen items-center ${isDark ? 'bg-black' : 'bg-[#f5f5f7]'}`}>
                {/* Left Side - 3D Avatar */}
                <div className="w-[40%] h-full flex justify-center relative overflow-hidden">

                    {/* 3D Avatar (centered vertically, similar to reference) */}
                    <div className="relative z-0 w-full h-full flex items-center justify-center">
                        <img
                            src={getAsset('Model')}
                            alt="3D Avatar"
                            className="h-[70vh] max-h-[520px] w-auto max-w-[420px] object-contain object-bottom"
                            onError={(e) => {
                                // Fallback if Model.png doesn't exist
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                }
                            }}
                        />
                        {/* Fallback placeholder */}
                        <div className="hidden w-[300px] h-[500px] bg-linear-to-b from-red-500 to-red-700 rounded-full items-center justify-center">
                            <div className="w-[200px] h-[300px] bg-red-400 rounded-full"></div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Content (heading + cards) */}
                <div className="w-[60%] flex flex-col items-center justify-center pr-16 pl-4">
                    {/* Title Section (Centered to match the image) */}
                    <div className="mb-12 text-center">
                        <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                            What's Features
                        </h1>
                        <h2 className={`text-xl sm:text-2xl md:text-3xl font-semibold leading-tight ${isDark ? 'text-white/90' : 'text-zinc-800'}`}>
                            That Feel Like They're Made For You ?
                        </h2>
                    </div>

                    {/* Feature Cards Container (two cards side by side, centered under heading) */}
                    <div className="flex flex-row gap-8 justify-center items-stretch w-full max-w-2xl mt-4">
                        {/* Principal Card - Horizontal content layout, yellow border */}
                        <div
                            onClick={() => navigate('/login')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/login') }}
                            className={`relative rounded-3xl overflow-hidden border-2 ${isDark ? 'bg-zinc-900/70 border-yellow-400' : 'bg-white border-yellow-500'} px-10 py-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-yellow-400/60' : 'focus:ring-yellow-500/60'}`}
                        >
                            {/* Card Content - Horizontal Layout */}
                            <div className="flex items-center gap-6">
                                {/* Illustration */}
                                <div className='shrink-0 p-1 flex items-center justify-center' style={{ width: '80px', height: '80px' }}>
                                    <img src={getAsset('Principle')} alt="Principal" className="w-[130px] h-[90px] object-contain" />
                                </div>

                                {/* Text Content */}
                                <div className="min-w-0">
                                    <h3 className={`text-xl font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        Principle
                                    </h3>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-zinc-600'} mt-1 text-sm leading-[1.6]`}>
                                        Shaping Young Minds, Building Bright Futures With Dedication And Vision, The Principal Leads Both Teachers And Students.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Student Card - Horizontal content layout, blue border */}
                        <div
                            onClick={() => navigate('/StudentPortal/login')}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') navigate('/StudentPortal/login') }}
                            className={`relative rounded-3xl overflow-hidden border-2 ${isDark ? 'bg-zinc-900/70 border-blue-400' : 'bg-white border-blue-500'} px-10 py-8 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl cursor-pointer focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-blue-400/60' : 'focus:ring-blue-500/60'}`}
                        >
                            {/* Card Content - Horizontal Layout */}
                            <div className="flex items-center gap-6">
                                {/* Illustration */}
                                <div className='shrink-0 p-1 flex items-center justify-center' style={{ width: '80px', height: '80px' }}>
                                    <img src={getAsset('student_login')} alt="Student" className="w-[120px] h-[110px] object-contain" />
                                </div>

                                {/* Text Content */}
                                <div className="min-w-0">
                                    <h3 className={`text-xl font-bold leading-snug ${isDark ? 'text-white' : 'text-zinc-900'}`}>
                                        Student
                                    </h3>
                                    <p className={`${isDark ? 'text-gray-300' : 'text-zinc-600'} mt-1 text-sm leading-[1.6]`}>With A Student Account, You Can Discover New Ideas, Track Progress, And Unlock Your Potential Every Day</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RoleFeatures;




