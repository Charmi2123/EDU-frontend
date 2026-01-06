import React from "react";
import { CloudUpload } from "lucide-react";
import Sidebar from "../../Tools/Sidebar";
import Header from "../../Tools/Header";
import { NavLink } from "react-router-dom";
function AddChapter({ isDark, toggleTheme, sidebardata, backto }) {

    return (
        <div
            className={`flex ${isDark ? "bg-black text-white" : "bg-zinc-50 text-zinc-900"
                } h-screen overflow-hidden transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-20 lg:ml-72 p-6 pb-0 transition-all duration-300">
                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Add Chapter"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Content */}
                <main
                    className={`mt-6 flex-1 transition-colors duration-300 ${isDark ? "bg-black" : "bg-zinc-50"
                        }`}
                >
                    <div
                        className={`overflow-y-auto no-scrollbar md:max-h-[calc(100vh-160px)] max-h-[calc(100vh-160px)] max-w-5xl mx-auto w-full rounded-xl ${isDark ? "border border-zinc-800 bg-zinc-900" : "shadow-sm bg-white"} p-6 pt-0 space-y-6 relative`}
                    >
                        {/* Header */}
                        {/* <div className="sticky -top-px z-10 flex justify-between items-center border-b sm:border-zinc-400 md:border-zinc-700 pb-4"> */}
                        <div
                            className={`sticky top-0 z-40 -mx-6 px-6 flex justify-between items-center py-4 ${isDark ? "bg-zinc-900" : "bg-white"} ${isDark ? 'border-b border-zinc-800' : 'border-b border-zinc-200'}`}
                        >

                            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-[#696CFF]'}`}>Uploaded Videos</h2>
                            <div className="space-x-3">
                                <NavLink
                                    to={backto}
                                    className={`px-4 py-2 rounded-md text-sm cursor-pointer ${isDark
                                        ? "bg-zinc-800 text-gray-300 border border-zinc-700 hover:bg-zinc-700"
                                        : "bg-white text-zinc-700 border border-zinc-300 hover:bg-zinc-100"
                                        }`}
                                >
                                    Cancel
                                </NavLink>
                                <button className={`px-4 py-2 rounded-md text-sm cursor-pointer ${isDark ? 'bg-white text-black hover:bg-zinc-100' : 'bg-[#696CFF] text-white hover:bg-[#5a5fe8]'}`}>
                                    Save
                                </button>

                            </div>
                        </div>

                        {/* Upload Video Section */}
                        <div className="space-y-2">
                            <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Upload Video</label>
                            <div
                                onClick={() => document.getElementById("video-upload").click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file && file.type === "video/mp4") {
                                        console.log("Uploaded file:", file);
                                    } else {
                                        alert("Only MP4 files are allowed!");
                                    }
                                }}
                                className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDark
                                    ? "border-blue-500/60 bg-zinc-800 hover:bg-zinc-800/70"
                                    : "border-[#696CFF33] bg-[#696CFF0D] hover:bg-[#696CFF1A]"
                                    }`}
                            >
                                <CloudUpload className="mx-auto h-5 w-5 text-blue-500" />
                                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-[#696CFF]'}`}>
                                    <span className="text-blue-500/60">Click to upload </span>
                                    or drag and drop
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>MP4 only</p>

                                {/* hidden input */}
                                <input
                                    id="video-upload"
                                    type="file"
                                    required
                                    accept="video/mp4"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file && file.type === "video/mp4") {
                                            console.log("Uploaded file:", file);
                                        } else {
                                            alert("Only MP4 files are allowed!");
                                            e.target.value = "";
                                        }
                                    }}
                                />
                            </div>
                        </div>


                        {/* Video Title */}
                        <div className="space-y-2">
                            <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Video Title</label>
                            <input
                                type="text"
                                required
                                placeholder="Enter Video Title"
                                className={`w-full px-4 py-2 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#696CFF] ${isDark
                                    ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                    : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                    }`}
                            />
                        </div>

                        {/* Class / Size */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Class</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Class"
                                    className={`w-full px-4 py-2 rounded-md text-sm ${isDark
                                        ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                        : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>
                                    Size Of Video (In MB Or GB)
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Size Of Video"
                                    className={`w-full px-4 py-2 rounded-md text-sm ${isDark
                                        ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                        : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Subject / Chapter */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Subject"
                                    className={`w-full px-4 py-2 rounded-md text-sm ${isDark
                                        ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                        : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>
                                    Chapter Name And Number
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Chapter Name And Number"
                                    className={`w-full px-4 py-2 rounded-md text-sm ${isDark
                                        ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                        : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Topic / Duration */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Topic</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Topic"
                                    className={`w-full px-4 py-2 rounded-md text-sm ${isDark
                                        ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                        : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                        }`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Video Time Duration</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter Video Time Duration"
                                    className={`w-full px-4 py-2 rounded-md text-sm ${isDark
                                        ? "border border-zinc-700 bg-zinc-800 text-gray-200 placeholder-gray-500"
                                        : "bg-zinc-50 text-zinc-800 placeholder-zinc-400"
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Cover Photo */}
                        <div className="space-y-2">
                            <label className={`text-sm block ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>Upload Image</label>
                            <div
                                onClick={() => document.getElementById("image-upload").click()}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files[0];
                                    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
                                        console.log("Uploaded file:", file);
                                    } else {
                                        alert("Only PNG or JPG images are allowed!");
                                    }
                                }}
                                className={`border-2 border-dashed rounded-md p-8 text-center cursor-pointer ${isDark
                                    ? "border-blue-500/60 bg-zinc-800 hover:bg-zinc-800/70"
                                    : "border-[#696CFF33] bg-[#696CFF0D] hover:bg-[#696CFF1A]"
                                    }`}
                            >
                                <CloudUpload className="mx-auto h-5 w-5 text-blue-500" />
                                <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-[#696CFF]'}`}>
                                    <span className="text-blue-500/60">Click to upload </span>
                                    or drag and drop
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-zinc-500'}`}>PNG, JPG only</p>

                                {/* hidden input */}
                                <input
                                    id="image-upload"
                                    required
                                    type="file"
                                    accept="image/png, image/jpeg"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
                                            console.log("Uploaded file:", file);
                                        } else {
                                            alert("Only PNG or JPG images are allowed!");
                                            e.target.value = "";
                                        }
                                    }}
                                />
                            </div>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}

export default AddChapter;
