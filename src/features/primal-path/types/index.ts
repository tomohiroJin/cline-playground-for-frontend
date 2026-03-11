/**
 * 型定義の barrel export
 *
 * すべてのドメイン型をここから re-export する。
 * 既存の import パス（'./types'）との後方互換を維持。
 */

// 共通型
export type {
  LogEntry,
  DmgPopup,
  CivType,
  CivTypeExt,
  BiomeId,
  BiomeIdExt,
  CivLevels,
  StatSnapshot,
  TreeBonus,
  TreeEffect,
  TreeNode,
  BiomeInfo,
  EnvDmgConfig,
  Difficulty,
  SpeedOption,
  BgmType,
  BgmPattern,
  SfxType,
  SfxDef,
} from './common';

// プレイヤー
export type { PlayerState } from './player';

// ユニット
export type { AllyTemplate, Ally, EnemyTemplate, Enemy } from './units';

// 戦闘
export type { BattleState } from './battle';

// 進行
export type { ProgressState } from './progression';

// 進化
export type {
  EvoEffect,
  SynergyTag,
  Evolution,
  SynergyEffect,
  SynergyBonusDef,
  ActiveSynergy,
  EvolutionState,
  ApplyEvoResult,
} from './evolution';

// スキル
export type {
  ASkillId,
  SkillFx,
  ASkillDef,
  ABuff,
  SkillSt,
  SkillState,
} from './skill';

// 覚醒
export type {
  AwakeningEffect,
  AwakeningInfo,
  AwokenRecord,
  AwakeningRule,
  AwakeningNext,
  AwakeningState,
} from './awakening';

// 統計
export type { RunStatsState, RunStats, AggregateStats } from './stats';

// チャレンジ
export type { ChallengeState, ChallengeModifier, ChallengeDef } from './challenge';

// エンドレス
export type { EndlessState } from './endless';

// セーブ
export type { SaveData } from './save';

// イベント
export type {
  EventId,
  EventEffect,
  EventCost,
  EventChoice,
  RandomEventDef,
} from './event';

// 実績
export type { AchievementCondition, AchievementDef, AchievementState } from './achievement';

// tick
export type { TickResult, TickEvent, PlayerAttackResult } from './tick';

// フェーズ
export type { GamePhase } from './phase';
export { PHASE_TRANSITIONS, isValidTransition, assertValidTransition } from './phase';

// ゲーム全体
export type { RunState, GameState } from './game-state';
