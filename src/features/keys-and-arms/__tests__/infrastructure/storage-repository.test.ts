// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createInMemoryStorageRepository,
  createLocalStorageRepository,
} from '../../infrastructure/storage-repository';
import type { GameStorageRepository } from '../../infrastructure/storage-repository';

describe('InMemoryStorageRepository', () => {
  let repo: GameStorageRepository;

  beforeEach(() => {
    repo = createInMemoryStorageRepository();
  });

  describe('getHighScore', () => {
    it('初期値は0を返す', () => {
      expect(repo.getHighScore()).toBe(0);
    });

    it('保存した値を取得できる', () => {
      // Arrange
      repo.setHighScore(5000);

      // Act & Assert
      expect(repo.getHighScore()).toBe(5000);
    });
  });

  describe('setHighScore', () => {
    it('ハイスコアを保存できる', () => {
      // Act
      repo.setHighScore(12345);

      // Assert
      expect(repo.getHighScore()).toBe(12345);
    });

    it('ハイスコアを上書きできる', () => {
      // Arrange
      repo.setHighScore(100);

      // Act
      repo.setHighScore(200);

      // Assert
      expect(repo.getHighScore()).toBe(200);
    });
  });
});

describe('LocalStorageRepository', () => {
  let repo: GameStorageRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = createLocalStorageRepository();
  });

  describe('getHighScore', () => {
    it('localStorage に値がない場合は0を返す', () => {
      expect(repo.getHighScore()).toBe(0);
    });

    it('localStorage の値を読み取る', () => {
      // Arrange
      localStorage.setItem('kaG', '9999');

      // Act & Assert
      expect(repo.getHighScore()).toBe(9999);
    });

    it('不正な値の場合は0を返す', () => {
      // Arrange
      localStorage.setItem('kaG', 'invalid');

      // Act & Assert
      expect(repo.getHighScore()).toBe(0);
    });
  });

  describe('setHighScore', () => {
    it('localStorage に値を保存する', () => {
      // Act
      repo.setHighScore(7777);

      // Assert
      expect(localStorage.getItem('kaG')).toBe('7777');
    });
  });
});
