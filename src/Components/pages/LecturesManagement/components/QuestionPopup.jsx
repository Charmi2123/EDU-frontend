import React, { useState, useEffect, useRef } from 'react';
import { X, SendHorizontal } from 'lucide-react';

function QuestionPopup({ isOpen, onResponse, onClose }) {
    const [transcript, setTranscript] = useState('');
    const [timeLeft, setTimeLeft] = useState(15);
    const [hasDetectedYes, setHasDetectedYes] = useState(false);
    const recognitionRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            setTranscript('');
            setTimeLeft(15);
            setHasDetectedYes(false);
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            return;
        }

        // Start voice recognition
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'en-IN';

            recognition.onresult = (event) => {
                let text = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    text += event.results[i][0].transcript;
                }
                text = text.toLowerCase().trim();
                setTranscript(text);

                if (event.results[event.results.length - 1].isFinal) {
                    const yesKeywords = ["yes", "ha", "haan", "haa", "yeah", "yep", "hmm"];
                    const noKeywords = ["no", "nahi", "na", "next", "nope"];

                    // Check for Yes/No responses
                    const isYesResponse = yesKeywords.some(kw => text === kw || text.startsWith(kw + " ") || text.endsWith(" " + kw));
                    const isNoResponse = noKeywords.some(kw => text === kw || text.startsWith(kw + " ") || text.endsWith(" " + kw));

                    if (isYesResponse) {
                        // ✅ "Yes" - Send current transcript to chatbot (or just open chatbot if no question)
                        setHasDetectedYes(true);
                        if (recognitionRef.current) {
                            try { recognitionRef.current.stop(); } catch (e) { }
                        }
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                        }
                        // Send transcript if it contains more than just "yes"
                        // Remove the yes keyword from the text to get the actual question
                        const questionPart = text.replace(/^(yes|ha|haan|haa|yeah|yep|hmm)\s*/i, '').trim();
                        if (questionPart.length > 3) {
                            onResponse(questionPart);  // Send the question part
                        } else {
                            onResponse('YES');  // Just open chatbot
                        }
                    } else if (isNoResponse) {
                        // ❌ "No" - Close popup, resume lecture, DON'T send text
                        if (recognitionRef.current) {
                            try { recognitionRef.current.stop(); } catch (e) { }
                        }
                        if (timerRef.current) {
                            clearInterval(timerRef.current);
                        }
                        onResponse('NO');
                    }
                    // ✅ Any other text just gets displayed but NOT auto-sent
                    // User must say "Yes" to confirm sending
                }
            };

            recognition.onerror = (event) => {
                console.error('Recognition error:', event.error);
            };

            try {
                recognition.start();
                recognitionRef.current = recognition;
            } catch (e) {
                console.error('Failed to start recognition:', e);
            }
        }

        // Start countdown timer - when time expires, treat as "NO"
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    onResponse('NO');  // ✅ Timer expiry = NO (close popup, resume lecture)
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isOpen, onResponse]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Do you have any questions?</h3>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center animate-pulse ${hasDetectedYes ? 'bg-green-500' : 'bg-red-500'}`}>
                            <div className="w-4 h-4 rounded-full bg-white"></div>
                        </div>
                    </div>

                    {transcript && (
                        <div className="p-4 bg-gray-100 rounded-lg mb-4">
                            <p className="text-gray-800 text-center">{transcript}</p>
                        </div>
                    )}

                    <p className="text-center text-gray-600 text-sm">
                        {hasDetectedYes
                            ? 'Sending to chatbot...'
                            : `Speak your question, then say "Yes" to send • ${timeLeft}s`}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onResponse('NO')}
                        className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-semibold hover:bg-gray-300 transition-colors"
                    >
                        No, Continue
                    </button>
                    <button
                        onClick={() => {
                            // ✅ Send transcript if available, otherwise just open chatbot
                            if (transcript && transcript.trim().length > 3) {
                                // Remove yes/no keywords from transcript before sending
                                const cleanText = transcript.replace(/^(yes|ha|haan|haa|yeah|yep|hmm|no|nahi|na|next|nope)\s*/i, '').trim();
                                if (cleanText.length > 3) {
                                    onResponse(cleanText);
                                } else {
                                    onResponse('YES');
                                }
                            } else {
                                onResponse('YES');
                            }
                        }}
                        className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors"
                    >
                        Yes, Send
                    </button>
                </div>
            </div>
        </div>
    );
}

export default QuestionPopup;
