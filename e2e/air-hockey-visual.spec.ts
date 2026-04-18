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

for (const vp of VIEWPORTS) {
  test.describe(`@${vp.name}`, () => {
    test.use({
      viewport: vp.viewport,
      reducedMotion: 'reduce',
    });

    test('TitleScreen 全体が視認可能', async ({ page }) => {
      await page.goto('/air-hockey');
      await stabilize(page);
      // GameTitle が表示されていることを確認（スモーク）
      await expect(page.getByRole('heading', { name: /Air Hockey/i })).toBeVisible();
      // スクリーンショット比較（ベースラインは `--update-snapshots` で生成）
      await expect(page).toHaveScreenshot(`title-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });
  });
}
