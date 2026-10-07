export interface ProjectDateInfo {
  startDate: Date;
  endDate: Date;
  durationMonths: number;
  isOngoing: boolean;
  formattedRangeEn: string;
  formattedRangeAr: string;
  durationEn: string;
  durationAr: string;
  startYearNum: number;
  completionYearNum: number;
}

export const ARCHIVE_START_DATE = new Date(2023, 0, 1); // Jan 1, 2023
export const ARCHIVE_END_DATE = new Date(2026, 9, 31); // Oct 31, 2026

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

// Simple deterministic hash based on project id string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Known anchors for flagship projects
const SPECIFIC_PROJECT_DATES: Record<string, { start: [number, number]; end: [number, number]; ongoing?: boolean }> = {
  transport: { start: [2023, 2], end: [2024, 10], ongoing: true },
  'smart-infra': { start: [2024, 0], end: [2025, 1], ongoing: true },
  'gis-automator': { start: [2023, 6], end: [2024, 3], ongoing: false },
  'transport-dashboard-ismailia-development-impact': { start: [2024, 1], end: [2024, 11], ongoing: false },
  'rsg-destinations': { start: [2024, 7], end: [2025, 5], ongoing: true },
  'alex-desert-road': { start: [2023, 8], end: [2024, 5], ongoing: false },
  'kalabsha-axis': { start: [2024, 3], end: [2024, 9], ongoing: false },
  'dabaa-corridor': { start: [2023, 10], end: [2024, 7], ongoing: false },
};

export function getProjectDateInfo(
  projectId: string,
  group: string = 'GIS',
  status: string = 'catalog',
  index: number = 0,
  explicitStartYear?: number | string,
  explicitCompletionYear?: number | string
): ProjectDateInfo {
  let startDate: Date;
  let endDate: Date;
  let isOngoing = status === 'live';

  if (explicitStartYear) {
    const sYr = Number(explicitStartYear);
    const eYr = explicitCompletionYear ? Number(explicitCompletionYear) : sYr;
    const startYear = isNaN(sYr) ? 2023 : sYr;
    const endYear = isNaN(eYr) ? startYear : Math.max(startYear, eYr);
    startDate = new Date(startYear, 0, 1);
    endDate = new Date(endYear, 11, 28);
  } else if (SPECIFIC_PROJECT_DATES[projectId]) {
    const spec = SPECIFIC_PROJECT_DATES[projectId];
    startDate = new Date(spec.start[0], spec.start[1], 1);
    endDate = new Date(spec.end[0], spec.end[1], 28);
    if (spec.ongoing !== undefined) isOngoing = spec.ongoing;
  } else {
    // Generate harmonious timeline placement based on group & deterministic seed
    const hash = hashString(projectId + index);
    let startYear = 2023;
    let startMonth = hash % 12;

    if (group === 'GIS') {
      startYear = 2023 + (hash % 2); // 2023 or 2024
      startMonth = (hash % 10) + 1;
    } else if (group === 'Dashboards') {
      startYear = 2024 + (hash % 2); // 2024 or 2025
      startMonth = hash % 12;
    } else if (group === 'Platforms' || group === 'Systems') {
      startYear = 2023 + (hash % 3); // 2023 to 2025
      startMonth = hash % 12;
    } else if (group === 'AI' || group === 'Commerce') {
      startYear = 2025 + (hash % 2); // 2025 or 2026
      startMonth = hash % 8;
    } else {
      startYear = 2023 + (hash % 4);
      startMonth = hash % 12;
    }

    // Clamp start
    if (startYear === 2026 && startMonth > 5) startMonth = 5;
    startDate = new Date(startYear, startMonth, 1);

    // Duration between 3 and 11 months
    const durationMonths = 3 + (hash % 8);
    let endYear = startYear;
    let endMonth = startMonth + durationMonths;
    if (endMonth >= 12) {
      endYear += Math.floor(endMonth / 12);
      endMonth = endMonth % 12;
    }

    if (endYear > 2026 || (endYear === 2026 && endMonth > 9)) {
      endYear = 2026;
      endMonth = 9;
    }

    endDate = new Date(endYear, endMonth, 28);
  }

  // Calculate duration in months
  const durationMonths = Math.max(
    1,
    (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1
  );

  const startMonthEn = MONTHS_EN[startDate.getMonth()];
  const startMonthAr = MONTHS_AR[startDate.getMonth()];
  const startYear = startDate.getFullYear();

  const endMonthEn = MONTHS_EN[endDate.getMonth()];
  const endMonthAr = MONTHS_AR[endDate.getMonth()];
  const endYear = endDate.getFullYear();

  const formattedRangeEn = isOngoing
    ? `${startMonthEn} ${startYear} — Present (${durationMonths} ${durationMonths === 1 ? 'month' : 'months'})`
    : `${startMonthEn} ${startYear} — ${endMonthEn} ${endYear} (${durationMonths} ${durationMonths === 1 ? 'month' : 'months'})`;

  const formattedRangeAr = isOngoing
    ? `${startMonthAr} ${startYear} — مستمر (${durationMonths} ${durationMonths === 1 ? 'شهر' : durationMonths <= 10 ? 'أشهر' : 'شهراً'})`
    : `${startMonthAr} ${startYear} — ${endMonthAr} ${endYear} (${durationMonths} ${durationMonths === 1 ? 'شهر' : durationMonths <= 10 ? 'أشهر' : 'شهراً'})`;

  const durationEn = `${durationMonths} month${durationMonths > 1 ? 's' : ''}`;
  const durationAr = `${durationMonths} ${durationMonths <= 10 ? 'أشهر' : 'شهراً'}`;

  return {
    startDate,
    endDate,
    durationMonths,
    isOngoing,
    formattedRangeEn,
    formattedRangeAr,
    durationEn,
    durationAr,
    startYearNum: startYear,
    completionYearNum: endYear,
  };
}
