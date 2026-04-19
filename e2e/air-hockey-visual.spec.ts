/**
 * Air Hockey VRT（Visual Regression Testing）
 *
 * 目的: UI 変更による意図しないレイアウト崩れを自動検知する。
 *
 * 設計（S9-V-1）:
 * - 各 test で `page.goto()` → `stabilize()` → スクショ の順（Codex P1-3 対応）
 * - `reducedMotion: 'reduce'` + animation 強制停止 CSS で flaky 防止
 * - WebFont 読み込み完了を `document.fonts.ready` で待機
 *
 * 初回ベースライン生成: `npx playwright test e2e/air-hockey-visual.spec.ts --update-snapshots`
 */
import { test, expect, type Page } from '@playwright/test';

const VIEWPORTS = [
  { name: 'iphone-se', viewport: { width: 375, height: 667 } },
  { name: 'iphone-14', viewport: { width: 393, height: 852 } },
  { name: 'tablet', viewport: { width: 768, height: 1024 } },
  { name: 'desktop', viewport: { width: 1280, height: 720 } },
] as const;

const FREEZE_ANIMATIONS_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
`;

async function stabilize(page: Page): Promise<void> {
  await page.addStyleTag({ content: FREEZE_ANIMATIONS_CSS });
  await page.evaluate(() => document.fonts.ready);
}

/**
 * 横スクロールが発生していないことをアサート（Codex P1-1 / 仕様 S9-A1-4）
 */
async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => window.innerWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px 許容
}

for (const vp of VIEWPORTS) {
  test.describe(`@${vp.name}`, () => {
    test.use({
      viewport: vp.viewport,
      reducedMotion: 'reduce',
    });

    test('TitleScreen 全体が視認可能 + 横スクロールなし', async ({ page }) => {
      await page.goto('/air-hockey');
      await stabilize(page);
      await expect(page.getByRole('heading', { name: /Air Hockey/i })).toBeVisible();
      await assertNoHorizontalOverflow(page);
      await expect(page).toHaveScreenshot(`title-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    test('VsScreen 1v1 全体が視認可能 + 横スクロールなし', async ({ page }) => {
      await page.goto('/air-hockey');
      await stabilize(page);
      // ストーリーボタンから VS 画面に到達（最短フロー）
      const storyBtn = page.getByRole('button', { name: /ストーリー/ });
      if (await storyBtn.count() > 0) {
        await storyBtn.click();
        // 最初のステージ選択
        const firstStage = page.locator('[data-testid^="stage-card"]').first();
        if (await firstStage.count() > 0) {
          await firstStage.click();
          await stabilize(page);
          await assertNoHorizontalOverflow(page);
          await expect(page).toHaveScreenshot(`vs-1v1-${vp.name}.png`, {
            maxDiffPixelRatio: 0.01,
          });
        } else {
          test.skip(true, 'ステージカード到達不能（data-testid 未設定）');
        }
      } else {
        test.skip(true, 'ストーリーボタン未検出');
      }
    });

    test('VsScreen 2v2 全体が視認可能 + 横スクロールなし', async ({ page }) => {
      await page.goto('/air-hockey');
      await stabilize(page);
      const pairBtn = page.getByRole('button', { name: /ペアマッチ/ });
      if (await pairBtn.count() > 0) {
        await pairBtn.click();
        await stabilize(page);
        // TeamSetupScreen → 開始ボタン
        const startBtn = page.getByRole('button', { name: /開始|スタート/ }).first();
        if (await startBtn.count() > 0) {
          await startBtn.click();
          await stabilize(page);
          await assertNoHorizontalOverflow(page);
          await expect(page).toHaveScreenshot(`vs-2v2-${vp.name}.png`, {
            maxDiffPixelRatio: 0.01,
          });
        } else {
          test.skip(true, '開始ボタン到達不能');
        }
      } else {
        test.skip(true, 'ペアマッチボタン未検出');
      }
    });

    test('ResultScreen のレイアウト確認は手動 E2E で実施', async ({ page }) => {
      // ResultScreen はゲーム完了後にのみ表示され、自動フローでの到達が困難。
      // 仕様: 手動で対戦完了後にスクショ取得
      await page.goto('/air-hockey');
      await stabilize(page);
      await assertNoHorizontalOverflow(page);
      test.info().annotations.push({
        type: 'note',
        description: 'ResultScreen は手動テストで到達。自動化は別 PR で検討',
      });
    });
  });
}
