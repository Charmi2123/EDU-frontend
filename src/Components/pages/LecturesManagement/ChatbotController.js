/**
 * REACT SIDE - CHATBOT CONTROLLER WITH 3-SECOND GRACE PERIOD
 * 
 * Handles:
 * - Chatbot open/close
 * - 3-second grace period on close
 * - Auto-resume if not reopened
 * - Mic state management
 */

import { useState, useRef, useEffect } from 'react';

export function useChatbotController(videoRef, recognitionRef, micStatus, setMicStatus) {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isInGracePeriod, setIsInGracePeriod] = useState(false);
    const gracePeriodTimerRef = useRef(null);

    /**
     * Open chatbot
     * Cancels grace period if reopening within 3 seconds
     */
    const openChatbot = () => {
        console.log('💬 Opening chatbot');

        // Cancel grace period if reopening
        if (gracePeriodTimerRef.current) {
            console.log('⏱️  Cancelled grace period - user reopened chat');
            clearTimeout(gracePeriodTimerRef.current);
            gracePeriodTimerRef.current = null;
            setIsInGracePeriod(false);
        }

        setIsChatOpen(true);

        // Tell iframe to enter chat mode
        if (videoRef.current?.contentWindow) {
            videoRef.current.contentWindow.postMessage({ type: 'CMD_ENTER_CHAT' }, '*');
        }
    };

    /**
     * Close chatbot
     * Starts 3-second grace period
     * Auto-resumes if not reopened
     */
    const closeChatbot = () => {
        console.log('❌ Closing chatbot');

        // Stop mic if listening
        if (micStatus === 'listening' && recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.warn('Failed to stop recognition:', e);
            }
        }

        setIsChatOpen(false);
        setIsInGracePeriod(true);

        // Start 3-second grace period
        console.log('⏱️  Starting 3-second grace period');
        gracePeriodTimerRef.current = setTimeout(() => {
            console.log('⏱️  Grace period expired - auto-resuming lecture');
            setIsInGracePeriod(false);
            gracePeriodTimerRef.current = null;

            // Tell iframe to resume
            if (videoRef.current?.contentWindow) {
                videoRef.current.contentWindow.postMessage({ type: 'CMD_RESUME' }, '*');
            }
        }, 3000);
    };

    /**
     * Toggle chatbot (used by chat button)
     */
    const toggleChatbot = () => {
        if (isChatOpen) {
            closeChatbot();
        } else {
            openChatbot();
        }
    };

    /**
     * Cleanup on unmount
     */
    useEffect(() => {
        return () => {
            if (gracePeriodTimerRef.current) {
                clearTimeout(gracePeriodTimerRef.current);
            }
        };
    }, []);

    return {
        isChatOpen,
        isInGracePeriod,
        openChatbot,
        closeChatbot,
        toggleChatbot
    };
}

/**
 * INTEGRATION INTO LectureVideo.jsx
 */

/*

STEP 1: Import the hook

import { useChatbotController } from './ChatbotController';

STEP 2: Replace existing chat state management

// OLD:
const [isChatOpen, setIsChatOpen] = useState(false);

// NEW:
const {
  isChatOpen,
  isInGracePeriod,
  openChatbot,
  closeChatbot,
  toggleChatbot
} = useChatbotController(videoRef, recognitionRef, micStatus, setMicStatus);

STEP 3: Update Chat button onClick

// OLD:
onClick={() => {
  if (isChatOpen) {
    if (micStatus === 'listening' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsChatOpen(false);
  } else {
    setIsChatOpen(true);
    if (videoRef.current?.contentWindow) {
      videoRef.current.contentWindow.postMessage({ type: 'CMD_ENTER_CHAT' }, '*');
    }
  }
}}

// NEW:
onClick={toggleChatbot}

STEP 4: Update Close button in chatbot header

// OLD:
onClick={() => setIsChatOpen(false)}

// NEW:
onClick={closeChatbot}

STEP 5: Add grace period indicator (optional)

{isInGracePeriod && (
  <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-yellow-500/90 text-white rounded-full text-sm font-medium animate-pulse">
    Resuming in 3 seconds... (Click chat to cancel)
  </div>
)}

STEP 6: Handle EVT_VOICE_TRIGGER from iframe

useEffect(() => {
  const handleMessage = (event) => {
    const { type, response } = event.data;

    if (type === 'EVT_VOICE_TRIGGER' && response === 'YES') {
      // User said "yes" to question prompt
      openChatbot();
      handlesuccess("Opening Chatbot...");
    }
  };

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [openChatbot]);

*/

console.log('✅ Chatbot Controller loaded');
