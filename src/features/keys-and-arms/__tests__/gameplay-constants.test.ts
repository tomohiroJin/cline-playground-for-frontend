/**
 * GAMEPLAY 定数のテスト
 * マジックナンバーが正しい値で定義されていることを保証
 */
import {
  HIT_STOP,
  TRANSITION_TOTAL,
  TRANSITION_MID,
  VICTORY_TIMER,
  BOSS_VICTORY_TIMER,
  BEAT_PULSE_DURATION,
  HURT_FLASH_DURATION,
  SHAKE_DURATION,
  SHIELD_KILL_INTERVAL,
  BOSS_ARM_COUNT,
  ARM_MAX_STAGE,
  COMBO_BONUS_POINTS,
} from '../constants';

describe('GAMEPLAY 定数', () => {
  describe('ヒットストップ', () => {
    it('LIGHT が 2 フレーム', () => {
      expect(HIT_STOP.LIGHT).toBe(2);
    });
    it('MEDIUM が 3 フレーム', () => {
      expect(HIT_STOP.MEDIUM).toBe(3);
    });
    it('HEAVY が 4 フレーム', () => {
      expect(HIT_STOP.HEAVY).toBe(4);
    });
  });

  describe('トランジション', () => {
    it('総フレーム数が 56', () => {
      expect(TRANSITION_TOTAL).toBe(56);
    });
    it('中間点が総フレーム数の半分', () => {
      expect(TRANSITION_MID).toBe(TRANSITION_TOTAL / 2);
    });
  });

  describe('勝利タイマー', () => {
    it('洞窟・草原は 120 フレーム', () => {
      expect(VICTORY_TIMER).toBe(120);
    });
    it('ボスは 150 フレーム', () => {
      expect(BOSS_VICTORY_TIMER).toBe(150);
    });
  });

  describe('エフェクト', () => {
    it('ビートパルスが 6 フレーム', () => {
      expect(BEAT_PULSE_DURATION).toBe(6);
    });
    it('ダメージフラッシュが 10 フレーム', () => {
      expect(HURT_FLASH_DURATION).toBe(10);
    });
    it('画面振動が 8 フレーム', () => {
      expect(SHAKE_DURATION).toBe(8);
    });
  });

  describe('ゲームバランス', () => {
    it('シールド獲得間隔が 5 キル', () => {
      expect(SHIELD_KILL_INTERVAL).toBe(5);
    });
    it('ボスの腕・台座が 6 本', () => {
      expect(BOSS_ARM_COUNT).toBe(6);
    });
    it('腕の最大段階が 6', () => {
      expect(ARM_MAX_STAGE).toBe(6);
    });
    it('コンボボーナスが 50 ポイント単位', () => {
      expect(COMBO_BONUS_POINTS).toBe(50);
    });
  });
});
