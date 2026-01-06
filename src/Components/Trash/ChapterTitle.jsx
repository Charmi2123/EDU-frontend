import Sidebar from "../Tools/Sidebar.jsx";
import Header from "../Tools/Header.jsx";
import { BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ChapterTitle({ isDark, toggleTheme, sidebardata }) {
  const navigate = useNavigate();
  const shellBg = isDark
    ? "bg-zinc-950 text-gray-100"
    : "bg-zinc-100 text-zinc-900";
  const panelBg = isDark
    ? "bg-zinc-900 border-zinc-800"
    : "bg-white border-zinc-200";
  const subText = isDark ? "text-zinc-400" : "text-zinc-600";

  // Dynamic chapter meta data
  const [chapterInfo] = useState({
    id: 1,
    title: "Chapter 1: Fundamentals of Computing",
    author: "Priti Sharma ",
    subject: "Mathematics",
    totalChapters: 10,
    coverImage: "/Model.png",
    description: [
      "Computer science is the study of computation, information, and automation. It encompasses both theoretical studies of algorithms and the practical problems involved in implementing them through computer hardware and software.",
      "The field of computer science spans a wide range of topics from theoretical foundations to practical applications. At its core, computer science is about problem-solving and understanding how we can use computers to solve complex problems efficiently.",
      "In this chapter, we will explore the fundamental concepts that form the foundation of computer science. We'll discuss the history of computing, basic computer architecture, and the principles that guide how computers process information.",
      "Understanding these fundamentals is crucial for anyone looking to pursue a career in technology or simply wanting to better understand the digital world we live in...",
    ],
  });

  // Dynamic chapter list
  const [chapters] = useState([
    { id: 1, title: "Chapter-1 Introduction" },
    { id: 2, title: "Chapter-2 Basics" },
    { id: 3, title: "Chapter-3 Examples" },
    { id: 4, title: "Chapter-4 Practice" },
    { id: 5, title: "Chapter-5 Summary" },
    { id: 6, title: "Chapter-6 Advanced Topics" },
    { id: 7, title: "Chapter-7 Case Studies" },
    { id: 8, title: "Chapter-8 Projects" },
    { id: 9, title: "Chapter-9 Review" },
  ]);

  return (
    <div className={`flex ${shellBg} h-screen transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main content */}
      <div className="flex flex-col h-screen w-full md:ml-15 lg:ml-72 transition-all duration-300">

        {/* Header bar */}
        <div className="sticky top-0 z-20 px-4 sm:px-7 pt-4 sm:pt-7">
          <Header
            title="Chapter title"
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        </div>

        {/* Content Area: title fixed, scroll below it */}
        <main className="flex-1 flex flex-col min-h-0 px-4 sm:px-7 pt-4 sm:pt-4 pb-0 sm:pb-0">
          {/* ==== Top: Chapter Title with Button (fixed within content) ==== */}
          <div className={`rounded-xl sm:rounded-2xl border px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${panelBg}`}>
            <h2 className="text-lg sm:text-xl font-semibold">{chapterInfo.title}</h2>

          </div>

          {/* Scrollable stack below the title (no scroll on large screens) */}
          <div className="flex-1 mt-4 flex flex-col gap-4 overflow-y-auto lg:overflow-visible no-scrollbar">
            {/* ==== Middle: Main Card + Chapter List ==== */}
            <div className="flex flex-col lg:flex-row gap-4">

              {/* Left: Book Card */}
              <div className={`${panelBg} rounded-xl sm:rounded-2xl border px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 lg:w-[48%]`}>
                {/* Book cover image */}
                <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-zinc-200 to-zinc-300 w-32 h-44 sm:w-40 sm:h-52 shrink-0 shadow-lg overflow-hidden">
                  <img
                    src={chapterInfo.coverImage}
                    alt="Chapter cover"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Text & button */}
                <div className="flex flex-col justify-center gap-3 flex-1 w-full">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold mb-1">Author - {chapterInfo.author}</h2>
                    <p className={`text-xs sm:text-sm ${subText}`}>
                      {chapterInfo.subject} · {chapterInfo.totalChapters} - Chapters
                    </p>
                  </div>
                  <button
                    onClick={() => navigate("/StudentPortal/desplaypdf")}
                    className={`${isDark ? 'bg-white text-black' : 'bg-[#3498db] text-white'} px-5 py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-gray-100 transition shadow-sm w-[25vh] cursor-pointer`}
                  >
                    Start Reading
                  </button>
                </div>
              </div>

              {/* Right: Chapter List (scrollable) */}
              <div className={`${panelBg} rounded-xl sm:rounded-2xl border px-4 sm:px-5 py-3 sm:py-4 flex-1`}>
                <div className="max-h-48 sm:max-h-56 overflow-y-auto no-scrollbar">
                  {chapters.map((ch, index) => (
                    <div
                      key={`${ch.id}-${index}`}
                      className={`flex items-center gap-3 py-2 sm:py-2.5 px-3 mb-1.5 last:mb-0 rounded-lg hover:bg-opacity-50 transition-colors cursor-pointer ${isDark ? "hover:bg-zinc-800" : "hover:bg-zinc-100"
                        }`}
                    >
                      <BookOpen className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${subText} shrink-0`} />
                      <span className="text-xs sm:text-sm">{ch.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom padding for scroll (small subtle gap only on mobile/tablet via main padding) */}
          </div>
        </main>
      </div>
    </div>
  );
}