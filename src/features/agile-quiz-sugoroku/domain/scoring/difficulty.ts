/**
 * 難易度設定とグレード計算ロジック
 *
 * 旧 difficulty.ts から移動。
 */
import { Difficulty, DifficultyConfig, Grade } from '../types';
import { GRADES } from '../../constants';

/** グレード計算の重み */
const GRADE_WEIGHTS = {
  accuracy: 0.5,
  stability: 0.3,
  speed: 0.2,
} as const;

/** 速度スコア係数 */
const SPEED_FACTOR = 8;

/** 難易度設定一覧 */
export const DIFFICULTY_CONFIGS: DifficultyConfig[] = [
  {
    id: 'easy',
    name: 'Easy',
    timeLimit: 20,
    debtMultiplier: 0.5,
    hasHint: true,
    emergencyRateBonus: 0,
    missDebtPenalty: 0,
    gradeBonus: 0,
    description: '初心者向け。20秒+ヒント付き',
  },
  {
    id: 'normal',
    name: 'Normal',
    timeLimit: 15,
    debtMultiplier: 1.0,
    hasHint: false,
    emergencyRateBonus: 0,
    missDebtPenalty: 0,
    gradeBonus: 0,
    description: '標準設定。15秒の制限時間',
  },
  {
    id: 'hard',
    name: 'Hard',
    timeLimit: 10,
    debtMultiplier: 2.0,
    hasHint: false,
    emergencyRateBonus: 0.2,
    missDebtPenalty: 0,
    gradeBonus: 1.1,
    description: '上級者向け。10秒+負債2倍',
  },
  {
    id: 'extreme',
    name: 'Extreme',
    timeLimit: 8,
    debtMultiplier: 3.0,
    hasHint: false,
    emergencyRateBonus: 0.3,
    missDebtPenalty: 15,
    gradeBonus: 1.2,
    description: '最高難易度。8秒+1ミスで負債+15',
  },
];

/** 難易度IDから設定を取得 */
export function getDifficultyConfig(difficulty: Difficulty): DifficultyConfig {
  return DIFFICULTY_CONFIGS.find(d => d.id === difficulty)
    ?? DIFFICULTY_CONFIGS.find(d => d.id === 'normal')!;
}

/** 難易度ボーナスを加味したグレード計算 */
export function calculateGradeWithDifficulty(
  tp: number,
  stab: number,
  spd: number,
  difficulty: Difficulty,
): Grade {
  const config = getDifficultyConfig(difficulty);
  const speedScore = Math.max(0, Math.min(100, 100 - spd * SPEED_FACTOR));
  let score =
    tp * GRADE_WEIGHTS.accuracy +
    stab * GRADE_WEIGHTS.stability +
    speedScore * GRADE_WEIGHTS.speed;

  // Hard以上のボーナス
  if (config.gradeBonus > 0) {
    score *= config.gradeBonus;
  }

  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1];
}
