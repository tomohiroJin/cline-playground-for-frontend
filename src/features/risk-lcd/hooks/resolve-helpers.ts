import type { GameState } from '../types';
import type { CycleJudgment } from '../domain/judgment';

/** 被弾時の結果区分 */
export const HitOutcome = {
  ShieldUsed: 'shield',
  ReviveUsed: 'revive',
  Dead: 'dead',
} as const;
export type HitOutcome = (typeof HitOutcome)[keyof typeof HitOutcome];

/**
 * 被弾時の状態更新（GameState を直接ミューテーションする）
 *
 * UI 描画やタイマーは呼び出し側で行う。
 */
export function applyHitStateUpdate(
  g: GameState,
  judgment: CycleJudgment,
): HitOutcome {
  g.artState = 'danger';

  if (judgment.shieldUsed) {
    g.shields--;
    g.frozen = g.st.sp;
    g.comboCount = 0;
    g.artState = 'shield';
    return HitOutcome.ShieldUsed;
  }

  if (judgment.reviveUsed) {
    g.revive--;
    g.comboCount = 0;
    return HitOutcome.ReviveUsed;
  }

  // 死亡
  g.alive = false;
  g.comboCount = 0;
  return HitOutcome.Dead;
}

/**
 * 回避時の状態更新（GameState を直接ミューテーションする）
 *
 * UI 描画やタイマーは呼び出し側で行う。
 */
export function applyDodgeStateUpdate(
  g: GameState,
  judgment: CycleJudgment,
  obstacles: readonly number[],
): void {
  // シェルター吸収
  if (judgment.sheltered && obstacles.includes(g.lane)) {
    g.shelterSaves++;
  }

  // ニアミス・リスク
  if (judgment.nearMiss) g.nearMiss++;
  if (judgment.riskPoint) g.riskScore++;

  // コンボ更新
  g.comboCount = judgment.comboCount;
  g.maxCombo = judgment.maxCombo;

  // フリーズ中
  if (judgment.frozen) {
    g.frozen--;
    return;
  }

  // スコア加算（zeroed でなければ）
  if (!judgment.zeroed) {
    g.score += judgment.scoreGained;
  }
}
