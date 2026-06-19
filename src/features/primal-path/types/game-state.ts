/**
 * ゲーム全体の状態型定義
 */
import type { GamePhase } from './phase';
import type { SaveData } from './save';
import type { Evolution } from './evolution';
import type { CivTypeExt, TreeBonus, LogEntry } from './common';
import type { Ally } from './units';
import type { RandomEventDef } from './event';
import type { RunStats, AggregateStats } from './stats';
import type { AchievementState } from './achievement';
import type { PlayerState } from './player';
import type { BattleState } from './battle';
import type { ProgressState } from './progression';
import type { EvolutionState } from './evolution';
import type { SkillState } from './skill';
import type { AwakeningState } from './awakening';
import type { RunStatsState } from './stats';
import type { ChallengeState } from './challenge';
import type { EndlessState } from './endless';

/**
 * ラン実行ステート（合成型）
 *
 * 後方互換のため、すべてのサブステートのフィールドをフラットに持つ。
 * P2〜P4 で段階的にサブステートベースに移行予定。
 */
export interface RunState extends
  PlayerState,
  BattleState,
  ProgressState,
  EvolutionState,
  SkillState,
  AwakeningState,
  RunStatsState,
  ChallengeState,
  EndlessState {
  log: LogEntry[];
  loopCount: number;
  btlCount: number;
  eventCount: number;
  bb: number;
  _fPhase: number;
  _fbk: string;
  _wDmgBase: number;
  tb: TreeBonus;
  /** 選択中の始祖トーテム */
  totemId?: import('./totem').TotemId;
  /** 火傷ダメージ倍率（トーテム/キーストーン由来、既定1.0） */
  burnDmgMul?: number;
  /** 仲間ATKボーナス（リクルート時に加算、既定0） */
  allyAtkBonus?: number;
  /** 取得済みキーストーン */
  keystones?: import('./keystone').KeystoneId[];
  /** キーストーンの累積スタック値（晩成系。例: hunter_stack=累積ATK, chain_blaze=火傷倍率加算） */
  ksStacks?: Record<string, number>;
  /** 不滅の祈りの戦闘内使用済みフラグ（startBattle でリセット） */
  ksGuardUsed?: boolean;
}

/** ゲーム全体ステート */
export interface GameState {
  phase: GamePhase;
  save: SaveData;
  run: RunState | null;
  finalMode: boolean;
  battleSpd: number;
  evoPicks: Evolution[];
  pendingAwk: { id: string; t: CivTypeExt; tier: number } | null;
  reviveTargets: Ally[];
  gameResult: boolean | null;
  currentEvent: RandomEventDef | undefined;
  /** メタ: ラン統計履歴 */
  runStats: RunStats[];
  /** メタ: 累計統計 */
  aggregate: AggregateStats;
  /** メタ: 実績状態 */
  achievementStates: AchievementState[];
  /** メタ: 新規解除実績ID（ゲームオーバー画面表示用） */
  newAchievements: string[];
  /** トーテム選択前に保持する開始パラメータ */
  pendingStart?: { di: number; loopOverride: number; challengeId?: string } | null;
  /** 節目で提示中のキーストーン3択 */
  keystonePicks?: import('./keystone').KeystoneDef[];
}
