import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ExternalLink,
  Grid2X2,
  Layers2,
  List,
  Moon,
  Search,
  Sun,
  X,
  Play,
  Compass,
  MapPin,
  Sparkles,
  Command,
  ZoomIn,
  Bookmark,
  ArrowUp,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SpatialRadar } from './components/SpatialRadar';
import { VideoModal } from './components/VideoModal';
import { ProjectLightbox } from './components/ProjectLightbox';
import { HeroVisual } from './components/HeroVisual';
import { ProjectDrawer } from './components/ProjectDrawer';
import { ScrollIndicator } from './components/ScrollIndicator';
import { QuickActionsMenu } from './components/QuickActionsMenu';

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

type Lang = 'en' | 'ar';
type View = 'grid' | 'list';
type Sort = 'featured' | 'az' | 'za';

type Project = {
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
};

const categories = ['All', 'GIS', 'Dashboards', 'Platforms', 'Systems', 'Business', 'Commerce', 'Education', 'AI', 'Culture'];
const categoryNames: Record<string, [string, string]> = {
  All: ['All work', 'كل الأعمال'],
  GIS: ['GIS & mapping', 'نظم المعلومات الجغرافية'],
  Dashboards: ['Dashboards', 'لوحات المعلومات'],
  Platforms: ['Digital platforms', 'المنصات الرقمية'],
  Systems: ['Enterprise systems', 'أنظمة المؤسسات'],
  Business: ['Websites', 'المواقع الإلكترونية'],
  Commerce: ['Commerce', 'التجارة الإلكترونية'],
  Education: ['Education', 'التعليم'],
  AI: ['AI & automation', 'الذكاء الاصطناعي'],
  Culture: ['Digital experiences', 'التجارب الرقمية'],
};

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

