/**
 * 実績チェッカーインターフェース
 *
 * Strategy パターンにより、新しい実績条件の追加を
 * 既存コードの修正なしで実現する（OCP準拠）。
 */
import type { AchievementCondition, AggregateStats, RunStats } from '../../types';

/** 実績チェッカーインターフェース */
export interface AchievementChecker {
  /** 条件を満たしているか判定する */
  check(condition: AchievementCondition, stats: AggregateStats, currentRun: RunStats): boolean;
}

/** 実績チェッカーレジストリ型 */
export type AchievementCheckerRegistry = ReadonlyMap<string, AchievementChecker>;
