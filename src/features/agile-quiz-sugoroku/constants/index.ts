/**
 * Agile Quiz Sugoroku - 定数モジュール
 *
 * 全定数を再エクスポート。
 * 各定数は責務ごとに分割されたファイルに定義されている。
 */

// カラー定数
export { COLORS, getColorByThreshold, getInverseColorByThreshold } from './colors';

// ゲーム設定
export {
  CONFIG,
  SPRINT_OPTIONS,
  INITIAL_GAME_STATS,
  DEBT_EVENTS,
  getDebtPoints,
  FONTS,
  OPTION_LABELS,
  CATEGORY_NAMES,
  PHASE_GENRE_MAP,
  EVENT_BACKGROUND_MAP,
} from './game-config';

// イベント定数
export { EVENTS, EMERGENCY_EVENT } from './events';

// グレード・評価定数
export {
  GRADES,
  getGrade,
  getSummaryText,
  STRENGTH_THRESHOLDS,
  CHALLENGE_EVALUATIONS,
  getStrengthText,
  getChallengeText,
  ENGINEER_TYPES,
} from './grades';
