import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { useLocation, useNavigate } from "react-router-dom";
import { CloudUpload, ArrowLeft } from "lucide-react";
import axios from "axios";
import { BACKEND_API_URL, handlesuccess, handleerror } from "../../../utils/assets.js";

function CoverPage({ theme = "dark", isDark: isDarkProp, toggleTheme, sidebardata, backto = "/chapter/AllChapters" }) {
    const isDark = typeof isDarkProp === "boolean" ? isDarkProp : theme === "dark";

    const [videoUrl, setVideoUrl] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Default thumbnail removed to match "empty box" look from design, 
    // or can be used if video is actually uploaded. 
    // For now, initializing videoUrl as null results in empty box.

    const handleVideoFile = (file) => {
        if (!file) return;
        if (file.type !== "video/mp4") {
            // alert("Only MP4 files are allowed!"); 
            // In a real app better to use toast, avoiding alert to be perfectly purely UI focused
            return;
        }
        const url = URL.createObjectURL(file);
        setVideoUrl(url);
    };

    const handleCoverFile = (file) => {
        if (!file) return;
        if (!(file.type === "image/png" || file.type === "image/jpeg")) {
            handleerror("Only PNG or JPG images are allowed!");
            return;
        }
        setCoverFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!coverFile) {
            handleerror("Please upload a cover photo first!");
            return;
        }

        // Get lecture_id from localStorage (assuming it's stored there)
        const lectureId = location.state?.lectureId;
        if (!lectureId) {
            handleerror("Lecture ID not found. Please try again.");
            return;
        }

        setIsUploading(true);
        try {
            const token = localStorage.getItem('access_token');
            const formData = new FormData();
            formData.append('cover_photo', coverFile);

            const response = await axios.post(
                `${BACKEND_API_URL}/chapter-materials/lectures/${lectureId}/cover-photo`,
                formData,
                {
                    headers: {
                        'Accept': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                }
            );

            if (response.data) {
                handlesuccess("Cover photo uploaded successfully!");
                navigate('/chapter/Home');
            }
        } catch (error) {
            console.error("Error uploading cover photo:", error);
            handleerror(error.response?.data?.detail || "Failed to upload cover photo. Please try again.");
        } finally {
            setIsUploading(false);
        }
    };

    // Card style - white on light mode, dashed borders inside
    const cardCls = `${isDark ? "bg-zinc-900" : "bg-white"} rounded-2xl p-6 transition-colors duration-200`;

    return (
        <div className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-[#F5F5F9] text-zinc-900"} h-screen overflow-hidden transition-colors duration-300`}>
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header title="Chapter Management" isDark={isDark} toggleTheme={toggleTheme} />
                </div>

                {/* Scrollable content */}
                <main className="mt-4 flex-1 overflow-y-auto no-scrollbar">
                    <div className="w-full mx-auto space-y-4">

                        {/* Preview Back Button */}
                        <div className={`rounded-lg px-4 py-3 ${isDark ? "bg-zinc-900" : "bg-white"}`}>
                            <div className={`${isDark ? 'text-white' : 'text-zinc-900'} text-md font-semibold flex items-center`}>
                                <button
                                    onClick={() => navigate(-1)}
                                    className={`mr-3 rounded-full transition-all cursor-pointer ${isDark ? 'text-gray-200 hover:text-white' : 'text-zinc-800 hover:text-zinc-900'}`}
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <h2 className={`text-md font-semibold transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-[#696CFF]'}`}>
                                    Upload Chapter
                                </h2>
                            </div>
                        </div>

                        {/* Main Card */}
                        <div className={cardCls}>
                            <div className="space-y-8">
                                {/* Uploaded Video */}
                                <div className="space-y-3">
                                    <label className={`text-sm font-medium block ${isDark ? "text-gray-300" : "text-[#141522]"}`}>
                                        Uploaded Video
                                    </label>
                                    <div
                                        className={`border border-dashed rounded-lg h-48 w-full flex items-center justify-center transition-colors duration-200 ${isDark
                                            ? "border-[#696CFF]/40 bg-zinc-950/30"
                                            : "border-[#696CFF]/40 bg-[#F5F5F9]"
                                            }`}
                                    >
                                        {videoUrl ? (
                                            <video
                                                src={videoUrl}
                                                controls
                                                className="h-full w-full rounded-lg object-contain bg-black"
                                            />
                                        ) : location.state?.lectureId ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const lectureId = location.state.lectureId;

                                                    // Open in new tab with lectureId in URL
                                                    window.open(`/chapter/lecture-priview?lectureId=${lectureId}`, '_blank');
                                                }}
                                                className={`px-8 py-3 rounded-lg text-sm font-medium cursor-pointer transition-all ${isDark
                                                    ? "bg-[#696CFF] text-white hover:bg-[#5f62e0] hover:shadow-lg"
                                                    : "bg-[#696CFF] text-white hover:bg-[#5f62e0] hover:shadow-lg"
                                                    }`}
                                            >
                                                Preview Lecture
                                            </button>
                                        ) : (
                                            /* Empty state to match design */
                                            <div className="w-full h-full"></div>
                                        )}
                                    </div>
                                </div>

                                {/* Cover Photo */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className={`text-sm font-medium block ${isDark ? "text-gray-300" : "text-[#141522]"}`}>
                                            Cover Photo
                                        </label>
                                        <button
                                            type="button"
                                            className={`min-w-[140px] px-6 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all ${isDark
                                                ? "bg-[#696CFF] text-white hover:bg-[#5f62e0]"
                                                : "bg-[#696CFF] text-white hover:bg-[#5f62e0]"
                                                }`}
                                        >
                                            Cover Photo By AI
                                        </button>
                                    </div>

                                    <div
                                        onClick={() => document.getElementById("cover-image-upload").click()}
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const file = e.dataTransfer.files[0];
                                            handleCoverFile(file);
                                        }}
                                        className={`border border-dashed rounded-lg h-48 w-full flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 ${isDark
                                            ? "border-[#696CFF]/40 bg-zinc-950/30 hover:bg-zinc-900"
                                            : "border-[#696CFF]/40 bg-[#F5F5F9]"
                                            }`}
                                    >
                                        {coverPreview ? (
                                            <div className="w-full h-full p-2">
                                                <img
                                                    src={coverPreview}
                                                    alt="Cover preview"
                                                    className="w-full h-full object-contain rounded-lg"
                                                />
                                            </div>
                                        ) : (
                                            <div className="text-center space-y-2">
                                                <CloudUpload className="mx-auto h-8 w-8 text-[#696CFF]" />
                                                <p className={`text-xs sm:text-sm ${isDark ? "text-gray-400" : "text-[#696CFF]"}`}>
                                                    <span className="font-medium">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-[10px] sm:text-xs text-gray-500 uppercase">
                                                    PNG, JPG
                                                </p>
                                            </div>
                                        )}

                                        {/* hidden input */}
                                        <input
                                            id="cover-image-upload"
                                            type="file"
                                            accept="image/png, image/jpeg"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                handleCoverFile(file);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Generate Button */}
                                <div className="pt-4 flex justify-center">
                                    <button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={isUploading}
                                        className={`min-w-[140px] px-6 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-all ${isDark
                                            ? "bg-[#696CFF] text-white hover:bg-[#5f62e0]"
                                            : "bg-[#696CFF] text-white hover:bg-[#5f62e0]"
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isUploading ? 'Uploading...' : 'Generate'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default CoverPage;
