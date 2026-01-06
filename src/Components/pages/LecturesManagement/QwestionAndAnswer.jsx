import React, { useState } from "react";
import Sidebar from "../../Tools/Sidebar.jsx";
import Header from "../../Tools/Header.jsx";
import { getAsset } from "../../../utils/assets.js";

function QwestionAndAnswer({ theme, isDark, toggleTheme, sidebardata }) {
    const [items, setItems] = useState([
        {
            id: 1,
            question: "What is AI history ?",
            answer:
                "Answer - Reinforcement learning is a branch of machine learning where an agent learns to make decisions by interacting with an environment, receiving rewards or penalties based on its actions, and optimizing its strategy over time.",
            open: false,
        },
        {
            id: 2,
            question: "What is AI history ?",
            answer:
                "Reinforcement learning is a branch of machine learning where an agent learns to make decisions by interacting with an environment, receiving rewards or penalties based on its actions.",
            open: false,
        },
        {
            id: 3,
            question: "What is AI history ?",
            answer:
                "Agents learn policies that maximize cumulative reward across episodes.",
            open: false,
        },
        {
            id: 4,
            question: "What is AI history ?",
            answer:
                "Common algorithms include Q-learning, SARSA, policy gradients, and actor-critic methods.",
            open: false,
        },
        {
            id: 5,
            question: "What is AI history ?",
            answer:
                "Use cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, gameUse cases span robotics, recommender systems, game playing, and operations research.",

            open: false,
        },
    ]);

    const toggleItem = (id) => {
        setItems((prev) =>
            prev.map((it) => (it.id === id ? { ...it, open: !it.open } : it))
        );
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
                <main className="mt-6 flex-1 flex flex-col min-h-0 mb-6">
                    {/* Top action bar (Start New Lecture + actions) */}
                    <div className={`w-full rounded ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"} px-3 py-2 md:px-4 md:py-3 text-sm md:text-base flex items-center justify-between mb-5`}>
                        <span className={`cursor-default px-3 py-1.5 rounded font-inter font-medium text-[18px] leading-[100%] capitalize ${isDark ? "text-gray-200" : " text-zinc-800"}`}>
                            Qwestion And Answer
                        </span>
                    </div>

                    {/* ===== Q&A Card ===== */}
                    <section className="flex-1 min-h-0">
                        <div className="w-full h-full">
                            <div className={`${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"} rounded-lg overflow-hidden h-full min-h-0 flex flex-col`}>
                                {/* Card header */}
                                <div className="px-4 py-3">
                                    <h3 className={`text-sm font-bold ${isDark ? "text-gray-200" : "text-zinc-900"}`}>Q&A</h3>
                                </div>
                                {/* List */}
                                <div className="px-2 pb-3 overflow-y-auto no-scrollbar flex-1 min-h-0">
                                    {items.map((it, idx) => (
                                        <div key={it.id} className={`rounded mb-2 ${isDark ? "bg-zinc-800" : "bg-zinc-50"} border ${isDark ? "border-zinc-700" : "border-zinc-200"}`}>
                                            <button
                                                className="cursor-pointer w-full flex items-center justify-between px-3 py-3 text-left"
                                                onClick={() => toggleItem(it.id)}
                                            >
                                                <span
                                                    className={`font-inter font-semibold text-[16px] leading-[100%] capitalize ${isDark ? "text-gray-200" : "text-zinc-800"
                                                        }`}
                                                >
                                                    {it.question}
                                                </span>

                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    className={`${it.open ? "rotate-180" : ""}`}
                                                    fill="none"
                                                >
                                                    <path d="M6 9l6 6 6-6" stroke={isDark ? "#d4d4d8" : "#3f3f46"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </button>
                                            {it.open && (
                                                <div className={`px-3 pb-3`}>
                                                    <div className={`${isDark ? "bg-zinc-800 border-none" : "bg-white border-zinc-200"} border rounded px-3 py-2 text-[15px] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                                                        {it.answer}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                </main>
            </div >
        </div >
    );
}

export default QwestionAndAnswer;