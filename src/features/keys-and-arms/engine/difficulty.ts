import { BASE_HAZARD_CYCLE, BASE_MOVE_WINDOW } from '../constants';
import { StageDifficulty } from '../types';

function normalizeLoop(loop: number): number {
  return Math.max(1, Math.floor(loop));
}

/**
 * 元HTMLの調整傾向に合わせて、ループ数で難易度を段階上昇させる。
 */
export function buildStageDifficulty(loop: number): StageDifficulty {
  const currentLoop = normalizeLoop(loop);

  return {
    hazardCycle: Math.max(3, BASE_HAZARD_CYCLE - Math.floor((currentLoop - 1) / 2)),
    moveWindow: Math.max(4, BASE_MOVE_WINDOW - (currentLoop - 1)),
    bossArmSpeed: Math.min(6, 2.2 + currentLoop * 0.35),
    bossArmRest: Math.max(1.5, 4.5 - currentLoop * 0.3),
    bossShieldCount: Math.min(5, 2 + Math.floor((currentLoop - 1) / 2)),
    trueEndingScore: 30000 + currentLoop * 20000,
  };
}

/**
 * ループに応じた敵混合率（草原ステージ）
 */
export function grassEnemyMix(loop: number): { eliteRate: number; shiftRate: number } {
  const currentLoop = normalizeLoop(loop);
  return {
    eliteRate: Math.min(0.6, 0.2 + currentLoop * 0.06),
    shiftRate: Math.min(0.7, 0.25 + currentLoop * 0.08),
  };
}

/**
 * 真エンド到達条件判定
 */
export function isTrueEnding(loop: number, score: number): boolean {
  const cfg = buildStageDifficulty(loop);
  return normalizeLoop(loop) >= 2 && score >= cfg.trueEndingScore;
}
