/**
 * AchievementObserver のテスト
 */
import { AchievementObserver } from '../achievement-observer';
import type { AchievementDefinition } from '../../domain/types';

describe('AchievementObserver', () => {
  const mockAchievement: AchievementDefinition = {
    id: 'test',
    name: 'テスト実績',
    description: 'テスト用の実績',
    rarity: 'Bronze',
    check: () => true,
  };

  describe('subscribe - リスナー登録', () => {
    it('リスナーが通知を受け取る', () => {
      // Arrange
      const observer = new AchievementObserver();
      const listener = jest.fn();
      observer.subscribe(listener);

      // Act
      observer.notify([mockAchievement]);

      // Assert
      expect(listener).toHaveBeenCalledWith([mockAchievement]);
    });

    it('複数のリスナーがすべて通知を受け取る', () => {
      // Arrange
      const observer = new AchievementObserver();
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      observer.subscribe(listener1);
      observer.subscribe(listener2);

      // Act
      observer.notify([mockAchievement]);

      // Assert
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('購読解除後はリスナーが呼ばれない', () => {
      // Arrange
      const observer = new AchievementObserver();
      const listener = jest.fn();
      const unsubscribe = observer.subscribe(listener);

      // Act
      unsubscribe();
      observer.notify([mockAchievement]);

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('notify - 通知', () => {
    it('空の配列では通知しない', () => {
      // Arrange
      const observer = new AchievementObserver();
      const listener = jest.fn();
      observer.subscribe(listener);

      // Act
      observer.notify([]);

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clear - 全リスナー解除', () => {
    it('clear後はリスナーが呼ばれない', () => {
      // Arrange
      const observer = new AchievementObserver();
      const listener = jest.fn();
      observer.subscribe(listener);

      // Act
      observer.clear();
      observer.notify([mockAchievement]);

      // Assert
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
