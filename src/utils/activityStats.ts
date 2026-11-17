import { DailyActivityRecord } from '../types';

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(daysAgo: number, from: Date = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() - daysAgo);
  return d;
}

const MONTH_SHORT_PT = [
  'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
  'jul', 'ago', 'set', 'out', 'nov', 'dez',
];

const WEEKDAY_SHORT_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function buildInitialActivityHistory(
  currentXp: number,
  currentStreak: number
): Record<string, DailyActivityRecord> {
  const map: Record<string, DailyActivityRecord> = {};
  const activeDays = Math.max(1, Math.min(30, currentStreak || 1));
  const safeTotalXp = Math.max(0, currentXp);

  if (safeTotalXp === 0) {
    const todayKey = getLocalDateKey();
    map[todayKey] = {
      date: todayKey,
      xpEarned: 0,
      activitiesCount: 0,
      wordsSaved: 0,
    };
    return map;
  }

  // Distribute existing XP cleanly across the user's recent active streak days
  let remainingXp = safeTotalXp;
  for (let i = activeDays - 1; i >= 0; i--) {
    const dateKey = getLocalDateKey(getDateDaysAgo(i));
    const isToday = i === 0;
    const share = isToday
      ? remainingXp
      : Math.max(10, Math.round(remainingXp / (i + 1)));
    const xpForDay = Math.min(remainingXp, share);
    remainingXp = Math.max(0, remainingXp - xpForDay);

    map[dateKey] = {
      date: dateKey,
      xpEarned: xpForDay,
      activitiesCount: Math.max(1, Math.round(xpForDay / 25)),
      wordsSaved: isToday ? 1 : 0,
    };
  }

  return map;
}

export interface ChartDayPoint {
  date: string;
  shortLabel: string;
  fullLabelPt: string;
  weekdayPt: string;
  xpEarned: number;
  cumulativeXp: number;
  activitiesCount: number;
  wordsSaved: number;
}

export function buildActivityChartSeries(
  records: Record<string, DailyActivityRecord>,
  totalXp: number,
  windowDays: 7 | 14 | 30 = 30
): ChartDayPoint[] {
  const now = new Date();
  const full30: ChartDayPoint[] = [];

  // Calculate XP inside the 30-day window to derive any pre-window baseline cleanly
  let windowXpSum = 0;
  for (let i = 29; i >= 0; i--) {
    const key = getLocalDateKey(getDateDaysAgo(i, now));
    windowXpSum += records[key]?.xpEarned || 0;
  }

  const baselineXp = Math.max(0, totalXp - windowXpSum);
  let runningXp = baselineXp;

  for (let i = 29; i >= 0; i--) {
    const d = getDateDaysAgo(i, now);
    const key = getLocalDateKey(d);
    const rec = records[key];
    const xpEarned = rec?.xpEarned || 0;
    const activitiesCount = rec?.activitiesCount || 0;
    const wordsSaved = rec?.wordsSaved || 0;

    runningXp += xpEarned;

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');

    full30.push({
      date: key,
      shortLabel: `${dd}/${mm}`,
      fullLabelPt: `${d.getDate()} de ${MONTH_SHORT_PT[d.getMonth()]}.`,
      weekdayPt: WEEKDAY_SHORT_PT[d.getDay()],
      xpEarned,
      cumulativeXp: runningXp,
      activitiesCount,
      wordsSaved,
    });
  }

  return full30.slice(30 - windowDays);
}

export interface WeekdayCadencePoint {
  weekday: string;
  activities: number;
  xp: number;
}

export function buildWeekdayCadence(series: ChartDayPoint[]): WeekdayCadencePoint[] {
  const totals: Record<string, { activities: number; xp: number }> = {};
  WEEKDAY_SHORT_PT.forEach((day) => {
    totals[day] = { activities: 0, xp: 0 };
  });

  series.forEach((pt) => {
    if (totals[pt.weekdayPt]) {
      totals[pt.weekdayPt].activities += pt.activitiesCount;
      totals[pt.weekdayPt].xp += pt.xpEarned;
    }
  });

  return WEEKDAY_SHORT_PT.map((day) => ({
    weekday: day,
    activities: totals[day].activities,
    xp: totals[day].xp,
  }));
}
