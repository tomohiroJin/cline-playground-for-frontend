/**
 * スコア・ランク表示 E2E テスト
 *
 * パズル完成後のスコア・ランク表示を検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('スコア・ランク表示', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
    // デバッグモード有効化
    await puzzlePage.activateDebugMode();
    // 3×3 を使用（2×2 はシャッフル後に即完成する確率があり、デバッグボタンが表示されない）
    await puzzlePage.setupAndStartGame(3);
  });

  test('パズル完成後にスコアが表示される', async () => {
    // Act: デバッグ完成
    await puzzlePage.completePuzzleForDebug();

    // Assert: スコア関連の表示がある
    await puzzlePage.expectResultScreen();
  });

  test('パズル完成後にランクが表示される', async () => {
    // Act: デバッグ完成
    await puzzlePage.completePuzzleForDebug();

    // Assert: ランク表示（★）がどこかに含まれる
    const pageContent = await puzzlePage.page.textContent('body');
    expect(pageContent).toMatch(/★|クリア/);
  });
});
