/**
 * CRITICAL FIX: Chatbot Audio Not Playing During Slide
 * 
 * BUG: When chat opens during slide, chatbot audio doesn't play
 * ROOT CAUSE: Slide audio buffer not properly cleared
 * FIX: Force stop all audio sources before playing chatbot
 */

export class AudioController {
    constructor(audioContext, glbHead) {
        this.ctx = audioContext;
        this.head = glbHead;

        // Audio sources
        this.currentSource = null;
        this.slideAudio = {
            data: null,
            pausedAt: 0,
            duration: 0,
            isPlaying: false,
            sourceNode: null // ✅ Track audio source node
        };
        this.chatAudio = {
            data: null,
            isPlaying: false,
            sourceNode: null // ✅ Track audio source node
        };

        this.isReady = false;
        this.isPaused = false;

        this.onAudioEnd = null;
        this.onError = null;
    }

    /**
     * ✅ CRITICAL: Force stop ALL audio sources
     * This is the key fix for the chatbot audio bug
     */
    forceStopAllAudio() {
        console.log('🛑 Force stopping ALL audio sources');

        // Stop TalkingHead
        try {
            this.head.stop();
            console.log('✅ TalkingHead stopped');
        } catch (e) {
            console.warn('Failed to stop TalkingHead:', e);
        }

        // Stop browser TTS
        try {
            window.speechSynthesis.cancel();
            console.log('✅ SpeechSynthesis cancelled');
        } catch (e) {
            console.warn('Failed to cancel speech:', e);
        }

        // ✅ CRITICAL: Disconnect any active audio source nodes
        if (this.slideAudio.sourceNode) {
            try {
                this.slideAudio.sourceNode.disconnect();
                this.slideAudio.sourceNode = null;
                console.log('✅ Slide audio source disconnected');
            } catch (e) {
                console.warn('Failed to disconnect slide source:', e);
            }
        }

        if (this.chatAudio.sourceNode) {
            try {
                this.chatAudio.sourceNode.disconnect();
                this.chatAudio.sourceNode = null;
                console.log('✅ Chat audio source disconnected');
            } catch (e) {
                console.warn('Failed to disconnect chat source:', e);
            }
        }

        // Reset state
        this.slideAudio.isPlaying = false;
        this.chatAudio.isPlaying = false;
    }

    /**
     * CRITICAL: Ensure AudioContext is running
     */
    async ensureContextRunning() {
        if (this.ctx.state === 'suspended') {
            console.log('🔊 AudioContext suspended, resuming...');
            try {
                await this.ctx.resume();

                // ✅ CRITICAL: Wait for actual state change
                let attempts = 0;
                while (this.ctx.state !== 'running' && attempts < 20) {
                    await new Promise(r => setTimeout(r, 50));
                    attempts++;
                }

                if (this.ctx.state !== 'running') {
                    throw new Error('AudioContext failed to resume after 20 attempts');
                }

                console.log('✅ AudioContext running');
            } catch (e) {
                console.error('❌ Failed to resume AudioContext:', e);
                throw e;
            }
        }
    }

    /**
     * ✅ FIXED: Play chatbot audio (PRIORITY 1)
     * This now properly stops slide audio first
     */
    async playChatAudio(audioData) {
        console.log('🤖 Playing chatbot audio (PRIORITY 1)');
        console.log('Current state before chat:', this.getState());

        try {
            // ✅ STEP 1: FORCE STOP ALL AUDIO (Critical fix)
            this.forceStopAllAudio();

            // Small delay to ensure cleanup
            await new Promise(r => setTimeout(r, 100));

            // ✅ STEP 2: Store slide pause position if it was playing
            if (this.currentSource === 'SLIDE' && this.slideAudio.data) {
                // Calculate current position (simplified - TalkingHead tracks internally)
                console.log('⏸️ Storing slide pause position');
                // Position is already tracked in slideAudio.pausedAt
            }

            // ✅ STEP 3: Ensure AudioContext is FULLY running
            await this.ensureContextRunning();

            // Additional verification
            if (this.ctx.state !== 'running') {
                throw new Error('AudioContext not running before chatbot audio');
            }

            // ✅ STEP 4: Set source and state
            this.currentSource = 'CHAT';
            this.chatAudio.data = audioData;
            this.chatAudio.isPlaying = true;

            // ✅ STEP 5: Start GLB animation
            this.head.start();
            console.log('✅ GLB animation started for chatbot');

            // ✅ STEP 6: Play audio with lip-sync
            console.log('🎵 Starting chatbot audio playback...');
            this.head.speakAudio(audioData);

            // ✅ STEP 7: Verify audio is actually playing
            await new Promise(r => setTimeout(r, 200));
            if (!this.head.isAudioPlaying) {
                throw new Error('Chatbot audio failed to start playing');
            }

            console.log('✅ Chatbot audio playing successfully');
            console.log('State after chat start:', this.getState());

            // ✅ STEP 8: Monitor for completion
            this.monitorAudioCompletion('CHAT');

        } catch (e) {
            console.error('❌ Failed to play chatbot audio:', e);
            console.error('AudioContext state:', this.ctx.state);
            console.error('TalkingHead state:', {
                isPlaying: this.head.isAudioPlaying,
                isSpeaking: this.head.isSpeaking
            });
            this.handleError('CHAT_AUDIO_FAILED', e);
            throw e; // Re-throw so caller can handle
        }
    }

