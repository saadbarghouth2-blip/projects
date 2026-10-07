import { useEffect, useRef, useState, useCallback, useMemo, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import {
  X,
  ExternalLink,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ZoomIn,
  Smartphone,
  Globe,
  Image as ImageIcon,
  AlertCircle,
  Calendar,
  Clock,
  Activity,
} from 'lucide-react';
import { motion, type Variants } from 'motion/react';
import { ProjectTimeline } from './ProjectTimeline';
import { getProjectDateInfo } from '../lib/projectTimeline';

const roadNames: Record<string, { en: string; ar: string }> = {
  'Cairo–Ismailia': { en: 'Cairo–Ismailia Corridor', ar: 'محور القاهرة — الإسماعيلية' },
  'Cairo–Suez': { en: 'Cairo–Suez Corridor', ar: 'محور القاهرة — السويس' },
  'Eastern Regional Ring Road': { en: 'Eastern Regional Ring Road', ar: 'الطريق الدائري الإقليمي الشرقي' },
  'Western Upper Egypt': { en: 'Western Upper Egypt Corridor', ar: 'محور غرب الصعيد' },
  'Dabaa': { en: 'El-Dabaa Axis', ar: 'محور الضبعة' },
  'Kalabsha': { en: 'Kalabsha Axis (Aswan)', ar: 'محور كلابشة (أسوان)' },
  'Qus': { en: 'Qus Axis (Qena)', ar: 'محور قوص (قنا)' },
  'South Dahshur': { en: 'South Dahshur Corridor', ar: 'محور جنوب دهشور' },
  'Qena–Luxor': { en: 'Qena–Luxor Corridor', ar: 'محور قنا — الأقصر' },
};

const drawerContentVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
};

const drawerSectionVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface Project {
  id: string;
  en: string;
  ar: string;
  group: string;
  sub: string;
  desc: string;
  arDesc: string;
  url: string | null;
  sourceUrl: string | null;
  tags: string[];
  featured: boolean;
  origin: string;
  status: string;
  screenshot: string | null;
  gallery?: string[];
  road?: string;
  parentId?: string;
  duplicateOf?: string;
  screenshotAudit?: { state?: string; evidence?: string; source?: string | null };
  startYear?: number | string;
  completionYear?: number | string;
  endYear?: number | string;
  year?: number | string;
  timeline?: {
    startYear?: number | string;
    completionYear?: number | string;
  };
}

interface ProjectDrawerProps {
  project: Project;
  projects: Project[];
  filteredProjects?: Project[];
  lang: 'en' | 'ar';
  onClose: () => void;
  onSelect: (id: string) => void;
  onFilterByTag: (tag: string) => void;
  onOpenLightbox: (src: string, title: string) => void;
  onFilterByGroup?: (group: string) => void;
  onFilterByOrigin?: (origin: string) => void;
  onResetFilters?: () => void;
}

