/**
 * コンボ段階定数のテスト
 */
import { COLORS } from '../constants';
import { getComboColor } from '../combo-color';
import {
  COMBO_STAGES,
  getComboStage,
  ComboStage,
} from '../combo-color';

describe('コンボ段階定数', () => {
  // ── COMBO_STAGES ────────────────────────────────────

  describe('COMBO_STAGES - 4段階の定義', () => {
    it('4段階が定義されている', () => {
      expect(COMBO_STAGES).toHaveLength(4);
    });

    it('各段階に id, label, color, minCombo プロパティがある', () => {
      COMBO_STAGES.forEach((stage: ComboStage) => {
        expect(stage).toHaveProperty('id');
        expect(stage).toHaveProperty('label');
        expect(stage).toHaveProperty('color');
        expect(stage).toHaveProperty('minCombo');
      });
    });

    it('fire, lightning, rainbow, legendary の順で定義されている', () => {
      const ids = COMBO_STAGES.map((s: ComboStage) => s.id);
      expect(ids).toEqual(['fire', 'lightning', 'rainbow', 'legendary']);
    });

    it('各段階のラベルが正しい', () => {
      const labels = COMBO_STAGES.map((s: ComboStage) => s.label);
      expect(labels).toEqual(['FIRE', 'LIGHTNING', 'RAINBOW', 'LEGENDARY']);
    });

    it('各段階の色が正しい', () => {
      // Arrange
      const expectedColors = [
        COLORS.orange,
        COLORS.purple,
        COLORS.cyan,
        COLORS.yellow,
      ];

      // Act
      const actualColors = COMBO_STAGES.map((s: ComboStage) => s.color);

      // Assert
      expect(actualColors).toEqual(expectedColors);
    });

    it('各段階の minCombo が正しい', () => {
      const minCombos = COMBO_STAGES.map((s: ComboStage) => s.minCombo);
      expect(minCombos).toEqual([2, 4, 6, 8]);
    });
  });

  // ── getComboStage ────────────────────────────────────

  describe('getComboStage - コンボ数に応じた段階を返す', () => {
    it('コンボ0は undefined を返す', () => {
      expect(getComboStage(0)).toBeUndefined();
    });

    it('コンボ1は undefined を返す', () => {
      expect(getComboStage(1)).toBeUndefined();
    });

    it('コンボ2は fire 段階を返す', () => {
      // Arrange & Act
      const stage = getComboStage(2);

      // Assert
      expect(stage?.id).toBe('fire');
    });

    it('コンボ3は fire 段階を返す', () => {
      expect(getComboStage(3)?.id).toBe('fire');
    });

    it('コンボ4は lightning 段階を返す', () => {
      expect(getComboStage(4)?.id).toBe('lightning');
    });

    it('コンボ5は lightning 段階を返す', () => {
      expect(getComboStage(5)?.id).toBe('lightning');
    });

    it('コンボ6は rainbow 段階を返す', () => {
      expect(getComboStage(6)?.id).toBe('rainbow');
    });

    it('コンボ7は rainbow 段階を返す', () => {
      expect(getComboStage(7)?.id).toBe('rainbow');
    });

    it('コンボ8は legendary 段階を返す', () => {
      expect(getComboStage(8)?.id).toBe('legendary');
    });

    it('コンボ10以上も legendary 段階を返す', () => {
      expect(getComboStage(10)?.id).toBe('legendary');
      expect(getComboStage(99)?.id).toBe('legendary');
    });
  });

  // ── getComboColor（既存関数の回帰テスト）────────────────

  describe('getComboColor - 既存関数が引き続き正しく動作する', () => {
    it('maxCombo 5以上は orange を返す', () => {
      expect(getComboColor(5)).toBe(COLORS.orange);
      expect(getComboColor(10)).toBe(COLORS.orange);
    });

    it('maxCombo 3-4 は yellow を返す', () => {
      expect(getComboColor(3)).toBe(COLORS.yellow);
      expect(getComboColor(4)).toBe(COLORS.yellow);
    });

    it('maxCombo 2以下は muted を返す', () => {
      expect(getComboColor(0)).toBe(COLORS.muted);
      expect(getComboColor(2)).toBe(COLORS.muted);
    });
  });
});
