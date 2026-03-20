// ドリフト物理計算のテスト

import {
  createDriftState,
  startDrift,
  updateDrift,
  endDrift,
  cancelDrift,
  getDriftBoost,
  getDriftSpeedRetain,
} from '../../../domain/player/drift';
import { DRIFT } from '../../../domain/player/constants';

describe('drift', () => {
  describe('createDriftState', () => {
    it('すべてのフィールドが初期値を持つ', () => {
      const state = createDriftState();
      expect(state.active).toBe(false);
      expect(state.duration).toBe(0);
      expect(state.slipAngle).toBe(0);
      expect(state.boostRemaining).toBe(0);
      expect(state.boostPower).toBe(0);
    });
  });

  describe('startDrift', () => {
    it('速度が MIN_SPEED 未満の場合はドリフトが開始しない', () => {
      // Arrange
      const state = createDriftState();

      // Act
      const result = startDrift(state, DRIFT.MIN_SPEED - 0.1);

      // Assert
      expect(result.active).toBe(false);
    });

    it('速度が MIN_SPEED 以上の場合はドリフトが開始する', () => {
      // Arrange
      const state = createDriftState();

      // Act
      const result = startDrift(state, DRIFT.MIN_SPEED);

      // Assert
      expect(result.active).toBe(true);
      expect(result.duration).toBe(0);
      expect(result.slipAngle).toBe(0);
    });

    it('既にドリフト中の場合は状態が変わらない', () => {
      // Arrange
      const state = { ...createDriftState(), active: true, duration: 1.0 };

      // Act
      const result = startDrift(state, 1.0);

      // Assert
      expect(result).toBe(state);
    });
  });

  describe('updateDrift', () => {
    it('非アクティブ時にブースト残量があれば減衰する', () => {
      // Arrange
      const state = { ...createDriftState(), boostRemaining: 0.3, boostPower: 0.2 };

      // Act
      const result = updateDrift(state, 0, 1.0, 0.1);

      // Assert
      expect(result.boostRemaining).toBeCloseTo(0.2);
      expect(result.boostPower).toBe(0.2);
    });

    it('低速度の場合はドリフトを自動終了する', () => {
      // Arrange
      const state = { ...createDriftState(), active: true, duration: 0.5 };

      // Act
      const result = updateDrift(state, 0, 0.1, 0.016);

      // Assert
      expect(result.active).toBe(false);
    });

    it('ステアリング方向に応じて slipAngle が変化する', () => {
      // Arrange
      const state = { ...createDriftState(), active: true };

      // Act & Assert: 右ステアリング
      const resultRight = updateDrift(state, 1, 1.0, 0.1);
      expect(resultRight.slipAngle).toBeGreaterThan(0);

      // Act & Assert: 左ステアリング
      const resultLeft = updateDrift(state, -1, 1.0, 0.1);
      expect(resultLeft.slipAngle).toBeLessThan(0);
    });

    it('ドリフト継続時間が増加する', () => {
      // Arrange
      const state = { ...createDriftState(), active: true, duration: 0.5 };

      // Act
      const result = updateDrift(state, 1, 1.0, 0.1);

      // Assert
      expect(result.duration).toBeCloseTo(0.6);
    });

    it('dt が 0 以下の場合はアサーションエラーになる', () => {
      const state = { ...createDriftState(), active: true };
      expect(() => updateDrift(state, 0, 1.0, 0)).toThrow();
      expect(() => updateDrift(state, 0, 1.0, -1)).toThrow();
    });
  });

  describe('endDrift', () => {
    it('アクティブなドリフトを終了しブーストを設定する', () => {
      // Arrange
      const state = { ...createDriftState(), active: true, duration: 1.0 };

      // Act
      const result = endDrift(state);

      // Assert
      expect(result.active).toBe(false);
      expect(result.boostRemaining).toBe(DRIFT.BOOST_DURATION);
      expect(result.boostPower).toBeGreaterThan(0);
      expect(result.boostPower).toBeLessThanOrEqual(DRIFT.BOOST_MAX);
    });

    it('非アクティブの場合は変更なしで返す', () => {
      const state = createDriftState();
      const result = endDrift(state);
      expect(result).toBe(state);
    });
  });

  describe('cancelDrift', () => {
    it('ドリフトをキャンセルしブーストなしでリセットする', () => {
      // Arrange
      const state = { ...createDriftState(), active: true, duration: 1.0, slipAngle: 0.3 };

      // Act
      const result = cancelDrift(state);

      // Assert
      expect(result.active).toBe(false);
      expect(result.duration).toBe(0);
      expect(result.slipAngle).toBe(0);
      expect(result.boostRemaining).toBe(0);
      expect(result.boostPower).toBe(0);
    });

    it('非アクティブの場合は変更なしで返す', () => {
      const state = createDriftState();
      const result = cancelDrift(state);
      expect(result).toBe(state);
    });
  });

  describe('getDriftBoost', () => {
    it('boostRemaining が 0 以下の場合は 0 を返す', () => {
      const state = { ...createDriftState(), boostRemaining: 0, boostPower: 0.2 };
      expect(getDriftBoost(state)).toBe(0);
    });

    it('boostPower * 残量比率を返す', () => {
      const state = {
        ...createDriftState(),
        boostRemaining: DRIFT.BOOST_DURATION,
        boostPower: 0.2,
      };
      expect(getDriftBoost(state)).toBeCloseTo(0.2);
    });

    it('結果は常に 0 以上', () => {
      const state = { ...createDriftState(), boostRemaining: 0.001, boostPower: 0.1 };
      expect(getDriftBoost(state)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getDriftSpeedRetain', () => {
    it('SPEED_RETAIN 定数値を返す', () => {
      expect(getDriftSpeedRetain()).toBe(DRIFT.SPEED_RETAIN);
    });

    it('結果は (0, 1] の範囲内', () => {
      const result = getDriftSpeedRetain();
      expect(result).toBeGreaterThan(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });
});
