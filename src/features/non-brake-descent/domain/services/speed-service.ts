import { Config } from '../../config';
import { SpeedRank } from '../../constants';
import { SpeedRankValue } from '../../types';
import { MathUtils } from '../math-utils';

/** 速度関連のドメインサービス */
export const SpeedDomain = {
  /** 速度からランクを取得する */
  getRank: (speed: number): SpeedRankValue =>
    speed < 6 ? SpeedRank.LOW : speed < 10 ? SpeedRank.MID : SpeedRank.HIGH,
  /** 速度に応じた色を取得する */
  getColor: (speed: number): string =>
    ['#00ff88', '#ffcc00', '#ff3344'][SpeedDomain.getRank(speed)],
  /** 速度に応じたスコア倍率を取得する */
  getMultiplier: (speed: number): number => [1, 2, 3][SpeedDomain.getRank(speed)],
  /** 加速・減速を適用する */
  accelerate: (speed: number, accel: boolean): number =>
    MathUtils.clamp(
      speed + (accel ? Config.speed.accelRate : -Config.speed.decelRate),
      Config.speed.min,
      Config.speed.max
    ),
  /** 速度ランクに応じたボーナスを取得する */
  getBonus: (speed: number): number => {
    const bonusByRank = [0, Config.score.speedBonusMid, Config.score.speedBonusHigh] as const;
    return bonusByRank[SpeedDomain.getRank(speed)] ?? 0;
  },
  /** 速度を 0〜1 に正規化する */
  getNormalized: (speed: number): number =>
    MathUtils.normalize(speed, Config.speed.min, Config.speed.max),
} as const;
