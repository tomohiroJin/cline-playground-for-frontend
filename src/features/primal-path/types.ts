/**
 * 原始進化録 - PRIMAL PATH - 型定義
 *
 * 後方互換のための re-export ファイル。
 * 実際の型定義は types/ ディレクトリに分割されている。
 */
export type {
  // 共通型
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

  // プレイヤー
  PlayerState,

  // ユニット
  AllyTemplate,
  Ally,
  EnemyTemplate,
  Enemy,

  // 戦闘
  BattleState,

  // 進行
  ProgressState,

  // 進化
  EvoEffect,
  SynergyTag,
  Evolution,
  SynergyEffect,
  SynergyBonusDef,
  ActiveSynergy,
  EvolutionState,
  ApplyEvoResult,

  // スキル
  ASkillId,
  SkillFx,
  ASkillDef,
  ABuff,
  SkillSt,
  SkillState,

  // 覚醒
  AwakeningEffect,
  AwakeningInfo,
  AwokenRecord,
  AwakeningRule,
  AwakeningNext,
  AwakeningState,

  // 統計
  RunStatsState,
  RunStats,
  AggregateStats,

  // チャレンジ
  ChallengeState,
  ChallengeModifier,
  ChallengeDef,

  // エンドレス
  EndlessState,

  // セーブ
  SaveData,

  // イベント
  EventId,
  EventEffect,
  EventCost,
  EventChoice,
  RandomEventDef,

  // 実績
  AchievementCondition,
  AchievementDef,
  AchievementState,

  // tick
  TickResult,
  TickEvent,
  PlayerAttackResult,

  // フェーズ
  GamePhase,

  // ゲーム全体
  RunState,
  GameState,
} from './types/index';

export { PHASE_TRANSITIONS, isValidTransition, assertValidTransition } from './types/index';
