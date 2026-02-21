import {
  createHighlightTracker,
  checkDriftBonus,
  checkHeatBoost,
  checkNearMiss,
  checkOvertake,
  checkFastestLap,
  checkPhotoFinish,
  getHighlightSummary,
} from '../highlight';
import type { DriftState, HeatState } from '../types';

// ドリフト状態のヘルパー生成関数
const makeDrift = (overrides: Partial<DriftState> = {}): DriftState => ({
  active: false,
  duration: 0,
  slipAngle: 0,
  boostRemaining: 0,
  boostPower: 0,
  ...overrides,
});

// HEAT 状態のヘルパー生成関数
const makeHeat = (overrides: Partial<HeatState> = {}): HeatState => ({
  gauge: 0,
  boostRemaining: 0,
  boostPower: 0,
  cooldown: 0,
  ...overrides,
});

describe('Highlight モジュール', () => {
  describe('createHighlightTracker', () => {
    test('初期状態が正しい値を持つ', () => {
      const tracker = createHighlightTracker();
      expect(tracker.events).toEqual([]);
      expect(tracker.nearMissTime).toBe(0);
      expect(tracker.fastestLapTime).toBe(Infinity);
      expect(tracker.lastPositions).toEqual([0, 0]);
      expect(tracker.lastHeatGauge).toEqual([0, 0]);
      expect(tracker.lastDriftActive).toEqual([false, false]);
    });
  });

  describe('checkDriftBonus', () => {
    test('ドリフト終了かつ duration>=1.5s でイベントを返す', () => {
      // 前フレームでドリフト中だった状態を設定
      const tracker = { ...createHighlightTracker(), lastDriftActive: [true, false] };
      const drift = makeDrift({ active: false, duration: 2.0 });
      const { event } = checkDriftBonus(tracker, drift, 0, 1, 5000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('drift_bonus');
      expect(event!.score).toBe(Math.floor(2.0 * 100));
    });

    test('duration<1.5s の場合はイベントなし', () => {
      const tracker = { ...createHighlightTracker(), lastDriftActive: [true, false] };
      const drift = makeDrift({ active: false, duration: 1.0 });
      const { event } = checkDriftBonus(tracker, drift, 0, 1, 5000);
      expect(event).toBeNull();
    });

    test('ドリフト継続中はイベントなし', () => {
      const tracker = { ...createHighlightTracker(), lastDriftActive: [true, false] };
      const drift = makeDrift({ active: true, duration: 3.0 });
      const { event } = checkDriftBonus(tracker, drift, 0, 1, 5000);
      expect(event).toBeNull();
    });
  });

  describe('checkHeatBoost', () => {
    test('ゲージ 0.95→<0.1 かつブースト残量>0 でイベントを返す', () => {
      const tracker = { ...createHighlightTracker(), lastHeatGauge: [0.98, 0] };
      const heat = makeHeat({ gauge: 0.05, boostRemaining: 2.0 });
      const { event } = checkHeatBoost(tracker, heat, 0, 1, 3000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('heat_boost');
      expect(event!.score).toBe(150);
    });

    test('条件を満たさない場合はイベントなし', () => {
      const tracker = { ...createHighlightTracker(), lastHeatGauge: [0.5, 0] };
      const heat = makeHeat({ gauge: 0.6, boostRemaining: 0 });
      const { event } = checkHeatBoost(tracker, heat, 0, 1, 3000);
      expect(event).toBeNull();
    });
  });

  describe('checkNearMiss', () => {
    test('壁に近い場合に nearMissTime が蓄積される', () => {
      const tracker = createHighlightTracker();
      // wallDist > trackWidth - 10 → ニアミスゾーン
      const { tracker: t1 } = checkNearMiss(tracker, 95, 100, 0.5, 0, 1, 1000);
      expect(t1.nearMissTime).toBeCloseTo(0.5);
      const { tracker: t2 } = checkNearMiss(t1, 96, 100, 0.6, 0, 1, 1500);
      expect(t2.nearMissTime).toBeCloseTo(1.1);
    });

    test('壁から離れた時に nearMissTime>=1.5s でイベントを返す', () => {
      const tracker = { ...createHighlightTracker(), nearMissTime: 2.0 };
      // wallDist <= trackWidth - 10 → ニアミスゾーン外
      const { event } = checkNearMiss(tracker, 80, 100, 0.016, 0, 1, 5000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('near_miss');
      expect(event!.score).toBe(Math.floor(2.0 * 200));
    });

    test('壁から離れた時に nearMissTime<1.5s ではリセットのみ', () => {
      const tracker = { ...createHighlightTracker(), nearMissTime: 1.0 };
      const { tracker: updated, event } = checkNearMiss(tracker, 80, 100, 0.016, 0, 1, 5000);
      expect(event).toBeNull();
      expect(updated.nearMissTime).toBe(0);
    });
  });

  describe('checkOvertake', () => {
    test('順位が逆転した場合にイベントを返す', () => {
      // プレイヤー0 が後方→前方へ
      const tracker = { ...createHighlightTracker(), lastPositions: [10, 20] };
      const { event } = checkOvertake(tracker, [25, 20], 0, 2, 8000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('overtake');
      expect(event!.score).toBe(300);
    });

    test('順位変動がない場合はイベントなし', () => {
      const tracker = { ...createHighlightTracker(), lastPositions: [20, 10] };
      const { event } = checkOvertake(tracker, [25, 15], 0, 2, 8000);
      expect(event).toBeNull();
    });
  });

  describe('checkFastestLap', () => {
    test('最速ラップを更新した場合にイベントを返す', () => {
      const tracker = createHighlightTracker();
      const { tracker: updated, event } = checkFastestLap(tracker, 30000, 0, 1, 30000);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('fastest_lap');
      expect(event!.score).toBe(200);
      expect(updated.fastestLapTime).toBe(30000);
    });

    test('最速ラップを更新しない場合はイベントなし', () => {
      const tracker = { ...createHighlightTracker(), fastestLapTime: 25000 };
      const { event } = checkFastestLap(tracker, 30000, 0, 2, 60000);
      expect(event).toBeNull();
    });
  });

  describe('checkPhotoFinish', () => {
    test('タイム差<500ms でイベントを返す', () => {
      const tracker = createHighlightTracker();
      const { event } = checkPhotoFinish(tracker, [60000, 60300], 3, 60300);
      expect(event).not.toBeNull();
      expect(event!.type).toBe('photo_finish');
      expect(event!.score).toBe(500);
    });

    test('タイム差>=500ms ではイベントなし', () => {
      const tracker = createHighlightTracker();
      const { event } = checkPhotoFinish(tracker, [60000, 61000], 3, 61000);
      expect(event).toBeNull();
    });

    test('フィニッシュタイムが2人未満の場合はイベントなし', () => {
      const tracker = createHighlightTracker();
      const { event } = checkPhotoFinish(tracker, [60000], 3, 60000);
      expect(event).toBeNull();
    });
  });

  describe('getHighlightSummary', () => {
    test('イベントをタイプごとにグループ化して返す', () => {
      const tracker = createHighlightTracker();
      tracker.events.push(
        { type: 'drift_bonus', player: 0, lap: 1, time: 1000, score: 200, message: '' },
        { type: 'drift_bonus', player: 1, lap: 2, time: 2000, score: 150, message: '' },
        { type: 'overtake', player: 0, lap: 2, time: 3000, score: 300, message: '' },
      );
      const summary = getHighlightSummary(tracker);
      expect(summary).toHaveLength(2);
      const drift = summary.find((s) => s.type === 'drift_bonus');
      expect(drift).toEqual({ type: 'drift_bonus', count: 2, totalScore: 350 });
      const overtake = summary.find((s) => s.type === 'overtake');
      expect(overtake).toEqual({ type: 'overtake', count: 1, totalScore: 300 });
    });

    test('イベントが空の場合は空配列を返す', () => {
      const tracker = createHighlightTracker();
      expect(getHighlightSummary(tracker)).toEqual([]);
    });
  });
});
