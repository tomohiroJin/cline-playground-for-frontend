// CPU AI Strategy パターン（純粋関数・副作用なし）

import type { Player } from './types';
import type { Point } from '../shared/types';
import { DRIFT, PLAYER } from './constants';
import { normalizeAngle, randomRange } from '../shared/math-utils';
import { getTrackInfo } from '../track/track';

/** CPU 操作パラメータ */
interface CpuParams {
  readonly skill: number;
  readonly miss: number;
}

/** CPU AI の思考インターフェース */
export interface CpuStrategy {
  /** 旋回量を計算 */
  calculateTurn(player: Player, trackPoints: readonly Point[], trackWidth: number): number;
  /** ドリフトすべきか判定 */
  shouldDrift(player: Player, trackPoints: readonly Point[], trackWidth: number): boolean;
}

/** 難易度レベル */
export type CpuDifficulty = 'easy' | 'normal' | 'hard';

/** 難易度ごとのパラメータ */
const DIFFICULTY_PARAMS: Record<CpuDifficulty, CpuParams> = {
  easy: { skill: 0.25, miss: 0.12 },
  normal: { skill: 0.5, miss: 0.05 },
  hard: { skill: 1.0, miss: 0 },
};

/** CPU Strategy の生成 */
export const createCpuStrategy = (difficulty: CpuDifficulty): CpuStrategy => {
  const params = DIFFICULTY_PARAMS[difficulty];

  return {
    calculateTurn(player: Player, trackPoints: readonly Point[], trackWidth: number): number {
      const info = getTrackInfo(player.x, player.y, trackPoints, trackWidth);
      const toCenter = Math.atan2(info.pt.y - player.y, info.pt.x - player.x);
      const nextIdx = (info.seg + 1) % trackPoints.length;
      const toNext = Math.atan2(trackPoints[nextIdx].y - player.y, trackPoints[nextIdx].x - player.x);
      const target = info.dist / trackWidth > 0.6 ? toCenter : toNext;
      let diff = normalizeAngle(target - player.angle);
      if (Math.random() < params.miss) diff += randomRange(-0.4, 0.4);
      const rate = PLAYER.TURN_RATE * params.skill;
      return diff > 0.03 ? rate : diff < -0.03 ? -rate : 0;
    },

    shouldDrift(player: Player, trackPoints: readonly Point[], trackWidth: number): boolean {
      if (params.skill < 0.2) return false;
      const info = getTrackInfo(player.x, player.y, trackPoints, trackWidth);
      const isCorner = info.dist / trackWidth > 0.25;
      return isCorner && player.speed >= DRIFT.MIN_SPEED && Math.random() < params.skill * 0.5;
    },
  };
};
