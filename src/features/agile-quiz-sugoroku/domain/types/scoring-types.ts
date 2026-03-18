/**
 * スコアリング・難易度に関するドメイン型定義
 */

/** 派生データ */
export interface DerivedStats {
  correctRate: number;
  averageSpeed: number;
  stability: number;
  sprintCorrectRates: number[];
}

/** グレード情報 */
export interface Grade {
  min: number;
  grade: string;
  color: string;
  label: string;
}

/** レーダーチャートデータ */
export interface RadarDataPoint {
  label: string;
  value: number;
}

/** 難易度レベル */
export type Difficulty = 'easy' | 'normal' | 'hard' | 'extreme';

/** 難易度設定 */
export interface DifficultyConfig {
  id: Difficulty;
  name: string;
  timeLimit: number;
  debtMultiplier: number;
  hasHint: boolean;
  emergencyRateBonus: number;
  missDebtPenalty: number;
  gradeBonus: number;
  description: string;
}

/** チャレンジモードの結果 */
export interface ChallengeResult {
  correctCount: number;
  maxCombo: number;
  averageSpeed: number;
  timestamp: number;
}
