import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Mic, Send, MessageSquare, Play, X, User, Bot, Loader2 } from 'lucide-react';

const TalkingHeadLecture = () => {
    const iframeRef = useRef(null);
    const recognitionRef = useRef(null);

    // Get Lecture ID from Route Params (/:lectureId) or Query Params (?lectureId=...)
    const { lectureId: paramId } = useParams();
    const [searchParams] = useSearchParams();
    const lectureId = paramId || searchParams.get("lectureId") || "22";

    // State Management
    const [isStarted, setIsStarted] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, playing, qna, chat
    const [qnaTimer, setQnaTimer] = useState(5);
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! If you have any questions about the slide, feel free to ask.", sender: 'system' }
    ]);
    const [currentMessage, setCurrentMessage] = useState("");
    const [micActive, setMicActive] = useState(false);
    const [isBotTyping, setIsBotTyping] = useState(false);

    // Construct Iframe URL using the resolved lectureId
    const iframeUrl = `https://mzhyi8c6omxn.id.wasmer.app/?lectureId=${lectureId}`;

    // --- Communication with Unity Iframe ---
    const sendMessageToUnity = (type, payload = {}) => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type, payload }, "*");
        }
    };

    // Handle Messages from Unity
    useEffect(() => {
        const handleMessage = (event) => {
            // We use '*' for flexibility as the iframe domain might be dynamic or redirected
            const { type } = event.data;

            if (type === "SLIDE_ENDED") {
                console.log("React: Slide Ended received");
                startQnAPhase();
            } else if (type === "RECORDING_STARTED") {
                // Recording started confirmation
            }
        };

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    }, []);

    // --- Logic Flows ---

    const handleStart = () => {
        setIsStarted(true);
        setStatus('playing');
        sendMessageToUnity("START_SESSION");
        sendMessageToUnity("START_RECORDING");
    };

    const startQnAPhase = () => {
        setStatus('qna');
        setQnaTimer(5);
        // Pause recording so Q&A isn't recorded in the main lecture video
        sendMessageToUnity("PAUSE_RECORDING");
    };

    // Timer Logic for Q&A
    useEffect(() => {
        let interval;
        if (status === 'qna' && qnaTimer > 0) {
            interval = setInterval(() => {
                setQnaTimer((prev) => prev - 1);
            }, 1000);
        } else if (status === 'qna' && qnaTimer === 0) {
            handleContinueLecture();
        }
        return () => clearInterval(interval);
    }, [status, qnaTimer]);

    const handleEnterChat = () => {
        setStatus('chat');
        // Resume/Start interaction
        sendMessageToUnity("PAUSE_RECORDING");
    };

    const handleContinueLecture = () => {
        setStatus('playing');
        sendMessageToUnity("RESUME_RECORDING");
        sendMessageToUnity("NEXT_SLIDE");
    };

    // --- Voice Logic (Web Speech API) ---
    // This replaces the OpenAI API call to avoid 429 errors and reduce latency
    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setMicActive(true);
            recognition.onend = () => setMicActive(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setCurrentMessage(transcript);
                }
            };

            recognitionRef.current = recognition;
        }
    }, []);

    const toggleMic = () => {
        if (!recognitionRef.current) {
            alert("Speech recognition not supported in this browser");
            return;
        }

        if (micActive) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const handleSendMessage = () => {
        if (!currentMessage.trim()) return;

        const newMessage = { id: Date.now(), text: currentMessage, sender: 'user' };
        setMessages(prev => [...prev, newMessage]);
        setCurrentMessage("");
        setIsBotTyping(true);

        // Simulate Bot Response
        // In a real app, this would call your backend AI service
        setTimeout(() => {
            setIsBotTyping(false);
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "That is an excellent question. Based on the current module, this concept is crucial for understanding the overall architecture.",
                sender: 'system'
            }]);
        }, 2000);
    };

    return (
        <div className="w-screen h-screen overflow-hidden relative bg-black font-sans">

            {/* 1. The Unity Iframe */}
            <iframe
                ref={iframeRef}
                src={iframeUrl}
                className="w-full h-full border-none block"
                allow="autoplay; microphone; camera; display-capture"
                title="Lecture Content"
            />

            {/* 2. Start Overlay */}
            {!isStarted && (
                <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-sm">
                    <button
                        onClick={handleStart}
                        className="group flex items-center gap-4 px-10 py-5 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all transform hover:scale-105 shadow-2xl hover:shadow-green-500/50"
                    >
                        <Play size={32} fill="currentColor" />
                        <span className="text-2xl font-bold tracking-wide">Start Lecture</span>
                    </button>
                    <p className="mt-6 text-white/60 text-sm font-medium tracking-wider uppercase">
                        Interactive Session • Recording Enabled
                    </p>
                </div>
            )}

            {/* 3. Q&A Prompt Overlay (5s Timer) */}
            {status === 'qna' && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30 animate-in fade-in duration-300 backdrop-blur-sm">
                    <div className="bg-[#1e1e1e] p-10 rounded-3xl text-center max-w-lg w-[90%] border border-white/10 shadow-2xl transform transition-all">
                        <h2 className="text-3xl font-bold text-white mb-2">Any Questions?</h2>
                        <p className="text-gray-400 mb-8">We can pause for a moment.</p>

                        {/* Progress Bar */}
                        <div className="w-full h-1 bg-gray-800 rounded-full mb-8 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 transition-all ease-linear duration-1000"
                                style={{ width: `${(qnaTimer / 5) * 100}%` }}
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={handleEnterChat}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
                            >
                                <MessageSquare size={20} />
                                Yes, Ask Question
                            </button>
                            <button
                                onClick={handleContinueLecture}
                                className="px-8 py-3 bg-transparent border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-xl font-medium transition-colors"
                            >
                                No, Continue ({qnaTimer}s)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Chat Interface Overlay */}
            {status === 'chat' && (
                <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-40 p-4 animate-in zoom-in-95 duration-200 backdrop-blur-md">
                    <div className="w-full max-w-4xl h-[85vh] bg-[#121212] rounded-3xl overflow-hidden flex flex-col border border-white/10 shadow-2xl">
                        {/* Header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
                            <div className="flex items-center gap-3">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <div>
                                    <h3 className="text-white font-bold text-lg">AI Assistant</h3>
                                    <p className="text-xs text-green-400 uppercase tracking-wider font-semibold">Recording Paused</p>
                                </div>
                            </div>
                            <button
                                onClick={handleContinueLecture}
                                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-white/10"
                            >
                                <span className="text-sm font-medium">Close & Resume</span>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 scroll-smooth">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-4 max-w-[80%] ${msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-[#2a2a2a] border border-white/10'}`}>
                                        {msg.sender === 'user' ? <User size={18} className="text-white" /> : <Bot size={18} className="text-green-500" />}
                                    </div>
                                    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-md ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-[#2a2a2a] text-gray-100 border border-white/5 rounded-tl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isBotTyping && (
                                <div className="flex gap-4 max-w-[80%] self-start">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-[#2a2a2a] border border-white/10">
                                        <Bot size={18} className="text-green-500" />
                                    </div>
                                    <div className="bg-[#2a2a2a] p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-5 bg-[#1a1a1a] border-t border-white/10">
                            <div className="flex items-center gap-3 bg-[#2a2a2a] p-2 pr-2 rounded-full border border-white/10 transition-colors focus-within:border-blue-500/50 focus-within:bg-[#303030]">
                                <button
                                    onClick={toggleMic}
                                    className={`p-3 rounded-full transition-all ${micActive
                                        ? 'bg-red-500/20 text-red-500 animate-pulse'
                                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    <Mic size={20} />
                                </button>
                                <input
                                    type="text"
                                    value={currentMessage}
                                    onChange={(e) => setCurrentMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-transparent border-none text-white text-base focus:ring-0 placeholder:text-gray-500"
                                />
                                <button
                                    onClick={handleSendMessage}
                                    disabled={!currentMessage.trim()}
                                    className={`p-3 rounded-full transition-all ${currentMessage.trim()
                                        ? 'bg-blue-600 text-white shadow-lg hover:bg-blue-700 transform hover:scale-105'
                                        : 'bg-transparent text-gray-600 cursor-not-allowed'
                                        }`}
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TalkingHeadLecture;