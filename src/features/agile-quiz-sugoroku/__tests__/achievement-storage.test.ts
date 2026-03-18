/**
 * 実績リポジトリ - 単体テスト
 */
import { AchievementRepository } from '../infrastructure/storage/achievement-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';

describe('AchievementRepository', () => {
  let repository: AchievementRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new AchievementRepository(new LocalStorageAdapter());
  });

  describe('loadProgress', () => {
    it('初期状態では空のunlockedオブジェクトを返す', () => {
      const progress = repository.loadProgress();
      expect(progress.unlocked).toEqual({});
    });

    it('保存済みデータを読み込む', () => {
      localStorage.setItem('aqs_achievements', JSON.stringify({
        unlocked: { 'first-clear': 1000 },
      }));
      const progress = repository.loadProgress();
      expect(progress.unlocked['first-clear']).toBe(1000);
    });

    it('不正なデータの場合はデフォルトを返す', () => {
      localStorage.setItem('aqs_achievements', 'invalid');
      const progress = repository.loadProgress();
      expect(progress.unlocked).toEqual({});
    });
  });

  describe('saveUnlock', () => {
    it('実績をアンロックして保存する', () => {
      repository.saveUnlock('first-clear', 1000);
      const progress = repository.loadProgress();
      expect(progress.unlocked['first-clear']).toBe(1000);
    });

    it('複数の実績を順次アンロックできる', () => {
      repository.saveUnlock('first-clear', 1000);
      repository.saveUnlock('combo-5', 2000);
      const progress = repository.loadProgress();
      expect(Object.keys(progress.unlocked)).toHaveLength(2);
      expect(progress.unlocked['combo-5']).toBe(2000);
    });

    it('すでにアンロック済みの実績は上書きしない', () => {
      repository.saveUnlock('first-clear', 1000);
      repository.saveUnlock('first-clear', 9999);
      const progress = repository.loadProgress();
      expect(progress.unlocked['first-clear']).toBe(1000);
    });
  });

  describe('getUnlockedIds', () => {
    it('アンロック済み実績のIDリストを返す', () => {
      repository.saveUnlock('first-clear', 1000);
      repository.saveUnlock('combo-5', 2000);
      const ids = repository.getUnlockedIds();
      expect(ids).toContain('first-clear');
      expect(ids).toContain('combo-5');
      expect(ids).toHaveLength(2);
    });

    it('初期状態では空配列を返す', () => {
      expect(repository.getUnlockedIds()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('実績データを削除する', () => {
      repository.saveUnlock('first-clear', 1000);
      repository.clear();
      expect(repository.getUnlockedIds()).toEqual([]);
    });
  });
});
