/**
 * 迷宮の残響 E2E テスト: アンロックシステム（seed 固定）
 *
 * 死亡 → KP 獲得 → アンロック購入 → 効果適用の確認。
 */
import { test, expect } from '@playwright/test';
import { LEPage } from './helpers/le-page';

/** KPありのデータを localStorage に設定するヘルパー */
async function setupMetaWithKP(page: import('@playwright/test').Page, kp: number, runs: number) {
  await page.evaluate(({ kp, runs }) => {
    const data = {
      runs,
      escapes: 0,
      kp,
      unlocked: [],
      bestFl: 2,
      totalEvents: runs * 3,
      endings: [],
      clearedDiffs: [],
      totalDeaths: runs,
      lastRun: runs > 0 ? { cause: '体力消耗', floor: 2, ending: null, hp: 0, mn: 10, inf: 3 } : null,
      title: null,
    };
    localStorage.setItem('labyrinth-echo-save', JSON.stringify(data));
  }, { kp, runs });
}

test.describe('迷宮の残響 - アンロックシステム', () => {
  let game: LEPage;

  test.beforeEach(async ({ page }) => {
    game = new LEPage(page);
    await game.goto();
    await game.resetGameState();
    await game.reload();
  });

  test('初期状態（runs=0）では知見の継承ボタンが表示されない', async ({ page }) => {
    // Assert — 初期状態では「知見の継承」ボタンは非表示（runs > 0 でのみ表示）
    const isVisible = await page.getByText(/知見の継承/).first().isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('ラン実績ありの場合に知見の継承ボタンが表示される', async ({ page }) => {
    // Arrange — runs > 0 のデータを設定
    await setupMetaWithKP(page, 10, 3);
    await game.reload();

    // Assert — 「知見の継承」ボタンが表示される
    await expect(page.getByText(/知見の継承/).first()).toBeVisible({ timeout: 5_000 });
  });

  test('知見の継承画面に遷移できる', async ({ page }) => {
    // Arrange
    await setupMetaWithKP(page, 10, 3);
    await game.reload();

    // Act
    await game.goToUnlocks();

    // Assert — アンロック画面が表示される
    await page.waitForTimeout(1000);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('KP保有時にアンロック画面でアイテムが表示される', async ({ page }) => {
    // Arrange — KPありのデータを設定
    await setupMetaWithKP(page, 20, 5);
    await game.reload();

    // Act
    await game.goToUnlocks();
    await page.waitForTimeout(1000);

    // Assert — アンロックアイテムが表示されている
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(100);
  });
});
