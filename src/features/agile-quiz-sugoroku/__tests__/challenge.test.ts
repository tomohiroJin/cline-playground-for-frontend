/**
 * チャレンジモードリポジトリ - 単体テスト
 */
import { ChallengeRepository } from '../infrastructure/storage/challenge-repository';
import { LocalStorageAdapter } from '../infrastructure/storage/local-storage-adapter';

describe('ChallengeRepository', () => {
  let repository: ChallengeRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new ChallengeRepository(new LocalStorageAdapter());
  });

  describe('loadHighScore', () => {
    it('初期状態では0を返す', () => {
      expect(repository.loadHighScore()).toBe(0);
    });
  });

  describe('saveHighScore', () => {
    it('ハイスコアを保存できる', () => {
      repository.saveHighScore(15);
      expect(repository.loadHighScore()).toBe(15);
    });

    it('既存のハイスコアより高い場合のみ更新する', () => {
      repository.saveHighScore(15);
      repository.saveHighScore(10);
      expect(repository.loadHighScore()).toBe(15);
    });

    it('既存のハイスコアより高ければ更新する', () => {
      repository.saveHighScore(10);
      repository.saveHighScore(20);
      expect(repository.loadHighScore()).toBe(20);
    });
  });

  describe('loadHighScore - 異常系', () => {
    it('localStorageに不正な（非数値）データがある場合は0を返す', () => {
      localStorage.setItem('aqs_challenge_highscore', 'invalid json');
      expect(repository.loadHighScore()).toBe(0);
    });
  });

  describe('clear', () => {
    it('ハイスコアを削除する', () => {
      repository.saveHighScore(15);
      repository.clear();
      expect(repository.loadHighScore()).toBe(0);
    });
  });
});
