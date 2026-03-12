/**
 * 腕 AI のテスト
 */
import {
  createArmState,
  advanceArm,
  retreatArm,
  isArmAtStrike,
  isArmResting,
  startArmRest,
  tickArmRest,
  isCounterPossible,
  counterArm,
} from '../../domain/boss/arm-ai';

describe('boss/arm-ai', () => {
  describe('createArmState', () => {
    it('初期状態は stage 0 で休眠中', () => {
      const arm = createArmState(3, 5);
      expect(arm.stage).toBe(0);
      expect(arm.resting).toBe(true);
    });
  });

  describe('advanceArm', () => {
    it('ステージが 1 増加する', () => {
      const arm = { stage: 1, dir: 1, speed: 3, resting: false, restTimer: 0 };
      const result = advanceArm(arm);
      expect(result.stage).toBe(2);
    });

    it('ステージ 6 で上限に達する', () => {
      const arm = { stage: 5, dir: 1, speed: 3, resting: false, restTimer: 0 };
      const result = advanceArm(arm);
      expect(result.stage).toBe(6);
    });

    it('ステージ 6 を超えない', () => {
      const arm = { stage: 6, dir: 1, speed: 3, resting: false, restTimer: 0 };
      const result = advanceArm(arm);
      expect(result.stage).toBe(6);
    });
  });

  describe('retreatArm', () => {
    it('ステージが 1 減少する', () => {
      const arm = { stage: 4, dir: -1, speed: 3, resting: false, restTimer: 0 };
      const result = retreatArm(arm);
      expect(result.stage).toBe(3);
    });

    it('ステージ 0 を下回らない', () => {
      const arm = { stage: 0, dir: -1, speed: 3, resting: false, restTimer: 0 };
      const result = retreatArm(arm);
      expect(result.stage).toBe(0);
    });
  });

  describe('isArmAtStrike', () => {
    it('ステージ 6 で攻撃状態', () => {
      expect(isArmAtStrike(6)).toBe(true);
    });

    it('ステージ 5 以下は攻撃前', () => {
      expect(isArmAtStrike(5)).toBe(false);
    });
  });

  describe('isArmResting', () => {
    it('休眠フラグが true なら休眠中', () => {
      expect(isArmResting(true)).toBe(true);
    });

    it('休眠フラグが false なら活動中', () => {
      expect(isArmResting(false)).toBe(false);
    });
  });

  describe('startArmRest', () => {
    it('休眠状態に入る', () => {
      const arm = { stage: 0, dir: 1, speed: 3, resting: false, restTimer: 0 };
      const result = startArmRest(arm, 5);
      expect(result.resting).toBe(true);
      expect(result.restTimer).toBe(5);
    });
  });

  describe('tickArmRest', () => {
    it('休息タイマーが 1 減少する', () => {
      const arm = { stage: 0, dir: 1, speed: 3, resting: true, restTimer: 3 };
      const result = tickArmRest(arm);
      expect(result.restTimer).toBe(2);
    });

    it('タイマーが 0 になったら休眠解除', () => {
      const arm = { stage: 0, dir: 1, speed: 3, resting: true, restTimer: 1 };
      const result = tickArmRest(arm);
      expect(result.restTimer).toBe(0);
      expect(result.resting).toBe(false);
    });
  });

  describe('isCounterPossible', () => {
    it('ステージ 3 以上かつ活動中でカウンター可能', () => {
      expect(isCounterPossible(3, false)).toBe(true);
      expect(isCounterPossible(5, false)).toBe(true);
    });

    it('ステージ 2 以下ではカウンター不可', () => {
      expect(isCounterPossible(2, false)).toBe(false);
    });

    it('休眠中はカウンター不可', () => {
      expect(isCounterPossible(4, true)).toBe(false);
    });
  });

  describe('counterArm', () => {
    it('腕がステージ 0 にリセットされる', () => {
      const arm = { stage: 4, dir: 1, speed: 3, resting: false, restTimer: 0 };
      const result = counterArm(arm, 7);
      expect(result.stage).toBe(0);
      expect(result.resting).toBe(true);
      expect(result.restTimer).toBe(7);
    });
  });
});
