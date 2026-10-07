import { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Calendar, Clock, Activity } from 'lucide-react';
import {
  ARCHIVE_START_DATE,
  ARCHIVE_END_DATE,
  getProjectDateInfo,
  type ProjectDateInfo,
} from '../lib/projectTimeline';

interface Project {
  id: string;
  en: string;
  ar: string;
  group: string;
  status: string;
  startYear?: number | string;
  completionYear?: number | string;
  endYear?: number | string;
  year?: number | string;
}

interface ProjectTimelineProps {
  project: Project;
  allProjects: Project[];
  lang: 'en' | 'ar';
}

export function ProjectTimeline({ project, allProjects, lang }: ProjectTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Compute this project's date information
  const dateInfo = useMemo<ProjectDateInfo>(() => {
    const idx = allProjects.findIndex(p => p.id === project.id);
    return getProjectDateInfo(
      project.id,
      project.group,
      project.status,
      Math.max(0, idx),
      project.startYear,
      project.completionYear ?? project.endYear
    );
  }, [project.id, project.group, project.status, project.startYear, project.completionYear, project.endYear, allProjects]);

  // Compute all projects date spans to calculate archive density / frequency across quarters
  const archiveSpans = useMemo(() => {
    return allProjects.map((p, i) => getProjectDateInfo(p.id, p.group, p.status, i));
  }, [allProjects]);

  // Calculate concurrent projects overlapping this project's timeframe
  const concurrentProjectsCount = useMemo(() => {
    return archiveSpans.filter(
      span => span.startDate <= dateInfo.endDate && span.endDate >= dateInfo.startDate
    ).length;
  }, [archiveSpans, dateInfo]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 580;
    const height = 120;
    const margin = { top: 22, right: 28, bottom: 32, left: 28 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale: 2023 to end of 2026
    const xScale = d3
      .scaleTime()
      .domain([ARCHIVE_START_DATE, ARCHIVE_END_DATE])
      .range([0, innerWidth]);

    // 1. Density / Frequency Background across 16 Quarters
    // Create quarters from 2023 Q1 to 2026 Q4
    const quarters: { start: Date; end: Date; count: number }[] = [];
    for (let year = 2023; year <= 2026; year++) {
      for (let q = 0; q < 4; q++) {
        if (year === 2026 && q > 3) continue;
        const qStart = new Date(year, q * 3, 1);
        const qEnd = new Date(year, q * 3 + 3, 0);
        const count = archiveSpans.filter(s => s.startDate <= qEnd && s.endDate >= qStart).length;
        quarters.push({ start: qStart, end: qEnd, count });
      }
    }

    const maxDensity = d3.max(quarters, d => d.count) || 1;
    const densityScale = d3
      .scaleLinear()
      .domain([0, maxDensity])
      .range([0, innerHeight - 8]);

    // Draw background quarterly frequency bars
    g.selectAll('.density-bar')
      .data(quarters)
      .enter()
      .append('rect')
      .attr('class', 'density-bar')
      .attr('x', d => xScale(d.start))
      .attr('width', d => Math.max(2, xScale(d.end) - xScale(d.start) - 1.5))
      .attr('y', d => innerHeight - densityScale(d.count))
      .attr('height', d => densityScale(d.count))
      .attr('fill', 'var(--line)')
      .attr('opacity', 0.45)
      .attr('rx', 1);

    // 2. Archive baseline line
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight)
      .attr('y2', innerHeight)
      .attr('stroke', 'var(--line)')
      .attr('stroke-width', 1.5);

    // 3. Year Milestone Ticks
    const years = [2023, 2024, 2025, 2026];
    years.forEach(yr => {
      const x = xScale(new Date(yr, 0, 1));

      // Tick mark
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', innerHeight - 4)
        .attr('y2', innerHeight + 6)
        .attr('stroke', 'var(--muted)')
        .attr('stroke-width', 1.2);

      // Year Label
      g.append('text')
        .attr('x', x)
        .attr('y', innerHeight + 18)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'var(--app-font-mono)')
        .attr('fill', 'var(--muted)')
        .text(yr);
    });

    // 4. Project Span Highlight
    const projectStartX = xScale(dateInfo.startDate);
    const projectEndX = xScale(dateInfo.endDate);
    const spanWidth = Math.max(10, projectEndX - projectStartX);
    const barY = innerHeight * 0.42;
    const barHeight = 14;

    // Glowing shadow for project span
    g.append('rect')
      .attr('x', projectStartX)
      .attr('y', barY - 2)
      .attr('width', spanWidth)
      .attr('height', barHeight + 4)
      .attr('fill', 'var(--teal)')
      .attr('opacity', 0.18)
      .attr('rx', 4);

    // Main Project Span Bar
    const projectBar = g
      .append('rect')
      .attr('class', 'project-timeline-bar')
      .attr('x', projectStartX)
      .attr('y', barY)
      .attr('width', spanWidth)
      .attr('height', barHeight)
      .attr('fill', 'var(--teal)')
      .attr('opacity', 0.88)
      .attr('rx', 2.5);

    // Animate width expansion
    projectBar
      .attr('width', 0)
      .transition()
      .duration(500)
      .ease(d3.easeCubicOut)
      .attr('width', spanWidth);

    // Start Pin Circle
    g.append('circle')
      .attr('cx', projectStartX)
      .attr('cy', barY + barHeight / 2)
      .attr('r', 4.5)
      .attr('fill', 'var(--paper)')
      .attr('stroke', 'var(--teal)')
      .attr('stroke-width', 2);

    // End Pin Circle (or pulsing arrow if ongoing)
    if (dateInfo.isOngoing) {
      g.append('circle')
        .attr('cx', projectEndX)
        .attr('cy', barY + barHeight / 2)
        .attr('r', 5)
        .attr('fill', 'var(--amber)')
        .attr('stroke', 'var(--paper)')
        .attr('stroke-width', 1.5);
    } else {
      g.append('circle')
        .attr('cx', projectEndX)
        .attr('cy', barY + barHeight / 2)
        .attr('r', 4.5)
        .attr('fill', 'var(--paper)')
        .attr('stroke', 'var(--teal)')
        .attr('stroke-width', 2);
    }

    // Top Label over project span
    const labelX = Math.min(
      innerWidth - 50,
      Math.max(45, projectStartX + spanWidth / 2)
    );

    g.append('text')
      .attr('x', labelX)
      .attr('y', barY - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--app-font-mono)')
      .attr('fill', 'var(--teal)')
      .text(lang === 'ar' ? dateInfo.durationAr : dateInfo.durationEn);

    // Optional interactive hover guide
    const hoverLine = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'var(--amber)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2 2')
      .style('opacity', 0);

    svg.on('mousemove', function (event) {
      const [mx] = d3.pointer(event, g.node());
      if (mx >= 0 && mx <= innerWidth) {
        hoverLine.attr('x1', mx).attr('x2', mx).style('opacity', 1);
        const date = xScale.invert(mx);
        const month = date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
          month: 'short',
          year: 'numeric',
        });
        setHoveredDate(month);
      }
    });

    svg.on('mouseleave', function () {
      hoverLine.style('opacity', 0);
      setHoveredDate(null);
    });
  }, [dateInfo, archiveSpans, lang]);

  return (
    <div
      ref={containerRef}
      className="p-3.5 my-4 bg-[var(--card)] border border-[var(--line)]"
      data-testid="project-timeline-block"
    >
      {/* Header */}
      <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-[var(--line)]">
        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-[var(--teal)]" />
          <span className="font-bold text-[var(--ink)] uppercase tracking-wider text-[10px]">
            {lang === 'ar' ? 'التسلسل الزمني وفترة التنفيذ' : 'PROJECT TIMELINE & ARCHIVE CADENCE'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
          <Clock size={11} className="text-[var(--amber)]" />
          <span>{lang === 'ar' ? dateInfo.formattedRangeAr : dateInfo.formattedRangeEn}</span>
        </div>
      </div>

      {/* D3 SVG Visualization */}
      <div className="relative pt-2">
        <svg ref={svgRef} className="w-full overflow-visible select-none" />

        {hoveredDate && (
          <div className="absolute top-1 inset-inline-end-1 text-[8px] font-mono text-[var(--amber)] bg-[var(--soft)] px-1.5 py-0.5 border border-[var(--line)] pointer-events-none">
            {hoveredDate}
          </div>
        )}
      </div>

      {/* Contextual Frequency & Duration Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2.5 mt-1 border-t border-[var(--line)] text-[9px] font-mono text-[var(--muted)]">
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-[var(--teal)] font-bold">●</span>
          <span>
            {lang === 'ar' ? 'المدة:' : 'Duration:'}{' '}
            <strong className="text-[var(--ink)]">
              {lang === 'ar' ? dateInfo.durationAr : dateInfo.durationEn}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-1.5 truncate">
          <Activity size={10} className="text-[var(--teal)]" />
          <span>
            {lang === 'ar' ? 'التزامن:' : 'Concurrency:'}{' '}
            <strong className="text-[var(--ink)]">
              {concurrentProjectsCount} {lang === 'ar' ? 'مشاريع متزامنة' : 'concurrent projects'}
            </strong>
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 justify-start sm:justify-end text-[8px] text-[var(--muted)]">
          <span>{lang === 'ar' ? 'النطاق الكلي: ٢٠٢٣ — ٢٠٢٦' : 'Archive range: 2023 — 2026'}</span>
        </div>
      </div>
    </div>
  );
}
