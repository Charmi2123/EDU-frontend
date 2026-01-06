import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { NavLink } from "react-router-dom";
import {
  Search,
  BookOpen,
  ListChecks,
  Layers,
  Clock3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function AllChapters({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter" }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  const chaptersData = [
    {
      id: 1,
      title: "Introduction To Computer Science",
      author: "Jane Doe",
      chaptersCount: 2,
      chapters: [
        {
          id: 1,
          title: "Introduction",
          description: "Introduction Content...",
          duration: "18 min",
          milestones: 4,
        },
        {
          id: 2,
          title: "Programming Basics",
          description: "Programming Content...",
          duration: "24 min",
          milestones: 6,
        },
      ],
    },
    {
      id: 2,
      title: "Advanced Algorithms",
      author: "John Doe",
      chaptersCount: 2,
      chapters: [
        {
          id: 1,
          title: "Divide & Conquer",
          description: "Algorithmic Content...",
          duration: "32 min",
          milestones: 5,
        },
        {
          id: 2,
          title: "Dynamic Programming",
          description: "Optimization Content...",
          duration: "29 min",
          milestones: 4,
        },
      ],
    },
  ];

  const themeClasses = {
    shell: isDark ? "bg-[#030303] text-gray-100" : "bg-[#F6F4FF] text-[#141322]",
    sidebarEdge: isDark ? "border-[#111118]" : "border-[#EAEAFC]",
    panel: isDark ? "bg-[#0C0C12] border-[#1E1E2A]" : "bg-white border-[#DFE1F0]",
    subtext: isDark ? "text-gray-400" : "text-zinc-500",
    pill: isDark ? "bg-[#1B1B25] text-gray-100" : "bg-[#EEF0FF] text-[#4338CA]",
    input: isDark
      ? "bg-[#11111A] border-[#1F1F2B] text-gray-100 placeholder:text-gray-500"
      : "bg-white border-[#E4E7F5] text-[#1F1F33] placeholder:text-gray-400",
    chapterCard: isDark
      ? "bg-[#11111A] border-[#1F1F2B] hover:border-[#6D6DFF]"
      : "bg-[#F9FAFF] border-[#E5E7FA] hover:border-[#7C3AED]",
    badges: isDark ? "bg-[#1F1F2B] text-gray-200" : "bg-white text-[#4338CA]",
  };

  const [expandedBooks, setExpandedBooks] = useState(() => {
    const initialState = {};
    chaptersData.forEach((book, index) => {
      initialState[book.id] = index === 0; // first book open by default
    });
    return initialState;
  });

  const toggleBook = (id) => {
    setExpandedBooks((prev) => {
      const isCurrentlyOpen = !!prev[id];

      const nextState = {};
      chaptersData.forEach((book) => {
        nextState[book.id] = false;
      });

      if (!isCurrentlyOpen) {
        nextState[id] = true; // open only this one
      }

      return nextState;
    });
  };

  return (
    <div
      className={`flex ${themeClasses.shell} min-h-screen overflow-hidden transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-screen w-full md:ml-20 lg:ml-72 p-4 sm:p-6 pb-6 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Upload Boook" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content wrapper (no own scroll; inner list scrolls) */}
        <main className="mt-4 sm:mt-5 flex-1">
          <div className="w-full mx-auto flex flex-col space-y-5">
            {/* Top toolbar card - same as other chapter pages */}
            <div
              className={`flex flex-col gap-4 rounded-2xl border px-5 py-5 shadow-sm ${themeClasses.panel}`}
            >
              <div className="flex flex-col gap-1">
                <p className="text-sm uppercase tracking-[0.2em] text-[#818CF8]">
                  Workflow
                </p>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold">
                      Add Chapter Management
                    </h1>
                    <p className={`text-sm ${themeClasses.subtext}`}>
                      Upload, order, and polish every chapter before publishing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <NavLink
                      to={backto}
                      className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition ${
                        isDark
                          ? "border-[#2B2B39] text-gray-200 hover:bg-[#161621]"
                          : "border-[#E4E7F5] text-[#1F1F33] hover:bg-[#F2F3FF]"
                      }`}
                    >
                      Cancel
                    </NavLink>
                    <button
                      type="button"
                      className="cursor-pointer rounded-xl bg-[#8B5CF6] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#8B5CF6]/40 transition hover:translate-y-0.5 hover:bg-[#7C3AED]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Uploaded", value: "08 Chapters" },
                  { label: "Ready To Review", value: "05 Drafts" },
                  { label: "Team", value: "3 Contributors" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`rounded-xl border px-4 py-3 text-sm font-medium ${
                      isDark ? "border-[#1F1F2B] bg-[#101018]" : "border-[#E4E6F5] bg-[#F9FAFF]"
                    }`}
                  >
                    <p className={`text-xs uppercase tracking-widest ${themeClasses.subtext}`}>
                      {stat.label}
                    </p>
                    <p className="mt-1 text-base">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* All Chapters main card */}
            <div
              className={`rounded-3xl border px-5 sm:px-7 py-6 sm:py-8 flex flex-col shadow-2xl shadow-black/5 ${themeClasses.panel}`}
            >
              <div className="mb-4 flex flex-col gap-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#818CF8]">
                  <Layers className="h-4 w-4" /> All Chapters
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold">
                  Browse All Chapters From Your Chapters
                </h2>
                <p className={`text-sm ${themeClasses.subtext}`}>
                  Keep your course structure tidy with grouped chapters and clear metadata.
                </p>
              </div>

              {/* Search bar */}
              <div className="mb-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search chapters, tags or authors"
                    className={`w-full h-11 rounded-2xl border pl-12 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-[#A5B4FC] ${themeClasses.input}`}
                  />
                </div>
              </div>

              {/* Chapters list (scrollable area inside fixed-height card) */}
              <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2 no-scrollbar">
                {chaptersData.map((book) => (
                  <div key={book.id} className="space-y-3 rounded-2xl border border-transparent px-3 py-2 transition hover:border-[#4C1D95]/30">
                    {/* Book header row with dropdown button */}
                    <button
                      type="button"
                      onClick={() => toggleBook(book.id)}
                      className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-2 text-left transition hover:bg-white/5"
                    >
                      <div>
                        <p className="text-sm uppercase tracking-[0.25em] text-[#8B5CF6]">
                          CURRICULUM
                        </p>
                        <h3 className="text-base sm:text-lg font-semibold">{book.title}</h3>
                        <p className={`text-xs ${themeClasses.subtext}`}>By {book.author}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold ${themeClasses.pill}`}>
                          <BookOpen className="h-4 w-4" /> {book.chapters.length} Chapters
                        </span>
                        {expandedBooks[book.id] ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {/* Chapters list (dropdown content) */}
                    {book.chapters.length > 0 && expandedBooks[book.id] && (
                      <div className="space-y-3">
                        {book.chapters.map((chapter, index) => (
                          <div
                            key={chapter.id}
                            className={`group rounded-2xl border px-4 py-4 transition ${themeClasses.chapterCard} cursor-pointer`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-start gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-b from-[#A78BFA] to-[#7C3AED] text-base font-semibold text-white">
                                  {String(index + 1).padStart(2, "0")}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold">{chapter.title}</p>
                                    <span className={`text-xs font-medium ${themeClasses.subtext}`}>
                                      {chapter.milestones} milestones
                                    </span>
                                  </div>
                                  <p className={`text-sm ${themeClasses.subtext}`}>
                                    {chapter.description}
                                  </p>
                                </div>
                              </div>
                              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${themeClasses.badges}`}>
                                <Clock3 className="h-3.5 w-3.5" /> {chapter.duration}
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-medium">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
                                isDark ? "border-[#26263A] bg-[#141421]" : "border-[#DADCF8] bg-white"
                              }`}>
                                <ListChecks className="h-3.5 w-3.5" /> Objectives
                              </span>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 ${
                                isDark ? "border-[#26263A] bg-[#141421]" : "border-[#DADCF8] bg-white"
                              }`}>
                                <BookOpen className="h-3.5 w-3.5" /> Notes
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Generate button */}
            <div className="flex justify-end">
              <button
                type="button"
                className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-[#4338CA] px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-[#4338CA]/40 transition hover:translate-y-0.5 hover:bg-[#312E81]"
              >
                Generate
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AllChapters;
