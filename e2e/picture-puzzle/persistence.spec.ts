/**
 * データ永続化 E2E テスト
 *
 * ベストスコアの保存・復元、クリア履歴の保存を検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('データ永続化', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    // localStorage をクリアしてクリーンな状態で開始
    await page.addInitScript(() => {
      localStorage.clear();
    });
    await puzzlePage.navigate();
  });

  test('パズルクリア後にベストスコアが保存される', async () => {
    // Arrange: デバッグモード有効化 → ゲーム開始
    await puzzlePage.activateDebugMode();
    await puzzlePage.setupAndStartGame(2);

    // Act: デバッグ完成
    await puzzlePage.completePuzzleForDebug();
    await puzzlePage.expectResultScreen();

    // Assert: localStorage にスコアが保存されている
    const records = await puzzlePage.page.evaluate(() => {
      const data = localStorage.getItem('puzzle_records');
      return data ? JSON.parse(data) : [];
    });
    expect(records.length).toBeGreaterThan(0);
  });

  test('パズルクリア後に累計クリア数が増える', async () => {
    // Arrange: デバッグモード有効化 → ゲーム開始
    await puzzlePage.activateDebugMode();
    await puzzlePage.setupAndStartGame(2);

    // Act: デバッグ完成
    await puzzlePage.completePuzzleForDebug();
    await puzzlePage.expectResultScreen();

    // Assert: localStorage に累計クリア数が保存されている
    const totalClears = await puzzlePage.page.evaluate(() => {
      const value = localStorage.getItem('puzzle_total_clears');
      return value ? parseInt(value, 10) : 0;
    });
    expect(totalClears).toBeGreaterThanOrEqual(1);
  });

  test('クリア履歴が保存される', async () => {
    // Arrange: デバッグモード有効化 → ゲーム開始
    await puzzlePage.activateDebugMode();
    await puzzlePage.setupAndStartGame(2);

    // Act: デバッグ完成
    await puzzlePage.completePuzzleForDebug();
    await puzzlePage.expectResultScreen();

    // Assert: localStorage にクリア履歴が保存されている
    const history = await puzzlePage.page.evaluate(() => {
      const data = localStorage.getItem('puzzle_clear_history');
      return data ? JSON.parse(data) : [];
    });
    expect(history.length).toBeGreaterThan(0);
  });
});
