import { motion, useReducedMotion } from 'motion/react';
import { ArrowDown } from 'lucide-react';

interface ScrollIndicatorProps {
  lang: 'en' | 'ar';
  targetId?: string;
}

const PREMIUM_EASE = [0.22, 1, 0.36, 1] as const;

export function ScrollIndicator({ lang, targetId = 'featured-work' }: ScrollIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  const handleClick = () => {
    const el = document.getElementById(targetId) || document.getElementById('archive');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const label = lang === 'ar' ? 'مرّر لاستكشاف المشاريع' : 'Scroll to explore';

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: PREMIUM_EASE }}
      className="hidden sm:inline-flex items-center gap-2.5 py-1.5 px-3 bg-transparent text-[var(--muted)] hover:text-[var(--ink)] text-[10px] font-mono tracking-wider transition-colors cursor-pointer group select-none border border-transparent hover:border-[var(--line)] rounded focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
      aria-label={label}
    >
      <span className="relative flex items-center justify-center w-3.5 h-6 border border-[var(--muted)]/50 group-hover:border-[var(--teal)] rounded-full transition-colors">
        <motion.span
          animate={shouldReduceMotion ? undefined : { y: [0, 6, 0] }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="w-1 h-1.5 rounded-full bg-[var(--teal)]"
        />
      </span>
      <span className="uppercase text-[9px] tracking-widest">{label}</span>
      <ArrowDown
        size={11}
        className="text-[var(--teal)] group-hover:translate-y-0.5 transition-transform"
      />
    </motion.button>
  );
}
