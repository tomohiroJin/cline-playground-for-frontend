import { Config } from '../../config';
import { Ranks } from '../../constants';
import { RankConfig, ScoreCalc } from '../../types';
import { SpeedDomain } from './speed-service';

/** スコア計算ドメインサービス */
export const ScoringDomain = {
  /** スコアに応じたランクデータを取得する */
  getRankData: (score: number): RankConfig =>
    Ranks.find(rank => score >= rank.minScore) || Ranks[Ranks.length - 1],
  /** ランプクリア時のスコアを計算する */
  calcRampScore: (speed: number, combo: number): ScoreCalc => {
    const base = Config.score.rampBase * SpeedDomain.getMultiplier(speed);
    return { base, bonus: combo > 1 ? Math.floor(base * (combo - 1) * 0.5) : 0 };
  },
  /** タイムボーナスを計算する */
  calcTimeBonus: (elapsed: number, max = 300): number => Math.max(0, Math.floor((max - elapsed) * 10)),
  /** 最終スコアを計算する */
  calcFinal: (score: number, speedBonus: number, timeBonus = 0): number =>
    score + speedBonus + timeBonus,
} as const;
