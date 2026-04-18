/**
 * パフォーマンス計測ユーティリティ（S9-C1）
 *
 * ゲームループの各セクション（物理・AI・描画）を begin/end で囲み、
 * サンプル蓄積 → p50/p95/p99 / FPS / TBT を算出する。
 *
 * 使い方:
 *   const probe = new PerfProbe();
 *   probe.attachLongTaskObserver();
 *   // フレームごとに:
 *   probe.begin('physics'); ... probe.end('physics');
 *   probe.begin('ai'); ... probe.end('ai');
 *   probe.begin('render'); ... probe.end('render');
 *   probe.commit();
 *   // 任意タイミングで:
 *   const snap = probe.snapshot();
 */

export type PerfSection = 'physics' | 'ai' | 'render' | 'total';

export type PerfSample = {
  physics: number;
  ai: number;
  render: number;
  total: number;
};

export type PerfSnapshot = {
  fps: number;
  p50: PerfSample;
  p95: PerfSample;
  p99: PerfSample;
  sampleCount: number;
  /** Total Blocking Time (ms) — PerformanceObserver で longtask を集計 */
  tbt: number;
  longTaskCount: number;
  /** Chrome のみ: performance.memory.usedJSHeapSize / 1024^2 (MB) */
  heapUsed?: number;
  devicePixelRatio: number;
};

const EMPTY_SAMPLE: PerfSample = { physics: 0, ai: 0, render: 0, total: 0 };

export class PerfProbe {
  private samples: PerfSample[] = [];
  private current: Partial<PerfSample> = {};
  private starts: Partial<Record<PerfSection, number>> = {};
  private firstSampleAt: number | null = null;
  private lastSampleAt: number | null = null;
  private tbtMs = 0;
  private longTaskCount = 0;
  private observer: PerformanceObserver | undefined;

  begin(section: PerfSection): void {
    this.starts[section] = performance.now();
  }

  end(section: PerfSection): void {
    const start = this.starts[section];
    if (start === undefined) return;
    const elapsed = performance.now() - start;
    this.current[section] = elapsed;
    this.starts[section] = undefined;
  }

  /** 現フレームのサンプルをコミット（samples 配列に push） */
  commit(): void {
    const sample: PerfSample = {
      physics: this.current.physics ?? 0,
      ai: this.current.ai ?? 0,
      render: this.current.render ?? 0,
      total: this.current.total ?? (
        (this.current.physics ?? 0) + (this.current.ai ?? 0) + (this.current.render ?? 0)
      ),
    };
    this.samples.push(sample);
    const now = performance.now();
    if (this.firstSampleAt === null) this.firstSampleAt = now;
    this.lastSampleAt = now;
    this.current = {};
  }

  /** 集計スナップショット */
  snapshot(): PerfSnapshot {
    const sampleCount = this.samples.length;
    if (sampleCount === 0) {
      return {
        fps: 0,
        p50: { ...EMPTY_SAMPLE },
        p95: { ...EMPTY_SAMPLE },
        p99: { ...EMPTY_SAMPLE },
        sampleCount: 0,
        tbt: this.tbtMs,
        longTaskCount: this.longTaskCount,
        heapUsed: this.readHeap(),
        devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      };
    }
    const sections: PerfSection[] = ['physics', 'ai', 'render', 'total'];
    const pct = (p: number): PerfSample => {
      const s: Partial<PerfSample> = {};
      for (const sec of sections) {
        const arr = this.samples.map(x => x[sec]).sort((a, b) => a - b);
        const idx = Math.min(arr.length - 1, Math.floor(arr.length * p));
        s[sec] = arr[idx];
      }
      return s as PerfSample;
    };
    const durationMs = (this.lastSampleAt ?? 0) - (this.firstSampleAt ?? 0);
    const fps = durationMs > 0 ? Math.round((sampleCount / durationMs) * 1000) : 0;
    return {
      fps,
      p50: pct(0.5),
      p95: pct(0.95),
      p99: pct(0.99),
      sampleCount,
      tbt: this.tbtMs,
      longTaskCount: this.longTaskCount,
      heapUsed: this.readHeap(),
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    };
  }

  reset(): void {
    this.samples = [];
    this.current = {};
    this.starts = {};
    this.firstSampleAt = null;
    this.lastSampleAt = null;
    this.tbtMs = 0;
    this.longTaskCount = 0;
  }

  /** PerformanceObserver で longtask を監視 → TBT 集計 */
  attachLongTaskObserver(): void {
    if (typeof window === 'undefined') return;
    if (typeof PerformanceObserver === 'undefined') return;
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTaskCount++;
          // TBT = Σ(duration - 50ms) for duration > 50ms
          const blocking = Math.max(0, entry.duration - 50);
          this.tbtMs += blocking;
        }
      });
      this.observer.observe({ type: 'longtask', buffered: true });
    } catch {
      // longtask 非対応ブラウザ（Safari 等）では無視
    }
  }

  detachLongTaskObserver(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private readHeap(): number | undefined {
    // Chrome 専用 API: performance.memory
    const perf = performance as unknown as { memory?: { usedJSHeapSize: number } };
    if (!perf.memory) return undefined;
    return Math.round(perf.memory.usedJSHeapSize / (1024 * 1024));
  }
}
