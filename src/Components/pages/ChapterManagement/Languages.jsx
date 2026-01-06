import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets";
import { ArrowLeft, ChevronDown, Clock, MessageSquareText, Star } from "lucide-react";

const CustomSelect = ({ value, onChange, options, placeholder, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`${isDark
          ? "bg-zinc-900 border-zinc-800 text-gray-100"
          : "bg-white border-zinc-300 text-zinc-900"
          } w-full rounded-md border px-3 py-2 text-sm cursor-pointer flex justify-between items-center focus:ring-1 focus:ring-[#696CFF] transition-all`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full rounded-md border shadow-lg max-h-60 overflow-y-auto ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
          }`}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors duration-150 ${value === option.value
                ? "bg-[#696CFF] text-white"
                : `hover:bg-[#696CFF] hover:text-white ${isDark ? "text-gray-100" : "text-zinc-900"}`
                }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
function Languages({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter/Narration" }) {
  const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";
  const [minutes, setMinutes] = useState("");
  const [language, setLanguage] = useState("");
  const [model, setModel] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const navState = location.state || {};
  const lectureId = navState.lectureId || null;
  const handleNext = async () => {
    try {
      const duration = Number(minutes);
      const mergedId = lectureId || navState.merged_id || null;
      // Require valid duration (30, 45, 60) and language before calling API
      if (!duration || ![30, 45, 60].includes(duration)) {
        handleerror("Please select a valid duration (30, 45 or 60 minutes).");
        return;
      }
      if (!language) {
        handleerror("Please select a language.");
        return;
      }
      if (!model) {
        handleerror("Please select a model.");
        return;
      }
      if (!mergedId) {
        handleerror("Missing lecture information. Please go back and try again.");
        return;
      }
      const token = localStorage.getItem("access_token");
      const response = await axios.post(
        `${BACKEND_API_URL}/chapter-materials/chapter_lecture/config`,
        {
          merged_id: mergedId,
          language,
          duration,
          model,
        },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      // Only navigate if the API call was successful
      if (response?.data?.status) {
        handlesuccess(response?.data?.message || "Lecture configuration saved");
        navigate("/chapter/Narration", {
          state: {
            lectureId,
          },
        });
      } else {
        // Handle unsuccessful response
        handleerror(response?.data?.detail || response?.data?.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving lecture configuration:", error);
      // Display error message from API response
      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save lecture configuration";
      handleerror(errorMessage);
    }
  };
  const cardCls = `${isDark ? "bg-zinc-900" : "bg-white"} border border-transparent rounded-2xl p-4 sm:p-5 transition-colors duration-200`;
  return (
    <div className={`flex ${isDark ? "bg-black text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen overflow-hidden transition-colors duration-300`}>
      {/* Sidebar */}
      <Sidebar isDark={isDark} sidebardata={sidebardata} />
      {/* Main Section */}
      <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
        {/* Header */}
        <div className="sticky top-0 z-20">
          <Header title="Add Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
        </div>
        {/* Scrollable content */}
        <main className="mt-4 sm:mt-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="w-full mx-auto space-y-4">
            {/* Toolbar row */}
            <div
              className={`${isDark ? "bg-zinc-900" : "bg-white"} sticky top-0 z-30 border border-transparent rounded-xl px-3 sm:px-4 py-3 flex items-center justify-between backdrop-blur bg-opacity-90`}
            >
              <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-lg font-semibold flex items-center`}>
                <button
                  onClick={() => navigate(-1)}
                  className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                  Add Chapter Management
                </h2>
              </div>
              <div className="flex gap-2 w-[200px] justify-center items-center">
                <button
                  onClick={() => {
                    setMinutes("");
                    setLanguage("");
                    setModel("");
                  }}
                  className={`${isDark
                    ? "bg-zinc-800 text-gray-300 hover:bg-zinc-700 border border-zinc-700"
                    : "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-300"
                    } w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleNext}
                  disabled={!minutes || !["30", "45", "60"].includes(minutes) || !language || !model}
                  className={`${isDark
                    ? "bg-white text-black hover:bg-zinc-100 disabled:bg-zinc-300 disabled:text-zinc-600"
                    : "bg-[#696CFF] text-white hover:bg-[#696CFF]/90 disabled:bg-zinc-300 disabled:text-zinc-500"
                    } w-full cursor-pointer px-4 py-1.5 flex items-center justify-center rounded-md text-sm disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  Next
                </button>
              </div>
            </div>
            {/* Set Time card */}
            <div className={cardCls}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-500/15 text-red-500 text-xs">
                      <Clock size={14} />
                    </span>
                    <span>Set Time For Single Chapter</span>
                  </h2>
                  {/* <p className="mt-1 text-xs sm:text-sm text-gray-400">Set Minute</p> */}
                </div>
                <div>
                  <CustomSelect
                    value={minutes}
                    onChange={setMinutes}
                    options={[
                      { value: "30", label: "30" },
                      { value: "45", label: "45" },
                      { value: "60", label: "60" },
                    ]}
                    placeholder="Select Minute"
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
            {/* Language Selection card */}
            <div className={cardCls}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-500 text-xs">
                      <MessageSquareText size={14} />
                    </span>
                    <span>Language Selection</span>
                  </h2>
                  {/* <p className="mt-1 text-xs sm:text-sm text-gray-400">Select Language</p> */}
                </div>
                <div className="space-y-2">
                  <CustomSelect
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { value: "English", label: "English" },
                      { value: "Hindi", label: "Hindi" },
                      { value: "Gujarati", label: "Gujarati" },
                    ]}
                    placeholder="Select Language"
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
            {/* Model Selection card */}
            <div className={cardCls}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500/15 text-yellow-500 text-xs">
                      <Star size={14} fill="currentColor" />
                    </span>
                    <span>Select Model</span>
                  </h2>
                </div>
                <div>
                  <CustomSelect
                    value={model}
                    onChange={setModel}
                    options={[
                      { value: "inai", label: "inai" },
                      { value: "vinai", label: "vinai" },
                      { value: "aira", label: "aira" },
                    ]}
                    placeholder="Select Model"
                    isDark={isDark}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div >
    </div >
  );
}
export default Languages;