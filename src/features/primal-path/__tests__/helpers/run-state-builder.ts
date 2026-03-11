/**
 * RunStateBuilder - テスト用 RunState ビルダー
 *
 * ドメイン別のサブステートを個別に設定し、可読性の高いテストデータ構築を実現する。
 * Builder パターンによるメソッドチェーンで直感的にテストデータを組み立てられる。
 */
import type { RunState } from '../../types';
import type { PlayerState } from '../../types/player';
import type { BattleState } from '../../types/battle';
import type { ProgressState } from '../../types/progression';
import type { EvolutionState } from '../../types/evolution';
import type { SkillState } from '../../types/skill';
import type { AwakeningState } from '../../types/awakening';
import type { RunStatsState } from '../../types/stats';
import type { ChallengeState } from '../../types/challenge';
import type { EndlessState } from '../../types/endless';
import type { LogEntry, TreeBonus } from '../../types/common';
import { DIFFS, TB_DEFAULTS } from '../../constants';

/** RunState のメタフィールド（サブステートに含まれないフィールド） */
interface RunMetaState {
  log: LogEntry[];
  loopCount: number;
  btlCount: number;
  eventCount: number;
  bb: number;
  _fPhase: number;
  _fbk: string;
  _wDmgBase: number;
  tb: TreeBonus;
}

/** デフォルトのプレイヤーステート */
const DEFAULT_PLAYER: PlayerState = {
  hp: 80, mhp: 80, atk: 8, def: 2,
  cr: 0.05, burn: 0, aM: 1, dm: 1,
};

/** デフォルトの戦闘ステート */
const DEFAULT_BATTLE: BattleState = {
  en: null, turn: 0, cW: 1, wpb: 4,
  cT: 0, cL: 0, cR: 0, bE: 0,
};

/** デフォルトの進行ステート */
const DEFAULT_PROGRESSION: ProgressState = {
  di: 0, dd: DIFFS[0], bc: 0,
  bms: ['grassland', 'glacier', 'volcano'],
  cB: 1, cBT: 'grassland', fe: null,
  evoN: 3, fReq: 5,
};

/** デフォルトの進化ステート */
const DEFAULT_EVOLUTION: EvolutionState = {
  evs: [],
};

/** デフォルトのスキルステート */
const DEFAULT_SKILL: SkillState = {
  sk: { avl: [], cds: {}, bfs: [] },
  al: [], mxA: 3, skillUseCount: 0,
};

/** デフォルトの覚醒ステート */
const DEFAULT_AWAKENING: AwakeningState = {
  awoken: [], saReq: 4, rvU: 0,
};

/** デフォルトの統計ステート */
const DEFAULT_STATS: RunStatsState = {
  kills: 0, dmgDealt: 0, dmgTaken: 0,
  maxHit: 0, wDmg: 0, wTurn: 0, totalHealing: 0,
};

/** デフォルトのチャレンジステート */
const DEFAULT_CHALLENGE: ChallengeState = {};

/** デフォルトのエンドレスステート */
const DEFAULT_ENDLESS: EndlessState = {
  isEndless: false, endlessWave: 0,
};

/** デフォルトのメタステート */
const DEFAULT_META: RunMetaState = {
  log: [], loopCount: 0, btlCount: 0,
  eventCount: 0, bb: 0,
  _fPhase: 0, _fbk: '', _wDmgBase: 0,
  tb: { ...TB_DEFAULTS },
};

/**
 * テスト用 RunState ビルダー
 *
 * 使用例:
 * ```typescript
 * const run = RunStateBuilder.create()
 *   .withPlayer({ hp: 50, mhp: 100, atk: 20 })
 *   .withBattle({ en: mockEnemy })
 *   .build();
 * ```
 */
export class RunStateBuilder {
  private player: PlayerState;
  private battle: BattleState;
  private progression: ProgressState;
  private evolution: EvolutionState;
  private skill: SkillState;
  private awakening: AwakeningState;
  private stats: RunStatsState;
  private challenge: ChallengeState;
  private endless: EndlessState;
  private meta: RunMetaState;

  private constructor() {
    this.player = { ...DEFAULT_PLAYER };
    this.battle = { ...DEFAULT_BATTLE };
    this.progression = { ...DEFAULT_PROGRESSION };
    this.evolution = { ...DEFAULT_EVOLUTION };
    this.skill = { ...DEFAULT_SKILL, sk: { ...DEFAULT_SKILL.sk }, al: [] };
    this.awakening = { ...DEFAULT_AWAKENING, awoken: [] };
    this.stats = { ...DEFAULT_STATS };
    this.challenge = { ...DEFAULT_CHALLENGE };
    this.endless = { ...DEFAULT_ENDLESS };
    this.meta = { ...DEFAULT_META, log: [], tb: { ...TB_DEFAULTS } };
  }

  /** ビルダーインスタンスを生成する */
  static create(): RunStateBuilder {
    return new RunStateBuilder();
  }

  /** プレイヤーステートを設定する */
  withPlayer(overrides: Partial<PlayerState>): this {
    this.player = { ...this.player, ...overrides };
    return this;
  }

  /** 戦闘ステートを設定する */
  withBattle(overrides: Partial<BattleState>): this {
    this.battle = { ...this.battle, ...overrides };
    return this;
  }

  /** 進行ステートを設定する */
  withProgression(overrides: Partial<ProgressState>): this {
    this.progression = { ...this.progression, ...overrides };
    return this;
  }

  /** 進化ステートを設定する */
  withEvolution(overrides: Partial<EvolutionState>): this {
    this.evolution = { ...this.evolution, ...overrides };
    return this;
  }

  /** スキルステートを設定する */
  withSkills(overrides: Partial<SkillState>): this {
    this.skill = { ...this.skill, ...overrides };
    return this;
  }

  /** 覚醒ステートを設定する */
  withAwakening(overrides: Partial<AwakeningState>): this {
    this.awakening = { ...this.awakening, ...overrides };
    return this;
  }

  /** 統計ステートを設定する */
  withStats(overrides: Partial<RunStatsState>): this {
    this.stats = { ...this.stats, ...overrides };
    return this;
  }

  /** チャレンジステートを設定する */
  withChallenge(overrides: Partial<ChallengeState>): this {
    this.challenge = { ...this.challenge, ...overrides };
    return this;
  }

  /** エンドレスステートを設定する */
  withEndless(overrides: Partial<EndlessState>): this {
    this.endless = { ...this.endless, ...overrides };
    return this;
  }

  /** メタステート（log, loopCount 等）を設定する */
  withMeta(overrides: Partial<RunMetaState>): this {
    this.meta = { ...this.meta, ...overrides };
    return this;
  }

  /** RunState を構築する */
  build(): RunState {
    return {
      ...this.player,
      ...this.battle,
      ...this.progression,
      ...this.evolution,
      ...this.skill,
      ...this.awakening,
      ...this.stats,
      ...this.challenge,
      ...this.endless,
      ...this.meta,
    };
  }
}
