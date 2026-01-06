import React from 'react';
import { Mic, X } from 'lucide-react';

function VoiceOverlay({ isVoiceProcessing, currentMessage, isDark, onClose }) {
    if (!isVoiceProcessing) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-zinc-900" : "bg-white"
                }`}>

                {/* Close Button */}
                {onClose && (
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer z-10 ${isDark
                                ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                                : "hover:bg-zinc-100 text-zinc-500 hover:text-black"
                            }`}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                )}

                {/* Main Content */}
                <div className="p-8 pt-10">
                    {/* Listening Text */}
                    <h2 className={`text-xl font-semibold mb-6 ${isDark ? "text-white" : "text-zinc-900"
                        }`}>
                        Listening...
                    </h2>

                    {/* Transcript Area */}
                    <div className={`min-h-[100px] mb-8 p-4 rounded-xl ${isDark ? "bg-zinc-800/50" : "bg-zinc-100"
                        }`}>
                        {currentMessage ? (
                            <p className={`text-lg leading-relaxed ${isDark ? "text-white" : "text-zinc-800"
                                }`}>
                                "{currentMessage}"
                            </p>
                        ) : (
                            <p className={`text-base italic ${isDark ? "text-zinc-500" : "text-zinc-400"
                                }`}>
                                Say something...
                            </p>
                        )}
                    </div>

                    {/* Mic Icon - Centered */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            {/* Pulsing rings */}
                            <div className="absolute inset-0 -m-2 w-24 h-24 rounded-full bg-red-500/20 animate-ping" style={{ animationDuration: '1.5s' }}></div>
                            <div className="absolute inset-0 -m-1 w-22 h-22 rounded-full bg-red-500/30 animate-pulse"></div>

                            {/* Main mic button */}
                            <div className="relative w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40 cursor-pointer hover:bg-red-600 transition-colors">
                                <Mic className="w-8 h-8 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Hints */}
                    <div className="text-center space-y-2">
                        <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                            <span className="inline-flex items-center gap-1">
                                <span className="font-semibold text-green-500">"Yes"</span>
                                <span>or</span>
                                <span className="font-semibold text-green-500">"Haan"</span>
                            </span>
                            {' '}- Ask a question
                        </p>
                        <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                            <span className="inline-flex items-center gap-1">
                                <span className="font-semibold text-blue-500">"No"</span>
                                <span>or</span>
                                <span className="font-semibold text-blue-500">"Next"</span>
                            </span>
                            {' '}- Continue lecture
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VoiceOverlay;
