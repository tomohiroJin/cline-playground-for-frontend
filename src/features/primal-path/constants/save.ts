/**
 * セーブ・ストレージ関連の定数
 */
import type { SaveData } from '../types';

/** 初期セーブデータ */
export const FRESH_SAVE: Readonly<SaveData> = Object.freeze({
  bones: 0,
  tree: Object.freeze({}),
  clears: 0,
  runs: 0,
  best: Object.freeze({}),
  loopCount: 0,
});

/** localStorage キー */
export const SAVE_KEY = 'primal-path-v7';

/** ラン統計ストレージキー */
export const STATS_KEY = 'primal-path-stats';

/** 実績ストレージキー */
export const ACHIEVEMENTS_KEY = 'primal-path-achievements';

/** 累計統計ストレージキー */
export const AGGREGATE_KEY = 'primal-path-aggregate';

/** ラン統計保持上限 */
export const MAX_RUN_STATS = 50;
