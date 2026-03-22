import { Config } from '../../config';
import { ObstacleType } from '../../constants';
import { CollisionCheckResult, Obstacle } from '../../types';

/** 危険な障害物タイプの一覧 */
const dangerousTypes: Obstacle['t'][] = [
  ObstacleType.HOLE_S,
  ObstacleType.HOLE_L,
  ObstacleType.ROCK,
  ObstacleType.ENEMY,
  ObstacleType.ENEMY_V,
];

/** 衝突判定ドメインサービス */
export const CollisionDomain = {
  /** プレイヤーと障害物の衝突判定を行う */
  check: (px: number, ox: number, jumping: boolean, jumpY: number): CollisionCheckResult => {
    const dist = Math.abs(px - ox);
    const {
      groundThreshold: gt,
      airThreshold: at,
      airYThreshold: ayt,
      nearMissThreshold: nmt,
    } = Config.collision;
    const ground = dist < gt && !jumping;
    const air = dist < at && jumping && jumpY > ayt;
    const nearMiss = dist < nmt && dist >= gt && !jumping;
    return { ground, air, hit: ground || air, nearMiss, dist };
  },
  /** 障害物が危険かどうか判定する */
  isDangerous: (t: Obstacle['t']): boolean => dangerousTypes.includes(t),
  /** 障害物がアクティブ（取得済み・倒された以外）かどうか判定する */
  isActive: (obs: Obstacle): boolean => obs.t !== ObstacleType.TAKEN && obs.t !== ObstacleType.DEAD,
} as const;
