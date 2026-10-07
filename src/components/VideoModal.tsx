import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export function VideoModal({ isOpen, onClose, lang }: VideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const showcaseSlides = [
    {
      title: lang === 'ar' ? 'منصة تطبيقات وزارة النقل — 78 تطبيق' : 'Transportation GIS Platform — 78 Apps',
      sub: 'GIS / Transport Infrastructure',
      img: '/screenshots/transport-live.jpg',
    },
    {
      title: lang === 'ar' ? 'شبكات المرافق والبنية التحتية الذكية' : 'Smart Utilities & Infrastructure GIS',
      sub: 'Water Networks / Roads / Civil Systems',
      img: '/screenshots/smart-infra-overview.webp',
    },
    {
      title: lang === 'ar' ? 'أتمتة الجيوداتابيس ونماذج GIS المتقدمة' : 'Geodatabase Automation & ModelBuilder GIS',
      sub: 'ArcGIS ModelBuilder / Spatial Automation',
      img: '/screenshots/gis-automator-main.webp',
    },
  ];

  useEffect(() => {
    if (!videoError || !isPlaying || !isOpen) return;
    const interval = setInterval(() => {
      setActiveSlide(s => (s + 1) % showcaseSlides.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [videoError, isPlaying, isOpen, showcaseSlides.length]);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
      if (e.key.toLowerCase() === 'm') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const togglePlay = () => {
    if (videoError) {
      setIsPlaying(p => !p);
      return;
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => setVideoError(true));
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          onClick={e => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative w-full max-w-4xl bg-[#0e171e] border border-[var(--line)]/30 rounded-none shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#20323e] bg-[#091016]">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[var(--teal)] animate-pulse" />
                <span className="font-mono text-[10px] tracking-wider text-[var(--teal)] uppercase">
                  {lang === 'ar' ? 'العرض المرئي للمشروع · وثائقي نُطق' : 'SHOWCASE REEL · NOTAQ PORTFOLIO'}
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={lang === 'ar' ? 'إغلاق الفيديو' : 'Close video'}
                className="w-8 h-8 flex items-center justify-center text-[#95a7a2] hover:text-white border border-[#20323e] hover:border-[var(--teal)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Video Canvas */}
            <div className="relative aspect-video bg-black flex items-center justify-center group overflow-hidden">
              {!videoError ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                  onError={() => setVideoError(true)}
                  className="w-full h-full object-contain cursor-pointer"
                >
                  <source src="/notaq-showcase.mp4" type="video/mp4" />
                </video>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center bg-[#071118]">
                  <img
                    src={showcaseSlides[activeSlide].img}
                    alt={showcaseSlides[activeSlide].title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white font-mono">
                        {showcaseSlides[activeSlide].title}
                      </p>
                      <p className="text-[10px] text-[var(--teal)] font-mono">
                        {showcaseSlides[activeSlide].sub}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide(
                            s => (s - 1 + showcaseSlides.length) % showcaseSlides.length
                          )
                        }
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-mono cursor-pointer"
                        aria-label="Previous slide"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlide(s => (s + 1) % showcaseSlides.length)
                        }
                        className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs font-mono cursor-pointer"
                        aria-label="Next slide"
                      >
                        →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Big central play overlay when paused */}
              {!isPlaying && !videoError && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[var(--teal)]/90 text-[#10221e] flex items-center justify-center shadow-xl hover:scale-110 transition-transform cursor-pointer"
                >
                  <Play size={28} className="translate-x-0.5 fill-current" />
                </button>
              )}
            </div>

            {/* Controls Bar */}
            <div className="px-5 py-3 bg-[#091016] border-t border-[#20323e] flex flex-col gap-2">
              {/* Progress Scrubber */}
              <div
                onClick={handleSeek}
                className="relative h-1.5 bg-[#1b2b36] hover:h-2.5 transition-all cursor-pointer rounded-full overflow-hidden"
              >
                <div
                  className="absolute top-0 bottom-0 inset-inline-start-0 bg-[var(--teal)]"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Button Controls */}
              <div className="flex items-center justify-between text-xs text-[#a0afb5] pt-1">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="p-1 hover:text-white transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="p-1 hover:text-white transition-colors"
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <span className="font-mono text-[10px]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-[#6c7d84] hidden sm:inline">
                    {lang === 'ar' ? 'مسافة = إيقاف · M = كتم الصوت' : 'SPACE = Play/Pause · M = Mute'}
                  </span>
                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    className="p-1 hover:text-white transition-colors"
                    aria-label="Fullscreen"
                  >
                    <Maximize2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
