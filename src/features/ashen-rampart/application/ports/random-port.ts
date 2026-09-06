/**
 * 灰燼の城壁 - RandomPort（乱数ソースポート）
 *
 * 本番: DefaultRandom（Math.random ラッパー）
 * テスト/シード固定: SeededRandom
 */
export interface RandomPort {
  /** 0 以上 1 未満の乱数を返す */
  random(): number;
}

/**
 * シードから決定的な乱数源を作る factory（反復6 最終レビュー指摘 I1）
 *
 * `startExpedition` / `startStage` / `advanceStage` は目的ごとに派生シードを
 * 作り、そのたびに新しい乱数源が要る（単一の `RandomPort` を注入するだけでは
 * 足りない）。かといって application 層が `infrastructure/random/seeded-random`
 * を直接 import すると依存方向が逆流する。この factory 型を挟むことで、
 * 実装（`SeededRandom`）は infrastructure に置いたまま、application は
 * 「シードを渡すと `RandomPort` が返る」という契約だけを知ればよくなる。
 *
 * 呼び出し側が呼ばれるたびに新しい `RandomPort` を作れば、
 * 元の実装が守っていた「派生シードから作り直す冪等性」（StrictMode の
 * 二重初期化対策）はそのまま保たれる。
 */
export type SeededRandomFactory = (seed: number) => RandomPort;
