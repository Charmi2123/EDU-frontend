// this is without board system
import { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Mic, MicOff, MessageCircle, Download, Circle } from "lucide-react";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";

const STREAMPIXEL_VIDEO_URL = "https://share.streampixel.io/67375bc07d20a24b406e2e34";

export default function UnrealVideo({ fullScreen = true, lecturejson }) {
  const videoRef = useRef(null);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);
  const finalTranscriptRef = useRef("");
  const retryTimeoutRef = useRef(null);

  // Recording refs
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognizedText, setRecognizedText] = useState("");
  const [speechError, setSpeechError] = useState("");

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordingError, setRecordingError] = useState("");
  const [isWaitingPermission, setIsWaitingPermission] = useState(false);

  // Current message state
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentSide, setCurrentSide] = useState('left');
  const [showMessage, setShowMessage] = useState(false);

  // Lecture Board State
  const [slidesData, setSlidesData] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(-1);

  // Fetch lecture data
  useEffect(() => {
    if (lecturejson) {
      const fetchLecture = async () => {
        try {
          let url = lecturejson;
          // Fix path: remove /chapter-materials if present as it causes 404
          url = url.replace('/chapter-materials', '');

          if (!url.startsWith('http')) {
            url = `${BACKEND_API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
          }
          const res = await axios.get(url);
          if (res.data && res.data.slides) {
            setSlidesData(res.data.slides);
          }
        } catch (e) {
          console.error("Failed to fetch lecture json", e);
        }
      };
      fetchLecture();
    }
  }, [lecturejson]);

  // Timer for slides animation
  useEffect(() => {
    if (!isPlaying || slidesData.length === 0) return;

    const currentSlide = slidesData[currentSlideIndex];
    if (!currentSlide) return;

    const totalBullets = currentSlide.bullets ? currentSlide.bullets.length : 0;
    let timeoutDuration = 4000; // 4s per bullet

    if (currentBulletIndex >= totalBullets - 1) {
      // Last bullet shown, wait longer before next slide
      timeoutDuration = 10000;
    }

    const timer = setTimeout(() => {
      if (currentBulletIndex < totalBullets - 1) {
        setCurrentBulletIndex(prev => prev + 1);
      } else if (currentSlideIndex < slidesData.length - 1) {
        setCurrentSlideIndex(prev => prev + 1);
        setCurrentBulletIndex(-1);
      }
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [currentBulletIndex, currentSlideIndex, isPlaying, slidesData]);

  // Auto-play video on mount
  useEffect(() => {
    if (videoRef.current && typeof videoRef.current.play === 'function') {
      videoRef.current.play().catch(() => {
        // Auto-play might be blocked, user needs to click play
      });
    }
  }, []);

  // Speech recognition setup
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setIsListening(true);
        setSpeechError("");
      };

      recognition.onresult = (event) => {
        setSpeechError("");
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const part = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptRef.current += part + " ";
            // Show the recognized text as a message
            showTranscriptMessage(part);
          } else {
            interimTranscript += part;
          }
        }
        const displayText = (
          finalTranscriptRef.current + (interimTranscript ? " " + interimTranscript : "")
        ).trim();
        setRecognizedText(displayText);
      };

      recognition.onerror = (event) => {
        let errorMessage = "";
        let shouldRetry = false;
        switch (event.error) {
          case "no-speech":
            errorMessage = "No speech detected. Listening...";
            shouldRetry = true;
            break;
          case "audio-capture":
            errorMessage = "No microphone found.";
            break;
          case "network":
            errorMessage = "Network error.";
            break;
          case "not-allowed":
            errorMessage = "Microphone access denied.";
            break;
          case "bad-grammar":
            errorMessage = "Speech not recognized.";
            shouldRetry = true;
            break;
          default:
            errorMessage = `Error: ${event.error}`;
        }
        setSpeechError(errorMessage);
        if (shouldRetry && isListeningRef.current) {
          if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch { }
          }, 2000);
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  // Show transcript as alternating side messages
  const showTranscriptMessage = (text) => {
    setShowMessage(false);
    setTimeout(() => {
      setCurrentMessage(text);
      setCurrentSide(prev => prev === 'left' ? 'right' : 'left');
      setShowMessage(true);

      // Hide message after 4 seconds
      setTimeout(() => {
        setShowMessage(false);
      }, 4000);
    }, 300);
  };

  // Simulate messages from video when playing (demo purposes)
  useEffect(() => {
    if (isPlaying) {
      const messages = [
        { text: 'Welcome to today\'s lecture on advanced concepts', side: 'left', delay: 2000 },
        { text: 'We will explore key principles step by step', side: 'right', delay: 5000 },
        { text: 'Understanding these fundamentals is crucial', side: 'left', delay: 8000 },
        { text: 'Let me explain with practical examples', side: 'right', delay: 11000 },
        { text: 'This knowledge will help in real applications', side: 'left', delay: 14000 },
        { text: 'Remember to practice regularly', side: 'right', delay: 17000 },
      ];

      const timers = messages.map(msg =>
        setTimeout(() => {
          setShowMessage(false);
          setTimeout(() => {
            setCurrentMessage(msg.text);
            setCurrentSide(msg.side);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 4000);
          }, 300);
        }, msg.delay)
      );

      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [isPlaying]);

  // Recording timer effect
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Keyboard event listener for Enter key and other controls
  useEffect(() => {
    const handleKeyPress = async (event) => {
      // Prevent default for specific keys
      if (['Escape'].includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case 'Escape':
          // Reset
          handleReset();
          break;
        case 'm':
        case 'M':
          // Toggle microphone
          handleMicrophone();
          break;
        default:
          break;
      }
    };

    // Add event listener to window (works even with iframe)
    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isPlaying, isRecording, recordedVideoUrl]); // Dependencies for handlePlay

  // Start recording function
  const startRecording = async () => {
    try {
      setRecordingError("");
      setIsWaitingPermission(true); // Show waiting state

      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      recordedChunksRef.current = [];

      // Create MediaRecorder
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000 // 2.5 Mbps
      };

      // Fallback to vp8 if vp9 not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setIsRecording(false);

        // Auto-download removed as per request
        // downloadRecording(url);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setRecordingError('Recording error occurred');
        stopRecording();
      };

      // Handle user stopping screen share
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        stopRecording();
      });

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);
      setIsWaitingPermission(false); // Permission granted

      return true; // Recording started successfully

    } catch (err) {
      console.error('Error starting recording:', err);
      setIsWaitingPermission(false); // Permission denied or error

      if (err.name === 'NotAllowedError') {
        setRecordingError('Screen capture permission denied');
      } else if (err.name === 'NotFoundError') {
        setRecordingError('No screen capture source found');
      } else {
        setRecordingError('Failed to start recording');
      }
      return false; // Recording failed
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  // Download recording function
  const downloadRecording = (url) => {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url || recordedVideoUrl;
    a.download = `lecture-recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      if (!url) URL.revokeObjectURL(recordedVideoUrl);
    }, 100);
  };

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlay = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      // Pause video
      if (typeof videoRef.current.pause === 'function') {
        videoRef.current.pause();
      }
      // Stop recording when paused
      if (isRecording) {
        stopRecording();
      }
      setIsPlaying(false);
    } else {
      // Try to start recording first (if not already recorded)
      if (!isRecording && !recordedVideoUrl) {
        const recordingStarted = await startRecording();

        // Only play video if recording started successfully
        if (recordingStarted) {
          if (typeof videoRef.current.play === 'function') {
            videoRef.current.play();
          }
          setIsPlaying(true);
        }
        // If recording failed (permission denied), don't play video
      } else {
        // If already recorded, just play without recording
        if (typeof videoRef.current.play === 'function') {
          videoRef.current.play();
        }
        setIsPlaying(true);
      }
    }
  };

  const handleReset = () => {
    if (videoRef.current) {
      if (typeof videoRef.current.pause === 'function') {
        videoRef.current.pause();
      }
      if ('currentTime' in videoRef.current) {
        try { videoRef.current.currentTime = 0; } catch { }
      }
    }
    setIsPlaying(false);
    setShowMessage(false);
    setCurrentMessage("");

    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Clear recorded video
    if (recordedVideoUrl) {
      URL.revokeObjectURL(recordedVideoUrl);
      setRecordedVideoUrl(null);
    }
    setRecordingTime(0);
    setRecordingError("");

    if (isListeningRef.current && recognitionRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setIsListening(false);
    }
    finalTranscriptRef.current = "";
    setRecognizedText("");
    setSpeechError("");
  };

  const handleMicrophone = () => {
    if (!recognitionRef.current) return;
    if (isListeningRef.current) {
      recognitionRef.current.stop();
      isListeningRef.current = false;
      setIsListening(false);
      setSpeechError("");
    } else {
      finalTranscriptRef.current = "";
      setRecognizedText("");
      setSpeechError("");
      isListeningRef.current = true;
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        isListeningRef.current = false;
        setIsListening(false);
        setSpeechError("Failed to start microphone.");
      }
    }
  };

  const handleClearRecognized = () => {
    finalTranscriptRef.current = "";
    setRecognizedText("");
    setSpeechError("");
    setShowMessage(false);
  };

  return (
    <div className={`${fullScreen ? "min-h-screen" : "w-full h-full"} bg-linear-to-br from-slate-950 via-blue-950 to-slate-950 overflow-hidden`}>
      {/* Background effects */}
      <div className={`${fullScreen ? "fixed" : "absolute"} inset-0 overflow-hidden pointer-events-none`}>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24%,rgba(79,172,254,0.05)_25%,rgba(79,172,254,0.05)_26%,transparent_27%,transparent_74%,rgba(79,172,254,0.05)_75%,rgba(79,172,254,0.05)_76%,transparent_77%,transparent),linear-gradient(90deg,transparent_24%,rgba(79,172,254,0.05)_25%,rgba(79,172,254,0.05)_26%,transparent_27%,transparent_74%,rgba(79,172,254,0.05)_75%,rgba(79,172,254,0.05)_76%,transparent_77%,transparent)] bg-size-[60px_60px]"></div>
      </div>

      <div className={fullScreen ? "relative z-10 min-h-screen" : "relative z-10 w-full h-full"}>
        <div className={fullScreen ? "relative w-screen h-screen" : "relative w-full h-full"}>
          {/* Added pointer-events-none to prevent blocking clicks */}
          <div className="absolute inset-0 border-2 border-cyan-500/30 rounded-3xl pointer-events-none" style={{ boxShadow: '0 0 30px rgba(34, 211, 238, 0.2), inset 0 0 30px rgba(34, 211, 238, 0.1)' }}></div>

          {/* Video container */}
          <div className="absolute inset-0 flex items-center justify-center p-0">
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-black shadow-2xl">
              <iframe
                ref={videoRef}
                src={STREAMPIXEL_VIDEO_URL}
                className="w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ border: 'none' }}
                onLoad={() => {
                  // Try to auto-play when iframe loads
                  setIsPlaying(false);
                }}
              />

              {isPlaying && (
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-cyan-500/20 animate-pulse pointer-events-none"></div>
              )}

              {/* Live badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-red-900/60 backdrop-blur rounded-full border border-red-600/50 pointer-events-none">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-red-300">LIVE</span>
              </div>

              {/* Status indicator - Moved to Top Right below LIVE badge to avoid blocking bottom controls */}
              <div className="absolute top-16 right-4 flex flex-col items-end gap-2 pointer-events-none">
                <div className="flex items-center justify-center gap-3 text-cyan-300">
                  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                  <span className="text-xs uppercase tracking-widest">Connected</span>
                </div>

                {/* Keyboard shortcuts hint - Updated */}
                <div className="text-[10px] text-cyan-400/60 text-right space-y-0.5">
                  <div>⌨️ <kbd className="px-1 py-0.5 bg-cyan-500/10 rounded">Esc</kbd> Reset</div>
                  <div>⌨️ <kbd className="px-1 py-0.5 bg-cyan-500/10 rounded">M</kbd> Mic</div>
                </div>
              </div>

              {/* Recording Status Badge */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-3 px-4 py-2 bg-red-600/80 backdrop-blur-md rounded-full border border-red-400/50 shadow-lg pointer-events-none">
                  <Circle className="w-3 h-3 text-white fill-white animate-pulse" />
                  <span className="text-sm font-bold text-white">REC</span>
                  <span className="text-sm font-mono text-white">{formatTime(recordingTime)}</span>
                </div>
              )}

              {/* Waiting for Permission Badge */}
              {isWaitingPermission && (
                <div className="absolute top-4 left-4 flex items-center gap-3 px-4 py-2 bg-yellow-600/80 backdrop-blur-md rounded-full border border-yellow-400/50 shadow-lg animate-pulse pointer-events-none">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-bold text-white">Waiting for permission...</span>
                </div>
              )}

              {/* Download Button (appears after recording) */}
              {recordedVideoUrl && !isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <button
                    onClick={() => downloadRecording()}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/80 hover:bg-green-500/90 backdrop-blur-md rounded-full border border-green-400/50 shadow-lg transition-all duration-300 pointer-events-auto"
                    title="Download Recording"
                  >
                    <Download className="w-4 h-4 text-white" />
                    <span className="text-sm font-semibold text-white">Download Recording</span>
                  </button>
                </div>
              )}

              {/* Classroom Board Overlay */}
              {slidesData.length > 0 && slidesData[currentSlideIndex] && (
                <div className="absolute top-20 right-8 w-[35%] min-w-[300px] bg-[#1a1a1a]/90 border-[6px] border-[#5d4037] rounded-lg p-6 shadow-2xl backdrop-blur-sm pointer-events-none origin-top-right transform transition-all duration-500"
                  style={{
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.05)'
                  }}>
                  {/* Chalk dust effect */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-chalkboard.png')] opacity-30 pointer-events-none"></div>

                  <h3 className="relative text-white text-2xl font-bold mb-6 border-b-2 border-white/20 pb-3 tracking-wide">
                    {slidesData[currentSlideIndex].title}
                  </h3>

                  <ul className="relative space-y-4">
                    {slidesData[currentSlideIndex].bullets?.map((bullet, idx) => (
                      <li key={idx}
                        className={`transition-all duration-700 flex items-start gap-3 text-lg leading-relaxed
                                    ${idx <= currentBulletIndex ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                                    ${idx === currentBulletIndex ? 'text-[#ffd700] scale-[1.02] font-semibold' : 'text-gray-100'}
                                `}>
                        <span className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${idx === currentBulletIndex ? 'bg-[#ffd700]' : 'bg-white'}`}></span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Slide Counter */}
                  <div className="absolute bottom-3 right-4 text-white/40 text-sm font-mono">
                    Slide {currentSlideIndex + 1} / {slidesData.length}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recording Error Display */}
          {recordingError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl p-3 bg-linear-to-r from-red-900/70 to-orange-900/70 backdrop-blur-md rounded-lg border border-red-500/50 text-center shadow-xl pointer-events-none">
              <p className="text-red-200 text-sm font-medium">{recordingError}</p>
            </div>
          )}

          {/* Alternating message - LEFT side */}
          {showMessage && currentSide === 'left' && (
            <div className="absolute left-6 top-1/2 -translate-y-1/2 w-96 pointer-events-none">
              <div className="relative p-6 rounded-2xl border border-purple-500/50 bg-purple-900/30 backdrop-blur-xl text-slate-100 shadow-2xl"
                style={{
                  animation: 'slideInLeft 0.5s ease-out',
                  boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)'
                }}>
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rotate-45 bg-purple-900/30 border-r border-t border-purple-500/50"></div>
                <p className="text-base leading-relaxed text-purple-50">{currentMessage}</p>
              </div>
            </div>
          )}

          {/* Alternating message - RIGHT side */}
          {showMessage && currentSide === 'right' && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-96 pointer-events-none">
              <div className="relative p-6 rounded-2xl border border-emerald-500/50 bg-emerald-900/30 backdrop-blur-xl text-slate-100 shadow-2xl"
                style={{
                  animation: 'slideInRight 0.5s ease-out',
                  boxShadow: '0 0 30px rgba(16, 185, 129, 0.3)'
                }}>
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rotate-45 bg-emerald-900/30 border-l border-b border-emerald-500/50"></div>
                <p className="text-base leading-relaxed text-emerald-50">{currentMessage}</p>
              </div>
            </div>
          )}

          {/* Recognized speech overlay */}
          {recognizedText && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-3xl p-4 bg-linear-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-md rounded-xl border border-green-500/50 text-center pointer-events-none">
              <p className="text-cyan-100 text-lg font-medium">{recognizedText}</p>
            </div>
          )}

          {/* Error overlay */}
          {speechError && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl p-3 bg-linear-to-r from-red-900/50 to-orange-900/50 backdrop-blur-md rounded-lg border border-red-500/50 text-center pointer-events-none">
              <p className="text-red-200 text-sm">{speechError}</p>
            </div>
          )}

          {/* Controls overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-6">
            <button
              onClick={handleMicrophone}
              className={`p-4 rounded-full border-2 transition-all duration-300 ${isListening
                ? "border-red-500 bg-red-500/20 text-red-400 shadow-lg shadow-red-500/50"
                : "border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50"
                }`}
              title={isListening ? "Stop Listening" : "Start Listening"}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            <button
              onClick={handlePlay}
              className={`p-4 rounded-full border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300`}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>

            <button
              onClick={handleClearRecognized}
              className="p-4 rounded-full border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              title="Clear Chat"
            >
              <MessageCircle className="w-6 h-6" />
            </button>

            <button
              onClick={handleReset}
              className="p-4 rounded-full border-2 border-cyan-500 bg-cyan-500/10 text-cyan-400 hover:shadow-lg hover:shadow-cyan-500/50 transition-all duration-300"
              title="Reset"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          {/* Animation styles */}
          <style>{`
            @keyframes slideInLeft {
              from {
                opacity: 0;
                transform: translateX(-50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            @keyframes slideInRight {
              from {
                opacity: 0;
                transform: translateX(50px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}