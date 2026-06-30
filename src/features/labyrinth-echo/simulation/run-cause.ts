/**
 * 迷宮の残響 - ラン終了原因（cause）の共有定数
 *
 * run-simulator が結果に書き込む cause と、invariants が検証する既知 cause 集合は
 * 同一の文字列でなければならない。両者でリテラルを二重定義すると、生成側を変えた際に
 * 検証側が古いままになり「未知の cause」を誤検出する（ドリフト）。
 * 単一ソースとしてここに集約する。
 */

/** ラン終了原因（脱出・体力消耗・精神崩壊） */
export const RUN_CAUSE = Object.freeze({
  /** 脱出成功（survived=true） */
  ESCAPE: 'escape',
  /** HP が尽きて死亡 */
  HP_DEPLETED: '体力消耗',
  /** MN が尽きて精神崩壊 */
  MN_DEPLETED: '精神崩壊',
});

/** RUN_CAUSE の値のユニオン型 */
export type RunCause = (typeof RUN_CAUSE)[keyof typeof RUN_CAUSE];
