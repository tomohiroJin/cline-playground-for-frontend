/**
 * 障害物生成モジュール
 *
 * generators.ts の ObstacleGen を application 層に移動。
 */
import { ObstacleType } from '../../constants';
import { createObstacle } from '../../domain/entities';
import { MathUtils } from '../../domain/math-utils';
import type { Obstacle } from '../../types';

/** 障害物生成テーブルのエントリ型 */
type ObstacleGenEntry = {
  readonly maxProb: number;
  readonly type: Obstacle['t'];
  readonly extras?: () => Partial<Obstacle>;
};

/** 障害物生成の確率テーブル */
const obstacleTable: readonly ObstacleGenEntry[] = [
  { maxProb: 0.1, type: ObstacleType.HOLE_S },
  { maxProb: 0.18, type: ObstacleType.HOLE_L },
  { maxProb: 0.28, type: ObstacleType.ROCK },
  {
    maxProb: 0.4,
    type: ObstacleType.ENEMY,
    extras: () => ({
      phase: MathUtils.randomRange(0, Math.PI * 2),
      moveDir: MathUtils.randomBool() ? 1 : -1,
      walkPos: MathUtils.randomRange(0, 100),
    }),
  },
  {
    maxProb: 0.48,
    type: ObstacleType.ENEMY_V,
    extras: () => ({
      phase: MathUtils.randomRange(0, Math.PI * 2),
      vSpeed: MathUtils.randomRange(0.1, 0.2),
    }),
  },
  { maxProb: 0.62, type: ObstacleType.SCORE },
  { maxProb: 0.72, type: ObstacleType.REVERSE },
  { maxProb: 0.8, type: ObstacleType.FORCE_JUMP },
] as const;

/** 障害物生成サービス */
export const ObstacleGen = {
  /** 確率テーブル */
  table: obstacleTable,

  /** 指定位置に障害物をランダム生成する */
  generate: (pos: number): Obstacle | undefined => {
    const entry = ObstacleGen.table.find(
      (candidate) => Math.random() < candidate.maxProb
    );
    return entry
      ? createObstacle(entry.type, pos, entry.extras ? entry.extras() : {})
      : undefined;
  },
} as const;
