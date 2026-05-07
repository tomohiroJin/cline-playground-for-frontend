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

    test('フリー対戦キャラ選択画面で横スクロールなし + スクショ', async ({ page }) => {
      // `?e2e=1` で Transition とカウントダウンを短縮（flaky 対策）
      await page.goto('/air-hockey?e2e=1');
      await stabilize(page);
      await page.getByTestId('btn-free-battle').click();
      await expect(page.getByTestId('btn-free-battle-confirm')).toBeVisible({ timeout: 5000 });
      await stabilize(page);
      await assertNoHorizontalOverflow(page);
      await expect(page).toHaveScreenshot(`free-char-select-${vp.name}.png`, {
        maxDiffPixelRatio: 0.01,
      });
    });

    test('ゲーム画面（Canvas + Scoreboard）で横スクロールなし + スクショ', async ({ page }) => {
      // `?e2e=1` でカウントダウン 50ms → スクショ取得可能
      await page.goto('/air-hockey?e2e=1');
      await stabilize(page);
      await page.getByTestId('btn-free-battle').click();
      await expect(page.getByTestId('btn-free-battle-confirm')).toBeVisible({ timeout: 5000 });
      await page.getByTestId('btn-free-battle-confirm').click();
      await expect(page.getByTestId('air-hockey-canvas')).toBeVisible({ timeout: 10000 });
      // カウントダウン完了を待機（e2e モードでは 100ms で終了）
      await page.waitForTimeout(300);
      await stabilize(page);
      await assertNoHorizontalOverflow(page);
      // Canvas のコンテンツは毎フレーム変化するため、レイアウト確認中心で許容を緩める
      await expect(page).toHaveScreenshot(`game-${vp.name}.png`, {
        maxDiffPixelRatio: 0.3,
      });
    });

    test('ResultScreen 到達確認（試合完了まで約 20 秒）', async ({ page }) => {
      // ResultScreen の自動到達は実試合の完了が必要で時間コストが高い。
      // `?e2e=1` + 意図的な失点フローを追加するまで保留
      test.fixme(true, 'ResultScreen の自動到達は追加の e2e モード拡張が必要');
      await page.goto('/air-hockey?e2e=1');
      await stabilize(page);
      await assertNoHorizontalOverflow(page);
    });
  });
}
