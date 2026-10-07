import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Layers, CheckCircle2, Globe2, Compass } from 'lucide-react';

interface StatsBarProps {
  totalProjects: number;
  liveCount: number;
  verifiedScreensCount: number;
  sectorsCount: number;
  liveOnly: boolean;
  onToggleLive: () => void;
  lang: 'en' | 'ar';
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1200; // ms
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = value / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  return <span>{String(count).padStart(2, '0')}</span>;
}

export function StatsBar({
  totalProjects,
  liveCount,
  verifiedScreensCount,
  sectorsCount,
  liveOnly,
  onToggleLive,
  lang,
}: StatsBarProps) {
  const stats = [
    {
      id: 'total',
      icon: <Layers size={15} className="text-[var(--teal)]" />,
      number: totalProjects,
      labelEn: 'DISTINCT ARCHIVE RECORDS',
      labelAr: 'سجلاً متميزاً في الأرشيف',
      clickable: false,
    },
    {
      id: 'verified',
      icon: <CheckCircle2 size={15} className="text-[var(--teal)]" />,
      number: verifiedScreensCount,
      labelEn: 'VERIFIED SCREENSHOT AUDITS',
      labelAr: 'لقطة موثقة بأدلة فحص',
      clickable: false,
    },
    {
      id: 'live',
      icon: <Globe2 size={15} className="text-[var(--amber)]" />,
      number: liveCount,
      labelEn: 'LIVE ACTIVE DEPLOYMENTS',
      labelAr: 'رابطاً مباشراً قيد التشغيل',
      clickable: true,
      active: liveOnly,
    },
    {
      id: 'sectors',
      icon: <Compass size={15} className="text-[var(--teal)]" />,
      number: sectorsCount,
      labelEn: 'SPATIAL & DIGITAL SECTORS',
      labelAr: 'قطاعات مكانية ورقمية',
      clickable: false,
    },
  ];

  return (
    <div className="w-full border-y border-[var(--line)] bg-[var(--soft)] py-2.5 sm:py-3 my-4 sm:my-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 md:gap-6 md:divide-x md:rtl:divide-x-reverse md:divide-[var(--line)]">
        {stats.map((s, idx) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08, duration: 0.3 }}
            onClick={s.clickable ? onToggleLive : undefined}
            className={`flex items-center gap-2 sm:gap-3 p-2 sm:px-3 sm:py-2 border md:border-0 border-[var(--line)] bg-[var(--card)]/60 md:bg-transparent rounded md:rounded-none ${
              s.clickable
                ? 'cursor-pointer hover:bg-[var(--paper)] transition-colors'
                : ''
            } ${s.active ? 'bg-[var(--card)] ring-1 ring-[var(--teal)]' : ''}`}
          >
            <div className="shrink-0 p-1.5 sm:p-2 bg-[var(--card)] border border-[var(--line)] rounded-[3px]">
              {s.icon}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="font-mono font-bold text-sm sm:text-base md:text-lg text-[var(--ink)] flex items-center gap-1">
                <AnimatedCounter value={s.number} />
                {s.clickable && (
                  <span className="text-[7px] sm:text-[8px] font-mono text-[var(--teal)] uppercase font-semibold">
                    {s.active ? (lang === 'ar' ? 'مفعل' : 'ACTIVE') : (lang === 'ar' ? 'انقر' : 'TOGGLE')}
                  </span>
                )}
              </div>
              <div className="text-[7.5px] sm:text-[9px] font-mono tracking-wider text-[var(--muted)] uppercase truncate">
                {lang === 'ar' ? s.labelAr : s.labelEn}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
