// 永続化インターフェース
export interface StorageApi {
  load<T>(key: string): T | undefined;
  save<T>(key: string, data: T): void;
  remove(key: string): void;
}
