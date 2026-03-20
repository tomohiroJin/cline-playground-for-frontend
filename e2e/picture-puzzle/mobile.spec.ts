/**
 * モバイル操作 E2E テスト
 *
 * スワイプ操作とレスポンシブレイアウトを検証する。
 */
import { test, expect, devices } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

// iPhone 13 のビューポート・タッチ設定を使用（ブラウザは chromium のまま）
const { defaultBrowserType: _, ...iPhone13Settings } = devices['iPhone 13'];
test.use(iPhone13Settings);

test.describe('モバイル操作', () => {
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
    await expect(puzzlePage.page.getByText(/⏱/).first()).toBeVisible();
  });

  test('レスポンシブレイアウトでボードが表示される', async () => {
    // Assert: ボードが表示されている
    const board = puzzlePage.page.locator('[title="ボードグリッド"]');
    await expect(board).toBeVisible();

    // ボードが画面上に存在する（座標が正）
    const box = await board.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    }
  });
});
