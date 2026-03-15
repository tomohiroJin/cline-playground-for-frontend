/**
 * 迷宮の残響 - RandomPort（乱数ソースポート）
 *
 * 依存性逆転の原則に基づく乱数ソースインターフェース。
 * 本番: DefaultRandomSource（Math.random ラッパー）
 * テスト: SeededRandomSource / モック
 */

/** 乱数ソースポート */
export interface RandomPort {
  /** 0 以上 1 未満の乱数を返す */
  random(): number;
}
