/**
 * ストレージ操作のポートインターフェース
 *
 * localStorage 等の永続化手段を抽象化する。
 * テスト時は InMemoryStorageAdapter に差し替え可能。
 */

/** ストレージ操作のインターフェース */
export interface StoragePort {
  /** 値を取得する。キーが存在しない場合は undefined を返す */
  get<T>(key: string): T | undefined;
  /** 値を保存する */
  set<T>(key: string, value: T): void;
  /** 値を削除する */
  remove(key: string): void;
  /** 全データを削除する */
  clear(): void;
  /** キーが存在するか確認する（生データレベル、パース可否は問わない） */
  has(key: string): boolean;
}