const copy = {
  en: {
    eyebrow: 'SAAD BARGHOUTH  /  NOTAQ · EGYPT',
    titleA: 'Spatial thinking.',
    titleB: 'Digital made useful.',
    desc: 'A working archive of geospatial intelligence, public infrastructure, enterprise systems and digital products — built for places, people and the decisions between them.',
    introMeta: 'INDEPENDENT DIGITAL PRACTICE',
    cairo: '30°02′N  ·  31°14′E  ·  CAIRO',
    archiveKicker: 'THE PROJECT ARCHIVE / 01',
    archiveTitle: 'Work, in its many coordinates.',
    archiveDesc: 'Explore projects across GIS, transport, infrastructure, enterprise systems, dashboards, education and the web. Alternate deployments remain connected to their parent record instead of appearing as separate projects.',
    search: 'Search projects, technologies, sectors…',
    sort: 'Order',
    featured: 'Featured first',
    az: 'Name A–Z',
    za: 'Name Z–A',
    allOrigins: 'All collections',
    liveOnly: 'Live links only',
    road: 'All corridors',
    results: 'distinct projects in archive',
    reset: 'Reset filters',
    open: 'VISIT PROJECT',
    details: 'Explore details',
    noLiveCard: 'No live URL recorded',
    unavailable: 'PROJECT IMAGE NOT VERIFIED',
    missing: 'No project-specific screenshot is available in the archive.',
    live: 'Live link',
    catalog: 'Catalog entry',
    case: 'Case study',
    concept: 'Concept',
    preview: 'Deployment preview',
    status: 'STATUS',
    collection: 'COLLECTION',
    type: 'PROJECT TYPE',
    tags: 'TOOLS & SUBJECTS',
    gallery: 'VERIFIED PROJECT SCREENS',
    related: 'RELATED RECORDS',
    overview: 'OVERVIEW',
    direct: 'Visit live project',
    source: 'Open source record',
    noLink: 'No direct project link is recorded for this entry.',
    evidence: 'Only original project screenshots marked verified in the catalog are shown here. Missing screenshots are clearly identified; nothing has been substituted.',
    emptyTitle: 'No records in this view.',
    empty: 'Change a filter or clear your search to return to the complete archive.',
    footerTitle: 'Build for the real world.',
    footerCopy: 'Saad Barghouth · Notaq. An independent digital practice based in Egypt, working across geospatial systems and useful digital experiences.',
    identity: 'Professional site',
    contact: 'Discuss a project',
    detailsTitle: 'SELECTED PROJECTS / VERIFIED SCREENS',
    count: 'distinct projects',
    available: 'live active deployments',
    close: 'Close project details',
    sourceOrigin: 'Collection',
    sourceNotaq: 'Notaq Collection',
    sourceGIS: 'GIS & Spatial Intelligence',
    sourceTransport: 'Transport Infrastructure',
    sourceWeb: 'Digital Products & Web',
    sourceConcept: 'Concepts & Research',
    projectIndex: 'ARCHIVE RECORD',
    watchReel: 'Showcase Reel',
    heroTabs: ['Original Evidence', 'Spatial Telemetry Radar'],
    tagFiltered: 'Filtered by tag:',
    clearTag: 'Clear tag',
  },
  ar: {
    eyebrow: 'سعد برغوث  /  نُطق · مصر',
    titleA: 'فكر مكاني.',
    titleB: 'تقنية تخدم الواقع.',
    desc: 'أرشيف عملي للذكاء المكاني والبنية التحتية والأنظمة المؤسسية والمنتجات الرقمية — حلول مرتبطة بالمكان والناس والقرارات.',
    introMeta: 'ممارسة رقمية مستقلة',
    cairo: '٣٠°٠٢′ شمالاً  ·  ٣١°١٤′ شرقاً  ·  القاهرة',
    archiveKicker: 'أرشيف المشاريع / ٠١',
    archiveTitle: 'أعمال بإحداثيات متعددة.',
    archiveDesc: 'استكشف مشاريع نظم المعلومات الجغرافية والنقل والبنية التحتية والأنظمة ولوحات المعلومات والتعليم والويب. تبقى روابط النشر البديلة مرتبطة بسجل المشروع الأصلي ولا تظهر كمشاريع مستقلة.',
    search: 'ابحث باسم المشروع أو التقنية أو المجال…',
    sort: 'الترتيب',
    featured: 'المميزة أولاً',
    az: 'الاسم أ–ي',
    za: 'الاسم ي–أ',
    allOrigins: 'كل المجموعات',
    liveOnly: 'روابط مباشرة فقط',
    road: 'كل الطرق والمحاور',
    results: 'مشروعاً في الأرشيف',
    reset: 'إعادة ضبط الفلاتر',
    open: 'زيارة المشروع',
    details: 'استكشف التفاصيل',
    noLiveCard: 'لا يوجد رابط مباشر مسجل',
    unavailable: 'صورة المشروع غير موثقة',
    missing: 'لا تتوفر في الأرشيف صورة مؤكدة لهذا المشروع.',
    live: 'رابط مباشر',
    catalog: 'سجل فهرس',
    case: 'دراسة حالة',
    concept: 'تصور',
    preview: 'معاينة منشورة',
    status: 'الحالة',
    collection: 'المجموعة',
    type: 'نوع المشروع',
    tags: 'التقنيات والموضوعات',
    gallery: 'صور مؤكدة من المشروع',
    related: 'سجلات ذات صلة',
    overview: 'نبذة',
    direct: 'زيارة المشروع',
    source: 'فتح سجل المصدر',
    noLink: 'لا يوجد رابط مباشر مسجل لهذا العنصر.',
    evidence: 'نعرض فقط صور المشاريع الأصلية المصنفة موثقة في الأرشيف. نوضح غياب الصور عند عدم توفرها ولا نستخدم صوراً بديلة.',
    emptyTitle: 'لا توجد سجلات في هذا العرض.',
    empty: 'غيّر أحد الفلاتر أو امسح البحث للعودة إلى الأرشيف الكامل.',
    footerTitle: 'تقنية للعالم الحقيقي.',
    footerCopy: 'سعد برغوث · نُطق. ممارسة رقمية مستقلة من مصر، تعمل على الأنظمة المكانية والتجارب الرقمية المفيدة.',
    identity: 'الموقع المهني',
    contact: 'تواصل بخصوص مشروع',
    detailsTitle: 'مشاريع مختارة / لقطات موثقة',
    count: 'مشروعاً متميزاً',
    available: 'رابطاً مباشراً قيد التشغيل',
    close: 'إغلاق تفاصيل المشروع',
    sourceOrigin: 'المجموعة',
    sourceNotaq: 'مجموعة نُطق',
    sourceGIS: 'نظم المعلومات الجغرافية والمكانية',
    sourceTransport: 'النقل والبنية التحتية',
    sourceWeb: 'المنتجات الرقمية والويب',
    sourceConcept: 'تصورات وبحوث استكشافية',
    projectIndex: 'سجل الأرشيف',
    watchReel: 'العرض المرئي',
    heroTabs: ['الأدلة البصرية الموثقة', 'رادار الإحداثيات المكانية'],
    tagFiltered: 'تصفية حسب الوسم:',
    clearTag: 'إزالة الوسم',
  },
} as const;

function IconButton({
  label,
  onClick,
  children,
  testId,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  testId: string;
}) {
  return (
    <button
      className="icon-button"
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      data-testid={testId}
    >
      {children}
    </button>
  );
}

