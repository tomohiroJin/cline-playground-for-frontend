/**
 * 始祖トーテム関連の型定義
 */
import type { AllyTemplate } from './units';

/** トーテム識別子（Phase 1 は基本3種） */
export type TotemId = 'blood' | 'flame' | 'pack';

/** パワーカーブ（縦の多様性：いつ強いか） */
export type PowerCurve = 'front' | 'scaling' | 'combo' | 'wild';

/** トーテム効果（ラン初期化時に適用される宣言的な補正） */
export interface TotemEffect {
  /** 最大HP倍率（例: 0.8 で -20%） */
  readonly mhpMul?: number;
  /** ATK倍率（例: 1.2 で +20%） */
  readonly atkMul?: number;
  /** 会心率加算（0〜1） */
  readonly crAdd?: number;
  /** DEF加算 */
  readonly defAdd?: number;
  /** 仲間枠加算 */
  readonly mxaAdd?: number;
  /** 火傷ダメージ倍率（既定1.0） */
  readonly burnDmgMul?: number;
  /** 仲間ATKボーナス（0.1 で +10%、以後のリクルートに適用） */
  readonly allyAtkBonus?: number;
  /** 開始時に加入する仲間 */
  readonly startAlly?: AllyTemplate;
}

/** トーテム定義 */
export interface TotemDef {
  readonly id: TotemId;
  readonly nm: string;
  readonly ic: string;
  readonly curve: PowerCurve;
  readonly desc: string;
  /** 解放に必要なクリア回数（基本トーテムは0） */
  readonly unlock: number;
  readonly effect: TotemEffect;
}
