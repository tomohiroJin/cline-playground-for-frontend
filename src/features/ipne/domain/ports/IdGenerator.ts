/**
 * ID生成器インターフェース
 * エンティティのID生成を抽象化し、テスタビリティを向上させる
 */
export interface IdGenerator {
  /** 敵IDを生成する */
  generateEnemyId(): string;
  /** 罠IDを生成する */
  generateTrapId(): string;
  /** アイテムIDを生成する */
  generateItemId(): string;
  /** フィードバックIDを生成する */
  generateFeedbackId(): string;
}
