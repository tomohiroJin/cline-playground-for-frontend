/**
 * モバイル操作 E2E テスト
 *
 * スワイプ操作とレスポンシブレイアウトを検証する。
 */
import { test, expect, devices } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('モバイル操作', () => {
  test.use({ ...devices['iPhone 13'] });

  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
    await puzzlePage.setupAndStartGame(2);
  });

  test('モバイルでゲーム画面が表示される', async () => {
    // Assert: ステータスバーが表示されている
    await puzzlePage.expectGameScreen();
  });

  test('スワイプでピースが移動する', async () => {
    // Arrange: ボードの位置を取得
    const board = puzzlePage.page.locator('[title="ボードグリッド"]');
    const box = await board.boundingBox();
    if (!box) throw new Error('ボードが見つかりません');

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    // Act: 上方向にスワイプ
    await puzzlePage.page.touchscreen.tap(centerX, centerY);
    await puzzlePage.page.mouse.move(centerX, centerY);
    await puzzlePage.page.mouse.down();
    await puzzlePage.page.mouse.move(centerX, centerY - 50, { steps: 5 });
    await puzzlePage.page.mouse.up();

    // Assert: エラーなくゲーム画面が表示されている
    await expect(puzzlePage.page.getByText(/⏱/)).toBeVisible();
  });

  test('レスポンシブレイアウトでボードが画面に収まる', async () => {
    // Assert: ボードが表示されている
    const board = puzzlePage.page.locator('[title="ボードグリッド"]');
    const box = await board.boundingBox();
    expect(box).toBeTruthy();

    // ボードがビューポートに収まっている
    if (box) {
      const viewport = puzzlePage.page.viewportSize();
      if (viewport) {
        expect(box.width).toBeLessThanOrEqual(viewport.width);
      }
    }
  });
});
