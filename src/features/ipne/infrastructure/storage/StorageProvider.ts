/**
 * 永続化ストレージ抽象
 */

export interface StorageProvider {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const noop = (): void => undefined;

export const NOOP_STORAGE_PROVIDER: StorageProvider = {
  getItem: () => null,
  setItem: noop,
  removeItem: noop,
};

/**
 * ブラウザ環境の localStorage を StorageProvider として扱う
 */
export function createBrowserStorageProvider(
  storage: Storage | undefined = typeof window !== 'undefined' ? window.localStorage : undefined
): StorageProvider {
  if (!storage) {
    return NOOP_STORAGE_PROVIDER;
  }

  return {
    getItem: (key: string) => storage.getItem(key),
    setItem: (key: string, value: string) => {
      storage.setItem(key, value);
    },
    removeItem: (key: string) => {
      storage.removeItem(key);
    },
  };
}
