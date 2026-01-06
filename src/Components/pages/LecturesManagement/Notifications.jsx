// export default Notifications;
import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";

function Notifications({ isDark, toggleTheme, sidebardata }) {
    // डमी नोटिफिकेशन डेटा (Dummy Notification Data)
    const notifications = [
        "Lorem ipsum dolor sit amet consectetur. Morbi eget quis.",
        "Lorem ipsum dolor sit amet consectetur. Lectus cursus tellus.",
        "Lorem ipsum dolor sit amet consectetur. Pulvinar etiam amet.",
        "Lorem ipsum dolor sit amet consectetur. Ornare pretium nec.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Pulvinar etiam amet.",
        "Lorem ipsum dolor sit amet consectetur. Ornare pretium nec.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Ornare pretium nec.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Ornare pretium nec.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Ornare pretium nec.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",
        "Lorem ipsum dolor sit amet consectetur. Vitae libero massa.",

    ];

    return (
        <div
            // h-screen (100vh) का उपयोग बाहरी कंटेनर पर
            className={`flex ${isDark ? "bg-zinc-950 text-gray-100" : "bg-zinc-50 text-zinc-900"} h-screen overflow-hidden transition-colors duration-300`}
        >
            {/* Sidebar */}
            <Sidebar isDark={isDark} sidebardata={sidebardata} />

            {/* Main Section */}
            <div className="flex flex-col min-h-0 h-screen w-full md:ml-15 lg:ml-72 p-2 md:p-6 pb-0 transition-all duration-300">

                {/* Header */}
                <div className="sticky top-0 z-20">
                    <Header
                        title="Lecture Management"
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>

                {/* Main Content */}
                <main
                    // flex-1 यह सुनिश्चित करता है कि यह बची हुई सारी वर्टिकल स्पेस ले ले
                    className={`mt-6 mb-6 flex-1 min-h-0 overflow-hidden transition-colors duration-300 ${isDark ? "bg-zinc-950" : "bg-zinc-50"}`}
                >
                    <div
                        className={`flex flex-col min-h-0 flex-1 ${isDark ? "bg-zinc-950 text-gray-200" : "bg-white text-zinc-800"}`}
                    >
                        <div className={`w-full max-w-7xl rounded p-4 md:px-8 lg:px-8 flex-1 min-h-0 flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-zinc-900' : 'bg-white'}`}>
                            <h2 className={`${isDark ? 'text-white' : 'text-zinc-800'} text-xl font-semibold mb-4`}>Notification</h2>

                            {/* Header Row */}
                            <div className={`grid grid-cols-[60px_1fr] text-sm font-medium py-2 px-4 rounded shrink-0 ${isDark ? 'bg-zinc-800 text-gray-400' : 'bg-zinc-100 text-zinc-600'}`}>
                                <span>No.</span>
                                <span>Notification</span>
                            </div>

                            <div className="h-[70vh] overflow-y-auto overflow-x-hidden no-scrollbar mt-2">
                                {notifications.map((notification, index) => (
                                    <div
                                        key={index}
                                        className={`grid grid-cols-[60px_1fr] items-center px-4 py-3 rounded transition-colors duration-200 ${isDark
                                            ? `${index % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-800'} text-gray-300 hover:bg-zinc-700`
                                            : `${index % 2 === 0 ? 'bg-white' : 'bg-zinc-100'} text-zinc-700 hover:bg-zinc-200`
                                            }`}
                                    >
                                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-600'}`}>{index + 1}.</span>
                                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-zinc-700'}`}>
                                            {notification}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Notifications;