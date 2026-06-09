/**
 * StudyProgressRepository のテスト
 *
 * 勉強会モードの累計回答数の永続化・インクリメントを検証する。
 */
import { StudyProgressRepository } from '../study-progress-repository';
import { StoragePort } from '../storage-port';

/** テスト用のインメモリ StoragePort */
const createMemoryStorage = (): StoragePort => {
  const data = new Map<string, unknown>();
  return {
    get: <T>(key: string) => data.get(key) as T | undefined,
    set: <T>(key: string, value: T) => {
      data.set(key, value);
    },
    remove: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    has: (key: string) => data.has(key),
  };
};

describe('StudyProgressRepository', () => {
  it('未保存の累計回答数は 0 を返す', () => {
    const repo = new StudyProgressRepository(createMemoryStorage());
    expect(repo.getTotalAnswered()).toBe(0);
  });

  it('incrementAnswered は累計を 1 ずつ増やして永続化する', () => {
    const storage = createMemoryStorage();
    const repo = new StudyProgressRepository(storage);

    expect(repo.incrementAnswered()).toBe(1);
    expect(repo.incrementAnswered()).toBe(2);
    // 同一ストレージを共有する別インスタンスでも累計を引き継ぐ
    expect(new StudyProgressRepository(storage).getTotalAnswered()).toBe(2);
  });
});
