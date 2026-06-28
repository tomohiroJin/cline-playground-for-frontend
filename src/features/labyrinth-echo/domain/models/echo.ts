/**
 * 迷宮の残響 - 残響モデル（先人・断片・レガシー）
 *
 * 過去の探索者（先人）とその残響断片、および残響継承（レガシー）を表現する型。
 * 純粋な型定義のみ。外部依存なし。
 */
import type { FxState } from './unlock';

/** 残響断片 — 先人の物語アークを構成する1片 */
export interface EchoFragment {
  /** 断片の一意ID（例 "f_lian_1"） */
  readonly id: string;
  /** 属する先人ID（例 "p_lian"） */
  readonly predecessorId: string;
  /** アーク内の読む順序（1始まり連番） */
  readonly order: number;
  /** この echoDepth 以上で出現可能（0〜6） */
  readonly depthGate: number;
  /** 探索中発見の対象フロア */
  readonly floors: readonly number[];
  /** 書庫の断片見出し */
  readonly title: string;
  /** 断片本文（重厚な散文） */
  readonly body: string;
}

/** 先人 — 残響の主（物語アークの単位） */
export interface Predecessor {
  readonly id: string;
  readonly name: string;
  /** アイコン（絵文字。画像は任意で後日差し替え） */
  readonly icon: string;
  readonly color: string;
  readonly floors: readonly number[];
  /** 全断片収集で解禁される人物総括 */
  readonly summary: string;
  /** この先人が属する真相レイヤー（1〜4） */
  readonly truthLayer: number;
}

/** EchoFragment の型ガード */
export const isEchoFragment = (v: unknown): v is EchoFragment => {
  if (typeof v !== 'object' || v === null) return false;
  const f = v as Record<string, unknown>;
  return typeof f.id === 'string'
    && typeof f.predecessorId === 'string'
    && typeof f.order === 'number'
    && typeof f.depthGate === 'number'
    && Array.isArray(f.floors)
    && typeof f.title === 'string'
    && typeof f.body === 'string';
};

/** 残響継承（先人レガシー）— トレードオフ型のビルド効果 */
export interface EchoLegacy {
  /** 一意ID（例 "lg_lian"） */
  readonly id: string;
  /** 紐づく先人ID（例 "p_lian"） */
  readonly predecessorId: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;
  /** 上振れの説明 */
  readonly upside: string;
  /** 下振れの説明 */
  readonly downside: string;
  /** fx デルタ（既存 FxState キーのみ） */
  readonly fx: Partial<FxState>;
}
