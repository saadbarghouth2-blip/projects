import { useState, useRef, useEffect } from 'react';
import { Compass, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface CorridorNode {
  id: string;
  nameEn: string;
  nameAr: string;
  x: number; // percentage in SVG
  y: number; // percentage in SVG
  count: number;
}

const CORRIDORS: CorridorNode[] = [
  { id: 'all', nameEn: 'Cairo Hub (30°02′N · 31°14′E)', nameAr: 'مركز القاهرة (٣٠°٠٢′ ش · ٣١°١٤′ ق)', x: 50, y: 48, count: 94 },
  { id: 'Cairo–Ismailia', nameEn: 'Cairo–Ismailia Corridor', nameAr: 'محور القاهرة — الإسماعيلية', x: 68, y: 38, count: 5 },
  { id: 'Cairo–Suez', nameEn: 'Cairo–Suez Corridor', nameAr: 'محور القاهرة — السويس', x: 74, y: 48, count: 4 },
  { id: 'Eastern Regional Ring Road', nameEn: 'Eastern Regional Ring Road', nameAr: 'الطريق الدائري الإقليمي الشرقي', x: 60, y: 44, count: 5 },
  { id: 'Dabaa', nameEn: 'El-Dabaa Axis', nameAr: 'محور الضبعة', x: 26, y: 36, count: 5 },
  { id: 'South Dahshur', nameEn: 'South Dahshur Corridor', nameAr: 'محور جنوب دهشور', x: 42, y: 56, count: 4 },
  { id: 'Western Upper Egypt', nameEn: 'Western Upper Egypt Corridor', nameAr: 'محور غرب الصعيد', x: 44, y: 68, count: 5 },
  { id: 'Qus', nameEn: 'Qus Axis (Qena)', nameAr: 'محور قوص (قنا)', x: 55, y: 76, count: 5 },
  { id: 'Qena–Luxor', nameEn: 'Qena–Luxor Corridor', nameAr: 'محور قنا — الأقصر', x: 52, y: 80, count: 4 },
  { id: 'Kalabsha', nameEn: 'Kalabsha Axis (Aswan)', nameAr: 'محور كلابشة (أسوان)', x: 58, y: 86, count: 5 },
];

interface SpatialRadarProps {
  lang: 'en' | 'ar';
  selectedRoad: string;
  onSelectRoad: (road: string) => void;
}

export function SpatialRadar({ lang, selectedRoad, onSelectRoad }: SpatialRadarProps) {
  const [activeNode, setActiveNode] = useState<CorridorNode>(CORRIDORS[0]);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCursorPos({ x: Math.round(x), y: Math.round(y) });

    // Find closest node
    let closest = CORRIDORS[0];
    let minDist = Infinity;
    for (const node of CORRIDORS) {
      const d = Math.hypot(node.x - x, node.y - y);
      if (d < minDist) {
        minDist = d;
        closest = node;
      }
    }
    if (minDist < 25) {
      setActiveNode(closest);
    }
  };

  const handleMouseLeave = () => {
    setCursorPos(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[320px] sm:h-[350px] overflow-hidden border border-[var(--line)] bg-[var(--soft)] select-none group"
      aria-label={lang === 'ar' ? 'رادار مكاني تفاعلي' : 'Interactive spatial coordinates radar'}
    >
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_srgb,var(--ink)_6%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--ink)_6%,transparent)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Rotating Radar Sweep */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, color-mix(in srgb, var(--teal) 15%, transparent) 360deg)',
        }}
      />

      {/* Concentric Coordinate Rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-[color-mix(in_srgb,var(--ink)_14%,transparent)] fill-none">
        <circle cx="50%" cy="50%" r="50" strokeDasharray="3 3" />
        <circle cx="50%" cy="50%" r="100" strokeDasharray="4 4" />
        <circle cx="50%" cy="50%" r="145" strokeDasharray="2 6" />
        <line x1="50%" y1="0" x2="50%" y2="100%" strokeDasharray="2 4" />
        <line x1="0" y1="50%" x2="100%" y2="50%" strokeDasharray="2 4" />
      </svg>

      {/* Interactive Corridor Nodes */}
      {CORRIDORS.map(node => {
        const isSelected = selectedRoad === node.id || (node.id === 'all' && selectedRoad === 'all');
        const isHovered = activeNode.id === node.id;
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onSelectRoad(node.id)}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 transition-transform duration-200 cursor-pointer p-2 focus:outline-none ${
              isHovered ? 'scale-125 z-20' : 'scale-100'
            }`}
            title={`${lang === 'ar' ? node.nameAr : node.nameEn} (${node.count} ${lang === 'ar' ? 'مشروع' : 'projects'})`}
          >
            <span className="relative flex items-center justify-center w-5 h-5">
              {(isHovered || isSelected) && (
                <span
                  className={`absolute inset-0 rounded-full animate-ping opacity-60 ${
                    isSelected ? 'bg-[var(--teal)]' : 'bg-[var(--amber)]'
                  }`}
                />
              )}
              <span
                className={`relative w-2.5 h-2.5 rounded-full border transition-colors ${
                  isSelected
                    ? 'bg-[var(--teal)] border-[var(--paper)] ring-2 ring-[var(--teal)]'
                    : isHovered
                    ? 'bg-[var(--amber)] border-[var(--paper)]'
                    : 'bg-[var(--ink)]/40 border-[var(--line)]'
                }`}
              />
            </span>
          </button>
        );
      })}

      {/* Top HUD: Spatial Coordinates readout */}
      <div className="absolute top-3 inset-inline-start-3 z-10 flex items-center gap-2 bg-[var(--paper)] border border-[var(--line)] px-2.5 py-1.5 text-[9px] font-mono tracking-wider text-[var(--muted)]">
        <Compass size={13} className="text-[var(--teal)] animate-spin" style={{ animationDuration: '30s' }} />
        <span>
          {cursorPos
            ? `${(30 + (100 - cursorPos.y) * 0.03).toFixed(2)}°N · ${(31 + cursorPos.x * 0.02).toFixed(2)}°E`
            : '30°02′N · 31°14′E · CAIRO'}
        </span>
      </div>

      {/* Bottom HUD: Active Corridor Card */}
      <motion.div
        key={activeNode.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="absolute bottom-3 inset-inline-start-3 inset-inline-end-3 sm:inset-inline-end-auto z-10 bg-[var(--card)] border border-[var(--line)] p-2.5 flex items-center justify-between gap-3 text-[10px] shadow-lg max-w-[360px]"
      >
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-[var(--amber)] shrink-0" />
          <div className="leading-tight">
            <span className="font-bold text-[var(--ink)] block">
              {lang === 'ar' ? activeNode.nameAr : activeNode.nameEn}
            </span>
            <span className="text-[8px] font-mono text-[var(--muted)]">
              {lang === 'ar' ? 'انقر لتصفية الأرشيف' : 'Click node to filter archive'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onSelectRoad(activeNode.id)}
          className="text-[9px] font-mono px-2 py-1 bg-[var(--night)] text-[var(--paper)] hover:bg-[var(--teal)] hover:text-[#10221e] transition-colors whitespace-nowrap"
        >
          {lang === 'ar' ? 'تصفية' : 'Filter'}
        </button>
      </motion.div>

      {/* Subtle Corner watermark */}
      <div className="absolute top-3 inset-inline-end-3 z-10 text-[8px] font-mono text-[var(--teal)] tracking-widest uppercase">
        {lang === 'ar' ? 'إحداثيات جغرافية مكشوفة' : 'SPATIAL TELEMETRY'}
      </div>
    </div>
  );
}
