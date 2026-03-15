/**
 * localStorage モックヘルパー
 *
 * テストで localStorage を安全にモックするためのユーティリティ。
 * beforeEach / afterEach で setup / teardown を呼び出して使用する。
 */

/** モック用のインメモリストレージ */
const mockStorage: Record<string, string> = {};

/** モックストレージへの直接アクセス（テストデータのセットアップ用） */
export const getMockStorage = (): Record<string, string> => mockStorage;

/** localStorage モックをセットアップする */
export const setupMockLocalStorage = (): void => {
  Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);

  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(
    (key: string) => mockStorage[key] ?? null
  );
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(
    (key: string, value: string) => {
      mockStorage[key] = value;
    }
  );
  jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(
    (key: string) => {
      delete mockStorage[key];
    }
  );
};

/** localStorage モックをクリーンアップする */
export const teardownMockLocalStorage = (): void => {
  jest.restoreAllMocks();
};
