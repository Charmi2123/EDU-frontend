import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Send } from 'lucide-react';

/**
 * QuestionPopup Component
 * 
 * COMPLETELY SEPARATE from Chatbot. This popup:
 * 1. Opens ONLY when "Do you have any questions?" is asked
 * 2. Accepts voice OR text input
 * 3. Detects keywords: yes/haan/ha → pause | no/next → continue
 * 4. Has 10 second timeout
 * 5. Sends response to iframe for decision (NOT to chatbot)
 */
function QuestionPopup({
    isOpen,
    onResponse,
    onClose,
    isDark,
    timeoutSeconds = 12
}) {
    // Local state - COMPLETELY SEPARATE from chatbot
    const [inputText, setInputText] = useState('');
    const [micStatus, setMicStatus] = useState('idle'); // 'idle', 'listening', 'denied'
    const [timeRemaining, setTimeRemaining] = useState(timeoutSeconds);
    const [transcript, setTranscript] = useState('');

    // Separate recognition instance for question popup
    const recognitionRef = useRef(null);
    const timeoutRef = useRef(null);
    const countdownRef = useRef(null);

    // Keywords for decision
    const YES_KEYWORDS = ['yes', 'haan', 'ha', 'haa', 'yeah', 'yep', 'sure', 'okay', 'ok', 'question', 'doubt'];
    const NO_KEYWORDS = ['no', 'nope', 'nahi', 'na', 'next', 'continue', 'skip', 'nothing', 'no question'];

    // Start countdown and auto-close timer when popup opens
    useEffect(() => {
        if (isOpen) {
            setTimeRemaining(timeoutSeconds);
            setInputText('');
            setTranscript('');

            // Start countdown
            countdownRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Auto-close after timeout
            timeoutRef.current = setTimeout(() => {
                console.log('⏱️ Question popup timeout - auto continuing');
                handleResponse('TIMEOUT');
            }, timeoutSeconds * 1000);

            // Auto-start mic
            startQuestionMic();
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            stopQuestionMic();
        };
    }, [isOpen]);

    // Check for keywords in text
    const checkKeywords = (text) => {
        const lowerText = text.toLowerCase().trim();

        if (YES_KEYWORDS.some(kw => lowerText.includes(kw))) {
            return 'YES';
        }
        if (NO_KEYWORDS.some(kw => lowerText.includes(kw))) {
            return 'NO';
        }
        return null;
    };

    // Handle response (YES/NO/TIMEOUT)
    const handleResponse = (response) => {
        console.log('📤 Question popup response:', response);

        // Clear timers
        if (countdownRef.current) clearInterval(countdownRef.current);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Stop mic
        stopQuestionMic();

        // Send response to parent
        onResponse(response);
    };

    // Start mic for question popup (SEPARATE from chatbot mic)
    const startQuestionMic = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported');
            setMicStatus('denied');
            return;
        }

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-IN';
            recognition.continuous = true;
            recognition.interimResults = true;
            recognitionRef.current = recognition;

            recognition.onstart = () => {
                console.log('🎤 Question popup mic started');
                setMicStatus('listening');
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                let interimTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const result = event.results[i];
                    if (result.isFinal) {
                        finalTranscript += result[0].transcript;
                    } else {
                        interimTranscript += result[0].transcript;
                    }
                }

                const currentTranscript = finalTranscript || interimTranscript;
                setTranscript(currentTranscript);
                setInputText(currentTranscript);

                // Check keywords on final result
                if (finalTranscript) {
                    console.log('🎤 Final transcript:', finalTranscript);
                    const keyword = checkKeywords(finalTranscript);
                    if (keyword) {
                        handleResponse(keyword);
                    }
                }
            };

            recognition.onerror = (event) => {
                console.error('🎤 Question mic error:', event.error);
                if (event.error === 'not-allowed') {
                    setMicStatus('denied');
                }
            };

            recognition.onend = () => {
                console.log('🎤 Question mic ended');
                // Restart if still open
                if (isOpen && micStatus === 'listening') {
                    try {
                        recognition.start();
                    } catch (e) {
                        console.warn('Could not restart recognition');
                    }
                }
            };

            recognition.start();
        } catch (e) {
            console.error('Failed to start question mic:', e);
            setMicStatus('denied');
        }
    };

    // Stop question mic
    const stopQuestionMic = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
            recognitionRef.current = null;
        }
        setMicStatus('idle');
    };

    // Toggle mic
    const toggleMic = () => {
        if (micStatus === 'listening') {
            stopQuestionMic();
        } else {
            startQuestionMic();
        }
    };

    // Handle text submit
    const handleTextSubmit = () => {
        if (inputText.trim()) {
            const keyword = checkKeywords(inputText);
            if (keyword) {
                handleResponse(keyword);
            } else {
                // Default to YES if typed something that's not recognized
                handleResponse('no');
            }
        }
    };

    // Handle key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleTextSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
            <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-2xl overflow-hidden ${isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
                }`}>

                {/* Close Button */}
                <button
                    onClick={() => handleResponse('NO')}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer z-10 ${isDark
                        ? "hover:bg-zinc-800 text-zinc-400 hover:text-white"
                        : "hover:bg-zinc-100 text-zinc-500 hover:text-black"
                        }`}
                    aria-label="Close"
                >
                    <X size={20} />
                </button>

                {/* Main Content */}
                <div className="p-6 pt-8">
                    {/* Title */}
                    <h2 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-zinc-900"
                        }`}>
                        Do you have any questions?
                    </h2>

                    {/* Countdown */}
                    <p className={`text-sm mb-4 ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                        Auto-continue in <span className="font-bold text-red-500">{timeRemaining}s</span>
                    </p>

                    {/* Transcript Display */}
                    <div className={`min-h-[60px] mb-4 p-3 rounded-xl ${isDark ? "bg-zinc-800/50" : "bg-zinc-100"
                        }`}>
                        {transcript ? (
                            <p className={`text-base ${isDark ? "text-white" : "text-zinc-800"}`}>
                                "{transcript}"
                            </p>
                        ) : (
                            <p className={`text-sm italic ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                                {micStatus === 'listening' ? 'Listening...' : 'Speak or type your response'}
                            </p>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="flex items-center gap-3 mb-4">
                        {/* Mic Button */}
                        <button
                            onClick={toggleMic}
                            className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full transition-all ${micStatus === 'listening'
                                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                                : micStatus === 'denied'
                                    ? 'bg-zinc-300 text-zinc-400 cursor-not-allowed'
                                    : isDark
                                        ? 'bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700'
                                        : 'bg-zinc-100 text-zinc-500 hover:text-black hover:bg-zinc-200'
                                }`}
                            disabled={micStatus === 'denied'}
                        >
                            {micStatus === 'denied' ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>

                        {/* Text Input */}
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type your response..."
                            className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-colors ${isDark
                                ? "bg-zinc-800 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-600"
                                : "bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-400"
                                }`}
                        />

                        {/* Submit Button */}
                        <button
                            onClick={handleTextSubmit}
                            disabled={!inputText.trim()}
                            className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-full transition-all ${inputText.trim()
                                ? 'bg-green-500 hover:bg-green-600 text-white cursor-pointer'
                                : isDark
                                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                                }`}
                        >
                            <Send size={18} />
                        </button>
                    </div>

                    {/* Quick Response Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleResponse('YES')}
                            className="flex-1 py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
                        >
                            Yes, I have a question
                        </button>
                        <button
                            onClick={() => handleResponse('NO')}
                            className="flex-1 py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
                        >
                            No, continue
                        </button>
                    </div>

                    {/* Keywords Hint */}
                    <p className={`text-xs text-center mt-4 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                        Say <span className="text-green-500 font-medium">"Yes"</span> or <span className="text-green-500 font-medium">"Haan"</span> to ask a question
                        <br />
                        Say <span className="text-blue-500 font-medium">"No"</span> or <span className="text-blue-500 font-medium">"Next"</span> to continue
                    </p>
                </div>
            </div>
        </div>
    );
}

export default QuestionPopup;
