import { Config } from '../config';
import { Ranks } from '../constants';
import { RankConfig, ScoreCalc } from '../types';
import { SpeedDomain } from './speed-domain';

export const ScoringDomain = {
  getRankData: (score: number): RankConfig =>
    Ranks.find(rank => score >= rank.minScore) || Ranks[Ranks.length - 1],
  calcRampScore: (speed: number, combo: number): ScoreCalc => {
    const base = Config.score.rampBase * SpeedDomain.getMultiplier(speed);
    return { base, bonus: combo > 1 ? Math.floor(base * (combo - 1) * 0.5) : 0 };
  },
  calcTimeBonus: (elapsed: number, max = 300): number => Math.max(0, Math.floor((max - elapsed) * 10)),
  calcFinal: (score: number, speedBonus: number, timeBonus = 0): number =>
    score + speedBonus + timeBonus,
} as const;
