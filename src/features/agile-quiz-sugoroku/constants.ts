/**
 * Agile Quiz Sugoroku - 定数・設定（後方互換用）
 *
 * 実体は constants/ ディレクトリに分割済み。
 * 既存のインポートパスを壊さないよう再エクスポートを維持する。
 */
export {
  // カラー
  COLORS,
  getColorByThreshold,
  getInverseColorByThreshold,
  // ゲーム設定
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
  // イベント
  EVENTS,
  EMERGENCY_EVENT,
  // グレード・評価
  GRADES,
  getGrade,
  getSummaryText,
  STRENGTH_THRESHOLDS,
  CHALLENGE_EVALUATIONS,
  getStrengthText,
  getChallengeText,
  ENGINEER_TYPES,
} from './constants/index';
