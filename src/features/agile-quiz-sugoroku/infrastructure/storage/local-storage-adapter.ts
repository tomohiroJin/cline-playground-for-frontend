/**
 * localStorage アダプター
 *
 * ブラウザの localStorage を StoragePort インターフェースで使用する。
 * localStorage が利用できない場合はエラーを無視する。
 */
import { StoragePort } from './storage-port';

export class LocalStorageAdapter implements StoragePort {
  get<T>(key: string): T | undefined {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage が利用できない場合は無視
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // localStorage が利用できない場合は無視
    }
  }

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      // localStorage が利用できない場合は無視
    }
  }

  has(key: string): boolean {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  }
}
