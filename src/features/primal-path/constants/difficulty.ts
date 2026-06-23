/**
 * 難易度関連の定数
 */
import type { Difficulty } from '../types';

/** 難易度一覧 */
export const DIFFS: readonly Difficulty[] = Object.freeze([
  Object.freeze({ n: '原始', d: '通常難易度', env: 1, bm: 1, ul: 0, ic: '🌿', hm: 1.5, am: 2.2, bb: 1 }),
  Object.freeze({ n: '氷河期', d: '環境ダメ強化 骨+25%', env: 1.6, bm: 1.25, ul: 1, ic: '❄️', hm: 2.0, am: 2.8, bb: 2 }),
  Object.freeze({ n: '大災厄', d: '敵大幅強化 骨+50%', env: 2.2, bm: 1.5, ul: 3, ic: '🔥', hm: 2.8, am: 3.5, bb: 3 }),
  Object.freeze({ n: '神話世界', d: '極限 骨+80%', env: 3, bm: 1.8, ul: 6, ic: '⚡', hm: 5.5, am: 5.5, bb: 5 }),
]);
