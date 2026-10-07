import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectLightboxProps {
  isOpen: boolean;
  imageSrc: string | null;
  title: string;
  onClose: () => void;
  lang: 'en' | 'ar';
}

export function ProjectLightbox({ isOpen, imageSrc, title, onClose, lang }: ProjectLightboxProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setScale(1);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(3, s + 0.25));
      if (e.key === '-' || e.key === '_') setScale(s => Math.max(0.75, s - 0.25));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg"
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Lightbox Toolbar */}
        <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-white border-b border-white/10 text-xs font-mono">
          <div className="truncate max-w-[60%] text-[#a3b8b0]">
            <span className="text-[var(--teal)] font-bold">SCREENSHOT /</span> {title}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setScale(s => Math.min(3, s + 0.25))}
              className="p-1.5 hover:text-[var(--teal)] transition-colors"
              title={lang === 'ar' ? 'تكبير (+)' : 'Zoom In (+)'}
              aria-label={lang === 'ar' ? 'تكبير (+)' : 'Zoom In (+)'}
            >
              <ZoomIn size={16} />
            </button>
            <button
              type="button"
              onClick={() => setScale(s => Math.max(0.75, s - 0.25))}
              className="p-1.5 hover:text-[var(--teal)] transition-colors"
              title={lang === 'ar' ? 'تصغير (-)' : 'Zoom Out (-)'}
              aria-label={lang === 'ar' ? 'تصغير (-)' : 'Zoom Out (-)'}
            >
              <ZoomOut size={16} />
            </button>
            <button
              type="button"
              onClick={() => setScale(1)}
              className="p-1.5 hover:text-[var(--teal)] transition-colors"
              title={lang === 'ar' ? 'إعادة ضبط الحجم' : 'Reset Zoom'}
              aria-label={lang === 'ar' ? 'إعادة ضبط الحجم' : 'Reset Zoom'}
            >
              <Maximize2 size={16} />
            </button>
            <a
              href={imageSrc}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 hover:text-[var(--teal)] transition-colors"
              title={lang === 'ar' ? 'فتح الصورة الأصلية' : 'Open Raw Image'}
              aria-label={lang === 'ar' ? 'فتح الصورة الأصلية' : 'Open Raw Image'}
            >
              <ExternalLink size={16} />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:text-[var(--teal)] transition-colors border border-white/20"
              title={lang === 'ar' ? 'إغلاق (ESC)' : 'Close (ESC)'}
              aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative flex-1 w-full max-w-5xl overflow-auto flex items-center justify-center py-4">
          <motion.img
            src={imageSrc}
            alt={title}
            style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="max-h-[85vh] max-w-full object-contain cursor-grab active:cursor-grabbing shadow-2xl border border-white/10"
          />
        </div>

        <div className="pt-2 text-[10px] font-mono text-[#768b8e]">
          {lang === 'ar' ? 'انقر على الصورة للتكبير أو استخدم +/-' : 'Use +/- to zoom · ESC to close'}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
