import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset, handlesuccess, handleerror, BACKEND_API_URL } from "../../../utils/assets.js";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function AddLecture({ theme, isDark, toggleTheme, sidebardata }) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        std: "",
        subject: "",
        chapter_title: ""
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.std || !formData.subject || !formData.chapter_title) {
            handleerror("Please fill all fields");
            return;
        }

        const payload = {
            std: formData.std.trim(),
            subject: formData.subject.trim(),
            chapter_title: formData.chapter_title.trim()
        };

        console.log("Sending Payload:", payload);

        setLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await axios.post(
                `${BACKEND_API_URL}/chapter-materials/public_lecture/start_new_lecture`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    }
                }
            );

            if (response.data?.status) {
                handlesuccess(response.data.message || "Lecture started successfully");
                // Navigate to LectureVideo with the lecture_uid from response
                if (response.data.data?.lecture_uid) {
                    setTimeout(() => {
                        navigate("/lecture/newlecture", {
                            state: {
                                lectureId: response.data.data.lecture_uid,
                                lecturejson: response.data.data?.lecture_link
                            }
                        });
                    }, 2000);
                }
            } else {
                handleerror(response.data?.message || "Failed to start lecture");
            }
        } catch (error) {
            console.error("Error starting lecture:", error);
            handleerror(error.response?.data?.message || "An error occurred while starting the lecture");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Content (offset for fixed sidebar) */}
            <div className={`flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-7 pb-0 transition-all duration-300`}>
                {/* ===== Sticky Header ===== */}
                <div className="sticky top-0 z-20">
                    <Header title="Lecture Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* ===== Main Section ===== */}
                <main className="mt-6 flex-1 flex flex-col min-h-0">
                    {/* Top action bar (Start New Lecture + actions) */}
                    <div className={`w-full rounded ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"} px-3 py-2 md:px-4 md:py-3 text-sm md:text-base flex items-center justify-between mb-5`}>
                        <span className={`cursor-default px-3 py-1.5 rounded font-inter font-medium text-[18px] leading-[100%] capitalize ${isDark ? "text-gray-200" : " text-zinc-800"}`}>
                            Start New Lecture
                        </span>
                    </div>

                    {/* Cards */}
                    <section className="space-y-4">
                        {/* Add Class */}
                        <div className={`rounded-md overflow-hidden ${isDark ? "bg-zinc-900  border border-zinc-800" : "bg-white border border-zinc-200"}`}>
                            <div className="flex items-center gap-2 px-3 py-1">

                                <span className="text-[16px]">📘</span>
                                <p className={`font-inter font-medium text-[18px] leading-[100%] capitalize ${isDark ? "text-gray-100" : "text-zinc-900"}`}>Add Class</p>
                            </div>
                            <div className="p-2">
                                <label className={`block font-medium text-[13px] leading-[100%] capitalize mb-1 font-inter ${isDark ? "text-white" : "text-zinc-700"}`}>
                                    Class
                                </label>

                                <div className="flex items-center gap-2">

                                    <input
                                        type="text"
                                        name="std"
                                        value={formData.std}
                                        onChange={handleChange}
                                        placeholder="Enter Class"
                                        className={`${isDark ? "w-full h-8 rounded bg-zinc-800  border border-zinc-800 text-gray-200 m-2 placeholder:text-zinc-500 px-2 outline-none focus:border-zinc-600" : "w-full h-8 rounded bg-white border border-zinc-300 text-zinc-900 m-2 placeholder:text-zinc-400 px-2 outline-none focus:border-zinc-400"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add Subject */}
                        <div className={`rounded-md overflow-hidden ${isDark ? "bg-zinc-900  border border-zinc-800" : "bg-white border border-zinc-200"}`}>
                            <div className="flex items-center gap-2 px-3 py-1">

                                <span className="text-[16px]">📚</span>
                                <p className={`font-inter font-medium text-[18px] leading-[100%] capitalize ${isDark ? "text-gray-100" : "text-zinc-900"}`}>Add Subject</p>
                            </div>
                            <div className="p-2">
                                <label className={`block font-medium text-[13px] leading-[100%] capitalize mb-1 font-inter ${isDark ? "text-white" : "text-zinc-700"}`}>Subject Name</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Enter Subject Name"
                                        className={`${isDark ? "w-full h-8 rounded bg-zinc-800  border border-zinc-800 text-gray-200  m-2 placeholder:text-zinc-500 px-2 outline-none focus:border-zinc-600" : "w-full h-8 rounded bg-white border border-zinc-300 text-zinc-900  m-2 placeholder:text-zinc-400 px-2 outline-none focus:border-zinc-400"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Add Chapter */}
                        <div className={`rounded-md overflow-hidden ${isDark ? "bg-zinc-900  border border-zinc-800" : "bg-white border border-zinc-200"}`}>
                            <div className="flex items-center gap-2 px-3 py-1">

                                <span className="text-[16px]">📕</span>
                                <p className={`font-inter font-medium text-[18px] leading-[100%] capitalize ${isDark ? "text-gray-100" : "text-zinc-900"}`}>
                                    Add Chapter
                                </p>

                            </div>
                            <div className="p-2">
                                <label className={`block font-medium text-[13px] leading-[100%] capitalize mb-1 font-inter ${isDark ? "text-white" : "text-zinc-700"}`}>Chapter Name</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        name="chapter_title"
                                        value={formData.chapter_title}
                                        onChange={handleChange}
                                        placeholder="Enter Chapter Name"
                                        className={`${isDark ? "w-full h-8 rounded bg-zinc-800  border border-zinc-800 text-gray-200  m-2 placeholder:text-zinc-500 px-2 outline-none focus:border-zinc-600" : "w-full h-8 rounded bg-white border border-zinc-300 text-zinc-900  m-2 placeholder:text-zinc-400 px-2 outline-none focus:border-zinc-400"}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Footer action */}
                    <div className="mt-4">
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className={`w-full md:w-auto cursor-pointer font-medium px-4 py-2 rounded text-sm flex items-center justify-center gap-2 ${isDark ? "bg-white text-zinc-900 hover:bg-zinc-100" : "bg-[#696CFF] text-white hover:bg-[#5a5de6]"} ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            <span>{loading ? "Starting..." : "Start Lecture"}</span>
                        </button>
                    </div>
                </main>
            </div >
        </div >
    );
}

export default AddLecture;