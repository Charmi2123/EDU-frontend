import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Mic, SendHorizontal, Bot, User, GripVertical } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ✅ Helper function to render text with math expressions
const renderMathText = (text) => {
    if (!text) return null;

    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;

    const parts = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = mathRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(<span key={keyIndex++}>{text.slice(lastIndex, match.index)}</span>);
        }

        let mathContent = match[0];
        let displayMode = false;

        if (mathContent.startsWith('$$') && mathContent.endsWith('$$')) {
            displayMode = true;
            mathContent = mathContent.slice(2, -2);
        } else if (mathContent.startsWith('$') && mathContent.endsWith('$')) {
            mathContent = mathContent.slice(1, -1);
        } else if (mathContent.startsWith('\\[') && mathContent.endsWith('\\]')) {
            displayMode = true;
            mathContent = mathContent.slice(2, -2);
        } else if (mathContent.startsWith('\\(') && mathContent.endsWith('\\)')) {
            mathContent = mathContent.slice(2, -2);
        }

        try {
            const html = katex.renderToString(mathContent.trim(), {
                displayMode,
                throwOnError: false,
                strict: false,
                trust: true
            });
            parts.push(
                <span
                    key={keyIndex++}
                    dangerouslySetInnerHTML={{ __html: html }}
                    className={displayMode ? 'block my-2' : 'inline'}
                />
            );
        } catch (e) {
            parts.push(
                <span key={keyIndex++} className="px-1 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-mono">
                    {match[0]}
                </span>
            );
        }

        lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
        parts.push(<span key={keyIndex++}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
};

// ✅ CSS for hiding scrollbar
const scrollbarHideStyles = `
    .chatbot-scroll::-webkit-scrollbar {
        display: none;
    }
    .chatbot-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
`;

