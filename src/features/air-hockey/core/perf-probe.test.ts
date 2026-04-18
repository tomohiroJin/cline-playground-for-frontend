/**
 * PerfProbe のテスト
 *
 * - section ごとの begin/end を計測
 * - commit でサンプルに push
 * - snapshot で p50/p95/p99 / fps を取得
 * - reset でサンプル配列をクリア
 */
import { PerfProbe } from './perf-probe';

describe('PerfProbe', () => {
  let probe: PerfProbe;
  let now: number;

  beforeEach(() => {
    probe = new PerfProbe();
    now = 1000;
    jest.spyOn(performance, 'now').mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('begin/end/commit', () => {
    it('begin → end で区間時間を記録する', () => {
      probe.begin('physics');
      now += 5;
      probe.end('physics');
      probe.commit();

      const snap = probe.snapshot();
      expect(snap.sampleCount).toBe(1);
      expect(snap.p50.physics).toBe(5);
    });

    it('複数セクションを並列計測', () => {
      probe.begin('physics');
      now += 3;
      probe.end('physics');
      probe.begin('ai');
      now += 2;
      probe.end('ai');
      probe.begin('render');
      now += 8;
      probe.end('render');
      probe.commit();

      const snap = probe.snapshot();
      expect(snap.p50.physics).toBe(3);
      expect(snap.p50.ai).toBe(2);
      expect(snap.p50.render).toBe(8);
    });

    it('commit 前は sampleCount が 0', () => {
      probe.begin('physics');
      probe.end('physics');
      expect(probe.snapshot().sampleCount).toBe(0);
    });
  });

  describe('snapshot 計算', () => {
    it('複数サンプルの p50/p95/p99 を計算する', () => {
      for (let i = 1; i <= 100; i++) {
        probe.begin('physics');
        now += i;
        probe.end('physics');
        probe.commit();
      }
      const snap = probe.snapshot();
      expect(snap.sampleCount).toBe(100);
      // ソート済みなので p50 は 50 (インデックス 49 の値)、p95 は 95、p99 は 99
      expect(snap.p50.physics).toBeGreaterThanOrEqual(49);
      expect(snap.p50.physics).toBeLessThanOrEqual(51);
      expect(snap.p95.physics).toBeGreaterThanOrEqual(94);
      expect(snap.p99.physics).toBeGreaterThanOrEqual(98);
    });

    it('fps はサンプル数と時間レンジから算出', () => {
      const start = now;
      for (let i = 0; i < 60; i++) {
        probe.begin('physics');
        now += 16; // 60fps 相当（1 フレーム 16.67ms 近似）
        probe.end('physics');
        probe.commit();
      }
      const snap = probe.snapshot();
      // 60 サンプル × 16ms = 960ms 経過 → 約 62.5fps
      expect(snap.fps).toBeGreaterThanOrEqual(50);
      expect(snap.fps).toBeLessThanOrEqual(70);
    });

    it('devicePixelRatio を取得する', () => {
      Object.defineProperty(window, 'devicePixelRatio', { value: 2.0, configurable: true });
      const snap = probe.snapshot();
      expect(snap.devicePixelRatio).toBe(2.0);
    });
  });

  describe('reset', () => {
    it('reset でサンプル配列がクリアされる', () => {
      probe.begin('physics');
      now += 5;
      probe.end('physics');
      probe.commit();
      probe.reset();
      expect(probe.snapshot().sampleCount).toBe(0);
    });
  });

  describe('longtask observer', () => {
    it('attachLongTaskObserver を呼べる（PerformanceObserver 未対応環境でも落ちない）', () => {
      expect(() => probe.attachLongTaskObserver()).not.toThrow();
    });
  });
});
