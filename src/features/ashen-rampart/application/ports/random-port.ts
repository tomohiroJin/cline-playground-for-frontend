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
