import React, { useState, useEffect } from "react";
import { getAsset } from "../../../utils/assets.js";
import {
  Home,
  Users,
  BookOpen,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  BarChart3,
  Layers,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function Sidebar({ isDark }) {
  const [isMembersOpen, setMembersOpen] = useState(false);
  const [isLectureOpen, setLectureOpen] = useState(false);
  const [isStudentOpen, setStudentOpen] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenu, setMobileMenu] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  // ✅ Handle responsive default state
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setSidebarOpen(true);
        setIsTablet(false);
      } else if (width >= 768) {
        setSidebarOpen(false);
        setIsTablet(true);
      } else {
        setSidebarOpen(true);
        setIsTablet(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* ===== Mobile Toggle Button ===== */}
      <button
        onClick={() => setMobileMenu(!isMobileMenu)}
        className={`md:hidden fixed top-[42px] left-[40px] z-50 ${isDark ? 'bg-zinc-900 text-gray-200 hover:bg-zinc-800' : 'bg-transparent text-zinc-700 hover:bg-zinc-100'} p-2 rounded-lg  transition`}
      >
        {isMobileMenu ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ===== Sidebar ===== */}
      <aside
        className={`${isDark ? 'bg-zinc-900 text-gray-200' : 'bg-white text-zinc-700'} flex flex-col justify-between fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out
        ${isMobileMenu ? "translate-x-0 w-64" : "-translate-x-full"}
        md:translate-x-0 ${isSidebarOpen ? "md:w-64" : "md:w-20"} lg:w-72`}
      >
        {/* <div className="flex flex-col h-full"> */}
        <div className="flex flex-col min-h-full justify-between">

          {/* ===== Logo Section ===== */}
          <div className={`relative flex flex-col h-[100px] items-center justify-center p-4 border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'} transition-colors duration-300`}>
            <img
              src={isDark ? getAsset('inailogo_dark') : getAsset('inailogo_light')}
              alt="INAI Logo"
              className={`object-contain transition-all duration-300 ${
                isSidebarOpen ? "w-28" : "w-10"
              }`}
            />

            {/* ===== ✅ Tablet Toggle Button ===== */}
            {isTablet && (
              <button
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className={`absolute top-25 ${
                  isSidebarOpen ? "right-1" : "left-1/2 -translate-x-1/2"
                } ${isDark ? 'bg-zinc-900 text-gray-200 hover:bg-zinc-800' : 'bg-transparent text-zinc-700 hover:bg-zinc-100'} p-3 rounded-lg transition cursor-pointer`}
              >
                {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>

          {/* ===== Navigation (hidden when tablet collapsed) ===== */}
          {(!isTablet || (isTablet && isSidebarOpen)) && (
            <nav className="flex-1 mt-2 p-1 z-1000">
              {/* Dashboard */}
              <NavLink
                to="/dashboard"
                className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
              >
                <Home size={18} />
                {isSidebarOpen && <span>Dashboard</span>}
              </NavLink>

              {/* All Members */}
              <div>
                <NavLink
                to={"/AllMember"}
                  onClick={() => setMembersOpen(!isMembersOpen)}
                  className={`w-full flex justify-between items-center py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                >
                  <div className="flex items-center space-x-3">
                    <Users size={18} />
                    {isSidebarOpen && <span>All Members</span>}
                  </div>
                  {isSidebarOpen &&
                    (isMembersOpen ? (
                      <ChevronDown size={18} />
                    ) : (
                      <ChevronRight size={18} />
                    ))}
                </NavLink>

                {isMembersOpen && (
                  <div className="pl-6 space-y-1 mt-2">
                    <NavLink
                      to={"/allmember/chaptermanagement"}
                      className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                    >
                      <Layers size={16} />
                      {isSidebarOpen && <span>Chapter Management</span>}
                    </NavLink>

                    <a
                      href="#"
                      className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                    >
                      <User size={16} />
                      {isSidebarOpen && <span>Student Management</span>}
                    </a>

                    <div>
                      <button
                        onClick={() => setLectureOpen(!isLectureOpen)}
                        className={`w-full flex justify-between items-center py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                      >
                        <div className="flex items-center space-x-3">
                          <BookOpen size={16} />
                          {isSidebarOpen && <span>Lecture Management</span>}
                        </div>
                        {isSidebarOpen &&
                          (isLectureOpen ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          ))}
                      </button>

                      {isLectureOpen && (
                        <div className="pl-6 space-y-1 mt-2">
                          <a
                            href="#"
                            className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                          >
                            <BookOpen size={16} />
                            {isSidebarOpen && <span>Taken Lectures</span>}
                          </a>

                          <div>
                            <button
                              onClick={() => setStudentOpen(!isStudentOpen)}
                              className={`w-full flex justify-between items-center py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                            >
                              <div className="flex items-center space-x-3">
                                <GraduationCap size={16} />
                                {isSidebarOpen && <span>Students</span>}
                              </div>
                              {isSidebarOpen &&
                                (isStudentOpen ? (
                                  <ChevronDown size={16} />
                                ) : (
                                  <ChevronRight size={16} />
                                ))}
                            </button>

                            {isStudentOpen && (
                              <div className="pl-6 space-y-1 mt-2">
                                <a
                                  href="#"
                                  className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                                >
                                  <SlidersHorizontal size={16} />
                                  {isSidebarOpen && <span>Filter</span>}
                                </a>
                                <a
                                  href="#"
                                  className={`flex items-center space-x-3 py-2 px-3 rounded-lg transition-colors duration-300 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'}`}
                                >
                                  <BarChart3 size={16} />
                                  {isSidebarOpen && (
                                    <span>Graphical Presentation</span>
                                  )}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          )}

          {/* ===== ✅ Logout (Hide on tablet when collapsed) ===== */}
          {(!isTablet || (isTablet && isSidebarOpen)) && (
            <div className={`p-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} transition-colors duration-300`}>
              <button className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors duration-300 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}>
                <LogOut size={16} />
                {isSidebarOpen && <span>Logout</span>}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ===== Mobile Overlay ===== */}
      {isMobileMenu && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileMenu(false)}
        ></div>
      )}

      {/* ===== Tablet Overlay (md only) - show when sidebar expanded ===== */}
      {isTablet && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 hidden md:block lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </>
  );
}

export default Sidebar;
