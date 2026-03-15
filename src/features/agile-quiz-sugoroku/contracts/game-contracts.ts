/**
 * ゲーム契約（Design by Contract）
 *
 * ゲーム進行に関する不変条件・事前条件・事後条件を定義する。
 */
import type { GameStats, GamePhase } from '../domain/types';
import { assertContract } from './contract-error';

/**
 * 不変条件: ゲーム統計は常に有効な状態を維持する
 *
 * - 正答数は非負
 * - 合計問題数は非負
 * - 合計問題数 >= 正答数
 * - 負債は非負
 * - コンボは非負
 * - 最大コンボ >= 現在コンボ
 * - 緊急対応回数は非負
 * - 緊急対応成功数は非負
 * - 緊急対応成功数 <= 発生回数
 */
export function assertValidGameStats(stats: GameStats): void {
  assertContract(
    stats.totalCorrect >= 0,
    `正答数が負: ${stats.totalCorrect}`,
  );
  assertContract(
    stats.totalQuestions >= 0,
    `合計問題数が負: ${stats.totalQuestions}`,
  );
  assertContract(
    stats.totalQuestions >= stats.totalCorrect,
    `合計問題数が正答数を下回っている: total=${stats.totalQuestions}, correct=${stats.totalCorrect}`,
  );
  assertContract(
    stats.debt >= 0,
    `負債が負: ${stats.debt}`,
  );
  assertContract(
    stats.combo >= 0,
    `コンボが負: ${stats.combo}`,
  );
  assertContract(
    stats.maxCombo >= stats.combo,
    `最大コンボが現在コンボを下回っている: max=${stats.maxCombo}, current=${stats.combo}`,
  );
  assertContract(
    stats.emergencyCount >= 0,
    `緊急対応回数が負: ${stats.emergencyCount}`,
  );
  assertContract(
    stats.emergencySuccess >= 0,
    `緊急対応成功数が負: ${stats.emergencySuccess}`,
  );
  assertContract(
    stats.emergencySuccess <= stats.emergencyCount,
    `緊急対応成功数が発生回数を超えている: success=${stats.emergencySuccess}, count=${stats.emergencyCount}`,
  );
}

/**
 * 不変条件: スプリント番号が有効な範囲内にある
 *
 * - スプリント番号は 1 以上
 * - スプリント番号は最大スプリント数以下
 * - 最大スプリント数は 1 以上
 */
export function assertValidSprintNumber(
  sprint: number,
  maxSprints: number,
): void {
  assertContract(
    maxSprints >= 1,
    `最大スプリント数が不正: ${maxSprints}`,
  );
  assertContract(
    sprint >= 1,
    `スプリント番号が不正（1未満）: ${sprint}`,
  );
  assertContract(
    sprint <= maxSprints,
    `スプリント番号が最大を超過: sprint=${sprint}, max=${maxSprints}`,
  );
}

/**
 * 事前条件: スプリントを開始できる状態か検証する
 *
 * - フェーズが sprint-start であること
 * - スプリント番号が有効な範囲内であること
 */
export function assertCanStartSprint(
  phase: GamePhase,
  sprint: number,
  maxSprints: number,
): void {
  assertContract(
    phase === 'sprint-start',
    `フェーズが sprint-start でない: ${phase}`,
  );
  assertValidSprintNumber(sprint, maxSprints);
}
