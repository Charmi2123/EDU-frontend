import { useRef, useState, useCallback } from 'react';

/**
 * Custom hook for canvas-based video recording
 * Records ONLY the lecture content area, not UI controls
 * Uses DOM capture for accurate content rendering
 */
const useRecorder = (audioContext) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hasRecordingData, setHasRecordingData] = useState(false);
    const [isConverting, setIsConverting] = useState(false);

    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const canvasRef = useRef(null);
    const canvasContextRef = useRef(null);
    const animationFrameRef = useRef(null);
    const recordingStreamRef = useRef(null);
    const audioDestinationRef = useRef(null);
    const mimeTypeRef = useRef('video/webm');

    // DOM reference for capturing
    const contentRef = useRef(null);

    // Preloaded images cache
    const imageCache = useRef(new Map());

    /**
     * Preload an image and cache it
     */
    const preloadImage = useCallback((src) => {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error('No src provided'));
                return;
            }
            if (imageCache.current.has(src)) {
                resolve(imageCache.current.get(src));
                return;
            }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                imageCache.current.set(src, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = src;
        });
    }, []);

    /**
     * Draw text with word wrapping - returns the Y position after drawing
     */
    const drawWrappedText = useCallback((ctx, text, x, y, maxWidth, lineHeight, font, color, align = 'left') => {
        if (!text) return y;

        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;

        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && i > 0) {
                ctx.fillText(line.trim(), x, currentY);
                line = words[i] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line.trim(), x, currentY);
        ctx.textAlign = 'left'; // Reset

        return currentY + lineHeight;
    }, []);

    /**
     * Draw current slide content to canvas - Matching the UI layout
     */
    const drawFrame = useCallback(async (slideData, logoSrc, slideImageSrc, videoElement, playbackProgress) => {
        if (!canvasRef.current || !canvasContextRef.current) return;

        const ctx = canvasContextRef.current;
        const width = canvasRef.current.width;
        const height = canvasRef.current.height;

        // Clear canvas with white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Layout dimensions
        const padding = 60;
        const logoHeight = 80;
        const contentStartY = logoHeight + 60;

        // Two column layout
        const leftColumnWidth = width * 0.48;
        const rightColumnX = width * 0.52;
        const rightColumnWidth = width * 0.44;

        // =====================
        // DRAW LOGO (TOP CENTER)
        // =====================
        try {
            const logo = await preloadImage(logoSrc);
            const logoW = 200;
            const logoH = (logo.height / logo.width) * logoW;
            const logoX = padding;
            ctx.drawImage(logo, logoX, 30, logoW, logoH);
        } catch (e) {
            // Logo failed to load
        }

        let currentY = contentStartY;

        // =====================
        // DRAW TITLE
        // =====================
        if (slideData?.title) {
            const titleFont = 'bold 52px "Noto Sans Gujarati", "Noto Sans Devanagari", "Noto Sans", Arial, sans-serif';
            ctx.font = titleFont;
            ctx.fillStyle = '#1a1a1a';

            // Draw title with word wrap
            currentY = drawWrappedText(
                ctx,
                slideData.title,
                padding,
                currentY,
                leftColumnWidth - padding,
                60,
                titleFont,
                '#1a1a1a',
                'left'
            );

            // Draw underline
            ctx.strokeStyle = '#333333';
            ctx.lineWidth = 3;
            ctx.beginPath();
            const underlineWidth = Math.min(ctx.measureText(slideData.title).width, leftColumnWidth - padding);
            ctx.moveTo(padding, currentY + 5);
            ctx.lineTo(padding + underlineWidth, currentY + 5);
            ctx.stroke();

            currentY += 50;
        }

        // =====================
        // DRAW BULLETS
        // =====================
        if (slideData?.bullets && slideData.bullets.length > 0) {
            const bulletFont = '36px "Noto Sans Gujarati", "Noto Sans Devanagari", "Noto Sans", Arial, sans-serif';
            const totalBullets = slideData.bullets.length;

            for (let i = 0; i < totalBullets; i++) {
                const step = 1 / totalBullets;
                const bulletStart = i * step;
                const localProgress = Math.max(0, Math.min(1, (playbackProgress - bulletStart) / step));

                if (localProgress > 0) {
                    const bullet = slideData.bullets[i];
                    const visibleLength = Math.floor(bullet.length * localProgress);
                    const visibleText = bullet.substring(0, visibleLength);

                    // Bullet point
                    ctx.font = 'bold 36px Arial, sans-serif';
                    ctx.fillStyle = '#333333';
                    ctx.fillText('•', padding, currentY);

                    // Bullet text
                    currentY = drawWrappedText(
                        ctx,
                        visibleText,
                        padding + 35,
                        currentY,
                        leftColumnWidth - padding - 50,
                        48,
                        bulletFont,
                        '#333333',
                        'left'
                    );
                    currentY += 20;
                }
            }
        } else if (slideData?.narration) {
            // Draw narration with typing effect
            const narrationFont = '32px "Noto Sans Gujarati", "Noto Sans Devanagari", "Noto Sans", Arial, sans-serif';
            const visibleLength = Math.floor(slideData.narration.length * playbackProgress);
            const visibleText = slideData.narration.substring(0, visibleLength);

            currentY = drawWrappedText(
                ctx,
                visibleText,
                padding,
                currentY,
                leftColumnWidth - padding,
                44,
                narrationFont,
                '#333333',
                'left'
            );
        }

        // =====================
        // DRAW IMAGE/VIDEO (RIGHT SIDE)
        // =====================
        const mediaY = contentStartY - 20;
        const mediaHeight = height - mediaY - 80;

        // Draw video frame if video element exists and is ready
        if (videoElement && videoElement.readyState >= 2 && videoElement.videoWidth > 0) {
            try {
                const vidAspect = videoElement.videoWidth / videoElement.videoHeight;
                const areaAspect = rightColumnWidth / mediaHeight;

                let drawWidth, drawHeight, drawX, drawY;

                if (vidAspect > areaAspect) {
                    drawWidth = rightColumnWidth;
                    drawHeight = rightColumnWidth / vidAspect;
                    drawX = rightColumnX;
                    drawY = mediaY + (mediaHeight - drawHeight) / 2;
                } else {
                    drawHeight = mediaHeight;
                    drawWidth = mediaHeight * vidAspect;
                    drawX = rightColumnX + (rightColumnWidth - drawWidth) / 2;
                    drawY = mediaY;
                }

                // Shadow
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 30;
                ctx.shadowOffsetY = 10;

                // Rounded corners
                ctx.beginPath();
                ctx.roundRect(drawX, drawY, drawWidth, drawHeight, 12);
                ctx.clip();
                ctx.drawImage(videoElement, drawX, drawY, drawWidth, drawHeight);
                ctx.restore();
            } catch (e) {
                console.warn('Video frame capture failed:', e);
            }
        } else if (slideImageSrc) {
            // Draw slide image
            try {
                const slideImg = await preloadImage(slideImageSrc);

                const imgAspect = slideImg.width / slideImg.height;
                const areaAspect = rightColumnWidth / mediaHeight;

                let drawWidth, drawHeight, drawX, drawY;

                if (imgAspect > areaAspect) {
                    drawWidth = rightColumnWidth;
                    drawHeight = rightColumnWidth / imgAspect;
                    drawX = rightColumnX;
                    drawY = mediaY + (mediaHeight - drawHeight) / 2;
                } else {
                    drawHeight = mediaHeight;
                    drawWidth = mediaHeight * imgAspect;
                    drawX = rightColumnX + (rightColumnWidth - drawWidth) / 2;
                    drawY = mediaY;
                }

                // Shadow
                ctx.save();
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 30;
                ctx.shadowOffsetY = 10;

                // Rounded corners
                ctx.beginPath();
                ctx.roundRect(drawX, drawY, drawWidth, drawHeight, 12);
                ctx.clip();
                ctx.drawImage(slideImg, drawX, drawY, drawWidth, drawHeight);
                ctx.restore();
            } catch (e) {
                console.warn('Image load failed:', e);
            }
        }

    }, [preloadImage, drawWrappedText]);

    /**
     * Start the recording animation loop
     */
    const startFrameCapture = useCallback((getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress) => {
        let lastDrawTime = 0;
        const frameInterval = 1000 / 30; // 30fps

        const captureLoop = async (timestamp) => {
            if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
                return;
            }

            // Throttle to ~30fps
            if (timestamp - lastDrawTime >= frameInterval) {
                if (mediaRecorderRef.current.state === 'recording') {
                    const slideData = getSlideData();
                    const logoSrc = getLogoSrc();
                    const slideImageSrc = getSlideImageSrc();
                    const videoElement = getVideoElement();
                    const progress = getProgress();

                    await drawFrame(slideData, logoSrc, slideImageSrc, videoElement, progress);
                    lastDrawTime = timestamp;
                }
            }

            animationFrameRef.current = requestAnimationFrame(captureLoop);
        };

        animationFrameRef.current = requestAnimationFrame(captureLoop);
    }, [drawFrame]);

    /**
     * Initialize and start recording
     */
    const startRecording = useCallback(async (getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress, audioManagerRef) => {
        try {
            // Create recording canvas (1920x1080 for Full HD)
            const canvas = document.createElement('canvas');
            canvas.width = 1920;
            canvas.height = 1080;
            canvasRef.current = canvas;
            canvasContextRef.current = canvas.getContext('2d', {
                alpha: false,
                desynchronized: true // Better performance
            });

            // Fill initial frame with white
            canvasContextRef.current.fillStyle = '#ffffff';
            canvasContextRef.current.fillRect(0, 0, 1920, 1080);

            // Get video stream from canvas at 30fps
            const videoStream = canvas.captureStream(30);

            // Get audio recording destination from AudioManager
            let audioTracks = [];
            if (audioManagerRef?.current) {
                const recordingDest = audioManagerRef.current.getRecordingDestination();
                if (recordingDest && recordingDest.stream) {
                    audioTracks = recordingDest.stream.getAudioTracks();
                    audioDestinationRef.current = recordingDest;
                }
            }

            // Combine video and audio streams
            const tracks = [...videoStream.getVideoTracks(), ...audioTracks];
            const combinedStream = new MediaStream(tracks);
            recordingStreamRef.current = combinedStream;

            // Determine best supported MIME type for quality
            let mimeType = 'video/webm;codecs=vp9,opus';
            if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
                mimeType = 'video/webm;codecs=vp9,opus';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
                mimeType = 'video/webm;codecs=vp8,opus';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            }
            mimeTypeRef.current = mimeType;

            // Create MediaRecorder with high bitrate
            const recorder = new MediaRecorder(combinedStream, {
                mimeType: mimeType,
                videoBitsPerSecond: 8000000, // 8 Mbps for high quality
                audioBitsPerSecond: 128000   // 128k audio
            });

            recordedChunksRef.current = [];

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                    setHasRecordingData(true);
                }
            };

            recorder.onstop = () => {
                console.log('Recording stopped, total chunks:', recordedChunksRef.current.length);
            };

            recorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
            };

            // Start recording with timeslice for partial downloads
            recorder.start(1000); // Capture data every 1 second
            mediaRecorderRef.current = recorder;

            setIsRecording(true);
            setIsPaused(false);

            // Start frame capture loop
            startFrameCapture(getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress);

            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            return false;
        }
    }, [startFrameCapture]);

    /**
     * Pause recording
     */
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.pause();
            setIsPaused(true);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }
    }, []);

    /**
     * Resume recording
     */
    const resumeRecording = useCallback((getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress) => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
            mediaRecorderRef.current.resume();
            setIsPaused(false);

            // Restart frame capture
            startFrameCapture(getSlideData, getLogoSrc, getSlideImageSrc, getVideoElement, getProgress);
        }
    }, [startFrameCapture]);

    /**
     * Stop recording completely
     */
    const stopRecording = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }

        setIsRecording(false);
        setIsPaused(false);
    }, []);

    /**
     * Download current recording as WebM (MP4 requires server-side conversion)
     * The file will play in all modern media players
     */
    const downloadRecording = useCallback(async () => {
        if (recordedChunksRef.current.length === 0) {
            console.warn('No recording data available');
            return false;
        }

        setIsConverting(true);

        // Request any pending data if still recording/paused
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.requestData();
        }

        // Wait for data to be flushed
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
            // Create WebM blob
            const webmBlob = new Blob(recordedChunksRef.current, { type: mimeTypeRef.current });

            // Download as WebM which plays in most modern media players
            // Note: For MP4, you would need server-side conversion with FFmpeg
            const url = URL.createObjectURL(webmBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `lecture-recording-${Date.now()}.webm`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);
            setIsConverting(false);
            return true;
        } catch (error) {
            console.error('Download failed:', error);
            setIsConverting(false);
            return false;
        }
    }, []);

    /**
     * Cleanup resources
     */
    const cleanup = useCallback(() => {
        stopRecording();

        if (recordingStreamRef.current) {
            recordingStreamRef.current.getTracks().forEach(track => track.stop());
            recordingStreamRef.current = null;
        }

        canvasRef.current = null;
        canvasContextRef.current = null;
        recordedChunksRef.current = [];
        imageCache.current.clear();
        setHasRecordingData(false);
    }, [stopRecording]);

    return {
        isRecording,
        isPaused,
        hasRecordingData,
        isConverting,
        startRecording,
        pauseRecording,
        resumeRecording,
        stopRecording,
        downloadRecording,
        cleanup
    };
};

export default useRecorder;
