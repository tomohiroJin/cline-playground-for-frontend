/**
 * Agile Quiz Sugoroku - グレード・評価定数
 *
 * グレード設定、エンジニアタイプ分類、評価テキスト生成
 */
import { Grade } from '../domain/types';
import { COLORS } from './colors';
import { CONFIG } from './game-config';

/** グレード設定（チーム成熟度ベース） */
const grades: Grade[] = [
  { min: 90, grade: 'S', color: COLORS.orange, label: 'Dream Team' },
  { min: 75, grade: 'A', color: COLORS.green, label: 'High-Performing' },
  { min: 60, grade: 'B', color: COLORS.accent, label: 'Collaborative' },
  { min: 45, grade: 'C', color: COLORS.yellow, label: 'Developing' },
  { min: 0, grade: 'D', color: COLORS.red, label: 'Kick-off' },
];
export const GRADES: readonly Grade[] = Object.freeze(grades);

/** グレード計算の重み */
const GRADE_WEIGHTS = Object.freeze({
  accuracy: 0.5,
  stability: 0.3,
  speed: 0.2,
});

/** 速度スコア係数（spd * SPEED_FACTOR を100から引いてスコア化） */
const SPEED_FACTOR = 8;

/** グレードを計算 */
export function getGrade(tp: number, stab: number, spd: number): Grade {
  const speedScore = Math.max(0, Math.min(100, 100 - spd * SPEED_FACTOR));
  const score =
    tp * GRADE_WEIGHTS.accuracy +
    stab * GRADE_WEIGHTS.stability +
    speedScore * GRADE_WEIGHTS.speed;
  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1];
}

/** サマリーテキストを生成（タカ / ビジネスオーナー視点・チーム観点） */
export function getSummaryText(tp: number, spd: number, debt: number, emergencySuccess: number, sc: number = CONFIG.sprintCount): string {
  if (tp >= 70) {
    return `素晴らしい。${sc}スプリントを安定して完走し、チームとしてプロダクトの価値を最大化した。${spd <= 6 ? '意思決定のスピードも申し分ない。' : ''}このチームにプロダクトを任せて正解だった。`;
  }
  if (tp >= 50) {
    return `チームの基礎力はある。${debt > 20 ? '技術的負債の管理をチームで改善すれば、プロダクトの品質がさらに上がるだろう。' : 'チーム全体の精度を高めて、より大きな価値を生み出してほしい。'}期待しているぞ。`;
  }
  return `${sc}スプリントをチームで走り抜いたことは評価する。${emergencySuccess > 0 ? 'チームとしての緊急対応力は光るものがあった。' : 'チーム全体で知識の幅を広げれば、次はもっと大きな成果を出せるはずだ。'}`;
}

/** 強み評価の閾値 */
export const STRENGTH_THRESHOLDS: readonly { readonly min: number; readonly text: string }[] = Object.freeze([
  { min: 80, text: '非常に高い精度でスプリントを完走' },
  { min: 60, text: '安定した知識基盤で進行' },
  { min: 40, text: '基礎知識はあるが精度にばらつき' },
  { min: 0, text: '知識の補強で大きく伸びる余地あり' },
]);

/** 課題評価 */
export const CHALLENGE_EVALUATIONS: readonly { readonly check: (debt: number, spd: number, pct: number) => boolean; readonly text: string }[] = Object.freeze([
  { check: (debt: number) => debt >= 30, text: '技術的負債の蓄積が深刻化' },
  { check: (debt: number) => debt >= 15, text: '技術的負債に注意' },
  { check: (_debt: number, spd: number) => spd > 10, text: '回答速度の改善で安定度アップ' },
  { check: (_debt: number, _spd: number, pct: number) => pct < 50, text: '正答率の向上が鍵' },
  { check: () => true, text: '高水準を維持' },
]);

/** 強み評価テキストを取得 */
export function getStrengthText(rate: number): string {
  const match = STRENGTH_THRESHOLDS.find(x => rate >= x.min);
  return match?.text ?? STRENGTH_THRESHOLDS[STRENGTH_THRESHOLDS.length - 1].text;
}

/** 課題評価テキストを取得 */
export function getChallengeText(debt: number, spd: number, rate: number): string {
  const match = CHALLENGE_EVALUATIONS.find(x => x.check(debt, spd, rate));
  return match?.text ?? CHALLENGE_EVALUATIONS[CHALLENGE_EVALUATIONS.length - 1].text;
}

