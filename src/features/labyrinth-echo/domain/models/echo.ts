/**
 * 迷宮の残響 - 残響モデル（先人・断片）
 *
 * 過去の探索者（先人）とその残響断片を表現する型。
 * 純粋な型定義のみ。外部依存なし。
 */

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
