import {
  initDriftState,
  startDrift,
  updateDrift,
  endDrift,
  cancelDrift,
  getDriftBoost,
  getDriftTurnRate,
  getDriftSpeedRetain,
} from '../drift';
import { DRIFT, Config } from '../constants';

describe('Drift モジュール', () => {
  describe('initDriftState', () => {
    test('すべてのフィールドが初期値を持つ', () => {
      const state = initDriftState();
      expect(state.active).toBe(false);
      expect(state.duration).toBe(0);
      expect(state.slipAngle).toBe(0);
      expect(state.boostRemaining).toBe(0);
      expect(state.boostPower).toBe(0);
    });
  });

  describe('startDrift', () => {
    test('速度がMIN_SPEED未満の場合は変更なしで返す', () => {
      const state = initDriftState();
      const result = startDrift(state, DRIFT.MIN_SPEED - 0.1);
      expect(result.active).toBe(false);
    });

    test('速度がMIN_SPEED以上の場合はactive=trueに設定する', () => {
      const state = initDriftState();
      const result = startDrift(state, DRIFT.MIN_SPEED);
      expect(result.active).toBe(true);
      expect(result.duration).toBe(0);
      expect(result.slipAngle).toBe(0);
    });

    test('既にアクティブな場合は変更なしで返す', () => {
      const state = { ...initDriftState(), active: true, duration: 1.0 };
      const result = startDrift(state, 1.0);
      expect(result).toBe(state);
    });
  });

  describe('updateDrift', () => {
    test('非アクティブ時にブースト残量があれば減衰する', () => {
      const state = { ...initDriftState(), boostRemaining: 0.3, boostPower: 0.2 };
      const result = updateDrift(state, 0, 1.0, 0.1);
      expect(result.boostRemaining).toBeCloseTo(0.2);
      expect(result.boostPower).toBe(0.2);
    });

    test('低速度の場合はドリフトを自動終了する', () => {
      const state = { ...initDriftState(), active: true, duration: 0.5 };
      const result = updateDrift(state, 0, 0.1, 0.016);
      expect(result.active).toBe(false);
    });

    test('ステアリング方向に応じてslipAngleが変化する', () => {
      const state = { ...initDriftState(), active: true };
      const resultRight = updateDrift(state, 1, 1.0, 0.1);
      expect(resultRight.slipAngle).toBeGreaterThan(0);

      const resultLeft = updateDrift(state, -1, 1.0, 0.1);
      expect(resultLeft.slipAngle).toBeLessThan(0);
    });

    test('ドリフト継続時間が増加する', () => {
      const state = { ...initDriftState(), active: true, duration: 0.5 };
      const result = updateDrift(state, 1, 1.0, 0.1);
      expect(result.duration).toBeCloseTo(0.6);
    });
  });

  describe('endDrift', () => {
    test('アクティブなドリフトを終了しブーストを設定する', () => {
      const state = { ...initDriftState(), active: true, duration: 1.0 };
      const result = endDrift(state);
      expect(result.active).toBe(false);
      expect(result.boostRemaining).toBe(DRIFT.BOOST_DURATION);
      expect(result.boostPower).toBeGreaterThan(0);
      expect(result.boostPower).toBeLessThanOrEqual(DRIFT.BOOST_MAX);
    });

    test('非アクティブの場合は変更なしで返す', () => {
      const state = initDriftState();
      const result = endDrift(state);
      expect(result).toBe(state);
    });
  });

  describe('cancelDrift', () => {
    test('ドリフトをキャンセルしブーストなしでリセットする', () => {
      const state = { ...initDriftState(), active: true, duration: 1.0, slipAngle: 0.3 };
      const result = cancelDrift(state);
      expect(result.active).toBe(false);
      expect(result.duration).toBe(0);
      expect(result.slipAngle).toBe(0);
      expect(result.boostRemaining).toBe(0);
      expect(result.boostPower).toBe(0);
    });

    test('非アクティブの場合は変更なしで返す', () => {
      const state = initDriftState();
      const result = cancelDrift(state);
      expect(result).toBe(state);
    });
  });

  describe('getDriftBoost', () => {
    test('boostRemainingが0以下の場合は0を返す', () => {
      const state = { ...initDriftState(), boostRemaining: 0, boostPower: 0.2 };
      expect(getDriftBoost(state)).toBe(0);
    });

    test('boostPower * 残量比率を返す', () => {
      const state = { ...initDriftState(), boostRemaining: DRIFT.BOOST_DURATION, boostPower: 0.2 };
      // 残量比率 = BOOST_DURATION / BOOST_DURATION = 1.0
      expect(getDriftBoost(state)).toBeCloseTo(0.2);
    });
  });

  describe('getDriftSpeedRetain', () => {
    test('DRIFT.SPEED_RETAINの定数値を返す', () => {
      expect(getDriftSpeedRetain()).toBe(DRIFT.SPEED_RETAIN);
    });
  });

  describe('getDriftTurnRate', () => {
    test('turnRate * ANGLE_MULTIPLIERの定数値を返す', () => {
      expect(getDriftTurnRate()).toBeCloseTo(Config.game.turnRate * DRIFT.ANGLE_MULTIPLIER);
    });
  });
});
