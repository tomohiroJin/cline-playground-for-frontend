/**
 * Agile Quiz Sugoroku - ジャンル別統計ユーティリティ
 */
import { TagStats } from './types';
import { TAG_MAP } from './questions/tag-master';
import { COLORS } from './constants';

export interface TagStatEntry {
  tagId: string;
  tagName: string;
  correct: number;
  total: number;
  rate: number;
  color: string;
  strength: 'strong' | 'normal' | 'weak';
}

/** 正答率の閾値 */
const STRONG_THRESHOLD = 70;
const WEAK_THRESHOLD = 50;

/** 正答率に応じた色を返す */
export function getTagColor(rate: number): string {
  if (rate >= STRONG_THRESHOLD) return COLORS.green;
  if (rate >= WEAK_THRESHOLD) return COLORS.yellow;
  return COLORS.red;
}

/** 正答率に応じた強弱判定を返す */
function getStrength(rate: number): 'strong' | 'normal' | 'weak' {
  if (rate >= STRONG_THRESHOLD) return 'strong';
  if (rate >= WEAK_THRESHOLD) return 'normal';
  return 'weak';
}

/** TagStats から表示用エントリ配列を計算 */
export function computeTagStatEntries(tagStats: TagStats): TagStatEntry[] {
  return Object.entries(tagStats)
    .filter(([, v]) => v.total > 0)
    .map(([tagId, v]) => {
      const rate = Math.round((v.correct / v.total) * 100);
      const tag = TAG_MAP.get(tagId);
      return {
        tagId,
        tagName: tag?.name ?? tagId,
        correct: v.correct,
        total: v.total,
        rate,
        color: getTagColor(rate),
        strength: getStrength(rate),
      };
    })
    .sort((a, b) => a.rate - b.rate);
}

/** 苦手ジャンル（50%以下）を抽出 */
export function getWeakGenres(tagStats: TagStats): TagStatEntry[] {
  return computeTagStatEntries(tagStats).filter((e) => e.strength === 'weak');
}

/** 苦手ジャンルIDの配列を返す */
export function getWeakGenreIds(tagStats: TagStats): string[] {
  return getWeakGenres(tagStats).map((e) => e.tagId);
}
