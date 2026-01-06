import React, { useState } from "react";
// import Sidebar from "./Sidebar.jsx";
import Sidebar from "../../Tools/Sidebar.jsx";
import { Search, Bell, UserCircle2, Users, BookOpen, GraduationCap, UserPlus } from "lucide-react";
import Header from "../../Tools/Header.jsx";
import { getAsset } from "../../../utils/assets.js";
import { useNavigate } from "react-router-dom";

function AllMembers({ theme, isDark, toggleTheme, sidebardata }) {
  const navigate = useNavigate();
  return (
    <div className={`flex ${isDark ? 'bg-zinc-950 text-gray-100' : 'bg-[#F5F5F9] text-zinc-900'} h-screen transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Content (offset for fixed sidebar) */}
      <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 transition-all duration-300`}>

        {/* ===== Sticky Header ===== */}
        <div className="sticky top-0 z-20">
          <Header title="All Member" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* ===== Main Section (scrollable) ===== */}
        <main className="mt-6 overflow-y-auto no-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-7">
          {/* Chapter Management */}
          <div
            onClick={() => navigate("/Admin/chapter/Dashboard")}
            className={`border border-transparent ${isDark ? 'bg-zinc-900 hover:border-[#F2C100]' : 'bg-white hover:border-[#F2C100]'} rounded-2xl p-5 flex flex-col gap-3.5 items-center justify-center transition h-[140px] cursor-pointer`}>
            <img
              src={isDark ? getAsset('chapter_dark') : getAsset('chapter_light')}
              alt="INAI Logo"
              className={`object-contain transition-all duration-300 w-10`}
            />
            <h2 className={`text-lg font-semibold text-[#F2C100]`}>
              Chapter Management
            </h2>
          </div>

          {/* Student Management */}
          <div onClick={() => navigate("/Admin/student/Dashboard")}
            className={`border border-transparent ${isDark ? 'bg-zinc-900 hover:border-[#8779CA]' : 'bg-white hover:border-[#8779CA]'} rounded-2xl p-6 flex flex-col gap-3.5 items-center justify-center transition h-[140px] cursor-pointer`}>
            <img
              src={getAsset('student')}
              alt="INAI Logo"
              className={`object-contain transition-all duration-300 w-10`}
            />
            <h2 className={`text-lg font-semibold text-[#8779CA]`}>
              Student Management
            </h2>
          </div>

          {/* Lecture Management */}
          <div
            onClick={() => navigate("/Admin/lecture/Dashboard")}
            className={`border border-transparent ${isDark ? 'bg-zinc-900 hover:border-[#4FBCA5]' : 'bg-white hover:border-[#4FBCA5]'} rounded-2xl p-6 flex flex-col gap-3.5 items-center justify-center transition h-[140px] cursor-pointer`}>
            <img
              src={getAsset('lecture')}
              alt="INAI Logo"
              className={`object-contain transition-all duration-300 w-10`}
            />
            <h2 className={`text-lg font-semibold text-[#4FBCA5]`}>
              Lecture Management
            </h2>
          </div>

          {/* Add Management */}
          {/* <div className={`${isDark ? 'bg-zinc-900 border-zinc-800 hover-border-pink-500' : 'bg-white border-zinc-200 hover-border-pink-400'} border rounded-2xl p-6 flex flex-col gap-3.5 items-center justify-center transition h-[140px] cursor-pointer`}> */}
          <div
            onClick={() => navigate("/Admin/Managementlist")}
            className={`border border-transparent ${isDark
              ? "bg-zinc-900 hover:border-[#B25CC1]"
              : "bg-white hover:border-[#B25CC1]"
              } rounded-2xl p-6 flex flex-col gap-3.5 items-center justify-center transition h-[140px] cursor-pointer`}
          >
            <img
              src={getAsset('Add')}
              alt="INAI Logo"
              className={`object-contain transition-all duration-300 w-10`}
            />
            <h2 className={`text-lg font-semibold text-[#B25CC1]`}>
              All Member List
            </h2>
          </div>

        </main>
      </div>
    </div>
  );
}

export default AllMembers;
