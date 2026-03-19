/**
 * 迷宮の残響 - StatusEffect 値オブジェクト
 *
 * 状態異常の定義を表現する値オブジェクト。
 */
import type { StatusEffectId } from './player';

/** 状態異常の視覚情報 */
export interface StatusEffectVisual {
  readonly primaryColor: string;
  readonly bgColor: string;
  readonly borderColor: string;
}

/** 状態異常のターン経過効果 */
export interface StatusEffectTick {
  readonly hpDelta: number;
  readonly mnDelta: number;
}

/** 状態異常定義 */
export interface StatusEffectDef {
  readonly id: StatusEffectId;
  readonly visual: StatusEffectVisual;
  readonly tick: StatusEffectTick | null;
}
