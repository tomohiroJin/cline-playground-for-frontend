/**
 * ヒントモード E2E テスト
 *
 * ヒントの表示/非表示の切り替えを検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('ヒントモード', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
    await puzzlePage.setupAndStartGame(2);
  });

  test('ヒント表示/非表示の切り替え', async () => {
    // Arrange: ゲーム画面が表示されている
    await puzzlePage.expectGameScreen();

    // 初期状態: ヒントは非表示
    await puzzlePage.expectHintHidden();

    // Act: ヒントを表示
    await puzzlePage.toggleHint();

    // Assert: ヒント画像が表示される
    await puzzlePage.expectHintVisible();
    await expect(puzzlePage.page.getByText('ヒントを隠す')).toBeVisible();

    // Act: ヒントを非表示
    await puzzlePage.toggleHint();

    // Assert: ヒント画像が非表示になる
    await puzzlePage.expectHintHidden();
    await expect(puzzlePage.page.getByText('ヒントを表示')).toBeVisible();
  });
});
