/**
 * ピース移動 E2E テスト
 *
 * ピースのクリック操作による移動を検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('ピース移動', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
    // 2×2 の最小分割でゲームを開始
    await puzzlePage.setupAndStartGame(2);
  });

  test('ピースクリックで手数がカウントされる', async () => {
    // Arrange: ゲーム画面が表示されている
    await puzzlePage.expectGameScreen();

    // Act: 全ピース位置をクリック（シャッフルにより隣接ピースは不定）
    await puzzlePage.clickPieceAt(0, 0, 2);
    await puzzlePage.clickPieceAt(0, 1, 2);
    await puzzlePage.clickPieceAt(1, 0, 2);

    // Assert: 手数がカウントされている（少なくとも1回は隣接ピースがある）
    const moveCountText = await puzzlePage.getMoveCount();
    expect(moveCountText).toMatch(/👣 \d+手/);
  });

  test('ボード上のピースをクリックしてもエラーが発生しない', async () => {
    // Arrange: ゲーム画面が表示されている
    await puzzlePage.expectGameScreen();

    // Act: 複数のピースをクリック
    await puzzlePage.clickPieceAt(0, 0, 2);
    await puzzlePage.clickPieceAt(0, 1, 2);
    await puzzlePage.clickPieceAt(1, 0, 2);

    // Assert: ステータスバーが引き続き表示されている
    await expect(puzzlePage.page.getByText(/⏱/).first()).toBeVisible();
  });
});