function Evidence({
  project,
  lang,
  className = '',
  onOpenLightbox,
}: {
  project: Project;
  lang: Lang;
  className?: string;
  onOpenLightbox?: (src: string, title: string) => void;
}) {
  const verified = project.screenshotAudit?.state === 'verified';
  const img = verified ? project.screenshot || project.gallery?.[0] || null : null;
  const title = lang === 'ar' ? project.ar : project.en;

  return (
    <div className={`unavailable ${className}`} data-testid={`evidence-${project.id}`}>
      {img ? (
        <div className="relative w-full h-full group">
          <img
            src={img}
            alt={lang === 'ar' ? `لقطة موثقة: ${project.ar}` : `Verified project screen: ${project.en}`}
            loading="lazy"
            className="transition-transform duration-500 group-hover:scale-105"
          />
          {onOpenLightbox && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpenLightbox(img, title);
              }}
              className="absolute top-2 inset-inline-start-2 p-1.5 bg-black/60 hover:bg-[var(--teal)] text-white hover:text-[#10221e] opacity-0 group-hover:opacity-100 transition-opacity"
              title={lang === 'ar' ? 'تكبير الصورة' : 'Zoom image'}
            >
              <ZoomIn size={13} />
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="unavailable-top">
            <span>{lang === 'ar' ? 'أرشيف المشاريع / دليل بصري' : 'PROJECT ARCHIVE / VISUAL EVIDENCE'}</span>
            <span className="unavailable-mark" aria-hidden="true">
              <Layers2 size={14} strokeWidth={1.5} />
            </span>
          </div>
          <div className="unavailable-label">
            {copy[lang].unavailable}
            <small>{copy[lang].missing}</small>
          </div>
        </>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  lang,
  index,
  onOpen,
  onFilterByTag,
  onOpenLightbox,
  shouldReduceMotion,
  isSaved,
  onToggleSave,
}: {
  project: Project;
  lang: Lang;
  index: number;
  onOpen: (id: string, source: HTMLElement) => void;
  onFilterByTag: (tag: string) => void;
  onOpenLightbox: (src: string, title: string) => void;
  shouldReduceMotion?: boolean | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const t = copy[lang];
  const name = lang === 'ar' ? project.ar : project.en;
  const description = lang === 'ar' ? project.arDesc : project.desc;
  const status =
    project.status === 'live'
      ? t.live
      : project.status === 'preview'
      ? t.preview
      : project.status === 'concept'
      ? t.concept
      : project.status === 'case'
      ? t.case
      : t.catalog;

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.45,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.03, 0.3),
        ease: PREMIUM_EASE,
      }}
      className="project-card group"
      data-testid={`card-project-${project.id}`}
      onClick={e => {
        // Prevent opening dialog if clicked on a direct link or tag
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) return;
        onOpen(project.id, e.currentTarget);
      }}
    >
      <div className="card-visual relative">
        <Evidence project={project} lang={lang} onOpenLightbox={onOpenLightbox} />
        <span className="card-status" data-testid={`status-project-${project.id}`}>
          {status}
        </span>
        <QuickActionsMenu
          projectId={project.id}
          projectUrl={project.url}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          lang={lang}
        />
      </div>
      <div className="card-body">
        <div className="card-kicker">
          <span>{project.group}</span>
          <span>
            {project.origin}
            {project.road ? ` / ${roadNames[project.road]?.[lang] || project.road}` : ''}
          </span>
        </div>
        <h3 className="card-title group-hover:text-[var(--teal)] transition-colors" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {name}
        </h3>
        <p className="card-description" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          {description}
        </p>

        {/* Clickable Tags */}
        <div className="tag-row">
          {project.tags.slice(0, 3).map(tag => (
            <button
              type="button"
              className="tag hover:border-[var(--teal)] hover:text-[var(--teal)] transition-colors cursor-pointer"
              key={tag}
              onClick={e => {
                e.stopPropagation();
                onFilterByTag(tag);
              }}
              title={`${lang === 'ar' ? 'تصفية حسب' : 'Filter by'} ${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>

        <div className="card-footer">
          <span className="project-number">N / {String(index + 1).padStart(2, '0')}</span>
          <div className="card-actions">
            <button
              className="card-action details-action"
              type="button"
              onClick={e => {
                e.stopPropagation();
                onOpen(project.id, e.currentTarget);
              }}
              data-testid={`button-details-${project.id}`}
            >
              <span className="hidden sm:inline">{t.details}</span>
              <span className="sm:hidden">{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
              <ArrowUpRight size={12} className="shrink-0" />
            </button>
            {project.url ? (
              <a
                className="card-action project-action"
                href={project.url}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                data-testid={`link-project-${project.id}`}
              >
                <span className="hidden sm:inline">{t.open}</span>
                <span className="sm:hidden">{lang === 'ar' ? 'زيارة' : 'Live'}</span>
                <ExternalLink size={11} className="shrink-0" />
              </a>
            ) : (
              <span
                className="card-action no-project-url"
                aria-disabled="true"
                data-testid={`status-no-live-url-${project.id}`}
              >
                {t.noLiveCard}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function FeaturedCard({
  project,
  lang,
  index,
  onOpen,
  onOpenLightbox,
  shouldReduceMotion,
  isSaved,
  onToggleSave,
}: {
  project: Project;
  lang: Lang;
  index: number;
  onOpen: (id: string, source: HTMLElement) => void;
  onOpenLightbox: (src: string, title: string) => void;
  shouldReduceMotion?: boolean | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const title = lang === 'ar' ? project.ar : project.en;
  const description = lang === 'ar' ? project.arDesc : project.desc;
  const image = project.screenshot!;
  const isFlagship = index === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{
        duration: 0.6,
        delay: shouldReduceMotion ? 0 : index * 0.08,
        ease: PREMIUM_EASE,
      }}
      className={`featured-card featured-card-${index + 1} group`}
      data-testid={`featured-project-${project.id}`}
    >
      <div className="featured-image relative overflow-hidden">
        <img
          src={image}
          alt={lang === 'ar' ? `لقطة موثقة من ${title}` : `Verified project screenshot: ${title}`}
          loading="lazy"
        />
        <span className="featured-index">
          {isFlagship ? 'SPOTLIGHT / 01' : `SELECTED / ${String(index + 1).padStart(2, '0')}`}
        </span>
        <QuickActionsMenu
          projectId={project.id}
          projectUrl={project.url}
          isSaved={isSaved}
          onToggleSave={onToggleSave}
          lang={lang}
        />
        <button
          type="button"
          onClick={() => onOpenLightbox(image, title)}
          className="absolute top-2 inset-inline-end-2 p-1.5 bg-black/65 hover:bg-[var(--teal)] text-white hover:text-[#10221e] opacity-0 group-hover:opacity-100 transition-opacity border border-white/20 rounded z-10"
          title={lang === 'ar' ? 'تكبير لقطة الشاشة' : 'Expand screenshot'}
        >
          <ZoomIn size={13} />
        </button>
      </div>
      <div className="featured-copy">
        <div className="featured-meta">
          <span>{project.group}</span>
          <span>
            {project.origin}
            {project.road ? ` / ${roadNames[project.road]?.[lang] || project.road}` : ''}
          </span>
        </div>
        <h3 dir={lang === 'ar' ? 'rtl' : 'ltr'}>{title}</h3>
        <p dir={lang === 'ar' ? 'rtl' : 'ltr'}>{description}</p>
        <div className="tag-row">
          {project.tags.slice(0, 4).map(tag => (
            <span className="tag" key={tag}>
              #{tag}
            </span>
          ))}
        </div>
        <div className="featured-actions">
          <button
            className="card-action details-action"
            type="button"
            onClick={e => onOpen(project.id, e.currentTarget)}
            data-testid={`button-featured-details-${project.id}`}
          >
            <span className="hidden sm:inline">{copy[lang].details}</span>
            <span className="sm:hidden">{lang === 'ar' ? 'التفاصيل' : 'Details'}</span>
            <ArrowUpRight size={13} className="shrink-0" />
          </button>
          {project.url ? (
            <a
              className="card-action project-action"
              href={project.url}
              target="_blank"
              rel="noreferrer"
              data-testid={`link-featured-project-${project.id}`}
            >
              <span className="hidden sm:inline">{copy[lang].open}</span>
              <span className="sm:hidden">{lang === 'ar' ? 'زيارة' : 'Live'}</span>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          ) : (
            <span
              className="card-action no-project-url"
              data-testid={`status-featured-no-live-url-${project.id}`}
            >
              {copy[lang].noLiveCard}
            </span>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export default function App() {
  const shouldReduceMotion = useReducedMotion();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState<Lang>(() => {
    const urlLang = new URLSearchParams(window.location.search).get('lang');
    if (urlLang === 'ar' || urlLang === 'en') return urlLang;
    try {
      const stored = localStorage.getItem('notaq-lang');
      if (stored === 'ar' || stored === 'en') return stored as Lang;
    } catch {
      // ignore
    }
    return 'en';
  });
  const [dark, setDark] = useState(() => localStorage.getItem('notaq-theme') === 'dark');
  const [group, setGroup] = useState('All');
  const [origin, setOrigin] = useState('all');
  const [road, setRoad] = useState('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('featured');
  const [liveOnly, setLiveOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      const stored = sessionStorage.getItem('notaq-saved-session-projects');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleSave = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        sessionStorage.setItem('notaq-saved-session-projects', JSON.stringify([...next]));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  }, []);
  const [view, setView] = useState<View>('grid');
  const [heroMode, setHeroMode] = useState<'evidence' | 'radar'>('evidence');
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState<{ isOpen: boolean; src: string | null; title: string }>({
    isOpen: false,
    src: null,
    title: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    new URLSearchParams(window.location.search).get('project')
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const t = copy[lang];

  useEffect(() => {
    let alive = true;
    fetch(`${import.meta.env.BASE_URL}data/projects.json`)
      .then(response => {
        if (!response.ok) throw new Error('Project index unavailable');
        return response.json() as Promise<Project[]>;
      })
      .then(data => {
        if (alive) setProjects(data);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (projects.length && selectedId && !projects.some(p => p.id === selectedId)) setSelectedId(null);
  }, [projects, selectedId]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('dark', dark);
    document.title =
      lang === 'ar' ? 'سعد برغوث · نُطق — أرشيف المشاريع' : 'Saad Barghouth · Notaq — Project Archive';
  }, [lang, dark]);

  useEffect(() => {
    localStorage.setItem('notaq-theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKey = (e: globalThis.KeyboardEvent) => {
      // Don't trigger if user is typing in search input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key.toLowerCase() === 'v' && !selectedId) {
        setIsVideoOpen(v => !v);
      } else if (e.key.toLowerCase() === 'g') {
        setView(v => (v === 'grid' ? 'list' : 'grid'));
      } else if (e.key.toLowerCase() === 't') {
        setDark(d => !d);
      } else if (e.key.toLowerCase() === 'l') {
        switchLanguage();
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [selectedId, lang]);

  const normalized = (s: string) => s.toLocaleLowerCase().normalize('NFC');

  const matches = useCallback(
    (p: Project, skip: 'group' | 'origin' | null = null) => {
      const q = normalized(query.trim());
      return (
        (skip === 'group' || group === 'All' || p.group === group) &&
        (skip === 'origin' || origin === 'all' || p.origin === origin) &&
        (road === 'all' || p.road === road) &&
        (!activeTag || p.tags.some(tag => normalized(tag) === normalized(activeTag))) &&
        (!liveOnly || (p.status === 'live' && !!p.url)) &&
        (!savedOnly || savedIds.has(p.id)) &&
        (!q ||
          [p.en, p.ar, p.desc, p.arDesc, p.sub, p.group, p.origin, p.road || '', p.id, ...p.tags].some(v =>
            normalized(v).includes(q)
          ))
      );
    },
    [group, origin, road, activeTag, liveOnly, savedOnly, savedIds, query]
  );

  const distinctProjects = useMemo(() => projects.filter(p => !p.duplicateOf), [projects]);

  const shown = useMemo(() => {
    const result = distinctProjects.filter(p => matches(p));
    return result.sort((a, b) =>
      sort === 'az'
        ? (lang === 'ar' ? a.ar : a.en).localeCompare(lang === 'ar' ? b.ar : b.en, lang)
        : sort === 'za'
        ? (lang === 'ar' ? b.ar : b.en).localeCompare(lang === 'ar' ? a.ar : a.en, lang)
        : Number(b.featured) - Number(a.featured) || projects.indexOf(a) - projects.indexOf(b)
    );
  }, [distinctProjects, projects, matches, sort, lang]);

  const roads = useMemo(
    () => [...new Set(distinctProjects.map(p => p.road).filter((x): x is string => !!x))].sort(),
    [distinctProjects]
  );

  const filtered =
    group !== 'All' ||
    origin !== 'all' ||
    road !== 'all' ||
    activeTag !== null ||
    query.length > 0 ||
    liveOnly ||
    savedOnly;

  const open = (id: string, source: HTMLElement) => {
    returnFocus.current = source;
    setSelectedId(id);
    const u = new URL(window.location.href);
    u.searchParams.set('project', id);
    window.history.replaceState({}, '', u);
  };

  const closeProject = () => {
    setSelectedId(null);
    const u = new URL(window.location.href);
    u.searchParams.delete('project');
    window.history.replaceState({}, '', u);
  };

  const reset = () => {
    setGroup('All');
    setOrigin('all');
    setRoad('all');
    setActiveTag(null);
    setQuery('');
    setLiveOnly(false);
    setSavedOnly(false);
    setSort('featured');
  };

  const filterByTag = (tag: string) => {
    setActiveTag(tag);
    setSelectedId(null);
    // Smooth scroll down to archive filter section
    document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' });
  };

  const setLanguage = (newLang: Lang) => {
    setLang(newLang);
    try {
      localStorage.setItem('notaq-lang', newLang);
    } catch {
      // ignore
    }
    const u = new URL(window.location.href);
    if (newLang === 'ar') u.searchParams.set('lang', 'ar');
    else u.searchParams.delete('lang');
    window.history.replaceState({}, '', u);
  };

  const switchLanguage = () => {
    setLanguage(lang === 'en' ? 'ar' : 'en');
  };

  const liveCount = distinctProjects.filter(p => p.status === 'live' && !!p.url).length;
  const verifiedScreensCount = distinctProjects.filter(p => p.screenshotAudit?.state === 'verified').length;
  const selected = projects.find(p => p.id === selectedId) || null;

  const featuredIds = [
    'transport',
    'smart-infra',
    'gis-automator',
    'transport-dashboard-ismailia-development-impact',
    'rsg-destinations',
  ];
  const selectedFeatures = featuredIds
    .map(id => distinctProjects.find(p => p.id === id))
    .filter((p): p is Project => !!p && p.screenshotAudit?.state === 'verified' && !!p.screenshot?.startsWith('/screenshots/'));

  const originNames: Record<string, string> = {
    Notaq: t.sourceNotaq,
    GIS: t.sourceGIS,
    Transport: t.sourceTransport,
    Web: t.sourceWeb,
    Concept: t.sourceConcept,
  };

  const openLightbox = (src: string, title: string) => {
    setLightboxState({ isOpen: true, src, title });
  };

  return (
    <div className="app">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <a href="#top" className="brand" aria-label={lang === 'ar' ? 'سعد برغوث — نُطق' : 'Saad Barghouth — Notaq'} data-testid="link-home">
          <span className="brand-mark">
            <img src="/logooo.png" alt="Saad Barghouth logo" className="brand-logo" />
          </span>
          <span>
            <span className="brand-name">SAAD BARGHOUTH</span>
            <span className="brand-sub">{lang === 'ar' ? 'نُطق / أرشيف المشاريع' : 'NOTAQ / PROJECT ARCHIVE'}</span>
          </span>
        </a>

        <div className="head-tools">
          <span className="head-count" data-testid="text-catalog-count">
            <strong className="text-[var(--teal)] font-bold">{distinctProjects.length}</strong>{' '}
            {t.count}
          </span>

          {/* Reel trigger button in topbar */}
          <button
            type="button"
            onClick={() => setIsVideoOpen(true)}
            className="header-archive hover:text-[var(--teal)] transition-colors cursor-pointer"
            title={lang === 'ar' ? 'مشاهدة العرض المرئي' : 'Watch Showcase Reel'}
          >
            <Play size={12} className="text-[var(--teal)] fill-[var(--teal)]" />
            <span>{t.watchReel}</span>
          </button>

          {/* Saved Session List Quick Access */}
          <button
            type="button"
            onClick={() => {
              setSavedOnly(s => !s);
              document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`header-archive hover:text-[var(--teal)] transition-colors cursor-pointer ${
              savedOnly ? 'text-[var(--teal)] font-bold' : ''
            }`}
            title={lang === 'ar' ? 'المشاريع المحفوظة للجلسة' : 'Saved session projects'}
            data-testid="button-header-saved"
          >
            <Bookmark
              size={12}
              className={savedIds.size > 0 ? 'fill-[var(--teal)] text-[var(--teal)]' : ''}
            />
            <span>{lang === 'ar' ? 'المحفوظات' : 'Saved'}</span>
          </button>

          <a className="header-archive" href="#archive" data-testid="link-header-archive">
            {lang === 'ar' ? 'الأرشيف' : 'Archive'}
            <ArrowRight size={13} className={lang === 'ar' ? 'rotate-180' : ''} />
          </a>

          <IconButton
            label={
              dark
                ? lang === 'ar'
                  ? 'الوضع الفاتح'
                  : 'Switch to light mode'
                : lang === 'ar'
                ? 'الوضع الداكن'
                : 'Switch to dark mode'
            }
            onClick={() => setDark(v => !v)}
            testId="button-theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </IconButton>

          <div
            className="language-switcher"
            role="group"
            aria-label={lang === 'ar' ? 'اختيار لغة الموقع' : 'Select site language'}
            data-testid="language-switcher"
          >
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              aria-pressed={lang === 'en'}
              title="English interface"
              data-testid="button-lang-en"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ar')}
              className={`lang-btn ${lang === 'ar' ? 'active' : ''}`}
              aria-pressed={lang === 'ar'}
              title="واجهة باللغة العربية"
              data-testid="button-lang-ar"
            >
              عربي
            </button>
          </div>

          <a
            className="header-cta"
            href="https://www.barghouth.me/contact"
            target="_blank"
            rel="noreferrer"
            aria-label={t.contact}
            data-testid="link-header-contact"
          >
            <span className="header-cta-label">{t.contact}</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </header>

      <main id="top" className="wrap">
        {/* Hero Section */}
        <section className="intro" aria-labelledby="intro-title">
          {/* Atmospheric transparent image backdrop */}
          <div className="hero-backdrop-image" aria-hidden="true" />

          <motion.div
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: PREMIUM_EASE }}
            className="intro-copy"
          >
            <div className="eyebrow">{t.eyebrow}</div>
            <h1 id="intro-title">
              {t.titleA}
              <br />
              <em>{t.titleB}</em>
            </h1>
            <p className="intro-desc">{t.desc}</p>
            <div className="intro-line">
              <span>{t.introMeta}</span>
              <span>—</span>
              <span>{t.cairo}</span>
            </div>
            <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--line)]/60">
              <ScrollIndicator lang={lang} targetId="featured-work" />
              <span className="coordinates static text-[9px]">
                {lang === 'ar' ? 'مشاريع متميزة' : 'DISTINCT PROJECTS'}
              </span>
            </div>
          </motion.div>

          {/* Interactive Hero Visual with View Toggle (Evidence Cards vs Spatial Radar) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] font-mono border-b border-[var(--line)] pb-2.5">
              <div className="hero-tabs-wrap">
                <button
                  type="button"
                  onClick={() => setHeroMode('evidence')}
                  className={`hero-tab-btn ${heroMode === 'evidence' ? 'active' : ''}`}
                >
                  <span>{t.heroTabs[0]}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroMode('radar')}
                  className={`hero-tab-btn ${heroMode === 'radar' ? 'active' : ''}`}
                >
                  <Compass size={11} className={heroMode === 'radar' ? 'text-[var(--teal)]' : ''} />
                  <span>{t.heroTabs[1]}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsVideoOpen(true)}
                className="hero-tab-btn hover:text-[var(--teal)] text-[var(--teal)] flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <Play size={10} className="fill-[var(--teal)] text-[var(--teal)]" />
                <span>{t.watchReel}</span>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {heroMode === 'evidence' ? (
                <motion.div
                  key="evidence"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <HeroVisual
                    projects={distinctProjects}
                    lang={lang}
                    onOpenVideo={() => setIsVideoOpen(true)}
                    onOpenLightbox={openLightbox}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="radar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <SpatialRadar
                    lang={lang}
                    selectedRoad={road}
                    onSelectRoad={r => {
                      setRoad(r);
                      document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Selected Featured Projects */}
        {selectedFeatures.length > 0 && (
          <section
            id="featured-work"
            className="featured-section"
            aria-labelledby="featured-title"
            data-testid="section-featured-projects"
          >
            <div className="featured-heading">
              <div>
                <div className="eyebrow">{t.detailsTitle}</div>
                <h2 id="featured-title">{lang === 'ar' ? 'نماذج من العمل.' : 'A closer look.'}</h2>
              </div>
              <p>
                {lang === 'ar'
                  ? 'لقطات أصلية مرتبطة بسجلاتها ومصنفة موثقة في أرشيف المشاريع.'
                  : 'Original screens, shown only where the catalog has verified project-specific evidence.'}
              </p>
            </div>
            <div className="featured-grid">
              {selectedFeatures.map((p, i) => (
                <FeaturedCard
                  key={p.id}
                  project={p}
                  lang={lang}
                  index={i}
                  onOpen={open}
                  onOpenLightbox={openLightbox}
                  shouldReduceMotion={shouldReduceMotion}
                  isSaved={savedIds.has(p.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main Archive Exploration Area */}
        <section className="archive-intro" id="archive">
          <div className="archive-title">
            <div className="eyebrow">{t.archiveKicker}</div>
            <h2>{t.archiveTitle}</h2>
          </div>
          <p className="archive-description">{t.archiveDesc}</p>
        </section>

        <section aria-label={lang === 'ar' ? 'تصفية المشاريع' : 'Filter projects'}>
          <div className="filters">
            <div className="filter-top">
              <label className="search-wrap relative flex-1">
                <Search size={17} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t.search}
                  aria-label={t.search}
                  data-testid="input-project-search"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="p-1 hover:text-[var(--teal)] transition-colors"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <kbd className="mono">/</kbd>
                )}
              </label>

              <select
                className="sort-select"
                value={sort}
                aria-label={t.sort}
                onChange={e => setSort(e.target.value as Sort)}
                data-testid="select-sort"
              >
                <option value="featured">{t.featured}</option>
                <option value="az">{t.az}</option>
                <option value="za">{t.za}</option>
              </select>

              <div
                className="view-toggle"
                role="group"
                aria-label={lang === 'ar' ? 'طريقة العرض' : 'View mode'}
              >
                <button
                  type="button"
                  className={view === 'grid' ? 'active' : ''}
                  aria-label="Grid view"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                  data-testid="button-view-grid"
                >
                  <Grid2X2 size={15} />
                </button>
                <button
                  type="button"
                  className={view === 'list' ? 'active' : ''}
                  aria-label="List view"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                  data-testid="button-view-list"
                >
                  <List size={16} />
                </button>
              </div>
            </div>

            {/* Active Tag Filter Indicator */}
            {activeTag && (
              <div className="flex items-center gap-2 pt-3 text-xs font-mono text-[var(--teal)]">
                <span>{t.tagFiltered}</span>
                <span className="px-2 py-0.5 bg-[var(--soft)] border border-[var(--line)] flex items-center gap-1.5">
                  #{activeTag}
                  <button
                    type="button"
                    onClick={() => setActiveTag(null)}
                    className="hover:text-red-500"
                    title={t.clearTag}
                  >
                    <X size={12} />
                  </button>
                </span>
              </div>
            )}

            <div className="filter-bottom">
              <div
                className="chip-row relative"
                role="group"
                aria-label={lang === 'ar' ? 'التصنيفات' : 'Categories'}
              >
                {categories.map(category => {
                  const label = categoryNames[category][lang === 'ar' ? 1 : 0];
                  const isActive = group === category;
                  return (
                    <button
                      type="button"
                      className={`filter-chip relative ${isActive ? 'active' : ''}`}
                      key={category}
                      onClick={() => setGroup(category)}
                      aria-pressed={isActive}
                      data-testid={`filter-category-${category.toLowerCase()}`}
                    >
                      {isActive && !shouldReduceMotion && (
                        <motion.span
                          layoutId="activeFilterBg"
                          className="absolute inset-0 bg-[var(--night)] rounded-[4px] -z-1"
                          transition={{ type: 'spring', damping: 26, stiffness: 350 }}
                        />
                      )}
                      <span className="relative z-10">{label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="filter-options">
                <select
                  className="origin-select"
                  aria-label={t.allOrigins}
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  data-testid="select-origin"
                >
                  <option value="all">{t.allOrigins}</option>
                  {[...new Set(distinctProjects.map(p => p.origin))].sort().map(o => (
                    <option value={o} key={o}>
                      {originNames[o] || o}
                    </option>
                  ))}
                </select>

                {roads.length > 0 && (
                  <select
                    className="road-select"
                    aria-label={t.road}
                    value={road}
                    onChange={e => setRoad(e.target.value)}
                    data-testid="select-road"
                  >
                    <option value="all">{t.road}</option>
                    {roads.map(r => (
                      <option value={r} key={r}>
                        {roadNames[r]?.[lang] || r}
                      </option>
                    ))}
                  </select>
                )}

                <label className="live-toggle">
                  <input
                    type="checkbox"
                    checked={liveOnly}
                    onChange={e => setLiveOnly(e.target.checked)}
                    data-testid="toggle-live-only"
                  />
                  {t.liveOnly}
                </label>

                <button
                  type="button"
                  onClick={() => setSavedOnly(s => !s)}
                  className={`live-toggle border border-[var(--line)] px-2.5 py-1 rounded cursor-pointer transition-colors ${
                    savedOnly
                      ? 'bg-[var(--night)] text-[var(--teal)] border-[var(--teal)] font-bold'
                      : 'hover:border-[var(--teal)]'
                  }`}
                  data-testid="filter-saved-projects"
                  title={
                    lang === 'ar'
                      ? 'تصفية المشاريع المحفوظة في هذه الجلسة'
                      : 'Filter saved projects for this session'
                  }
                >
                  <Bookmark
                    size={11}
                    className={savedOnly || savedIds.size > 0 ? 'fill-[var(--teal)] text-[var(--teal)]' : ''}
                  />
                  <span>{lang === 'ar' ? 'المحفوظات' : 'Saved'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="result-line">
            <span>
              {filtered
                ? (lang === 'ar' ? `${shown.length} مشاريع مطابقة للتصفية` : `${shown.length} matching filtered projects`)
                : `${distinctProjects.length} ${t.results}`}
            </span>
            {filtered ? (
              <button
                className="reset-button hover:underline cursor-pointer"
                onClick={reset}
                type="button"
                data-testid="button-reset-filters"
              >
                {t.reset} ×
              </button>
            ) : (
              <span>
                <strong className="text-[var(--teal)]">{liveCount}</strong> {t.available}
              </span>
            )}
          </div>

          {/* Project Grid / List display */}
          {error ? (
            <div className="empty" role="alert">
              <h3>{lang === 'ar' ? 'تعذر تحميل فهرس المشاريع' : 'The project index could not be loaded.'}</h3>
              <p>
                {lang === 'ar'
                  ? 'تأكد من تشغيل الموقع عبر خادم الويب.'
                  : 'Please serve the app from its configured web root and reload.'}
              </p>
              <button
                className="reset-button"
                onClick={() => window.location.reload()}
                data-testid="button-retry"
              >
                {lang === 'ar' ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          ) : projects.length === 0 ? (
            <div
              className="loading"
              aria-label={lang === 'ar' ? 'جارٍ تحميل المشاريع' : 'Loading projects'}
            >
              {[1, 2, 3].map(n => (
                <div className="skeleton" key={n} />
              ))}
            </div>
          ) : shown.length ? (
            <motion.div
              layout
              className={`project-grid ${view}`}
              data-testid="project-archive"
            >
              {shown.map((p, idx) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  lang={lang}
                  index={distinctProjects.indexOf(p)}
                  onOpen={open}
                  onFilterByTag={filterByTag}
                  onOpenLightbox={openLightbox}
                  shouldReduceMotion={shouldReduceMotion}
                  isSaved={savedIds.has(p.id)}
                  onToggleSave={toggleSave}
                />
              ))}
            </motion.div>
          ) : (
            <div className="empty" data-testid="empty-project-results">
              <h3>
                {savedOnly
                  ? lang === 'ar'
                    ? 'لم تقم بحفظ أي مشاريع بعد خلال هذه الجلسة'
                    : 'No saved projects in this session yet'
                  : t.emptyTitle}
              </h3>
              <p>
                {savedOnly
                  ? lang === 'ar'
                    ? 'مرر مؤشر الفأرة فوق أي بطاقة مشروع وانقر على أيقونة الإشارة المرجعية لحفظها والرجوع إليها بسهولة دون فتح نافذة التفاصيل.'
                    : 'Hover over any project card and click the floating bookmark icon to save it here without opening the full details drawer.'
                  : t.empty}
              </p>
              <button className="reset-button" onClick={reset} data-testid="button-empty-reset">
                {t.reset}
              </button>
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="footer-main">
            <div className="footer-title">
              SAAD <span>×</span> NOTAQ
            </div>
            <p className="footer-copy">{t.footerCopy}</p>
            <a
              className="footer-link"
              href="https://www.barghouth.me/"
              target="_blank"
              rel="noreferrer"
              data-testid="link-professional-portfolio"
            >
              {t.identity}
              <ArrowRight size={15} className={lang === 'ar' ? 'rotate-180' : ''} />
            </a>
          </div>
          <div className="footer-meta">
            <span>{t.footerTitle}</span>
            <span>{t.cairo}</span>
            <span>© SAAD BARGHOUTH / NOTAQ</span>
          </div>
        </footer>
      </main>

      {/* Interactive Project Drawer */}
      <AnimatePresence>
        {selected && (
          <ProjectDrawer
            project={selected}
            projects={projects}
            filteredProjects={shown}
            lang={lang}
            onClose={closeProject}
            onSelect={id => {
              setSelectedId(id);
              const u = new URL(window.location.href);
              u.searchParams.set('project', id);
              window.history.replaceState({}, '', u);
            }}
            onFilterByTag={filterByTag}
            onFilterByGroup={grp => {
              setGroup(grp);
              closeProject();
              document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onFilterByOrigin={orig => {
              setOrigin(orig);
              closeProject();
              document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onResetFilters={() => {
              reset();
              closeProject();
              document.getElementById('archive')?.scrollIntoView({ behavior: 'smooth' });
            }}
            onOpenLightbox={openLightbox}
          />
        )}
      </AnimatePresence>

      {/* Cinematic Showcase Reel Video Modal */}
      <VideoModal isOpen={isVideoOpen} onClose={() => setIsVideoOpen(false)} lang={lang} />

      {/* Image Lightbox Zoom Modal */}
      <ProjectLightbox
        isOpen={lightboxState.isOpen}
        imageSrc={lightboxState.src}
        title={lightboxState.title}
        onClose={() => setLightboxState({ isOpen: false, src: null, title: '' })}
        lang={lang}
      />
    </div>
  );
}
