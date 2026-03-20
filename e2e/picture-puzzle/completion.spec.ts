/**
 * パズル完成 E2E テスト
 *
 * デバッグモードを使ったパズル完成とリザルト画面の表示を検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('パズル完成', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
  });

  test('デバッグモードでパズルを完成させるとリザルト画面が表示される', async () => {
    // Arrange: デバッグモードを有効化してゲームを開始
    await puzzlePage.activateDebugMode();
    await puzzlePage.setupAndStartGame(2);
    await puzzlePage.expectGameScreen();

    // Act: デバッグ機能でパズルを完成させる
    await puzzlePage.completePuzzleForDebug();

    // Assert: リザルト画面が表示される
    await puzzlePage.expectResultScreen();
  });

  test('リザルト画面から設定に戻る', async () => {
    // Arrange: デバッグモードでパズルを完成させる
    await puzzlePage.activateDebugMode();
    await puzzlePage.setupAndStartGame(2);
    await puzzlePage.completePuzzleForDebug();
    await puzzlePage.expectResultScreen();

    // Act: 設定に戻る
    await puzzlePage.endGame();

    // Assert: セットアップ画面に戻る
    await puzzlePage.expectSetupScreen();
  });
});
