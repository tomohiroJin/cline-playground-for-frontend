/**
 * TitleService（称号判定サービス）のテスト
 */
import {
  getUnlockedTitles,
  getActiveTitle,
} from '../../../domain/services/title-service';
import { createMetaState } from '../../../domain/models/meta-state';

describe('TitleService', () => {
  describe('getUnlockedTitles', () => {
    it('初期状態では「迷い人」のみ解放されている', () => {
      // Arrange
      const meta = createMetaState();

      // Act
      const titles = getUnlockedTitles(meta);

      // Assert
      expect(titles).toHaveLength(1);
      expect(titles[0].id).toBe('t00');
      expect(titles[0].name).toBe('迷い人');
    });

    it('runs >= 1 で「初探索者」が解放される', () => {
      // Arrange
      const meta = createMetaState({ runs: 1 });

      // Act
      const titles = getUnlockedTitles(meta);

      // Assert
      const names = titles.map(t => t.name);
      expect(names).toContain('初探索者');
    });

    it('複数条件を満たす場合は全て返される', () => {
      // Arrange
      const meta = createMetaState({ runs: 5, escapes: 1 });

      // Act
      const titles = getUnlockedTitles(meta);

      // Assert
      const names = titles.map(t => t.name);
      expect(names).toContain('迷い人');
      expect(names).toContain('初探索者');
      expect(names).toContain('冒険者');
      expect(names).toContain('生還者');
    });
  });

  describe('getActiveTitle', () => {
    it('activeTitle未設定時は最も新しい称号が返される', () => {
      // Arrange
      const meta = createMetaState({ runs: 5 });

      // Act
      const title = getActiveTitle(meta);

      // Assert
      expect(title.id).toBe('t02'); // 冒険者
    });

    it('activeTitleが設定済みならその称号が返される', () => {
      // Arrange
      const meta = createMetaState({ runs: 5, activeTitle: 't01' });

      // Act
      const title = getActiveTitle(meta);

      // Assert
      expect(title.id).toBe('t01');
    });

    it('activeTitleの条件を満たさない場合はフォールバックする', () => {
      // Arrange — runs=0 なのに t01 を設定
      const meta = createMetaState({ runs: 0, activeTitle: 't01' });

      // Act
      const title = getActiveTitle(meta);

      // Assert
      expect(title.id).toBe('t00'); // 迷い人にフォールバック
    });
  });
});
