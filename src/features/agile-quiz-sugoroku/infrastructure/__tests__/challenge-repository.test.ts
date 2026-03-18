/**
 * ChallengeRepository テスト
 */
import { InMemoryStorageAdapter } from '../storage/in-memory-storage-adapter';
import { ChallengeRepository } from '../storage/challenge-repository';

describe('ChallengeRepository', () => {
  let storage: InMemoryStorageAdapter;
  let repository: ChallengeRepository;

  beforeEach(() => {
    storage = new InMemoryStorageAdapter();
    repository = new ChallengeRepository(storage);
  });

  describe('loadHighScore', () => {
    it('データがない場合は 0 を返す', () => {
      // Act & Assert
      expect(repository.loadHighScore()).toBe(0);
    });
  });

  describe('saveHighScore', () => {
    it('ハイスコアを保存できる', () => {
      // Act
      repository.saveHighScore(100);

      // Assert
      expect(repository.loadHighScore()).toBe(100);
    });

    it('既存より高いスコアのみ保存する', () => {
      // Arrange
      repository.saveHighScore(100);

      // Act
      repository.saveHighScore(50);

      // Assert
      expect(repository.loadHighScore()).toBe(100);
    });

    it('既存より高いスコアは上書きする', () => {
      // Arrange
      repository.saveHighScore(100);

      // Act
      repository.saveHighScore(200);

      // Assert
      expect(repository.loadHighScore()).toBe(200);
    });
  });

  describe('clear', () => {
    it('ハイスコアを削除する', () => {
      // Arrange
      repository.saveHighScore(100);

      // Act
      repository.clear();

      // Assert
      expect(repository.loadHighScore()).toBe(0);
    });
  });
});
