import { useState } from 'react';
import { Bookmark, ExternalLink, Share2, Check } from 'lucide-react';

interface QuickActionsMenuProps {
  projectId: string;
  projectUrl: string | null;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
  lang: 'en' | 'ar';
}

export function QuickActionsMenu({
  projectId,
  projectUrl,
  isSaved,
  onToggleSave,
  lang,
}: QuickActionsMenuProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = new URL(window.location.href);
    url.searchParams.set('project', projectId);
    navigator.clipboard.writeText(url.toString()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  };

  return (
    <div
      className="absolute inset-inline-start-1.5 top-1.5 z-20 flex items-center gap-0.5 p-0.5 bg-[#0b141af2] sm:bg-[#0b141ae6] backdrop-blur-md border border-white/20 rounded shadow-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-auto select-none"
      onClick={e => e.stopPropagation()}
      role="toolbar"
      aria-label={lang === 'ar' ? 'إجراءات سريعة' : 'Quick actions'}
      data-testid={`quick-actions-${projectId}`}
    >
      {/* Bookmark Toggle Button */}
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onToggleSave(projectId);
        }}
        className={`p-1 sm:p-1.5 min-w-[26px] min-h-[26px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded transition-all duration-150 cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none ${
          isSaved
            ? 'text-[var(--teal)] bg-[var(--teal)]/20 hover:bg-[var(--teal)]/30'
            : 'text-white/80 hover:text-white hover:bg-white/15'
        }`}
        title={
          isSaved
            ? lang === 'ar'
              ? 'إزالة من المحفوظات'
              : 'Remove from saved'
            : lang === 'ar'
              ? 'حفظ في قائمة الجلسة'
              : 'Save to session list'
        }
        aria-label={
          isSaved
            ? lang === 'ar'
              ? 'إزالة من المحفوظات'
              : 'Remove from saved'
            : lang === 'ar'
              ? 'حفظ في قائمة الجلسة'
              : 'Save to session list'
        }
        aria-pressed={isSaved}
        data-testid={`button-bookmark-${projectId}`}
      >
        <Bookmark size={11} className={isSaved ? 'fill-current' : ''} />
      </button>

      {/* Quick Share Link */}
      <button
        type="button"
        onClick={handleCopyLink}
        className="p-1 sm:p-1.5 min-w-[26px] min-h-[26px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
        title={
          copied
            ? lang === 'ar'
              ? 'تم النسخ!'
              : 'Copied link!'
            : lang === 'ar'
              ? 'نسخ رابط المشروع'
              : 'Copy project link'
        }
        aria-label={lang === 'ar' ? 'نسخ رابط المشروع' : 'Copy project link'}
        data-testid={`button-quick-share-${projectId}`}
      >
        {copied ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
      </button>

      {/* External Live Link (if available) */}
      {projectUrl && (
        <a
          href={projectUrl}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          className="p-1 sm:p-1.5 min-w-[26px] min-h-[26px] sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-[var(--teal)] focus:outline-none"
          title={lang === 'ar' ? 'زيارة الرابط المباشر' : 'Visit live URL'}
          aria-label={lang === 'ar' ? 'زيارة الرابط المباشر' : 'Visit live URL'}
          data-testid={`link-quick-external-${projectId}`}
        >
          <ExternalLink size={11} />
        </a>
      )}
    </div>
  );
}
