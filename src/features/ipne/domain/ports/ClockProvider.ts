/**
 * 時計プロバイダーインターフェース
 * 現在時刻の取得を抽象化し、テスタビリティを向上させる
 */
export interface ClockProvider {
  /** 現在時刻（ms）を返す */
  now(): number;
}