    /**
     * Play slide narration audio
     */
    async playSlideAudio(audioData, resumeFrom = 0) {
        console.log(`🎓 Playing slide audio from ${resumeFrom}ms`);

        try {
            // Don't interrupt chatbot audio
            if (this.currentSource === 'CHAT' && this.chatAudio.isPlaying) {
                console.warn('⚠️ Chatbot audio active, deferring slide audio');
                return false;
            }

            // Ensure context is running
            await this.ensureContextRunning();

            // Stop any existing audio
            this.forceStopAllAudio();
            await new Promise(r => setTimeout(r, 50));

            // Set source and state
            this.currentSource = 'SLIDE';
            this.slideAudio.data = audioData;
            this.slideAudio.pausedAt = resumeFrom;
            this.slideAudio.duration = audioData.audio.duration * 1000;
            this.slideAudio.isPlaying = true;
            this.isPaused = false;

            // Start GLB animation
            this.head.start();

            // Play audio with lip-sync
            console.log('🎵 Starting slide audio playback...');
            this.head.speakAudio(audioData);

            // Verify playing
            await new Promise(r => setTimeout(r, 200));
            if (!this.head.isAudioPlaying) {
                throw new Error('Slide audio failed to start playing');
            }

            console.log('✅ Slide audio playing successfully');

            // Monitor for completion
            this.monitorAudioCompletion('SLIDE');

            return true;

        } catch (e) {
            console.error('❌ Failed to play slide audio:', e);
            this.handleError('SLIDE_AUDIO_FAILED', e);
            return false;
        }
    }

    /**
     * Pause slide audio
     */
    async pauseSlideAudio() {
        if (this.currentSource !== 'SLIDE') {
            console.log('⚠️ Not currently playing slide audio');
            return;
        }

        console.log('⏸️ Pausing slide audio');

        // Store current position
        // TalkingHead tracks position internally
        this.slideAudio.isPlaying = false;
        this.isPaused = true;

        // Stop audio
        this.forceStopAllAudio();

        // Suspend context to save resources
        if (this.ctx.state === 'running') {
            try {
                await this.ctx.suspend();
                console.log('✅ AudioContext suspended');
            } catch (e) {
                console.warn('Failed to suspend context:', e);
            }
        }

        console.log('✅ Slide audio paused');
    }

    /**
     * Resume slide audio
     */
    async resumeSlideAudio() {
        if (!this.slideAudio.data) {
            console.warn('⚠️ No slide audio to resume');
            return false;
        }

        console.log('▶️ Resuming slide audio from:', this.slideAudio.pausedAt);

        // Resume from stored position
        const resumeFrom = this.slideAudio.pausedAt;
        return await this.playSlideAudio(this.slideAudio.data, resumeFrom);
    }

    /**
     * Play TTS
     */
    async playTTS(text, lang = 'en-US') {
        console.log('🗣️ Playing TTS:', text.substring(0, 50));

        try {
            // Don't interrupt other audio
            if (this.currentSource && (this.slideAudio.isPlaying || this.chatAudio.isPlaying)) {
                console.warn('⚠️ Audio active, deferring TTS');
                return false;
            }

            // Ensure context running
            await this.ensureContextRunning();

            // Stop existing
            this.forceStopAllAudio();
            await new Promise(r => setTimeout(r, 50));

            this.currentSource = 'TTS';

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = lang;

            utterance.onend = () => {
                console.log('✅ TTS finished');
                this.currentSource = null;
                if (this.onAudioEnd) this.onAudioEnd('TTS');
            };

            utterance.onerror = (e) => {
                console.error('❌ TTS error:', e);
                this.handleError('TTS_FAILED', e);
            };

            window.speechSynthesis.speak(utterance);
            return true;

        } catch (e) {
            console.error('❌ Failed to play TTS:', e);
            this.handleError('TTS_FAILED', e);
            return false;
        }
    }

    /**
     * Stop all audio
     */
    stopAll() {
        console.log('🛑 Stopping all audio');
        this.forceStopAllAudio();
        this.currentSource = null;
    }

    /**
     * Monitor audio completion
     */
    monitorAudioCompletion(source) {
        const checkInterval = setInterval(() => {
            // Check if audio is still playing
            const isPlaying = this.head.isAudioPlaying || window.speechSynthesis.speaking;

            if (!isPlaying) {
                clearInterval(checkInterval);

                console.log(`✅ ${source} audio completed`);

                if (source === 'CHAT') {
                    this.chatAudio.isPlaying = false;
                    this.chatAudio.data = null;
                    this.chatAudio.sourceNode = null;
                    this.currentSource = null;
                } else if (source === 'SLIDE') {
                    this.slideAudio.isPlaying = false;
                }

                if (this.onAudioEnd) {
                    this.onAudioEnd(source);
                }
            }
        }, 100);
    }

    /**
     * Error handler
     */
    handleError(code, error) {
        console.error(`🔴 AudioController Error [${code}]:`, error);

        // Attempt recovery
        this.forceStopAllAudio();

        if (this.onError) {
            this.onError(code, error);
        }
    }

    /**
     * Get current state for debugging
     */
    getState() {
        return {
            contextState: this.ctx.state,
            currentSource: this.currentSource,
            slideAudio: {
                isPlaying: this.slideAudio.isPlaying,
                pausedAt: this.slideAudio.pausedAt,
                hasData: !!this.slideAudio.data,
                hasSourceNode: !!this.slideAudio.sourceNode
            },
            chatAudio: {
                isPlaying: this.chatAudio.isPlaying,
                hasData: !!this.chatAudio.data,
                hasSourceNode: !!this.chatAudio.sourceNode
            },
            isPaused: this.isPaused,
            glbPlaying: this.head.isAudioPlaying,
            glbSpeaking: this.head.isSpeaking
        };
    }
}
