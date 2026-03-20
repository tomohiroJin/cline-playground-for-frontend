// ハイライトイベント検出のテスト

import {
  detectDriftBonus,
  detectHeatBoost,
  detectNearMiss,
  detectOvertake,
  detectFastestLap,
  detectPhotoFinish,
} from '../../../domain/highlight/event-detector';
import { createTracker } from '../../../domain/highlight/highlight';
import type { DriftState, HeatState } from '../../../domain/player/types';

const makeDrift = (overrides: Partial<DriftState> = {}): DriftState => ({
  active: false, duration: 0, slipAngle: 0, boostRemaining: 0, boostPower: 0,
  ...overrides,
});

const makeHeat = (overrides: Partial<HeatState> = {}): HeatState => ({
  gauge: 0, boostRemaining: 0, boostPower: 0, cooldown: 0,
  ...overrides,
});

describe('event-detector', () => {
  describe('detectDriftBonus', () => {
    it('ドリフト終了かつ前フレームの duration>=1.5s でイベントを返す', () => {
      // Arrange: 前フレームでドリフト中、duration=2.0
      const tracker = {
        ...createTracker(),
        lastDriftActive: [true, false],
        lastDriftDuration: [2.0, 0],
      };
      // endDrift 後の状態: active=false, duration=0
      const drift = makeDrift({ active: false, duration: 0 });

      // Act
      const { event } = detectDriftBonus(tracker, drift, 0, 1, 5000);

      // Assert
      expect(event).not.toBeNull();
      expect(event!.type).toBe('drift_bonus');
      expect(event!.score).toBe(Math.floor(2.0 * 100));
    });

    it('前フレームの duration<1.5s の場合はイベントなし', () => {
      const tracker = {
        ...createTracker(),
        lastDriftActive: [true, false],
        lastDriftDuration: [1.0, 0],
      };
      const drift = makeDrift({ active: false, duration: 0 });
      const { event } = detectDriftBonus(tracker, drift, 0, 1, 5000);
      expect(event).toBeNull();
    });

    it('ドリフト継続中は duration を記録しイベントなし', () => {
      const tracker = createTracker();
      const drift = makeDrift({ active: true, duration: 3.0 });
      const { tracker: updated, event } = detectDriftBonus(tracker, drift, 0, 1, 5000);
      expect(event).toBeNull();
      expect(updated.lastDriftDuration[0]).toBe(3.0);
    });
  });

  describe('detectHeatBoost', () => {
    it('ゲージ 0.95→<0.1 かつブースト残量>0 でイベントを返す', () => {
      const tracker = { ...createTracker(), lastHeatGauge: [0.98, 0] };
      const heat = makeHeat({ gauge: 0.05, boostRemaining: 2.0 });
      const { event } = detectHeatBoost(tracker, heat, 0, 1, 3000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('heat_boost');
    });

    it('条件を満たさない場合はイベントなし', () => {
      const tracker = { ...createTracker(), lastHeatGauge: [0.5, 0] };
      const heat = makeHeat({ gauge: 0.6 });
      const { event } = detectHeatBoost(tracker, heat, 0, 1, 3000);
      expect(event).toBeNull();
    });
  });

  describe('detectNearMiss', () => {
    it('壁に近い状態が 1.5s 以上続いた後に離れるとイベントを返す', () => {
      const tracker = { ...createTracker(), nearMissTime: 2.0 };
      const { event } = detectNearMiss(tracker, 80, 100, 0.016, 0, 1, 5000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('near_miss');
    });

    it('壁に近い間は nearMissTime が蓄積される', () => {
      const tracker = createTracker();
      const { tracker: updated } = detectNearMiss(tracker, 95, 100, 0.5, 0, 1, 1000);
      expect(updated.nearMissTime).toBeCloseTo(0.5);
    });
  });

  describe('detectOvertake', () => {
    it('順位が逆転した場合にイベントを返す', () => {
      const tracker = { ...createTracker(), lastPositions: [10, 20] };
      const { event } = detectOvertake(tracker, [25, 20], 0, 2, 8000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('overtake');
    });

    it('順位変動がない場合はイベントなし', () => {
      const tracker = { ...createTracker(), lastPositions: [20, 10] };
      const { event } = detectOvertake(tracker, [25, 15], 0, 2, 8000);
      expect(event).toBeNull();
    });
  });

  describe('detectFastestLap', () => {
    it('最速ラップを更新した場合にイベントを返す', () => {
      const tracker = createTracker();
      const { event, tracker: updated } = detectFastestLap(tracker, 30000, 0, 1, 30000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('fastest_lap');
      expect(updated.fastestLapTime).toBe(30000);
    });

    it('最速ラップを更新しない場合はイベントなし', () => {
      const tracker = { ...createTracker(), fastestLapTime: 25000 };
      const { event } = detectFastestLap(tracker, 30000, 0, 2, 60000);
      expect(event).toBeNull();
    });
  });

  describe('detectPhotoFinish', () => {
    it('タイム差<500ms でイベントを返す', () => {
      const tracker = createTracker();
      const { event } = detectPhotoFinish(tracker, [60000, 60300], 3, 60300);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('photo_finish');
    });

    it('タイム差>=500ms ではイベントなし', () => {
      const tracker = createTracker();
      const { event } = detectPhotoFinish(tracker, [60000, 61000], 3, 61000);
      expect(event).toBeNull();
    });
  });
});
