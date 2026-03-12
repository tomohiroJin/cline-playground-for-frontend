/**
 * SHIFTER AI のテスト
 */
import {
  createShifterEnemy,
  shouldShifterMove,
  shiftLane,
} from '../../domain/enemies/shifter-behavior';

describe('enemies/shifter-behavior', () => {
  describe('createShifterEnemy', () => {
    it('shifter タイプで生成される', () => {
      const enemy = createShifterEnemy(1);
      expect(enemy.beh).toBe('shifter');
      expect(enemy.lane).toBe(1);
    });
  });

  describe('shouldShifterMove', () => {
    it('step 2 でレーン移動が可能', () => {
      expect(shouldShifterMove(2)).toBe(true);
    });

    it('step 2 以外ではレーン移動しない', () => {
      expect(shouldShifterMove(0)).toBe(false);
      expect(shouldShifterMove(1)).toBe(false);
      expect(shouldShifterMove(3)).toBe(false);
    });
  });

  describe('shiftLane', () => {
    it('レーン 0 から上に移動できない（0 のまま）', () => {
      expect(shiftLane(0, -1, 3)).toBe(0);
    });

    it('レーン 2 から下に移動できない（2 のまま）', () => {
      expect(shiftLane(2, 1, 3)).toBe(2);
    });

    it('レーン 1 から上に移動できる', () => {
      expect(shiftLane(1, -1, 3)).toBe(0);
    });

    it('レーン 1 から下に移動できる', () => {
      expect(shiftLane(1, 1, 3)).toBe(2);
    });

    it('方向 0 なら移動しない', () => {
      expect(shiftLane(1, 0, 3)).toBe(1);
    });
  });
});
