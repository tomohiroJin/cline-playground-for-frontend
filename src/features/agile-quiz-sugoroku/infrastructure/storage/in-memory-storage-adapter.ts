/**
 * インメモリストレージアダプター（テスト用）
 *
 * StoragePort を Map で実装する。
 * テストやサーバーサイドレンダリング時に使用。
 */
import { StoragePort } from './storage-port';

export class InMemoryStorageAdapter implements StoragePort {
  private readonly store = new Map<string, string>();

  get<T>(key: string): T | undefined {
    const raw = this.store.get(key);
    if (raw === undefined) return undefined;
    return JSON.parse(raw) as T;
  }

  set<T>(key: string, value: T): void {
    this.store.set(key, JSON.stringify(value));
  }

  remove(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: string): boolean {
    return this.store.has(key);
  }
}
