// StoragePort の localStorage 実装テスト

import { createLocalStorageRepository } from '../../infrastructure/storage/score-repository';

describe('score-repository', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saveScore でスコアを保存し getHighScore で取得できる', async () => {
    // Arrange
    const repo = createLocalStorageRepository();

    // Act
    await repo.saveScore('racing', 60000, 'solo');
    await repo.saveScore('racing', 50000, 'solo');
    const high = await repo.getHighScore('racing', 'solo', 'asc');

    // Assert: asc = 低い方が良い（タイム計測）
    expect(high).toBe(50000);
  });

  it('スコアがない場合は 0 を返す', async () => {
    const repo = createLocalStorageRepository();
    const high = await repo.getHighScore('nonexistent', 'solo', 'desc');
    expect(high).toBe(0);
  });
});
