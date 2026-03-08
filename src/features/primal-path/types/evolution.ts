/**
 * 進化関連の型定義
 */
import type { CivType } from './common';
import type { AllyTemplate } from './units';

/** 進化エフェクト */
export interface EvoEffect {
  readonly atk?: number;
  readonly def?: number;
  readonly cr?: number;
  readonly mhp?: number;
  readonly heal?: number;
  readonly full?: number;
  readonly sd?: number;
  readonly burn?: number;
  readonly half?: number;
  readonly aM?: number;
  readonly bb?: number;
  readonly aHL?: number;
  readonly revA?: number;
}

/** シナジータグ */
export type SynergyTag = 'fire' | 'ice' | 'regen' | 'shield' | 'hunt' | 'spirit' | 'tribe' | 'wild';

/** 進化定義 */
export interface Evolution {
  readonly n: string;
  readonly d: string;
  readonly t: CivType;
  readonly r: number;
  readonly e: EvoEffect;
  readonly tags?: readonly SynergyTag[];
}

/** シナジー効果 */
export type SynergyEffect =
  | { type: 'stat_bonus'; stat: 'atk' | 'hp' | 'def' | 'cr'; value: number }
  | { type: 'damage_multiplier'; target: 'burn' | 'all'; multiplier: number }
  | { type: 'heal_bonus'; ratio: number }
  | { type: 'ally_bonus'; stat: 'atk' | 'hp'; value: number }
  | { type: 'special'; id: 'awakening_boost' | 'awakening_power' | 'env_immune' }
  | { type: 'compound'; effects: readonly SynergyEffect[] };

/** シナジーボーナス定義 */
export interface SynergyBonusDef {
  readonly tag: SynergyTag;
  readonly tier1: {
    readonly name: string;
    readonly description: string;
    readonly effect: SynergyEffect;
  };
  readonly tier2: {
    readonly name: string;
    readonly description: string;
    readonly effect: SynergyEffect;
  };
}

/** 発動中のシナジー情報 */
export interface ActiveSynergy {
  tag: SynergyTag;
  count: number;
  /** 1=Tier1(タグ2個), 2=Tier2(タグ3個以上) */
  tier: 1 | 2;
  bonusName: string;
}

/** 進化関連の状態 */
export interface EvolutionState {
  /** 取得済み進化リスト */
  evs: Evolution[];
  /** 最大進化回数（チャレンジ用） */
  maxEvo?: number;
}

/** 進化適用結果 */
export interface ApplyEvoResult {
  nextRun: import('./game-state').RunState;
  allyJoined: AllyTemplate | null;
  allyRevived: string | null;
}
