/**
 * 実績ストレージ - 単体テスト
 */
import {
  loadAchievementProgress,
  saveAchievementUnlock,
  getUnlockedIds,
  clearAchievementProgress,
} from '../achievement-storage';

describe('achievement-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadAchievementProgress', () => {
    it('初期状態では空のunlockedオブジェクトを返す', () => {
      const progress = loadAchievementProgress();
      expect(progress.unlocked).toEqual({});
    });

    it('保存済みデータを読み込む', () => {
      localStorage.setItem('aqs_achievements', JSON.stringify({
        unlocked: { 'first-clear': 1000 },
      }));
      const progress = loadAchievementProgress();
      expect(progress.unlocked['first-clear']).toBe(1000);
    });

    it('不正なデータの場合はデフォルトを返す', () => {
      localStorage.setItem('aqs_achievements', 'invalid');
      const progress = loadAchievementProgress();
      expect(progress.unlocked).toEqual({});
    });
  });

  describe('saveAchievementUnlock', () => {
    it('実績をアンロックして保存する', () => {
      saveAchievementUnlock('first-clear', 1000);
      const progress = loadAchievementProgress();
      expect(progress.unlocked['first-clear']).toBe(1000);
    });

    it('複数の実績を順次アンロックできる', () => {
      saveAchievementUnlock('first-clear', 1000);
      saveAchievementUnlock('combo-5', 2000);
      const progress = loadAchievementProgress();
      expect(Object.keys(progress.unlocked)).toHaveLength(2);
      expect(progress.unlocked['combo-5']).toBe(2000);
    });

    it('すでにアンロック済みの実績は上書きしない', () => {
      saveAchievementUnlock('first-clear', 1000);
      saveAchievementUnlock('first-clear', 9999);
      const progress = loadAchievementProgress();
      expect(progress.unlocked['first-clear']).toBe(1000);
    });
  });

  describe('getUnlockedIds', () => {
    it('アンロック済み実績のIDリストを返す', () => {
      saveAchievementUnlock('first-clear', 1000);
      saveAchievementUnlock('combo-5', 2000);
      const ids = getUnlockedIds();
      expect(ids).toContain('first-clear');
      expect(ids).toContain('combo-5');
      expect(ids).toHaveLength(2);
    });

    it('初期状態では空配列を返す', () => {
      expect(getUnlockedIds()).toEqual([]);
    });
  });

  describe('clearAchievementProgress', () => {
    it('実績データを削除する', () => {
      saveAchievementUnlock('first-clear', 1000);
      clearAchievementProgress();
      expect(getUnlockedIds()).toEqual([]);
    });
  });
});
