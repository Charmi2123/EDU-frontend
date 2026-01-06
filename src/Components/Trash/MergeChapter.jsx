import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { Plus, Trash2, Lock, Circle, CheckCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";

function MergeChapter({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  const [selectedChapters] = useState(0);

  const books = [
    {
      id: 1,
      title: "Introduction to Computer Science",
      author: "John Smith",
      chapters: [
        { id: 1, title: "Introduction" },
        { id: 2, title: "Programming Basics" },
      ],
    },
    {
      id: 2,
      title: "Introduction to Computer Science",
      author: "John Smith",
      chapters: [
        { id: 1, title: "Introduction" },
        { id: 2, title: "Programming Basics" },
      ],
    },
    {
      id: 2,
      title: "Introduction to Computer Science",
      author: "John Smith",
      chapters: [
        { id: 1, title: "Introduction" },
        { id: 2, title: "Programming Basics" },
      ],
    },
    {
      id: 2,
      title: "Introduction to Computer Science",
      author: "John Smith",
      chapters: [
        { id: 1, title: "Introduction" },
        { id: 2, title: "Programming Basics" },
      ],
    },
    {
      id: 2,
      title: "Introduction to Computer Science",
      author: "John Smith",
      chapters: [
        { id: 1, title: "Introduction" },
        { id: 2, title: "Programming Basics" },
      ],
    },
  ];

  return (
    <div
      className={`flex ${isDark ? "bg-black text-gray-100" : "bg-zinc-50 text-zinc-900"
        } h-screen overflow-hidden transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-20 lg:ml-72 p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Upload Boook" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-5 flex-1 overflow-y-auto  no-scrollbar">
          <div className="w-full mx-auto flex flex-col space-y-4">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} sticky top-0 z-30 border rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90 shadow-sm`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>Upload Chapter</div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <NavLink
                  to={backto}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </NavLink>
                <button
                  type="button"
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Next
                </button>
              </div>
            </div>

            {/* Main merge layout */}
            <div className="flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6">
              {/* Left: Merge Chapter card */}
              <div
                className={`flex-1 rounded-2xl border shadow-sm px-5 sm:px-7 py-5 sm:py-6${isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"
                  }`}
              >
                <div className="mb-2">
                  <h2 className="text-lg sm:text-xl font-semibold">Merge Chapter</h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">
                    Select chapters from multiple books to merge into a complete lecture
                  </p>
                </div>

                <div className="space-y-4 max-h-[53vh] overflow-y-auto pr-2 no-scrollbar">
                  {books.map((book) => (
                    <div
                      key={book.id}
                      className={`rounded-xl px-4 sm:px-5 py-4 space-y-3 border ${
                        isDark
                          ? "bg-zinc-900 border-zinc-800"
                          : "bg-zinc-50 border-zinc-200"
                      }`}
                    >
                      {/* Book header */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm sm:text-base font-semibold">
                            {book.title}
                          </h3>
                          <p className="mt-1 text-[11px] sm:text-xs text-gray-400">
                            by {book.author} | {book.chapters.length} chapters
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-gray-100 hover:bg-zinc-700"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            className="cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800 text-gray-300 hover:text-white hover:bg-zinc-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Chapters list */}
                      <div className="space-y-2">
                        {book.chapters.map((chapter, index) => (
                          <div
                            key={chapter.id}
                            className={`flex items-center rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm ${
                              isDark
                                ? "bg-zinc-850/90"
                                : "bg-zinc-100"
                            }`}
                          >
                            <button
                              type="button"
                              className={`mr-3 flex h-5 w-5 items-center justify-center rounded-full border text-gray-200 ${
                                index === 0
                                  ? "border-[#696CFF] bg-[#696CFF]/10"
                                  : "border-zinc-600 bg-transparent"
                              }`}
                            >
                              {index === 0 ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                <Circle className="h-3 w-3" />
                              )}
                            </button>
                            <div
                              className={`flex-1 rounded-md px-3 py-1 font-medium ${
                                isDark ? "bg-zinc-900" : "bg-white"
                              }`}
                            >
                              {chapter.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    className="cursor-pointer inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs sm:text-sm font-medium bg-white text-black hover:bg-zinc-100 transition-colors"
                  >
                    <span>Add Chapter</span>
                    <Plus className="h-3 w-3" />
                  </button>

                  <button
                    type="button"
                    className="text-xs sm:text-sm text-red-500 hover:underline"
                  >
                    Skip
                  </button>
                </div>
              </div>

              {/* Right: Merged Lecture card */}
              <div
                className={`w-full lg:w-80 xl:w-96 rounded-2xl border shadow-sm px-5 sm:px-6 py-4 sm:py-5 self-start ${isDark ? "bg-zinc-950 border-zinc-900" : "bg-white border-zinc-200"
                  }`}
              >
                <div className="mb-4">
                  <h2 className="text-base sm:text-lg font-semibold">Merged Lecture</h2>
                  <p className="mt-1 text-xs sm:text-sm text-gray-400">
                    {selectedChapters} chapter(s) selected
                  </p>
                </div>

                <div className="mb-5 rounded-lg border border-dashed border-zinc-700 bg-zinc-900 px-4 py-3">
                  <p className="text-xs sm:text-sm text-gray-300">
                    Select chapters from different books to create a comprehensive lecture
                  </p>
                </div>

                <button
                  type="button"
                  className="w-full cursor-pointer inline-flex items-center justify-center gap-2 rounded-md bg-white text-black text-xs sm:text-sm font-medium px-4 py-2.5 hover:bg-zinc-100 transition-colors"
                >
                  <span>Create Merged Lecture</span>
                  <Lock className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default MergeChapter;
