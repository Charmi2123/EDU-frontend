import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const AudioManager = forwardRef(({ audioContext, analyserNode, onAudioSourceChange }, ref) => {
    const slideAudioRef = useRef(null);
    const chatbotAudioRef = useRef(null);
    const slideSourceRef = useRef(null);
    const chatbotSourceRef = useRef(null);
    const [slideAudioBuffer, setSlideAudioBuffer] = useState(null);

    // ✅ NEW: Audio cache to prevent double loading
    const audioCacheRef = useRef(new Map());
    const loadingUrlsRef = useRef(new Set());  // Track URLs currently being loaded

    // ✅ FIX: Flag to prevent race conditions when stopping/starting audio
    const isStoppingRef = useRef(false);

    // ✅ FIX: Flag to track if audio should play (starts false - only true when play is called)
    const shouldPlayRef = useRef(false);

    // ✅ FIX: Track which URL was requested - only play if it matches current request
    const currentRequestedUrlRef = useRef(null);

    // Using refs for timing to avoid re-renders during audio playback loops
    const slideStartTime = useRef(0);
    const slidePauseTime = useRef(0);
    const isPaused = useRef(false);

    const currentOnEndedCallback = useRef(null);

    // ✅ CENTRALIZED HELPER: Load Audio with Retry, Cache & Deduplication
    const loadAudio = async (url) => {
        if (!url || !audioContext) return null;

        // 1. Check Cache
        if (audioCacheRef.current.has(url)) {
            // console.log(`▶️ Cache Hit: ${url.slice(-20)}`);
            return audioCacheRef.current.get(url);
        }

        // 2. Check if currently loading (Wait for it)
        if (loadingUrlsRef.current.has(url)) {
            console.log(`⏳ Waiting for existing load: ${url.slice(-20)}`);
            let waitTime = 0;
            while (loadingUrlsRef.current.has(url) && waitTime < 10000) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Poll every 100ms
                waitTime += 100;
            }
            // After wait, check cache again
            if (audioCacheRef.current.has(url)) {
                return audioCacheRef.current.get(url);
            }
            // If NOT in cache, previous load failed - fall through to retry
            console.log(`🔄 Previous load failed, retrying: ${url.slice(-20)}`);
        }

        // 3. Load Fresh with Retry
        loadingUrlsRef.current.add(url);
        try {
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const response = await fetch(url, {
                        mode: 'cors',
                        credentials: 'omit',
                        headers: { 'Accept': 'audio/*' }
                    });

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const arrayBuffer = await response.arrayBuffer();
                    // Decode (CPU intensive, but usually fast for single files)
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    audioCacheRef.current.set(url, audioBuffer);
                    console.log(`✅ Loaded: ${url.slice(-20)}`);
                    return audioBuffer;
                } catch (err) {
                    console.warn(`⚠️ Attempt ${attempt}/3 failed for ${url.slice(-20)}: ${err.message}`);
                    if (attempt === 3) throw err;
                    await new Promise(r => setTimeout(r, attempt * 500)); // Backoff
                }
            }
        } catch (error) {
            console.error(`❌ Failed to load audio after 3 attempts:`, {
                url: url,
                error: error.message,
                stack: error.stack
            });
            return null;
        } finally {
            loadingUrlsRef.current.delete(url);
        }
    };

    useImperativeHandle(ref, () => ({
        getSlideElapsed() {
            if (audioContext) {
                // If paused, return the frozen time
                if (isPaused.current) {
                    return slidePauseTime.current;
                }
                // Otherwise calculate live
                return audioContext.currentTime - slideStartTime.current;
            }
            return 0;
        },

        // ✅ NEW: Preload all audio URLs at once (optimized with helper)
        async preloadAudioUrls(urls) {
            if (!audioContext || !urls || urls.length === 0) return;
            console.log(`🚀 Bulk Preloading ${urls.length} audio files...`);

            // Execute all loads in parallel (browser handles concurrency limits)
            await Promise.all(urls.map(url => loadAudio(url)));

            console.log(`✅ Preloading complete. Cache size: ${audioCacheRef.current.size}`);
        },

        async playSlideAudio(url, onEnded) {
            try {
                // ✅ Mark that we want to play (checked after loading)
                shouldPlayRef.current = true;
                currentRequestedUrlRef.current = url;  // Track this URL
                console.log('🎵 playSlideAudio called for:', url.slice(-20), '- shouldPlayRef = TRUE');

                // ✅ Prevent double play - Stop any existing audio FIRST
                if (slideSourceRef.current) {
                    try {
                        slideSourceRef.current.stop();
                        slideSourceRef.current.disconnect();
                    } catch (e) {
                        // Already stopped
                    }
                    slideSourceRef.current = null;
                }
                if (chatbotSourceRef.current) {
                    try {
                        chatbotSourceRef.current.stop();
                        chatbotSourceRef.current.disconnect();
                    } catch (e) {
                        // Already stopped
                    }
                    chatbotSourceRef.current = null;
                }

                // Reset pause state
                isPaused.current = false;
                slidePauseTime.current = 0;
                currentOnEndedCallback.current = onEnded;



                // ✅ Optimistic Resume: Resume AudioContext immediately to capture user gesture
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume().catch(e => console.warn('Audio resume failed', e));
                }

                // ✅ Use centralized helper to load/get audio
                const audioBuffer = await loadAudio(url);

                if (!audioBuffer) {
                    console.error('Failed to get audio buffer for:', url);
                    return { duration: 0 };
                }

                setSlideAudioBuffer(audioBuffer);

                // ✅ CHECK 1: If user paused during loading, don't start playing
                if (!shouldPlayRef.current) {
                    console.log('⏸️ Audio load complete but user paused - not playing');
                    return { duration: audioBuffer.duration };
                }

                // ✅ CHECK 2: If user navigated to different slide during loading, don't play this audio
                if (currentRequestedUrlRef.current !== url) {
                    console.log('⏭️ Audio load complete but different slide requested - not playing this audio');
                    return { duration: audioBuffer.duration };
                }

                // Create source
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                slideSourceRef.current = source;
                onAudioSourceChange(source);

                source.onended = () => {
                    if (isPaused.current) return;
                    if (currentOnEndedCallback.current) currentOnEndedCallback.current();
                };

                // Resume context if suspended
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                source.start(0);
                slideStartTime.current = audioContext.currentTime;
                console.log('▶️ Audio started playing!');

                // Return duration so parent can handle progress
                return { duration: audioBuffer.duration };

            } catch (error) {
                console.error('Failed to play slide audio:', error);
                return { duration: 0 };
            }
        },

        pauseSlideAudio() {
            // ✅ Cancel any pending play (if audio is still loading)
            console.log('⏸️ pauseSlideAudio called - shouldPlayRef set to FALSE');
            shouldPlayRef.current = false;

            if (slideSourceRef.current && audioContext && !isPaused.current) {
                isPaused.current = true;
                const elapsed = audioContext.currentTime - slideStartTime.current;
                slidePauseTime.current = elapsed;

                // We stop the source node
                try {
                    slideSourceRef.current.stop();
                    slideSourceRef.current.disconnect();
                } catch (e) {
                    // Already stopped
                }
                slideSourceRef.current = null;
            }
        },

        async resumeSlideAudio() {
            if (slideAudioBuffer && audioContext && isPaused.current) {
                isPaused.current = false;

                const source = audioContext.createBufferSource();
                source.buffer = slideAudioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                slideSourceRef.current = source;
                onAudioSourceChange(source);

                // Re-attach the original onEnded callback
                source.onended = () => {
                    if (isPaused.current) return;
                    if (currentOnEndedCallback.current) currentOnEndedCallback.current();
                };

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                source.start(0, slidePauseTime.current);
                // Adjust start time so (currentTime - start) equals the offset we resumed at
                slideStartTime.current = audioContext.currentTime - slidePauseTime.current;
            }
        },

        async playChatbotAudio(url) {
            try {
                // ✅ STOP any existing chatbot audio FIRST (prevents overlapping audio)
                if (chatbotSourceRef.current) {
                    try {
                        chatbotSourceRef.current.stop();
                        chatbotSourceRef.current.disconnect();
                    } catch (e) {
                        // Already stopped
                    }
                    chatbotSourceRef.current = null;
                }

                // Pause slide audio (if playing)
                if (slideSourceRef.current && !isPaused.current) {
                    const elapsed = audioContext.currentTime - slideStartTime.current;
                    slidePauseTime.current = elapsed;
                    isPaused.current = true; // Mark as paused

                    try {
                        slideSourceRef.current.stop();
                        slideSourceRef.current.disconnect();
                    } catch (e) {
                        // Already stopped
                    }
                    slideSourceRef.current = null;
                }

                // Resume AudioContext if suspended
                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                // Fetch and decode new chatbot audio
                // ✅ FIX: Add CORS mode for AWS S3 audio files
                const response = await fetch(url, {
                    mode: 'cors',
                    credentials: 'omit',
                    headers: {
                        'Accept': 'audio/*'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                // Create and play source
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                chatbotSourceRef.current = source;
                onAudioSourceChange(source);

                source.start(0);

            } catch (error) {
                console.error('Failed to play chatbot audio:', error);
            }
        },

        // ✅ NEW: Stop chatbot audio (called when closing chatbot)
        stopChatbotAudio() {
            if (chatbotSourceRef.current) {
                try {
                    chatbotSourceRef.current.stop();
                    chatbotSourceRef.current.disconnect();
                } catch (e) {
                    // Already stopped
                }
                chatbotSourceRef.current = null;
                console.log('Chatbot audio stopped');
            }
        },

        // ✅ NEW: Stop ALL audio sources (slide + chatbot)
        stopAllAudio() {
            console.log('Stopping all audio sources...');

            // Stop slide audio
            if (slideSourceRef.current) {
                try {
                    slideSourceRef.current.stop();
                    slideSourceRef.current.disconnect();
                } catch (e) {
                    // Already stopped
                }
                slideSourceRef.current = null;
            }

            // Stop chatbot audio
            if (chatbotSourceRef.current) {
                try {
                    chatbotSourceRef.current.stop();
                    chatbotSourceRef.current.disconnect();
                } catch (e) {
                    // Already stopped
                }
                chatbotSourceRef.current = null;
            }

            // Reset state
            isPaused.current = false;
            slidePauseTime.current = 0;
            currentOnEndedCallback.current = null;
            shouldPlayRef.current = false;  // ✅ Cancel any pending play
            currentRequestedUrlRef.current = null;  // ✅ Clear requested URL

            console.log('🛑 All audio stopped');
        },

        // ✅ NEW: Clear cache when needed
        clearCache() {
            audioCacheRef.current.clear();
            loadingUrlsRef.current.clear();
            console.log('Audio cache cleared');
        }
    }));

    return null;
});

AudioManager.displayName = 'AudioManager';

export default AudioManager;
