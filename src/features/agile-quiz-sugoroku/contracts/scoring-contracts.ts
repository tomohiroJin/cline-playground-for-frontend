/**
 * スコア契約（Design by Contract）
 *
 * スコアリング・グレード分類に関する不変条件・事後条件を定義する。
 */
import type { DerivedStats } from '../domain/types';
import { assertContract } from './contract-error';

/** 有効なグレード文字列 */
const VALID_GRADES = ['S', 'A', 'B', 'C', 'D'] as const;

/**
 * 不変条件: グレード分類結果が有効なグレードであること
 *
 * - グレードが S, A, B, C, D のいずれかであること
 */
export function assertValidGradeClassification(grade: string): void {
  assertContract(
    (VALID_GRADES as readonly string[]).includes(grade),
    `不正なグレード: ${grade}`,
  );
}

/**
 * 事後条件: 派生統計が有効な範囲内であること
 *
 * - 正答率が 0〜100 の範囲であること
 * - 平均回答時間が非負であること
 * - 安定度が非負であること
 */
export function assertValidDerivedStats(stats: DerivedStats): void {
  assertContract(
    stats.correctRate >= 0 && stats.correctRate <= 100,
    `正答率が範囲外: ${stats.correctRate}（0〜100であること）`,
  );
  assertContract(
    stats.averageSpeed >= 0,
    `平均回答時間が負: ${stats.averageSpeed}`,
  );
  assertContract(
    stats.stability >= 0,
    `安定度が負: ${stats.stability}`,
  );
}

/**
 * 不変条件: 技術的負債が非負であること
 */
export function assertNonNegativeDebt(debt: number): void {
  assertContract(
    debt >= 0,
    `負債が負: ${debt}`,
  );
}
