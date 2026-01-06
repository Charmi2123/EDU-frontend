import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';

const AudioManager = forwardRef(({ audioContext, analyserNode, onAudioSourceChange }, ref) => {
    const slideAudioRef = useRef(null);
    const chatbotAudioRef = useRef(null);
    const slideSourceRef = useRef(null);
    const chatbotSourceRef = useRef(null);
    const [slideAudioBuffer, setSlideAudioBuffer] = useState(null);

    // Using refs for timing to avoid re-renders during audio playback loops
    const slideStartTime = useRef(0);
    const slidePauseTime = useRef(0);
    const isPaused = useRef(false);

    const currentOnEndedCallback = useRef(null);

    // Recording destination for capturing audio
    const recordingDestinationRef = useRef(null);

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

        // Get or create recording destination for audio capture
        getRecordingDestination() {
            if (!audioContext) return null;

            if (!recordingDestinationRef.current) {
                recordingDestinationRef.current = audioContext.createMediaStreamDestination();
            }
            return recordingDestinationRef.current;
        },

        async playSlideAudio(url, onEnded) {
            try {
                // Stop any existing audio
                if (slideSourceRef.current) {
                    slideSourceRef.current.stop();
                    slideSourceRef.current.disconnect();
                }
                if (chatbotSourceRef.current) {
                    chatbotSourceRef.current.stop();
                    chatbotSourceRef.current.disconnect();
                }

                // Reset pause state
                isPaused.current = false;
                slidePauseTime.current = 0;
                currentOnEndedCallback.current = onEnded;

                // Fetch and decode audio
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                setSlideAudioBuffer(audioBuffer);

                // Create source
                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                // Also connect to recording destination if it exists
                if (recordingDestinationRef.current) {
                    source.connect(recordingDestinationRef.current);
                }

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

                // Return duration so parent can handle progress
                return { duration: audioBuffer.duration };

            } catch (error) {
                console.error('Failed to play slide audio:', error);
                return { duration: 0 };
            }
        },

        pauseSlideAudio() {
            if (slideSourceRef.current && audioContext && !isPaused.current) {
                isPaused.current = true;
                const elapsed = audioContext.currentTime - slideStartTime.current;
                slidePauseTime.current = elapsed;

                // We stop the source node
                slideSourceRef.current.stop();
                slideSourceRef.current.disconnect();
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

                // Also connect to recording destination if it exists
                if (recordingDestinationRef.current) {
                    source.connect(recordingDestinationRef.current);
                }

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
                // Pause slide audio
                if (slideSourceRef.current) {
                    const elapsed = audioContext.currentTime - slideStartTime.current;
                    slidePauseTime.current = elapsed;
                    isPaused.current = true; // Mark as paused

                    slideSourceRef.current.stop();
                    slideSourceRef.current.disconnect();
                }

                // Play chatbot audio
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                const source = audioContext.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(analyserNode);
                analyserNode.connect(audioContext.destination);

                chatbotSourceRef.current = source;
                onAudioSourceChange(source);

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                source.start(0);

            } catch (error) {
                console.error('Failed to play chatbot audio:', error);
            }
        }
    }));

    return null;
});

AudioManager.displayName = 'AudioManager';

export default AudioManager;
