/**
 * Air Hockey パフォーマンス計測 E2E（S9-C1-3）
 *
 * 手動実行: `npm run test:e2e:perf`
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

/**
 * フリー対戦フロー経由でゲーム画面に到達（Codex P1-3 対応: 実到達型）
 *
 * `?e2e=1` は Transition / カウントダウン演出を短縮するためのフラグで、
 * これが無いと初回 Transition の演出により btn-free-battle 表示が遅延する。
 */
async function navigateToGame(page: Page): Promise<void> {
  await page.goto('/air-hockey?e2e=1&perf=1');
  // フリー対戦ボタン
  await expect(page.getByTestId('btn-free-battle')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('btn-free-battle').click();
  // キャラ選択 → 対戦開始
  await expect(page.getByTestId('btn-free-battle-confirm')).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('btn-free-battle-confirm').click();
  // Canvas が出現するまで待つ（ゲーム画面到達確認）
  await expect(page.getByTestId('air-hockey-canvas')).toBeVisible({ timeout: 10_000 });
}

async function getPerfSnapshot(page: Page): Promise<PerfSnapshot | null> {
  return await page.evaluate(() => {
    const snap = (window as unknown as { __ahPerfSnapshot?: PerfSnapshot }).__ahPerfSnapshot;
    return snap ?? null;
  });
}

test.describe.configure({ mode: 'serial' });

test.describe('Air Hockey パフォーマンス計測', () => {
  test('フリー対戦で 10 秒走らせて PerfProbe スナップショットを取得', async ({ page }) => {
    await navigateToGame(page);

    // 10 秒ゲームループを走らせる（カウントダウン 3 秒 + プレイ 7 秒）
    await page.waitForTimeout(10_000);

    const snap = await getPerfSnapshot(page);
    expect(snap).not.toBeNull();
    if (!snap) return;

    // eslint-disable-next-line no-console
    console.log('perf-free-battle:', JSON.stringify(snap, null, 2));
    // サンプル数は 60fps × 10 秒 ≒ 600 だが、カウントダウン除外で > 30 を確認
    expect(snap.sampleCount).toBeGreaterThan(30);
  });

  test('スナップショット形状が仕様通り', async ({ page }) => {
    await navigateToGame(page);
    await page.waitForTimeout(5_000);
    const snap = await getPerfSnapshot(page);
    expect(snap).not.toBeNull();
    if (!snap) return;

    expect(snap).toMatchObject({
      fps: expect.any(Number),
      p50: expect.objectContaining({
        physics: expect.any(Number),
        ai: expect.any(Number),
        render: expect.any(Number),
        total: expect.any(Number),
      }),
      p95: expect.objectContaining({ total: expect.any(Number) }),
      p99: expect.objectContaining({ total: expect.any(Number) }),
      tbt: expect.any(Number),
      longTaskCount: expect.any(Number),
      devicePixelRatio: expect.any(Number),
    });
  });
});
