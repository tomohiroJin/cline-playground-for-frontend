/**
 * Air Hockey パフォーマンス計測 E2E（S9-C1-3）
 *
 * 手動実行: `npm run test:e2e:perf`
 * CI スキップ前提（実機プレイ + 実測が必要）。
 *
 * 仕様: .docs/ah-20260419-01/spec.md S9-C1-4
 * - `?perf=1` で PerfProbe を有効化
 * - window.__ahPerfSnapshot でメトリクスを expose
 * - p50/p95/p99 / TBT / DPR を取得
 */
import { test, expect, type Page } from '@playwright/test';

type PerfSample = {
  physics: number;
  ai: number;
  render: number;
  total: number;
};

type PerfSnapshot = {
  fps: number;
  p50: PerfSample;
  p95: PerfSample;
  p99: PerfSample;
  sampleCount: number;
  tbt: number;
  longTaskCount: number;
  heapUsed?: number;
  devicePixelRatio: number;
};

async function waitForGameLoop(page: Page, durationSec: number): Promise<void> {
  await page.waitForTimeout(durationSec * 1000);
}

async function getPerfSnapshot(page: Page): Promise<PerfSnapshot | null> {
  return await page.evaluate(() => {
    const snap = (window as unknown as { __ahPerfSnapshot?: PerfSnapshot }).__ahPerfSnapshot;
    return snap ?? null;
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('Air Hockey パフォーマンス計測', () => {
  test.beforeEach(async ({ page }) => {
    // perf モードで起動
    await page.goto('/air-hockey?perf=1');
  });

  test('1v1 Original で 10 秒計測（spot-check）', async ({ page }) => {
    // TitleScreen → フリー対戦フローの最短到達（data-testid 経由推奨）
    // 実装では計測開始前にゲーム画面に到達する必要がある
    // ここでは仕様のハーネス骨格のみ提供
    await waitForGameLoop(page, 10);
    const snap = await getPerfSnapshot(page);
    // Game がまだ起動していない場合は null が返るのでスキップ
    test.skip(snap === null, 'ゲーム未起動のためスキップ（手動操作で到達必要）');
    if (snap) {
      // eslint-disable-next-line no-console
      console.log('perf-1v1-original', JSON.stringify(snap, null, 2));
      expect(snap.sampleCount).toBeGreaterThan(30);
    }
  });

  test('2v2 Original で 10 秒計測（spot-check）', async ({ page }) => {
    await waitForGameLoop(page, 10);
    const snap = await getPerfSnapshot(page);
    test.skip(snap === null, 'ゲーム未起動のためスキップ（手動操作で到達必要）');
    if (snap) {
      // eslint-disable-next-line no-console
      console.log('perf-2v2-original', JSON.stringify(snap, null, 2));
      expect(snap.sampleCount).toBeGreaterThan(30);
    }
  });

  test('perf スナップショットが仕様通りの形状で返る', async ({ page }) => {
    await waitForGameLoop(page, 5);
    const snap = await getPerfSnapshot(page);
    test.skip(snap === null, 'ゲーム未起動のためスキップ');
    if (snap) {
      expect(snap).toMatchObject({
        fps: expect.any(Number),
        p50: expect.objectContaining({ total: expect.any(Number) }),
        p95: expect.objectContaining({ total: expect.any(Number) }),
        p99: expect.objectContaining({ total: expect.any(Number) }),
        tbt: expect.any(Number),
        longTaskCount: expect.any(Number),
        devicePixelRatio: expect.any(Number),
      });
    }
  });
});
