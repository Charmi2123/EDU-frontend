import { useState, useRef, useEffect } from "react";
import { Download, Circle } from "lucide-react";
import { BACKEND_API_URL } from "../../../utils/assets.js";
import axios from "axios";

const STREAMPIXEL_VIDEO_URL = "https://share.streampixel.io/67375bc07d20a24b406e2e34";
// const STREAMPIXEL_VIDEO_URL = "https://www.youtube.com/embed/05TA9jNnCdU?si=ejoDFiuqQ9rGvyVz&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&fs=0&disablekb=1";

const Typewriter = ({ text, speed = 20 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    setDisplayedText("");
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

export default function UnrealVideo({ fullScreen = true, lecturejson, handleStartClick, isRecording, setIsRecording, showControls, videoRef, isPlaying, setIsPlaying, recognizedText, speechError }) {

  const recordingTimerRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Lecture Board State
  const [slidesData, setSlidesData] = useState([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [currentBulletIndex, setCurrentBulletIndex] = useState(-1);

  // Sync local recording state (for timer)
  useEffect(() => {
    if (isRecording) {
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

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

    // Calculate duration based on current bullet length to allow reading/typing
    let currentBulletText = "";
    if (currentBulletIndex >= 0 && currentBulletIndex < totalBullets) {
      currentBulletText = currentSlide.bullets[currentBulletIndex];
    }

    // Base delay (2s) + typing time (approx 20ms per char) + reading buffer
    let timeoutDuration = 2000 + (currentBulletText.length * 30);

    if (currentBulletIndex >= totalBullets - 1) {
      // Last bullet shown, wait longer before next slide
      timeoutDuration = 8000;
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

  // Format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
                  // Parent handles isPlaying state
                }}
              />

              {isPlaying && (
                <div className="absolute inset-0 bg-linear-to-r from-blue-500/20 to-cyan-500/20 animate-pulse pointer-events-none"></div>
              )}

              {/* Live badge */}
              {/* <div className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-red-900/60 backdrop-blur rounded-full border border-red-600/50 pointer-events-none">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-xs font-semibold text-red-300">LIVE</span>
              </div> */}

              {/* Recording Status Badge */}
              {/* {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-3 px-4 py-2 bg-red-600/80 backdrop-blur-md rounded-full border border-red-400/50 shadow-lg pointer-events-none">
                  <Circle className="w-3 h-3 text-white fill-white animate-pulse" />
                  <span className="text-sm font-bold text-white">REC</span>
                  <span className="text-sm font-mono text-white">{formatTime(recordingTime)}</span>
                </div>
              )} */}

              {/* Classroom Board Overlay */}
              {slidesData.length > 0 && slidesData[currentSlideIndex] && (
                <div className="absolute inset-0 bg-[#1a1a1a] border-12 border-[#5d4037] rounded-none p-8 shadow-2xl pointer-events-none flex flex-col items-center justify-center"
                  style={{
                    fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
                    zIndex: 20
                  }}>
                  {/* Chalk dust effect */}
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/black-chalkboard.png')] opacity-30 pointer-events-none"></div>

                  <div className="relative w-full max-w-5xl h-full flex flex-col justify-center">
                    <h3 className="text-white text-2xl md:text-4xl font-bold mb-6 md:mb-10 border-b-2 border-white/20 pb-4 tracking-wide text-center shrink-0">
                      {slidesData[currentSlideIndex].title}
                    </h3>

                    <ul className="space-y-4 md:space-y-6 px-4 md:px-8">
                      {slidesData[currentSlideIndex].bullets?.map((bullet, idx) => (
                        <li key={idx}
                          className={`transition-all duration-700 flex items-start gap-3 md:gap-4 text-lg md:text-2xl leading-relaxed text-white
                                    ${idx <= currentBulletIndex ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                                `}>
                          <span className="mt-2.5 w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-white shrink-0"></span>
                          {idx === currentBulletIndex ? (
                            <Typewriter text={bullet} speed={20} />
                          ) : (
                            <span>{bullet}</span>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Slide Counter */}
                    <div className="absolute bottom-2 right-4 text-white/30 text-sm md:text-base font-mono">
                      Slide {currentSlideIndex + 1} / {slidesData.length}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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

          {/* Animation styles */}
          <style>{`
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
    </div >
  );
}