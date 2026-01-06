import React, { useRef, useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { RotateCcw } from "lucide-react";
import { NavLink } from "react-router-dom";

function UploadBook({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, suggestion = true, backto }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

  const shouldShowAddBook = () => Boolean(suggestion);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [topics, setTopics] = useState(["", ""]);

  const [recentBooks, setRecentBooks] = useState([
    {
      id: 1,
      title: "Advanced Algorithms",
      author: "Jane Doe",
      chapters: 2,
    },
    {
      id: 2,
      title: "Advanced Algorithms",
      author: "Jane Doe",
      chapters: 2,
    },




  ]);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const rawName = file.name || "";
    const baseName = rawName.replace(/\.[^/.]+$/, "");

    // For now, dummy topics; future me API response se replace kar sakte ho
    const generatedTopics = ["Ai History", "Present Application", "Future trends"];

    setChapterTitle(baseName);
    setTopics(generatedTopics);

    setRecentBooks((prev) => [
      {
        id: Date.now(),
        title: baseName || "Untitled Chapter",
        author: "Auto generated",
        chapters: generatedTopics.length,
      },
      ...prev,
    ]);

    setIsAddModalOpen(true);

    // reset input so same file ko bhi dubara choose kar sake
    e.target.value = "";
  };

  return (
    <div
      className={`flex ${isDark ? "bg-black text-gray-100" : "bg-white text-zinc-900"
        } h-screen overflow-hidden transition-colors duration-300`}
    >
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />

      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-20 lg:ml-72 p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Upload Book" isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-hidden">
          <div className="w-full mx-auto h-full flex flex-col space-y-4">
            {/* Toolbar row (sticky) */}
            <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} sticky top-0 z-30 border rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90 shadow-sm`}>
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-base sm:text-lg font-medium`}>Add Chapter Management</div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <NavLink
                  to={backto}
                  className={`${isDark ? 'bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700' : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </NavLink>
                <NavLink
                  to={"/chapter/Suggestions"}
                  className={`${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#696CFF]/90'} w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}>
                  Next
                </NavLink>
              </div>
            </div>

            {/* Upload Chapter content panel */}
            <div
              className={`rounded-2xl mb-2 border shadow-sm px-5 sm:px-7 py-5 sm:py-6 transition-colors duration-300 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
                }`}
            >
              {/* Heading + description */}
              <div className="space-y-1 mb-5">
                <h2 className="text-lg sm:text-xl font-semibold">Upload Chapter</h2>
                <p className="text-xs sm:text-sm text-gray-400">
                  Add a new chapter to your library with chapters
                </p>
              </div>

              {/* Hidden file input for chapter upload */}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {/* Add Book button */}
              {shouldShowAddBook() && (
                <div className="mb-6">
                  <button
                    type="button"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className={`cursor-pointer inline-flex items-center gap-1 px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${isDark
                      ? "bg-zinc-800 text-gray-100 hover:bg-zinc-700"
                      : "bg-[#696CFF] text-white hover:bg-[#5a5de6]"
                      }`}
                  >
                    <span>Add Chapter</span>
                    <span>+</span>
                  </button>
                </div>
              )}

              {/* Recently added section */}
              <div className="space-y-3 flex flex-col">
                <div className="text-xs sm:text-sm text-gray-400">
                  Recently Added Books
                </div>

                <div className="space-y-2 pr-1 max-h-80 md:max-h-72 overflow-y-auto no-scrollbar">
                  {recentBooks.map((book) => (
                    <div
                      key={book.id}
                      className={`rounded-md px-4 py-3 flex flex-col gap-1 text-xs sm:text-sm ${isDark
                        ? "bg-zinc-800 border border-zinc-700 text-gray-100"
                        : "bg-transparent border-0 text-zinc-900"
                        }`}
                    >
                      <div className="font-medium">
                        {book.title}
                      </div>
                      <div className="text-[11px] sm:text-xs text-gray-400">
                        By {book.author} ok {book.chapters} Chapters
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Book Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm px-3 sm:px-4"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className={`w-full max-w-lg max-h-[80vh] rounded-2xl shadow-xl px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto no-scrollbar ${isDark ? "bg-zinc-950 text-gray-100" : "bg-white text-zinc-900"
              }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg text-[15px] font-semibold">Add Chapter</h3>
                <p className="text-xs sm:text-sm text-gray-400">
                  Enter chapter details and topics
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="cursor-pointer text-white hover:text-gray-200 hover:bg-zinc-900 text-lg leading-none px-2"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              {/* Chapter Title */}
              <div className="space-y-1">
                <label className={`block text-[15px] sm:text-xs ${isDark ? "text-white" : "text-zinc-900"}`}>
                  Chapter Title
                </label>
                <div
                  className={`w-full rounded-md px-3 py-2 text-xs sm:text-sm placeholder:text-gray-500 ${isDark
                    ? "bg-zinc-900 border border-zinc-800 text-gray-100"
                    : "bg-[#f4f4fb] border border-transparent text-zinc-900"
                    }`}
                >
                  {chapterTitle || "Chapter title will appear here after upload"}
                </div>
              </div>
              {/* Topics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] sm:text-xs ${isDark ? "text-white" : "text-zinc-900"}`}>Topics</span>
                  <button
                    type="button"
                    onClick={() => {
                      setChapterTitle("");
                      setTopics(Array(topics.length).fill(""));
                    }}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-md border border-zinc-400 bg-white px-4 py-1.5 text-[12px] font-semibold text-black shadow-sm hover:bg-zinc-100"
                  >
                    <span className="font-bold text-sm">Restore</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px]">
                      <RotateCcw />
                    </span>
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  {topics.map((value, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className={`w-6 text-[15px] ${isDark ? "text-white" : "text-zinc-900"}`}>{index + 1}</div>
                      <div
                        className={`flex-1 rounded-md px-3 py-2 text-xs sm:text-sm placeholder:text-gray-500 ${isDark
                          ? "bg-zinc-900 border border-zinc-800 text-white"
                          : "bg-[#f4f4fb] border border-transparent text-zinc-900"
                          }`}
                      >
                        {value || "Topic will appear here after upload"}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer buttons
                <div className="mt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className={`cursor-pointer px-5 py-2 rounded-md bg-white text-black text-xs sm:text-sm font-medium shadow-sm hover:bg-zinc-100 ${isDark ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700" : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"}`}
                  >
                    Done
                  </button>

                </div> */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UploadBook;
