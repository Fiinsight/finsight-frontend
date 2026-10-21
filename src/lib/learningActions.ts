import type { LearningLevel } from './learningPreferences';

export type PromotionSnoozes = Partial<Record<LearningLevel, number>>;
export const promotionStorageKey = (ownerId: number) => `finsight.learning-promotion.${ownerId}`;
export const snoozePromotion = (saved: PromotionSnoozes, level: LearningLevel, now = Date.now()): PromotionSnoozes => ({ ...saved, [level]: now + 7 * 24 * 60 * 60 * 1000 });
export const promotionVisible = (saved: PromotionSnoozes, level: LearningLevel, now = Date.now()) => !Number.isFinite(saved[level]) || saved[level]! <= now;
export function parsePromotionSnoozes(raw: string | null): PromotionSnoozes {
  try {
    const value = JSON.parse(raw ?? '{}');
    if (!value || typeof value !== 'object') return {};
    return Object.fromEntries(['normal', 'analyst'].filter(level => typeof value[level] === 'number' && Number.isFinite(value[level])).map(level => [level, value[level]]));
  } catch { return {}; }
}

/** Candidates stay verbatim: this practice identifies a reported number, not a price prediction. */
export function evidenceSentences(body: string): string[] {
  return [...new Set(body.split(/(?<=[.!?。])\s+|\n+/).map(s => s.trim()).filter(s => s.length >= 12 && s.length <= 220))].slice(0, 12);
}
export const hasObservedNumber = (sentence: string) => /\d/.test(sentence) && !/전망|예상|가능성|예측|목표|계획|예정|것으로|것이다|수 있다/.test(sentence);

export function learningSummary(summary: string, body: string) {
  const fromOriginal = !summary.trim() || /요약을 확인|확인할 수 없|fallback/i.test(summary);
  return { text: fromOriginal ? evidenceSentences(body).slice(0, 3).join('\n') : summary, fromOriginal };
}
