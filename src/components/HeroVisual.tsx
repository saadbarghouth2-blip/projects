import { useState, useRef } from 'react';
import { Play, Sparkles, ZoomIn } from 'lucide-react';
import { motion } from 'motion/react';

interface Project {
  id: string;
  en: string;
  ar: string;
  group: string;
  origin: string;
  screenshot: string | null;
  screenshotAudit?: { state?: string };
}

interface HeroVisualProps {
  projects: Project[];
  lang: 'en' | 'ar';
  onOpenVideo: () => void;
  onOpenLightbox: (src: string, title: string) => void;
}

export function HeroVisual({ projects, lang, onOpenVideo, onOpenLightbox }: HeroVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  const primary = projects.find(
    p => p.id === 'transport' && p.screenshotAudit?.state === 'verified' && p.screenshot
  ) || projects.find(p => p.id === 'transport');
  const secondary = projects.find(
    p => p.id === 'smart-infra' && p.screenshotAudit?.state === 'verified' && p.screenshot
  ) || projects.find(p => p.id === 'smart-infra');

  const [primarySrc, setPrimarySrc] = useState(
    primary?.screenshot || '/screenshots/transport-dashboard-49446055c2.webp'
  );
  const [secondarySrc, setSecondarySrc] = useState(
    secondary?.screenshot || '/screenshots/smart-infra-overview.webp'
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({
      x: (-y / rect.height) * 12,
      y: (x / rect.width) * 12,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  if (!primary || !secondary) {
    return <div className="hero-evidence-loading" aria-hidden="true" />;
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1200 }}
      className="hero-evidence group relative select-none"
      aria-label={lang === 'ar' ? 'لقطات أصلية موثقة من المشاريع' : 'Verified original project screenshots'}
    >
      {/* 3D Moving Wrapper */}
      <motion.div
        animate={{ rotateX: rotate.x, rotateY: rotate.y }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full h-full relative"
      >
        {/* Main Background Card */}
        <figure
          onClick={() => onOpenLightbox(primarySrc, lang === 'ar' ? primary.ar : primary.en)}
          className="hero-shot hero-shot-main cursor-pointer hover:border-[var(--teal)] transition-all"
        >
          <img
            src={primarySrc}
            alt={lang === 'ar' ? `لقطة حقيقية من ${primary.ar}` : `Original screen from ${primary.en}`}
            fetchPriority="high"
            onError={() => setPrimarySrc('/screenshots/transport-dashboard-49446055c2.webp')}
          />
          <figcaption>
            {primary.group} / {primary.origin}
          </figcaption>
        </figure>

        {/* Overlay Card */}
        <figure
          onClick={() => onOpenLightbox(secondarySrc, lang === 'ar' ? secondary.ar : secondary.en)}
          className="hero-shot hero-shot-overlay cursor-pointer hover:border-[var(--teal)] transition-all"
        >
          <img
            src={secondarySrc}
            alt={lang === 'ar' ? `لقطة حقيقية من ${secondary.ar}` : `Original screen from ${secondary.en}`}
            loading="lazy"
            onError={() => setSecondarySrc('/screenshots/smart-infra-overview.webp')}
          />
          <figcaption>
            {secondary.group} / {secondary.origin}
          </figcaption>
        </figure>

        {/* Video Reel Floating Action Trigger with Frosted Glass Transparency */}
        <motion.button
          type="button"
          onClick={onOpenVideo}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="absolute bottom-2 sm:bottom-3 inset-inline-start-2 sm:inset-inline-start-4 z-20 flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-4 sm:py-2.5 bg-[#0b141ab8] hover:bg-[#0b141ae6] backdrop-blur-md text-white border border-white/20 hover:border-[var(--teal)] rounded-full shadow-2xl transition-all cursor-pointer group/btn"
          aria-label={lang === 'ar' ? 'مشاهدة العرض المرئي للمشروع' : 'Watch Project Reel'}
        >
          <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--teal)] text-[#10221e] flex items-center justify-center transition-transform group-hover/btn:scale-110 shadow-sm shrink-0">
            <Play size={10} className="translate-x-0.5 fill-current" />
          </span>
          <span className="text-[9.5px] sm:text-[11px] font-mono font-bold tracking-wider uppercase text-white drop-shadow-sm whitespace-nowrap">
            {lang === 'ar' ? 'عرض مرئي وثائقي' : 'WATCH SHOWCASE REEL'}
          </span>
        </motion.button>
      </motion.div>

      <span className="hero-evidence-label">
        {lang === 'ar' ? 'واجهات أصلية من الأرشيف' : 'ORIGINAL PROJECT SCREENS'}
      </span>
    </div>
  );
}
