/**
 * チャレンジモード - 単体テスト
 */
import {
  saveHighScore,
  loadHighScore,
  clearHighScore,
} from '../challenge-storage';

describe('challenge-storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadHighScore', () => {
    it('初期状態では0を返す', () => {
      expect(loadHighScore()).toBe(0);
    });
  });

  describe('saveHighScore', () => {
    it('ハイスコアを保存できる', () => {
      saveHighScore(15);
      expect(loadHighScore()).toBe(15);
    });

    it('既存のハイスコアより高い場合のみ更新する', () => {
      saveHighScore(15);
      saveHighScore(10);
      expect(loadHighScore()).toBe(15);
    });

    it('既存のハイスコアより高ければ更新する', () => {
      saveHighScore(10);
      saveHighScore(20);
      expect(loadHighScore()).toBe(20);
    });
  });

  describe('clearHighScore', () => {
    it('ハイスコアを削除する', () => {
      saveHighScore(15);
      clearHighScore();
      expect(loadHighScore()).toBe(0);
    });
  });
});
