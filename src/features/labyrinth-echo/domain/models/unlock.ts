/**
 * 迷宮の残響 - Unlock エンティティ・FxState
 *
 * アンロック定義と集約済みアンロック効果を表現する。
 */
import type { DifficultyId } from './difficulty';
import type { MetaState } from './meta-state';

/** アンロックカテゴリ */
export type UnlockCategory = 'basic' | 'special' | 'trophy' | 'achieve';

/** アンロック効果のキー */
export type UnlockEffectKey =
  | 'hpBonus' | 'mentalBonus' | 'infoBonus'
  | 'infoMult' | 'healMult' | 'mnReduce' | 'hpReduce'
  | 'dangerSense' | 'bleedReduce' | 'drainImmune'
  | 'curseImmune' | 'secondLife' | 'chainBoost'
  | 'negotiator' | 'mentalSense';

/** アンロック効果値 */
export type UnlockEffectValue = number | boolean;

/** アンロック定義 */
export interface UnlockDef {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly cost: number;
  readonly icon: string;
  readonly category: UnlockCategory;
  readonly effects: Readonly<Partial<Record<UnlockEffectKey, UnlockEffectValue>>>;
  readonly gateRequirement?: DifficultyId;
  readonly difficultyRequirement?: DifficultyId | 'abyss_perfect';
  readonly achievementCondition?: (meta: MetaState) => boolean;
  readonly achievementDescription?: string;
}

/** 集約済みアンロック効果 */
export interface FxState {
  // 加算効果
  readonly hpBonus: number;
  readonly mentalBonus: number;
  readonly infoBonus: number;
  // 乗算効果
  readonly infoMult: number;
  readonly healMult: number;
  readonly mnReduce: number;
  readonly hpReduce: number;
  // ブール効果
  readonly dangerSense: boolean;
  readonly bleedReduce: boolean;
  readonly drainImmune: boolean;
  readonly curseImmune: boolean;
  readonly secondLife: boolean;
  readonly chainBoost: boolean;
  readonly negotiator: boolean;
  readonly mentalSense: boolean;
}

/** FxStateのデフォルト値 */
export const FX_DEFAULTS: Readonly<FxState> = Object.freeze({
  hpBonus: 0,
  mentalBonus: 0,
  infoBonus: 0,
  infoMult: 1,
  healMult: 1,
  mnReduce: 1,
  hpReduce: 1,
  dangerSense: false,
  bleedReduce: false,
  drainImmune: false,
  curseImmune: false,
  secondLife: false,
  chainBoost: false,
  negotiator: false,
  mentalSense: false,
});

/** FX 乗算キーの型 */
export type FxMultKey = 'infoMult' | 'healMult' | 'mnReduce' | 'hpReduce';

/** FX ブールキーの型 */
export type FxBoolKey = 'dangerSense' | 'bleedReduce' | 'drainImmune' | 'curseImmune' | 'secondLife' | 'chainBoost' | 'negotiator' | 'mentalSense';

/** FX 加算キーの型 */
export type FxAddKey = 'hpBonus' | 'mentalBonus' | 'infoBonus';

/** FX key の分類（型安全なセット） */
export const FX_MULT = new Set<FxMultKey>(['infoMult', 'healMult', 'mnReduce', 'hpReduce']);
export const FX_BOOL = new Set<FxBoolKey>(['dangerSense', 'bleedReduce', 'drainImmune', 'curseImmune', 'secondLife', 'chainBoost', 'negotiator', 'mentalSense']);
