/**
 * 始祖トーテム関連の型定義
 */
import type { AllyTemplate } from './units';
import type { SynergyTag } from './evolution';

/** トーテム識別子（基本3種＋上位3種） */
export type TotemId = 'blood' | 'flame' | 'pack' | 'rock' | 'spirit' | 'ember';

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
  /** 環境ダメージ軽減率（0.3 で -30%。tb.iR/fR に加算される） */
  readonly envDmgR?: number;
  /** 覚醒要求の減算（1 で saReq/fReq を -1、最小1にクランプ） */
  readonly awkReqReduce?: number;
  /** 覚醒効果の増加率（0.25 で覚醒効果 +25%） */
  readonly awkMul?: number;
  /** 踏破ごとの全ステ加算率（0.12 で base×0.12 を ATK/DEF/最大HP に踏破ごと加算） */
  readonly biomeScale?: number;
}

/** トーテム定義 */
export interface TotemDef {
  readonly id: TotemId;
  readonly nm: string;
  readonly ic: string;
  readonly curve: PowerCurve;
  /** 推しアーキタイプ（節目のキーストーン提示で tag 一致を優先） */
  readonly tag?: SynergyTag;
  readonly desc: string;
  /** 解放に必要なクリア回数（基本トーテムは0） */
  readonly unlock: number;
  readonly effect: TotemEffect;
}
