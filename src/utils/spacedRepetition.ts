import { VocabularyItem } from '../types';

export type SrsGrade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsScheduleResult {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  lapses: number;
  nextReviewAt: number;
  lastReviewedAt: number;
  previewLabelPt: string;
}

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function formatIntervalPt(days: number, minutesIfZero = 5): string {
  if (days <= 0) {
    return `${minutesIfZero} min`;
  }
  if (days === 1) {
    return '1 dia';
  }
  if (days < 14) {
    return `${days} dias`;
  }
  if (days < 30) {
    const weeks = Math.round(days / 7);
    return weeks === 1 ? '1 sem' : `${weeks} sem`;
  }
  if (days < 365) {
    const months = Math.round(days / 30);
    return months === 1 ? '1 mês' : `${months} meses`;
  }
  const years = (days / 365).toFixed(1).replace('.0', '');
  return years === '1' ? '1 ano' : `${years} anos`;
}

/**
 * Computes next SM-2 spaced repetition state for a vocabulary card.
 */
export function calculateNextSrs(
  item: VocabularyItem,
  grade: SrsGrade,
  now: number = Date.now()
): SrsScheduleResult {
  const prevReps = Math.max(0, Math.round(item.srsRepetitions ?? 0));
  const prevInterval = Math.max(0, Math.round(item.srsIntervalDays ?? 0));
  const prevEase = Math.max(1.3, Math.min(4.0, item.srsEaseFactor ?? 2.5));
  const prevLapses = Math.max(0, Math.round(item.srsLapses ?? 0));

  let repetitions = prevReps;
  let intervalDays = prevInterval;
  let easeFactor = prevEase;
  let lapses = prevLapses;
  let nextReviewAt = now;

  if (grade === 'again') {
    repetitions = 0;
    intervalDays = 0;
    lapses = Math.min(10000, prevLapses + 1);
    easeFactor = Number(Math.max(1.3, prevEase - 0.2).toFixed(2));
    // Re-queue in 5 minutes so the student practices it again shortly
    nextReviewAt = now + 5 * MINUTE_MS;
  } else if (grade === 'hard') {
    repetitions = Math.min(10000, prevReps + 1);
    if (prevReps === 0) {
      intervalDays = 1;
    } else if (prevReps === 1) {
      intervalDays = 3;
    } else {
      intervalDays = Math.max(prevInterval + 1, Math.round(prevInterval * 1.2));
    }
    intervalDays = Math.min(3650, intervalDays);
    easeFactor = Number(Math.max(1.3, prevEase - 0.15).toFixed(2));
    nextReviewAt = now + intervalDays * DAY_MS;
  } else if (grade === 'good') {
    repetitions = Math.min(10000, prevReps + 1);
    if (prevReps === 0) {
      intervalDays = 1;
    } else if (prevReps === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.max(prevInterval + 1, Math.round(prevInterval * prevEase));
    }
    intervalDays = Math.min(3650, intervalDays);
    easeFactor = Number(prevEase.toFixed(2));
    nextReviewAt = now + intervalDays * DAY_MS;
  } else {
    // easy
    repetitions = Math.min(10000, prevReps + 1);
    if (prevReps === 0) {
      intervalDays = 4;
    } else if (prevReps === 1) {
      intervalDays = 8;
    } else {
      intervalDays = Math.max(prevInterval + 2, Math.round(prevInterval * prevEase * 1.3));
    }
    intervalDays = Math.min(3650, intervalDays);
    easeFactor = Number(Math.min(4.0, prevEase + 0.15).toFixed(2));
    nextReviewAt = now + intervalDays * DAY_MS;
  }

  return {
    repetitions,
    intervalDays,
    easeFactor,
    lapses,
    nextReviewAt,
    lastReviewedAt: now,
    previewLabelPt: formatIntervalPt(intervalDays, 5),
  };
}

export function applySrsReview(
  item: VocabularyItem,
  grade: SrsGrade,
  now: number = Date.now()
): VocabularyItem {
  const next = calculateNextSrs(item, grade, now);
  return {
    ...item,
    srsRepetitions: next.repetitions,
    srsIntervalDays: next.intervalDays,
    srsEaseFactor: next.easeFactor,
    srsLapses: next.lapses,
    srsNextReviewAt: next.nextReviewAt,
    srsLastReviewedAt: next.lastReviewedAt,
  };
}

export function isCardDueForReview(item: VocabularyItem, now: number = Date.now()): boolean {
  if (!item.srsNextReviewAt) return true;
  return item.srsNextReviewAt <= now;
}

export function getSrsMasteryStage(item: VocabularyItem): {
  id: 'new' | 'learning' | 'mastered';
  labelPt: string;
} {
  const reps = item.srsRepetitions ?? 0;
  const interval = item.srsIntervalDays ?? 0;
  if (!item.srsLastReviewedAt && reps === 0) {
    return { id: 'new', labelPt: 'Novo' };
  }
  if (reps >= 3 && interval >= 6) {
    return { id: 'mastered', labelPt: 'Dominado' };
  }
  return { id: 'learning', labelPt: 'Em revisão' };
}

export function previewNextIntervals(
  item: VocabularyItem,
  now: number = Date.now()
): Record<SrsGrade, string> {
  return {
    again: calculateNextSrs(item, 'again', now).previewLabelPt,
    hard: calculateNextSrs(item, 'hard', now).previewLabelPt,
    good: calculateNextSrs(item, 'good', now).previewLabelPt,
    easy: calculateNextSrs(item, 'easy', now).previewLabelPt,
  };
}

export function formatDueStatusPt(item: VocabularyItem, now: number = Date.now()): string {
  if (!item.srsNextReviewAt) {
    return 'Novo · Pronto para revisar';
  }
  const diffMs = item.srsNextReviewAt - now;
  if (diffMs <= 0) {
    return 'Pronto para revisar agora';
  }
  const diffMinutes = Math.ceil(diffMs / MINUTE_MS);
  if (diffMinutes < 60) {
    return `Revisão em ${diffMinutes} min`;
  }
  const diffHours = Math.ceil(diffMs / (60 * MINUTE_MS));
  if (diffHours < 24) {
    return `Revisão em ${diffHours}h`;
  }
  const diffDays = Math.round(diffMs / DAY_MS);
  return `Próxima em ${formatIntervalPt(diffDays)}`;
}

export function sortQueueBySrsPriority(
  items: VocabularyItem[],
  now: number = Date.now()
): VocabularyItem[] {
  return [...items].sort((a, b) => {
    const aDue = isCardDueForReview(a, now) ? 0 : 1;
    const bDue = isCardDueForReview(b, now) ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;

    const aNext = a.srsNextReviewAt ?? 0;
    const bNext = b.srsNextReviewAt ?? 0;
    return aNext - bNext;
  });
}
