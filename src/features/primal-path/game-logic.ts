/**
 * 原始進化録 - PRIMAL PATH - 純粋ゲームロジック
 *
 * ドメイン分割後の barrel re-export ファイル。
 * すべての公開関数・型はドメインサービスから re-export される。
 */

// 共通ユーティリティ
export { clamp, mkPopup, updatePopups, getSnap, applyStatFx } from './domain/shared/utils';

// 文明ユーティリティ
export { civLvs, civMin, civLv, dominantCiv } from './domain/shared/civ-utils';

// 戦闘計算
export { calcPlayerAtk, effATK, biomeBonus, calcEnvDmg, aliveAllies, deadAllies, scaleEnemy } from './domain/battle/combat-calculator';

// 戦闘ティック
export { tick, tickEnvPhase, tickPlayerPhase, tickAllyPhase, tickRegenPhase, tickEnemyPhase, tickDeathCheck } from './domain/battle/tick-phases';

// バトルサービス
export { startBattle, afterBattle } from './domain/battle/battle-service';

// ボスサービス
export { resolveFinalBossKey, startFinalBoss, handleFinalBossKill } from './domain/battle/boss-service';

// 進化サービス
export { rollE, applyEvo, simEvo } from './domain/evolution/evolution-service';

// シナジーサービス
export { calcSynergies, applySynergyBonuses } from './domain/evolution/synergy-service';
export type { SynergyBonusResult } from './domain/evolution/synergy-service';

// スキルサービス
export { applySkill, calcAvlSkills, tickBuffs, decSkillCds } from './domain/skill/skill-service';

// 覚醒サービス
export { checkAwakeningRules, applyAwkFx, awkInfo } from './domain/awakening/awakening-service';

// イベントサービス
export { rollEvent, applyEventChoice, computeEventResult, formatEventResult, getEffectHintColor, getEffectHintIcon } from './domain/event/event-service';

// ランサービス
export { startRunState, calcRunStats, calcBoneReward, allyReviveCost } from './domain/progression/run-service';

// バイオームサービス
export { pickBiomeAuto, applyBiomeSelection, applyFirstBiome, applyAutoLastBiome, calcEndlessScale, calcEndlessScaleWithAM, applyEndlessLoop } from './domain/progression/biome-service';

// ツリーサービス
export { getTB, tbSummary, bestDiffLabel } from './domain/progression/tree-service';

// 実績サービス
export { checkAchievement } from './domain/achievement/achievement-service';

// チャレンジサービス
export { applyChallenge } from './domain/challenge/challenge-service';
