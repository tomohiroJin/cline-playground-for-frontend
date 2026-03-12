/**
 * コンボシステムのテスト
 */
import {
  createComboState,
  incrementCombo,
  resetCombo,
  afterSweep,
  comboBonus,
} from '../../domain/combat/combo-system';

describe('combat/combo-system', () => {
  describe('incrementCombo', () => {
    it('コンボカウントが 1 増加する', () => {
      // Arrange
      const state = createComboState();

      // Act
      const result = incrementCombo(state);

      // Assert
      expect(result.count).toBe(1);
    });

    it('最大コンボが更新される', () => {
      // Arrange
      let state = createComboState();
      state = incrementCombo(state);
      state = incrementCombo(state);
      state = resetCombo(state);

      // Act
      state = incrementCombo(state);

      // Assert
      expect(state.maxCombo).toBe(2);
      expect(state.count).toBe(1);
    });

    it('コンボ 4 でスウィープが有効になる', () => {
      // Arrange
      let state = createComboState();

      // Act
      for (let i = 0; i < 4; i++) {
        state = incrementCombo(state);
      }

      // Assert
      expect(state.sweepReady).toBe(true);
    });

    it('コンボ 3 ではスウィープが無効のまま', () => {
      // Arrange
      let state = createComboState();

      // Act
      for (let i = 0; i < 3; i++) {
        state = incrementCombo(state);
      }

      // Assert
      expect(state.sweepReady).toBe(false);
    });
  });

  describe('resetCombo', () => {
    it('コンボカウントが 0 にリセットされる', () => {
      // Arrange
      let state = createComboState();
      state = incrementCombo(state);
      state = incrementCombo(state);

      // Act
      const result = resetCombo(state);

      // Assert
      expect(result.count).toBe(0);
    });

    it('最大コンボは保持される', () => {
      // Arrange
      let state = createComboState();
      state = incrementCombo(state);
      state = incrementCombo(state);
      state = incrementCombo(state);

      // Act
      const result = resetCombo(state);

      // Assert
      expect(result.maxCombo).toBe(3);
    });

    it('スウィープがリセットされる', () => {
      // Arrange
      let state = createComboState();
      for (let i = 0; i < 4; i++) {
        state = incrementCombo(state);
      }

      // Act
      const result = resetCombo(state);

      // Assert
      expect(result.sweepReady).toBe(false);
    });
  });

  describe('afterSweep', () => {
    it('スウィープ実行後にコンボとフラグがリセットされる', () => {
      // Arrange
      let state = createComboState();
      for (let i = 0; i < 4; i++) {
        state = incrementCombo(state);
      }

      // Act
      const result = afterSweep(state);

      // Assert
      expect(result.count).toBe(0);
      expect(result.sweepReady).toBe(false);
    });

    it('スウィープ未到達で実行するとエラーになる', () => {
      // Arrange
      const state = createComboState();

      // Act & Assert
      expect(() => afterSweep(state)).toThrow('[Contract]');
    });
  });

  describe('comboBonus', () => {
    it('コンボ 0 でボーナスは 0', () => {
      expect(comboBonus(0)).toBe(0);
    });

    it('コンボ 1 でボーナスは 0', () => {
      expect(comboBonus(1)).toBe(0);
    });

    it('コンボ 2 でボーナスは 50', () => {
      expect(comboBonus(2)).toBe(50);
    });

    it('コンボ 5 でボーナスは 200', () => {
      expect(comboBonus(5)).toBe(200);
    });

    it('負のコンボ数はエラーになる', () => {
      expect(() => comboBonus(-1)).toThrow('[Contract]');
    });
  });
});