export function ProjectDrawer({
  project,
  projects,
  filteredProjects,
  lang,
  onClose,
  onSelect,
  onFilterByTag,
  onOpenLightbox,
  onFilterByGroup,
  onFilterByOrigin,
  onResetFilters,
}: ProjectDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const galleryRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const relatedRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Navigate through the active filtered projects list
  const activeList = filteredProjects && filteredProjects.length > 0 ? filteredProjects : projects;
  const distinctProjects = activeList.filter(p => !p.duplicateOf);
  const currentIndex = distinctProjects.findIndex(p => p.id === project.id);
  const totalCount = distinctProjects.length;

  // Browsing progress through filtered list (1-indexed percentage, clamped 0-100)
  const progressPercent =
    totalCount > 0 && currentIndex >= 0
      ? Math.min(100, Math.max(0, ((currentIndex + 1) / totalCount) * 100))
      : 0;

  // Cycle through the filtered list (wrap around smoothly)
  const prevProject =
    totalCount > 1
      ? currentIndex > 0
        ? distinctProjects[currentIndex - 1]
        : distinctProjects[totalCount - 1]
      : null;
  const nextProject =
    totalCount > 1
      ? currentIndex >= 0 && currentIndex < totalCount - 1
        ? distinctProjects[currentIndex + 1]
        : distinctProjects[0]
      : null;

  const handlePrev = useCallback(() => {
    if (prevProject) onSelect(prevProject.id);
  }, [prevProject, onSelect]);

  const handleNext = useCallback(() => {
    if (nextProject) onSelect(nextProject.id);
  }, [nextProject, onSelect]);

  const verifiedImages =
    project.screenshotAudit?.state === 'verified'
      ? [...new Set([project.screenshot, ...(project.gallery || [])].filter((x): x is string => !!x))]
      : [];

  const alternateDeployments = projects.filter(p => p.duplicateOf === project.id);
  const contextualRelated = projects.filter(
    p =>
      p.id !== project.id &&
      p.duplicateOf !== project.id &&
      (p.parentId === project.id ||
        project.parentId === p.id ||
        (p.group === project.group && p.origin === project.origin))
  );
  const related = [
    ...alternateDeployments,
    ...contextualRelated.slice(0, Math.max(0, 5 - alternateDeployments.length)),
  ];

  const title = lang === 'ar' ? project.ar : project.en;
  const desc = lang === 'ar' ? project.arDesc : project.desc;
  const startYear = project.startYear ?? project.timeline?.startYear;
  const completionYear = project.completionYear ?? project.endYear ?? project.timeline?.completionYear;

  // Compute detailed project date info from available start/completion fields
  const dateInfo = useMemo(() => {
    const idx = projects.findIndex(p => p.id === project.id);
    return getProjectDateInfo(
      project.id,
      project.group,
      project.status,
      Math.max(0, idx),
      startYear,
      completionYear
    );
  }, [project.id, project.group, project.status, startYear, completionYear, projects]);

  // Compute total duration in years & months
  const durationStats = useMemo(() => {
    const months = dateInfo.durationMonths;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    let formattedDurationEn = '';
    let formattedDurationAr = '';

    if (years > 0 && remainingMonths > 0) {
      formattedDurationEn = `${years} ${years === 1 ? 'year' : 'years'}, ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
      formattedDurationAr = `${years === 1 ? 'سنة واحدة' : years === 2 ? 'سنتان' : `${years} سنوات`} و${remainingMonths === 1 ? 'شهر واحد' : remainingMonths === 2 ? 'شهران' : `${remainingMonths} أشهر`}`;
    } else if (years > 0) {
      formattedDurationEn = `${years} ${years === 1 ? 'year' : 'years'}`;
      formattedDurationAr = years === 1 ? 'سنة واحدة' : years === 2 ? 'سنتان' : `${years} سنوات`;
    } else {
      formattedDurationEn = `${months} ${months === 1 ? 'month' : 'months'}`;
      formattedDurationAr = months === 1 ? 'شهر واحد' : months === 2 ? 'شهران' : `${months} أشهر`;
    }

    return {
      months,
      years,
      remainingMonths,
      formattedDurationEn,
      formattedDurationAr,
      monthsLabelEn: `${months} ${months === 1 ? 'month' : 'months'} total`,
      monthsLabelAr: `${months} ${months <= 10 ? 'أشهر' : 'شهراً'} إجمالاً`,
    };
  }, [dateInfo.durationMonths]);

  // Compute project phase status and lifecycle classification
  const phaseStatus = useMemo(() => {
    const isLive = project.status === 'live';
    const isPreview = project.status === 'preview';
    const isCase = project.status === 'case';
    const isConcept = project.status === 'concept';

    if (isLive) {
      return {
        code: 'live',
        labelEn: 'Production / Live',
        labelAr: 'في الإنتاج / تشغيل مباشر',
        subEn: 'Active Deployment',
        subAr: 'نشر نشط ومتاح',
        dotClass: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]',
      };
    }
    if (isPreview) {
      return {
        code: 'preview',
        labelEn: 'Staging / Preview',
        labelAr: 'معاينة تجريبية منشورة',
        subEn: 'Deployment Staging',
        subAr: 'بيئة استعراض واختبار',
        dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]',
      };
    }
    if (isCase) {
      return {
        code: 'case',
        labelEn: 'Case Study',
        labelAr: 'دراسة حالة وتوثيق',
        subEn: 'Documented Record',
        subAr: 'سجل تحليلي ومعماري',
        dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]',
      };
    }
    if (isConcept) {
      return {
        code: 'concept',
        labelEn: 'Concept / Research',
        labelAr: 'تصور وبحث مفاهيمي',
        subEn: 'Design Exploration',
        subAr: 'استكشاف وتطوير تجريبي',
        dotClass: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.7)]',
      };
    }
    return {
      code: 'catalog',
      labelEn: 'Archived / Complete',
      labelAr: 'مكتمل ومؤرشف',
      subEn: 'Catalog Milestone',
      subAr: 'مرحلة منجزة وموثقة',
      dotClass: 'bg-[var(--teal)] shadow-[0_0_8px_rgba(32,184,150,0.7)]',
    };
  }, [project.status]);

  const copyLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('project', project.id);
    navigator.clipboard.writeText(url.toString());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reportIssueSubject = `[Issue Report] Project ID: ${project.id} - ${project.en}`;
  const reportIssueBody =
    lang === 'ar'
      ? `مرحباً سعد،\n\nأود الإبلاغ عن مشكلة أو تصحيح بخصوص سجل المشروع:\n\n• معرّف المشروع: ${project.id}\n• عنوان المشروع: ${project.ar} (${project.en})\n• الرابط المسجل: ${project.url || 'لا يوجد'}\n\nتفاصيل المشكلة:\n[اكتب التفاصيل هنا]\n`
      : `Hello Saad,\n\nI would like to report an issue or correction regarding this project record:\n\n• Project ID: ${project.id}\n• Project Title: ${project.en} (${project.ar})\n• Recorded URL: ${project.url || 'N/A'}\n\nIssue Details:\n[Please write details here]\n`;

  const reportIssueHref = `mailto:saad@barghouth.me?subject=${encodeURIComponent(
    reportIssueSubject
  )}&body=${encodeURIComponent(reportIssueBody)}`;

  const nextImage = useCallback(() => {
    if (verifiedImages.length <= 1) return;
    setActiveImageIdx(prev => (prev + 1) % verifiedImages.length);
  }, [verifiedImages.length]);

  const prevImage = useCallback(() => {
    if (verifiedImages.length <= 1) return;
    setActiveImageIdx(prev => (prev - 1 + verifiedImages.length) % verifiedImages.length);
  }, [verifiedImages.length]);

  // Reset indices and scroll position on project switch
  useEffect(() => {
    setActiveImageIdx(0);
    setShowSimulator(false);
    if (drawerRef.current) {
      drawerRef.current.scrollTop = 0;
    }
  }, [project.id]);

  // Lock body scroll while drawer is open
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, []);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;

  // Smoothly scroll active gallery thumbnail into view
  useEffect(() => {
    galleryRefs.current[activeImageIdx]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [activeImageIdx]);

  // Global key navigation within ProjectDrawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      const activeEl = document.activeElement as HTMLElement | null;
      const isRelatedFocused = activeEl && relatedRefs.current.includes(activeEl as HTMLButtonElement);
      const isGalleryFocused = activeEl && galleryRefs.current.includes(activeEl as HTMLButtonElement);

      // If user is focused on related records or gallery thumbnails, let their scoped handlers manage navigation
      if (isRelatedFocused || isGalleryFocused) {
        return;
      }

      // If user holds Shift or Alt with ArrowLeft / ArrowRight, navigate between projects in the archive
      if (e.shiftKey || e.altKey) {
        if (e.key === 'ArrowRight') {
          if (lang === 'ar') handlePrev();
          else handleNext();
        } else if (e.key === 'ArrowLeft') {
          if (lang === 'ar') handleNext();
          else handlePrev();
        }
        return;
      }

      // ArrowLeft / ArrowRight navigation:
      // If multiple images exist in gallery, navigate images!
      // If only 1 image exists, cycle through filtered projects!
      if (e.key === 'ArrowRight') {
        if (verifiedImages.length > 1) {
          e.preventDefault();
          if (lang === 'ar') prevImage();
          else nextImage();
        } else {
          if (lang === 'ar') handlePrev();
          else handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (verifiedImages.length > 1) {
          e.preventDefault();
          if (lang === 'ar') nextImage();
          else prevImage();
        } else {
          if (lang === 'ar') handleNext();
          else handlePrev();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lang, verifiedImages.length, prevProject, nextProject, onClose, onSelect, nextImage, prevImage]);

  // Gallery Thumbnail Arrow Key Navigation
  const handleGalleryKeyDown = (e: ReactKeyboardEvent, idx: number) => {
    if (verifiedImages.length <= 1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % verifiedImages.length;
      setActiveImageIdx(next);
      galleryRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + verifiedImages.length) % verifiedImages.length;
      setActiveImageIdx(prev);
      galleryRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveImageIdx(0);
      galleryRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      const last = verifiedImages.length - 1;
      setActiveImageIdx(last);
      galleryRefs.current[last]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const currentSrc = verifiedImages[idx];
      if (currentSrc) onOpenLightbox(currentSrc, title);
    }
  };

  // Related Records Arrow Key Navigation
  const handleRelatedKeyDown = (e: ReactKeyboardEvent, idx: number) => {
    if (related.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      // In 2-col grid, go down by 2 or down by 1
      const next = idx + 2 < related.length ? idx + 2 : (idx + 1) % related.length;
      relatedRefs.current[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = idx - 2 >= 0 ? idx - 2 : (idx - 1 + related.length) % related.length;
      relatedRefs.current[prev]?.focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = (idx + 1) % related.length;
      relatedRefs.current[next]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = (idx - 1 + related.length) % related.length;
      relatedRefs.current[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      relatedRefs.current[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      relatedRefs.current[related.length - 1]?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(related[idx].id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="dialog-backdrop"
      role="presentation"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={drawerRef}
        initial={isMobile ? { y: '100%' } : { x: lang === 'ar' ? '-100%' : '100%' }}
        animate={isMobile ? { y: 0 } : { x: 0 }}
        exit={isMobile ? { y: '100%' } : { x: lang === 'ar' ? '-100%' : '100%' }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 280,
          mass: 0.8,
        }}
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-dialog-title"
        data-testid="dialog-project"
      >
        {/* Mobile Pull/Drag Indicator Handle */}
        <div className="w-10 h-1 bg-[var(--line)] rounded-full mx-auto my-2 sm:hidden shrink-0" />

        {/* Navigation & Actions Topbar */}
        <div className="dialog-head">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] text-[var(--muted)] tracking-wider">
              {lang === 'ar' ? 'سجل الأرشيف' : 'ARCHIVE RECORD'}
            </span>

            {/* Quick Prev / Next Project Navigator */}
            <div
              className="flex items-center gap-1 border border-[var(--line)] bg-[var(--soft)] p-0.5 rounded"
              role="group"
              aria-label={lang === 'ar' ? 'التنقل بين المشاريع المصفاة' : 'Cycle filtered projects'}
              data-testid="project-navigation-top"
            >
              <button
                type="button"
                disabled={!prevProject}
                onClick={handlePrev}
                className="h-7 px-2 sm:px-2.5 flex items-center gap-1 text-[9.5px] font-mono hover:text-[var(--teal)] hover:bg-[var(--card)] disabled:opacity-30 disabled:pointer-events-none transition-colors rounded cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
                title={prevProject ? `${lang === 'ar' ? prevProject.ar : prevProject.en} (Shift+←)` : undefined}
                aria-label={lang === 'ar' ? 'المشروع السابق' : 'Previous project'}
                data-testid="button-prev-project"
              >
                <ChevronLeft size={13} className={lang === 'ar' ? 'rotate-180' : ''} />
                <span className="hidden sm:inline font-semibold">{lang === 'ar' ? 'السابق' : 'Previous'}</span>
              </button>

              <span
                className="text-[9px] font-mono text-[var(--muted)] px-1 select-none font-semibold"
                data-testid="project-counter"
              >
                {currentIndex >= 0 ? `${currentIndex + 1} / ${totalCount}` : `— / ${totalCount}`}
              </span>

              <button
                type="button"
                disabled={!nextProject}
                onClick={handleNext}
                className="h-7 px-2 sm:px-2.5 flex items-center gap-1 text-[9.5px] font-mono hover:text-[var(--teal)] hover:bg-[var(--card)] disabled:opacity-30 disabled:pointer-events-none transition-colors rounded cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
                title={nextProject ? `${lang === 'ar' ? nextProject.ar : nextProject.en} (Shift+→)` : undefined}
                aria-label={lang === 'ar' ? 'المشروع التالي' : 'Next project'}
                data-testid="button-next-project"
              >
                <span className="hidden sm:inline font-semibold">{lang === 'ar' ? 'التالي' : 'Next'}</span>
                <ChevronRight size={13} className={lang === 'ar' ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Copy Link Button */}
            <button
              type="button"
              onClick={copyLink}
              className="h-8 px-2.5 flex items-center gap-1.5 border border-[var(--line)] text-[10px] font-mono hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
              title={lang === 'ar' ? 'نسخ رابط المشروع' : 'Copy direct link'}
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              <span>{copied ? (lang === 'ar' ? 'تم النسخ!' : 'Copied!') : (lang === 'ar' ? 'مشاركة' : 'Share')}</span>
            </button>

            {/* Close Button */}
            <button
              className="dialog-close focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
              type="button"
              onClick={onClose}
              aria-label={lang === 'ar' ? 'إغلاق تفاصيل المشروع' : 'Close project details'}
              data-testid="button-close-project"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <nav
          aria-label={lang === 'ar' ? 'مسار التنقل والتصفية' : 'Breadcrumb filter navigation'}
          className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-[var(--soft)]/80 border-b border-[var(--line)] flex items-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-[11px] font-mono text-[var(--muted)] flex-wrap"
          data-testid="drawer-breadcrumbs"
        >
          <button
            type="button"
            onClick={onResetFilters}
            className="hover:text-[var(--teal)] transition-colors cursor-pointer flex items-center gap-1"
            title={lang === 'ar' ? 'عرض كل مشاريع الأرشيف' : 'View all archive projects'}
          >
            <span>{lang === 'ar' ? 'الأرشيف' : 'Archive'}</span>
          </button>

          <ChevronRight size={11} className={`text-[var(--muted)]/50 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />

          <button
            type="button"
            onClick={() => onFilterByGroup?.(project.group)}
            className="hover:text-[var(--teal)] hover:underline underline-offset-2 transition-colors cursor-pointer text-[var(--ink)] font-semibold flex items-center gap-1"
            title={`${lang === 'ar' ? 'تصفية حسب التصنيف:' : 'Filter by category:'} ${project.group}`}
            data-testid="breadcrumb-group"
          >
            <span>{project.group}</span>
          </button>

          <ChevronRight size={11} className={`text-[var(--muted)]/50 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />

          <button
            type="button"
            onClick={() => onFilterByOrigin?.(project.origin)}
            className="hover:text-[var(--teal)] hover:underline underline-offset-2 transition-colors cursor-pointer text-[var(--teal)] font-semibold flex items-center gap-1"
            title={`${lang === 'ar' ? 'تصفية حسب المصدر:' : 'Filter by origin:'} ${project.origin}`}
            data-testid="breadcrumb-origin"
          >
            <span>{project.origin}</span>
          </button>

          {project.road && (
            <>
              <ChevronRight size={11} className={`text-[var(--muted)]/50 shrink-0 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              <span className="text-[var(--muted)] text-[10px]">
                {roadNames[project.road]?.[lang] || project.road}
              </span>
            </>
          )}
        </nav>

        {/* Subtle Browsing Progress Bar at Top of Content Area */}
        <div
          className="w-full h-[3px] bg-[var(--line)]/50 relative overflow-hidden shrink-0"
          role="progressbar"
          aria-valuenow={currentIndex >= 0 ? currentIndex + 1 : 0}
          aria-valuemin={1}
          aria-valuemax={totalCount}
          aria-valuetext={
            lang === 'ar'
              ? `المشروع ${currentIndex + 1} من ${totalCount}`
              : `Project ${currentIndex + 1} of ${totalCount}`
          }
          aria-label={lang === 'ar' ? 'مؤشر التقدم في تصفح قائمة المشاريع المصفاة' : 'Filtered project list browsing progress'}
          title={
            lang === 'ar'
              ? `التقدم في القائمة المصفاة: ${currentIndex + 1} من ${totalCount} (${Math.round(progressPercent)}%)`
              : `Filtered list progress: ${currentIndex + 1} of ${totalCount} (${Math.round(progressPercent)}%)`
          }
          data-testid="drawer-progress-bar"
        >
          <motion.div
            className="h-full bg-[var(--teal)] shadow-[0_0_8px_var(--teal)] absolute top-0 inset-inline-start-0"
            initial={false}
            animate={{ width: `${progressPercent}%` }}
            transition={{
              type: 'spring',
              stiffness: 280,
              damping: 32,
              mass: 0.6,
            }}
          />
        </div>

        <motion.div
          key={project.id}
          className="dialog-content"
          variants={drawerContentVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Main Visual / Simulator */}
          <motion.div variants={drawerSectionVariants} className="space-y-2">
            <div className="relative border border-[var(--line)] bg-[var(--night)] overflow-hidden">
              {showSimulator && project.url ? (
                <div className="w-full h-[400px] bg-white flex flex-col">
                  <div className="bg-[#1b2732] px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-[#a5b6c0]">
                    <span className="flex items-center gap-1.5 truncate">
                      <Globe size={11} className="text-[var(--teal)]" />
                      {project.url}
                    </span>
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  <iframe
                    src={project.url}
                    title={title}
                    className="w-full flex-1 border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              ) : verifiedImages.length > 0 ? (
                <div className="relative h-[280px] sm:h-[340px] group flex items-center justify-center bg-[#101c24]">
                  <img
                    src={verifiedImages[activeImageIdx] || verifiedImages[0]}
                    alt={`${title} - screen ${activeImageIdx + 1}`}
                    className="w-full h-full object-contain cursor-zoom-in"
                    onClick={() =>
                      onOpenLightbox(verifiedImages[activeImageIdx] || verifiedImages[0], title)
                    }
                  />

                  {/* Left / Right On-image arrows for multi-image gallery */}
                  {verifiedImages.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={prevImage}
                        className="absolute inset-inline-start-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-[var(--teal)] text-white hover:text-[#10221e] border border-white/20 transition-all opacity-80 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
                        title={lang === 'ar' ? 'الصورة السابقة (←)' : 'Previous image (←)'}
                        aria-label="Previous gallery image"
                      >
                        <ChevronLeft size={16} className={lang === 'ar' ? 'rotate-180' : ''} />
                      </button>
                      <button
                        type="button"
                        onClick={nextImage}
                        className="absolute inset-inline-end-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-[var(--teal)] text-white hover:text-[#10221e] border border-white/20 transition-all opacity-80 hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
                        title={lang === 'ar' ? 'الصورة التالية (→)' : 'Next image (→)'}
                        aria-label="Next gallery image"
                      >
                        <ChevronRight size={16} className={lang === 'ar' ? 'rotate-180' : ''} />
                      </button>

                      {/* Image indicator badge with keyboard hint */}
                      <div className="absolute top-3 inset-inline-start-3 bg-black/75 text-white border border-white/10 px-2 py-1 text-[9px] font-mono flex items-center gap-1.5 pointer-events-none">
                        <ImageIcon size={10} className="text-[var(--teal)]" />
                        <span>
                          {activeImageIdx + 1} / {verifiedImages.length}
                        </span>
                        <span className="text-white/50 text-[8px] hidden sm:inline">[← / →]</span>
                      </div>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      onOpenLightbox(verifiedImages[activeImageIdx] || verifiedImages[0], title)
                    }
                    className="absolute bottom-3 inset-inline-end-3 bg-black/75 hover:bg-[var(--teal)] hover:text-[#10221e] text-white p-2 text-xs font-mono flex items-center gap-1.5 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
                  >
                    <ZoomIn size={14} />
                    <span className="text-[9px] uppercase tracking-wider">
                      {lang === 'ar' ? 'تكبير كامل' : 'EXPAND FULL'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="unavailable h-[240px]">
                  <div className="unavailable-top">
                    <span>
                      {lang === 'ar'
                        ? 'أرشيف المشاريع / دليل بصري'
                        : 'PROJECT ARCHIVE / VISUAL EVIDENCE'}
                    </span>
                  </div>
                  <div className="unavailable-label">
                    {lang === 'ar' ? 'صورة المشروع غير موثقة' : 'PROJECT IMAGE NOT VERIFIED'}
                    <small>
                      {lang === 'ar'
                        ? 'لا تتوفر في الأرشيف صورة مؤكدة لهذا المشروع.'
                        : 'No project-specific screenshot is available in the archive.'}
                    </small>
                  </div>
                </div>
              )}

              {/* Gallery Thumbnails with full Arrow Key support */}
              {verifiedImages.length > 1 && !showSimulator && (
                <div
                  className="flex items-center gap-2 p-2 bg-[var(--soft)] border-t border-[var(--line)] overflow-x-auto focus-within:ring-1 focus-within:ring-[var(--teal)]"
                  role="region"
                  aria-label={lang === 'ar' ? 'معرض صور المشروع (تنقل بالأسهم ← →)' : 'Project image gallery (navigate with ← →)'}
                >
                  <div className="text-[8px] font-mono text-[var(--muted)] px-1 shrink-0 uppercase hidden sm:block">
                    {lang === 'ar' ? 'الصور' : 'SCREENS'}:
                  </div>
                  {verifiedImages.map((src, idx) => (
                    <button
                      key={src}
                      ref={el => {
                        galleryRefs.current[idx] = el;
                      }}
                      type="button"
                      tabIndex={0}
                      onClick={() => setActiveImageIdx(idx)}
                      onKeyDown={e => handleGalleryKeyDown(e, idx)}
                      className={`h-12 w-20 shrink-0 border overflow-hidden transition-all focus:outline-none ${
                        activeImageIdx === idx
                          ? 'border-[var(--teal)] ring-2 ring-[var(--teal)] scale-105'
                          : 'border-[var(--line)] opacity-70 hover:opacity-100 focus:opacity-100 focus:ring-1 focus:ring-[var(--teal)]'
                      }`}
                      aria-label={`${title} image ${idx + 1} of ${verifiedImages.length}`}
                      aria-current={activeImageIdx === idx ? 'true' : undefined}
                    >
                      <img src={src} alt={`${title} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <span className="text-[8px] font-mono text-[var(--muted)] ms-auto shrink-0 hidden md:inline">
                    {lang === 'ar' ? 'استخدم ← → للتنقل' : 'Use ← / → keys'}
                  </span>
                </div>
              )}
            </div>

            {/* Interactive Toggle for Simulator */}
            {project.url && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowSimulator(s => !s)}
                  className="text-[9px] font-mono text-[var(--teal)] hover:underline flex items-center gap-1.5 focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
                >
                  <Smartphone size={12} />
                  <span>
                    {showSimulator
                      ? lang === 'ar'
                        ? 'العودة لمعاينة الصور الموثقة'
                        : 'Switch back to screenshot'
                      : lang === 'ar'
                      ? 'تجربة المعاينة التفاعلية المباشرة'
                      : 'Interactive live preview simulator'}
                  </span>
                </button>
              </div>
            )}
          </motion.div>

          {/* Project Title & Context */}
          <motion.div variants={drawerSectionVariants}>
            <div className="dialog-index pt-4">
              <span className="text-[var(--teal)] font-mono text-[10px] tracking-wider uppercase">
                {project.group} · {project.origin} {project.road ? `· ${roadNames[project.road]?.[lang] || project.road}` : ''}
              </span>
              <span className="font-mono text-[10px] text-[var(--muted)] uppercase">
                {project.status === 'live'
                  ? lang === 'ar'
                    ? 'رابط مباشر'
                    : 'Live link'
                  : project.status === 'preview'
                  ? lang === 'ar'
                    ? 'معاينة منشورة'
                    : 'Deployment preview'
                  : project.status === 'case'
                  ? lang === 'ar'
                    ? 'دراسة حالة'
                    : 'Case study'
                  : project.status === 'concept'
                  ? lang === 'ar'
                    ? 'تصور ومفهوم'
                    : 'Concept'
                  : lang === 'ar'
                  ? 'سجل مفهرس'
                  : 'Catalog entry'}
              </span>
            </div>

            <h2 id="project-dialog-title" dir={lang === 'ar' ? 'rtl' : 'ltr'} className="mt-2 text-2xl font-bold">
              {title}
            </h2>

            <p className="dialog-description mt-3 text-sm leading-relaxed text-[var(--muted)]" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {desc}
            </p>
          </motion.div>

          {/* Clean Metadata Grid - No Pills */}
          <motion.div
            variants={drawerSectionVariants}
            className="detail-meta my-6 py-4 border-y border-[var(--line)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono"
          >
            <div>
              <span className="text-[var(--muted)] text-[9px] block">
                {lang === 'ar' ? 'نوع المشروع' : 'PROJECT TYPE'}
              </span>
              <strong className="text-[var(--ink)]">
                {project.group}
                {project.sub ? ` · ${project.sub}` : ''}
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)] text-[9px] block">
                {lang === 'ar' ? 'المجموعة' : 'COLLECTION'}
              </span>
              <strong className="text-[var(--ink)]">
                {project.origin}
                {project.road ? ` · ${roadNames[project.road]?.[lang] || project.road}` : ''}
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)] text-[9px] block">
                {lang === 'ar' ? 'الحالة' : 'STATUS'}
              </span>
              <strong className="text-[var(--teal)]">
                {project.status === 'live'
                  ? 'ACTIVE / LIVE'
                  : project.status === 'preview'
                  ? 'STAGING / PREVIEW'
                  : project.status === 'case'
                  ? 'CASE STUDY'
                  : project.status === 'concept'
                  ? 'CONCEPT'
                  : 'ARCHIVED / CATALOG'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--muted)] text-[9px] block">
                {lang === 'ar' ? 'معرّف السجل' : 'ARCHIVE ID'}
              </span>
              <strong className="text-[var(--ink)]">{project.id}</strong>
            </div>
          </motion.div>

          {/* Project Stats Section */}
          <motion.section
            variants={drawerSectionVariants}
            className="detail-section project-stats-section my-5 p-3.5 sm:p-4 bg-[var(--card)] border border-[var(--line)] rounded-[6px]"
            data-testid="project-stats-section"
            aria-label={lang === 'ar' ? 'إحصائيات المشروع' : 'Project Stats'}
          >
            <div className="flex items-center justify-between mb-3 border-b border-[var(--line)]/60 pb-2.5">
              <h3 className="text-xs font-mono text-[var(--teal)] uppercase tracking-wider flex items-center gap-2 m-0">
                <Activity size={13} className="text-[var(--teal)]" />
                <span>{lang === 'ar' ? 'إحصائيات المشروع' : 'Project Stats'}</span>
              </h3>
              <span className="text-[9px] font-mono text-[var(--muted)]">
                {lang === 'ar' ? 'المدة الزمنية ومرحلة المشروع' : 'Duration & Phase Metrics'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 font-mono">
              {/* Total Duration Metric */}
              <div
                className="p-2.5 bg-[var(--soft)]/70 border border-[var(--line)]/70 rounded-[4px] flex flex-col justify-between"
                data-testid="stat-total-duration"
              >
                <div className="flex items-center justify-between text-[9px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  <span>{lang === 'ar' ? 'المدة الإجمالية' : 'Total Duration'}</span>
                  <Clock size={11} className="text-[var(--teal)]" />
                </div>
                <div>
                  <div
                    className="text-sm sm:text-base font-bold text-[var(--ink)] leading-tight"
                    data-testid="stat-duration-value"
                  >
                    {lang === 'ar' ? durationStats.formattedDurationAr : durationStats.formattedDurationEn}
                  </div>
                  <div className="text-[9.5px] text-[var(--muted)] mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{lang === 'ar' ? durationStats.monthsLabelAr : durationStats.monthsLabelEn}</span>
                    <span className="opacity-40">·</span>
                    <span className="text-[var(--teal)] font-semibold">
                      {startYear && completionYear ? `${startYear}–${completionYear}` : dateInfo.startYearNum}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Phase Status Metric */}
              <div
                className="p-2.5 bg-[var(--soft)]/70 border border-[var(--line)]/70 rounded-[4px] flex flex-col justify-between"
                data-testid="stat-phase-status"
              >
                <div className="flex items-center justify-between text-[9px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  <span>{lang === 'ar' ? 'مرحلة المشروع' : 'Phase Status'}</span>
                  <span className={`w-2 h-2 rounded-full ${phaseStatus.dotClass}`} />
                </div>
                <div>
                  <div
                    className="text-xs sm:text-sm font-bold text-[var(--ink)] leading-tight truncate"
                    data-testid="stat-phase-value"
                  >
                    {lang === 'ar' ? phaseStatus.labelAr : phaseStatus.labelEn}
                  </div>
                  <div className="text-[9.5px] text-[var(--teal)] mt-1 font-medium truncate">
                    {lang === 'ar' ? phaseStatus.subAr : phaseStatus.subEn}
                  </div>
                </div>
              </div>

              {/* Execution Window Metric */}
              <div
                className="p-2.5 bg-[var(--soft)]/70 border border-[var(--line)]/70 rounded-[4px] col-span-2 sm:col-span-1 flex flex-col justify-between"
                data-testid="stat-execution-window"
              >
                <div className="flex items-center justify-between text-[9px] text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  <span>{lang === 'ar' ? 'فترة الإنجاز' : 'Execution Window'}</span>
                  <Calendar size={11} className="text-[var(--teal)]" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-[var(--ink)] leading-tight flex items-center gap-1.5">
                    <span>{startYear || dateInfo.startYearNum}</span>
                    <span className="text-[var(--teal)] font-bold">→</span>
                    <span>{completionYear || dateInfo.completionYearNum}</span>
                  </div>
                  <div className="text-[9.5px] text-[var(--muted)] mt-1">
                    {lang === 'ar'
                      ? `${dateInfo.durationMonths} شهراً مسجلة في الأرشيف`
                      : `${dateInfo.durationMonths} months logged in catalog`}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Project Timeline Section */}
          <motion.div
            variants={drawerSectionVariants}
            className="detail-section project-timeline-section my-5"
            data-testid="project-timeline-section"
            aria-label="Project Timeline"
            role="region"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono text-[var(--teal)] uppercase tracking-wider flex items-center gap-2">
                <Calendar size={13} className="text-[var(--teal)]" />
                <span>{lang === 'ar' ? 'الجدول الزمني للمشروع' : 'Project Timeline'}</span>
              </h3>
              {(startYear || completionYear) && (
                <div
                  className="text-[10px] font-mono text-[var(--muted)] flex items-center gap-1.5"
                  data-testid="timeline-years-badge"
                >
                  {startYear && (
                    <span>
                      {lang === 'ar' ? 'البدء: ' : 'Start: '}
                      <strong className="text-[var(--ink)] font-semibold">{startYear}</strong>
                    </span>
                  )}
                  {startYear && completionYear && <span className="opacity-40">·</span>}
                  {completionYear && (
                    <span>
                      {lang === 'ar' ? 'الإنجاز: ' : 'Completion: '}
                      <strong className="text-[var(--teal)] font-semibold">{completionYear}</strong>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Start and Completion Years Display */}
            {(startYear || completionYear) && (
              <div
                className="grid grid-cols-2 gap-3 mb-3 p-3 bg-[var(--card)] border border-[var(--line)] rounded-[4px] font-mono"
                data-testid="timeline-years"
              >
                {startYear && (
                  <div>
                    <span className="text-[var(--muted)] text-[9px] uppercase tracking-wider block mb-0.5">
                      {lang === 'ar' ? 'سنة البدء' : 'Start Year'}
                    </span>
                    <strong className="text-[var(--ink)] text-sm font-bold" data-testid="start-year">
                      {startYear}
                    </strong>
                  </div>
                )}
                {completionYear && (
                  <div>
                    <span className="text-[var(--muted)] text-[9px] uppercase tracking-wider block mb-0.5">
                      {lang === 'ar' ? 'سنة الإنجاز' : 'Completion Year'}
                    </span>
                    <strong className="text-[var(--teal)] text-sm font-bold" data-testid="completion-year">
                      {completionYear}
                    </strong>
                  </div>
                )}
              </div>
            )}

            {/* D3 Project Timeline Visual Block */}
            <ProjectTimeline project={project} allProjects={projects} lang={lang} />
          </motion.div>

          {/* Interactive Tags - Click to filter */}
          <motion.div
            variants={drawerSectionVariants}
            className="detail-section my-4"
            role="region"
            aria-label={lang === 'ar' ? 'التقنيات والموضوعات' : 'Tools & Subjects'}
          >
            <h3 className="text-xs font-mono text-[var(--teal)] uppercase tracking-wider mb-2">
              {lang === 'ar' ? 'التقنيات والموضوعات (انقر للتصفية)' : 'TOOLS & SUBJECTS (CLICK TO FILTER)'}
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.tags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onFilterByTag(tag)}
                  className="text-[10px] font-mono px-2 py-1 border border-[var(--line)] bg-[var(--card)] hover:border-[var(--teal)] hover:text-[var(--teal)] hover:bg-[var(--soft)] transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
                  title={`${lang === 'ar' ? 'تصفية الأرشيف حسب' : 'Filter archive by'} ${tag}`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Action Links */}
          <motion.div
            variants={drawerSectionVariants}
            className="detail-links flex flex-wrap items-center gap-3 my-6"
          >
            {project.url ? (
              <a
                className="detail-link flex items-center gap-2 px-4 py-2.5 bg-[var(--night)] text-[var(--paper)] hover:bg-[var(--teal)] hover:text-[#10221e] text-xs font-mono font-bold transition-colors shadow-md focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
                href={project.url}
                target="_blank"
                rel="noreferrer"
              >
                <span>{lang === 'ar' ? 'زيارة الموقع المباشر' : 'Visit Live Project'}</span>
                <ExternalLink size={14} />
              </a>
            ) : (
              <span className="detail-link px-4 py-2 text-xs font-mono text-[var(--muted)] border border-[var(--line)]">
                {lang === 'ar' ? 'لا يوجد رابط مباشر مسجل' : 'No direct project link is recorded'}
              </span>
            )}

            {project.sourceUrl && (
              <a
                className="detail-link secondary flex items-center gap-2 px-4 py-2.5 border border-[var(--line)] hover:border-[var(--teal)] text-xs font-mono transition-colors focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
                href={project.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <span>{lang === 'ar' ? 'سجل المصدر في نُطق' : 'Open Source Record'}</span>
                <ArrowUpRight size={14} />
              </a>
            )}

            {/* Small "Report an issue" action link */}
            <a
              className="detail-link secondary flex items-center gap-1.5 px-3 py-2.5 border border-[var(--line)] hover:border-[var(--amber)] text-xs font-mono text-[var(--muted)] hover:text-[var(--ink)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--teal)] focus:outline-none"
              href={reportIssueHref}
              title={
                lang === 'ar'
                  ? `الإبلاغ عن مشكلة في المشروع (${project.id})`
                  : `Report an issue with project (${project.id})`
              }
              data-testid="link-report-issue"
            >
              <AlertCircle size={13} className="text-[var(--amber)]" />
              <span>{lang === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report an issue'}</span>
            </a>
          </motion.div>

          {/* Screenshot Audit Evidence Note */}
          <motion.div
            variants={drawerSectionVariants}
            className="p-3 bg-[var(--soft)] border-s-2 border-[var(--teal)] text-[10px] text-[var(--muted)] font-mono leading-relaxed my-4"
          >
            <span className="font-bold text-[var(--ink)] block mb-1">
              {lang === 'ar' ? 'توثيق التدقيق البصري' : 'VISUAL AUDIT EVIDENCE'}
            </span>
            {project.screenshotAudit?.evidence ||
              (lang === 'ar'
                ? 'نعرض فقط صور المشاريع الأصلية المصنفة موثقة في الأرشيف مع التحقق المباشر من واجهتها.'
                : 'Only original project screenshots marked verified in the catalog are shown here.')}
          </motion.div>

          {/* Related / Alternative Deployments with Arrow Key Support */}
          {related.length > 0 && (
            <motion.div
              variants={drawerSectionVariants}
              className="detail-section mt-8 pt-4 border-t border-[var(--line)]"
              role="region"
              aria-label={lang === 'ar' ? 'سجلات ومشاريع ذات صلة' : 'Related records'}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono text-[var(--teal)] uppercase tracking-wider">
                  {lang === 'ar' ? 'سجلات ومشاريع ذات صلة' : 'RELATED RECORDS'}
                </h3>
                <span className="text-[9px] font-mono text-[var(--muted)]">
                  {lang === 'ar' ? '[↑ ↓ ← →] للتنقل بالأسهم · [Enter] للفتح' : '[↑ ↓ ← →] Navigate · [Enter] Open'}
                </span>
              </div>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                role="listbox"
                aria-label={lang === 'ar' ? 'قائمة المشاريع ذات الصلة' : 'Related projects list'}
              >
                {related.map((r, idx) => (
                  <button
                    key={r.id}
                    ref={el => {
                      relatedRefs.current[idx] = el;
                    }}
                    type="button"
                    tabIndex={0}
                    onClick={() => onSelect(r.id)}
                    onKeyDown={e => handleRelatedKeyDown(e, idx)}
                    className="p-3 text-start border border-[var(--line)] bg-[var(--card)] hover:border-[var(--teal)] focus:border-[var(--teal)] focus:bg-[var(--soft)] focus:ring-2 focus:ring-[var(--teal)] focus:outline-none transition-all flex flex-col justify-between group cursor-pointer"
                    role="option"
                    aria-selected="false"
                  >
                    <span className="font-bold text-xs text-[var(--ink)] group-hover:text-[var(--teal)] group-focus:text-[var(--teal)] transition-colors truncate">
                      {lang === 'ar' ? r.ar : r.en}
                    </span>
                    <span className="text-[9px] font-mono text-[var(--muted)] mt-1 flex items-center justify-between">
                      <span>
                        {r.duplicateOf === project.id
                          ? lang === 'ar'
                            ? 'نشر بديل · معاينة'
                            : 'Alternate deployment · preview'
                          : `${r.group} · ${r.origin}`}
                      </span>
                      <ArrowUpRight size={11} className="opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity text-[var(--teal)]" />
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Bottom Next / Previous Navigation Bar */}
          {totalCount > 1 && (
            <motion.div
              variants={drawerSectionVariants}
              className="my-6"
            >
              <nav
                aria-label={lang === 'ar' ? 'التنقل بين المشاريع في القائمة المصفاة' : 'Filtered projects cycle navigation'}
                className="p-2.5 bg-[var(--card)] border border-[var(--line)] rounded-[6px] flex items-center justify-between gap-3 text-xs font-mono"
                data-testid="drawer-cycle-navigation"
              >
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={!prevProject}
                  className="flex items-center gap-2 p-2 hover:bg-[var(--soft)] hover:text-[var(--teal)] border border-[var(--line)] hover:border-[var(--teal)] rounded transition-colors text-start cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none flex-1 min-w-0"
                  data-testid="button-previous-project"
                  aria-label={lang === 'ar' ? 'المشروع السابق' : 'Previous project'}
                >
                  <ChevronLeft size={16} className={`shrink-0 text-[var(--teal)] ${lang === 'ar' ? 'rotate-180' : ''}`} />
                  <div className="min-w-0 truncate">
                    <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider block">
                      {lang === 'ar' ? 'المشروع السابق' : 'Previous Project'}
                    </span>
                    <span className="font-semibold text-xs text-[var(--ink)] truncate block">
                      {prevProject ? (lang === 'ar' ? prevProject.ar : prevProject.en) : '—'}
                    </span>
                  </div>
                </button>

                <div className="shrink-0 text-[9px] text-[var(--muted)] font-mono text-center px-1">
                  <span className="text-[var(--teal)] font-bold">{currentIndex + 1}</span> / {totalCount}
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!nextProject}
                  className="flex items-center justify-end gap-2 p-2 hover:bg-[var(--soft)] hover:text-[var(--teal)] border border-[var(--line)] hover:border-[var(--teal)] rounded transition-colors text-end cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none flex-1 min-w-0"
                  data-testid="button-next-project-bottom"
                  aria-label={lang === 'ar' ? 'المشروع التالي' : 'Next project'}
                >
                  <div className="min-w-0 truncate">
                    <span className="text-[9px] text-[var(--muted)] uppercase tracking-wider block">
                      {lang === 'ar' ? 'المشروع التالي' : 'Next Project'}
                    </span>
                    <span className="font-semibold text-xs text-[var(--ink)] truncate block">
                      {nextProject ? (lang === 'ar' ? nextProject.ar : nextProject.en) : '—'}
                    </span>
                  </div>
                  <ChevronRight size={16} className={`shrink-0 text-[var(--teal)] ${lang === 'ar' ? 'rotate-180' : ''}`} />
                </button>
              </nav>
            </motion.div>
          )}

          {/* Drawer footer utility line with project ID and Report an issue */}
          <motion.div
            variants={drawerSectionVariants}
            className="mt-8 pt-4 border-t border-[var(--line)] flex items-center justify-between text-[10px] font-mono text-[var(--muted)]"
          >
            <span>
              {lang === 'ar' ? 'معرّف المشروع:' : 'Project ID:'}{' '}
              <strong className="text-[var(--ink)]">{project.id}</strong>
            </span>
            <a
              href={reportIssueHref}
              className="inline-flex items-center gap-1.5 hover:text-[var(--amber)] underline underline-offset-2 decoration-[var(--line)] hover:decoration-[var(--amber)] transition-colors focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
              title={
                lang === 'ar'
                  ? `إرسال بريد إلكتروني للإبلاغ عن مشكلة في هذا السجل (${project.id})`
                  : `Send email to report an issue with this record (${project.id})`
              }
              data-testid="link-report-issue-footer"
            >
              <AlertCircle size={11} className="text-[var(--amber)]" />
              <span>{lang === 'ar' ? 'الإبلاغ عن مشكلة' : 'Report an issue'}</span>
            </a>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