function Chatbot({ messages, pendingMessages = [], onSendMessage, onClose, isWaitingForResponse = false, onStopAudio }) {
    const [currentMessage, setCurrentMessage] = useState('');
    const [micStatus, setMicStatus] = useState('idle');
    const chatContainerRef = useRef(null);
    const recognitionRef = useRef(null);
    const chatbotRef = useRef(null);

    // ✅ Drag & Drop State
    const [position, setPosition] = useState({ x: null, y: null });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

    // ✅ Resize State
    const [size, setSize] = useState({ width: 380, height: 520 });
    const [isResizing, setIsResizing] = useState(false);
    const [resizeDirection, setResizeDirection] = useState(null);
    const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 });

    // ✅ Min/Max constraints
    const MIN_WIDTH = 320;
    const MAX_WIDTH = 550;
    const MIN_HEIGHT = 400;
    const MAX_HEIGHT = 650;

    // ✅ Auto-scroll Logic
    useEffect(() => {
        if (chatContainerRef.current) {
            setTimeout(() => {
                chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
            }, 100);
        }
    }, [messages]);

    // ✅ Mic Cleanup Logic
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
            }
        };
    }, []);

    // ✅ DRAG HANDLERS
    const handleDragStart = useCallback((e) => {
        if (isResizing) return;

        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = chatbotRef.current?.getBoundingClientRect();
        if (!rect) return;

        dragStartRef.current = {
            x: clientX,
            y: clientY,
            posX: position.x ?? rect.left,
            posY: position.y ?? rect.top
        };

        setIsDragging(true);
        e.preventDefault();
    }, [isResizing, position]);

    const handleDragMove = useCallback((e) => {
        if (!isDragging) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - dragStartRef.current.x;
        const deltaY = clientY - dragStartRef.current.y;

        let newX = dragStartRef.current.posX + deltaX;
        let newY = dragStartRef.current.posY + deltaY;

        // Boundary constraints
        const maxX = window.innerWidth - size.width;
        const maxY = window.innerHeight - size.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        setPosition({ x: newX, y: newY });
    }, [isDragging, size]);

    const handleDragEnd = useCallback(() => {
        setIsDragging(false);
    }, []);

    // ✅ RESIZE HANDLERS - All directions
    const handleResizeStart = useCallback((direction) => (e) => {
        const clientX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

        const rect = chatbotRef.current?.getBoundingClientRect();
        if (!rect) return;

        resizeStartRef.current = {
            x: clientX,
            y: clientY,
            width: size.width,
            height: size.height,
            posX: position.x ?? rect.left,
            posY: position.y ?? rect.top
        };

        setResizeDirection(direction);
        setIsResizing(true);
        e.preventDefault();
        e.stopPropagation();
    }, [size, position]);

    const handleResizeMove = useCallback((e) => {
        if (!isResizing || !resizeDirection) return;

        const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
        const clientY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;

        const deltaX = clientX - resizeStartRef.current.x;
        const deltaY = clientY - resizeStartRef.current.y;

        let newWidth = resizeStartRef.current.width;
        let newHeight = resizeStartRef.current.height;
        let newPosX = resizeStartRef.current.posX;
        let newPosY = resizeStartRef.current.posY;

        // Handle different resize directions
        if (resizeDirection.includes('e')) {
            // East (right edge) - increase width
            newWidth = resizeStartRef.current.width + deltaX;
        }
        if (resizeDirection.includes('w')) {
            // West (left edge) - increase width, move position
            newWidth = resizeStartRef.current.width - deltaX;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                newPosX = resizeStartRef.current.posX + deltaX;
            }
        }
        if (resizeDirection.includes('s')) {
            // South (bottom edge) - increase height
            newHeight = resizeStartRef.current.height + deltaY;
        }
        if (resizeDirection.includes('n')) {
            // North (top edge) - increase height, move position
            newHeight = resizeStartRef.current.height - deltaY;
            if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
                newPosY = resizeStartRef.current.posY + deltaY;
            }
        }

        // Apply constraints
        newWidth = Math.max(MIN_WIDTH, Math.min(newWidth, MAX_WIDTH));
        newHeight = Math.max(MIN_HEIGHT, Math.min(newHeight, MAX_HEIGHT));

        // Keep within screen bounds
        newPosX = Math.max(0, Math.min(newPosX, window.innerWidth - newWidth));
        newPosY = Math.max(0, Math.min(newPosY, window.innerHeight - newHeight));

        setSize({ width: newWidth, height: newHeight });
        if (resizeDirection.includes('w') || resizeDirection.includes('n')) {
            setPosition({ x: newPosX, y: newPosY });
        }
    }, [isResizing, resizeDirection]);

    const handleResizeEnd = useCallback(() => {
        setIsResizing(false);
        setResizeDirection(null);
    }, []);

    // ✅ Global event listeners
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleDragMove);
            window.removeEventListener('mouseup', handleDragEnd);
            window.removeEventListener('touchmove', handleDragMove);
            window.removeEventListener('touchend', handleDragEnd);
        };
    }, [isDragging, handleDragMove, handleDragEnd]);

    useEffect(() => {
        if (isResizing) {
            window.addEventListener('mousemove', handleResizeMove);
            window.addEventListener('mouseup', handleResizeEnd);
            window.addEventListener('touchmove', handleResizeMove, { passive: false });
            window.addEventListener('touchend', handleResizeEnd);
        }

        return () => {
            window.removeEventListener('mousemove', handleResizeMove);
            window.removeEventListener('mouseup', handleResizeEnd);
            window.removeEventListener('touchmove', handleResizeMove);
            window.removeEventListener('touchend', handleResizeEnd);
        };
    }, [isResizing, handleResizeMove, handleResizeEnd]);

    const startVoiceRecognition = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech recognition not supported');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            setMicStatus('listening');
            setCurrentMessage('');
            // ✅ Stop chatbot audio when user starts speaking
            if (onStopAudio) onStopAudio();
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
            setCurrentMessage(transcript);
        };

        recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            setMicStatus('idle');
        };

        recognition.onend = () => {
            setMicStatus('idle');
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopVoiceRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const handleMicClick = () => {
        if (micStatus === 'listening') {
            stopVoiceRecognition();
        } else {
            startVoiceRecognition();
        }
    };

    const handleSend = () => {
        if (isWaitingForResponse) return;

        if (currentMessage.trim()) {
            onSendMessage(currentMessage.trim());
            setCurrentMessage('');
        }
    };

    // Calculate position style
    const positionStyle = position.x !== null && position.y !== null
        ? { left: position.x, top: position.y, right: 'auto', bottom: 'auto' }
        : { right: 16, bottom: 16 };

    // Resize handle styles
    const resizeHandleBase = "absolute z-20 opacity-0 hover:opacity-100 transition-opacity";

    return (
        <>
            <style>{scrollbarHideStyles}</style>

            <div
                ref={chatbotRef}
                className={`fixed rounded-3xl border border-gray-200 shadow-2xl overflow-visible flex flex-col z-50 bg-white transition-shadow ${isDragging ? 'shadow-3xl cursor-grabbing' : ''} ${isResizing ? 'select-none' : ''}`}
                style={{
                    ...positionStyle,
                    width: size.width,
                    height: size.height,
                    userSelect: isDragging || isResizing ? 'none' : 'auto'
                }}
            >
                {/* ✅ RESIZE HANDLES - All 8 directions */}

                {/* Corners */}
                <div
                    className={`${resizeHandleBase} top-0 left-0 w-4 h-4 cursor-nw-resize`}
                    onMouseDown={handleResizeStart('nw')}
                    onTouchStart={handleResizeStart('nw')}
                >
                    <div className="w-2 h-2 m-1 border-l-2 border-t-2 border-blue-400 rounded-tl-sm" />
                </div>
                <div
                    className={`${resizeHandleBase} top-0 right-0 w-4 h-4 cursor-ne-resize`}
                    onMouseDown={handleResizeStart('ne')}
                    onTouchStart={handleResizeStart('ne')}
                >
                    <div className="w-2 h-2 m-1 ml-auto border-r-2 border-t-2 border-blue-400 rounded-tr-sm" />
                </div>
                <div
                    className={`${resizeHandleBase} bottom-0 left-0 w-4 h-4 cursor-sw-resize`}
                    onMouseDown={handleResizeStart('sw')}
                    onTouchStart={handleResizeStart('sw')}
                >
                    <div className="w-2 h-2 m-1 mt-auto border-l-2 border-b-2 border-blue-400 rounded-bl-sm" />
                </div>
                <div
                    className={`${resizeHandleBase} bottom-0 right-0 w-4 h-4 cursor-se-resize`}
                    onMouseDown={handleResizeStart('se')}
                    onTouchStart={handleResizeStart('se')}
                >
                    <div className="w-2 h-2 m-1 ml-auto mt-auto border-r-2 border-b-2 border-blue-400 rounded-br-sm" />
                </div>

                {/* Edges */}
                <div
                    className={`${resizeHandleBase} top-0 left-4 right-4 h-2 cursor-n-resize`}
                    onMouseDown={handleResizeStart('n')}
                    onTouchStart={handleResizeStart('n')}
                />
                <div
                    className={`${resizeHandleBase} bottom-0 left-4 right-4 h-2 cursor-s-resize`}
                    onMouseDown={handleResizeStart('s')}
                    onTouchStart={handleResizeStart('s')}
                />
                <div
                    className={`${resizeHandleBase} left-0 top-4 bottom-4 w-2 cursor-w-resize`}
                    onMouseDown={handleResizeStart('w')}
                    onTouchStart={handleResizeStart('w')}
                />
                <div
                    className={`${resizeHandleBase} right-0 top-4 bottom-4 w-2 cursor-e-resize`}
                    onMouseDown={handleResizeStart('e')}
                    onTouchStart={handleResizeStart('e')}
                />

                {/* Header - Draggable */}
                <div
                    className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-3xl ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleDragStart}
                    onTouchStart={handleDragStart}
                >
                    <div className="flex items-center gap-2">
                        <GripVertical size={16} className="text-gray-400" />
                        <h3 className="font-semibold text-sm text-gray-900">AI Assistant</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-gray-200 text-gray-600"
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Messages - Hidden Scrollbar */}
                <div
                    ref={chatContainerRef}
                    className="chatbot-scroll p-4 space-y-4 overflow-y-auto flex-1 bg-white"
                >
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'system' && (
                                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 border border-blue-100">
                                    <Bot size={18} className="text-blue-600" />
                                </div>
                            )}

                            <div className={`px-4 py-2 text-sm max-w-[80%] ${msg.sender === 'system'
                                ? 'border rounded-2xl rounded-bl-none bg-blue-50 border-blue-100 text-gray-800'
                                : 'rounded-2xl rounded-br-none font-medium bg-linear-to-r from-indigo-500 to-blue-500 text-white shadow-sm'
                                }`}>
                                {renderMathText(msg.text)}
                            </div>

                            {msg.sender === 'user' && (
                                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-linear-to-br from-indigo-500 to-blue-500">
                                    <User size={16} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Typing Indicator */}
                    {isWaitingForResponse && (
                        <div className="flex items-end gap-3">
                            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 border border-blue-100">
                                <Bot size={18} className="text-blue-600" />
                            </div>
                            <div className="px-4 py-3 border rounded-2xl rounded-bl-none bg-blue-50 border-blue-100">
                                <div className="flex gap-1">
                                    <span className="w-2 h-2 rounded-full animate-bounce bg-blue-400" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 rounded-full animate-bounce bg-blue-400" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 rounded-full animate-bounce bg-blue-400" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ Pending Messages Queue */}
                    {pendingMessages.length > 0 && pendingMessages.map((pendingText, index) => (
                        <div key={`pending-${index}`} className="flex items-end gap-3 justify-end">
                            <div className="flex flex-col gap-1">
                                <div className="px-4 py-2 text-sm max-w-[80%] rounded-2xl rounded-br-none font-medium bg-gray-400 text-white/80 shadow-sm">
                                    {pendingText}
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-orange-500 ml-auto">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Pending...</span>
                                </div>
                            </div>
                            <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm bg-gray-400">
                                <User size={16} className="text-white" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Section */}
                <div className="p-3 border-t border-gray-200 bg-white rounded-b-3xl">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleMicClick}
                            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full transition-all ${micStatus === 'listening'
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <Mic size={20} />
                        </button>

                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !isWaitingForResponse && handleSend()}
                                onFocus={() => {
                                    // ✅ Stop chatbot audio when user starts typing
                                    if (onStopAudio) onStopAudio();
                                }}
                                placeholder={isWaitingForResponse ? "Waiting for response..." : "Ask a question..."}
                                className="w-full px-4 py-3 rounded-full text-sm outline-none border bg-gray-50 border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <button
                            onClick={!isWaitingForResponse ? handleSend : undefined}
                            disabled={isWaitingForResponse || !currentMessage.trim()}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isWaitingForResponse
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : !currentMessage.trim()
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                    : 'bg-linear-to-r from-indigo-500 to-blue-500 text-white hover:from-indigo-600 hover:to-blue-600 shadow-sm'
                                }`}
                        >
                            {isWaitingForResponse ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                            ) : (
                                <SendHorizontal size={16} className="ml-0.5" />
                            )}
                        </button>
                    </div>
                </div>

                {/* ✅ Min size indicator (shows on resize) */}
                {isResizing && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md whitespace-nowrap">
                        {Math.round(size.width)} × {Math.round(size.height)}
                    </div>
                )}
            </div>
        </>
    );
}

export default Chatbot;
