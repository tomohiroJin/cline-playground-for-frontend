/**
 * 実績チェッカーレジストリ
 *
 * 全実績条件タイプとチェッカーの対応を管理する。
 * 新しい条件タイプを追加する場合は、チェッカーを実装し
 * このレジストリに登録するだけで拡張可能（OCP準拠）。
 */
import type { AchievementChecker } from './achievement-checker';
import type { AchievementCondition } from '../../types';
import {
  firstClearChecker,
  clearCountChecker,
  clearDifficultyChecker,
  allDifficultiesClearedChecker,
  allAwakeningsChecker,
  maxDamageChecker,
  totalKillsChecker,
  synergyTier2Checker,
  allSynergiesTier1Checker,
  eventCountChecker,
  challengeClearChecker,
  noDamageBossChecker,
  speedClearChecker,
  boneHoarderChecker,
  fullTreeChecker,
} from './checkers';

/** 実績チェッカーレジストリ */
export const achievementRegistry: ReadonlyMap<AchievementCondition['type'], AchievementChecker> = new Map<AchievementCondition['type'], AchievementChecker>([
  ['first_clear', firstClearChecker],
  ['clear_count', clearCountChecker],
  ['clear_difficulty', clearDifficultyChecker],
  ['all_difficulties_cleared', allDifficultiesClearedChecker],
  ['all_awakenings', allAwakeningsChecker],
  ['max_damage', maxDamageChecker],
  ['total_kills', totalKillsChecker],
  ['synergy_tier2', synergyTier2Checker],
  ['all_synergies_tier1', allSynergiesTier1Checker],
  ['event_count', eventCountChecker],
  ['challenge_clear', challengeClearChecker],
  ['no_damage_boss', noDamageBossChecker],
  ['speed_clear', speedClearChecker],
  ['bone_hoarder', boneHoarderChecker],
  ['full_tree', fullTreeChecker],
]);
