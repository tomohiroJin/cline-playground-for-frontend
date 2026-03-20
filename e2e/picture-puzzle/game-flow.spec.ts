/**
 * ゲームフロー E2E テスト
 *
 * タイトル画面 → セットアップ → ゲーム開始 → 終了の基本フローを検証する。
 */
import { test } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('ゲームフロー', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
  });

  test('タイトル画面が表示される', async () => {
    await puzzlePage.expectTitleScreen();
  });

  test('画像選択 → 難易度選択 → ゲーム開始', async () => {
    // Arrange: タイトルからセットアップ画面へ
    await puzzlePage.startFromTitle();
    await puzzlePage.expectSetupScreen();

    // Act: 画像を選択して難易度を選び、ゲームを開始
    await puzzlePage.selectFirstImage();
    await puzzlePage.selectDifficulty(2);
    await puzzlePage.clickStartPuzzle();

    // Assert: ゲーム画面が表示される
    await puzzlePage.expectGameScreen();
  });

  test('ゲーム終了 → セットアップ画面に戻る', async () => {
    // Arrange: ゲームを開始
    await puzzlePage.setupAndStartGame(2);
    await puzzlePage.expectGameScreen();

    // Act: ゲームを終了
    await puzzlePage.endGame();

    // Assert: セットアップ画面に戻る
    await puzzlePage.expectSetupScreen();
  });
});
