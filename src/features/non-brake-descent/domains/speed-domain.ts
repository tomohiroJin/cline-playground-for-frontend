import { Config } from '../config';
import { SpeedRank } from '../constants';
import { SpeedRankValue } from '../types';
import { MathUtils } from './math-utils';

export const SpeedDomain = {
  getRank: (speed: number): SpeedRankValue =>
    speed < 6 ? SpeedRank.LOW : speed < 10 ? SpeedRank.MID : SpeedRank.HIGH,
  getColor: (speed: number): string =>
    ['#00ff88', '#ffcc00', '#ff3344'][SpeedDomain.getRank(speed)],
  getMultiplier: (speed: number): number => [1, 2, 3][SpeedDomain.getRank(speed)],
  accelerate: (speed: number, accel: boolean): number =>
    MathUtils.clamp(
      speed + (accel ? Config.speed.accelRate : -Config.speed.decelRate),
      Config.speed.min,
      Config.speed.max
    ),
  getBonus: (speed: number): number => {
    const bonusByRank = [0, Config.score.speedBonusMid, Config.score.speedBonusHigh] as const;
    return bonusByRank[SpeedDomain.getRank(speed)] ?? 0;
  },
  getNormalized: (speed: number): number =>
    MathUtils.normalize(speed, Config.speed.min, Config.speed.max),
} as const;
