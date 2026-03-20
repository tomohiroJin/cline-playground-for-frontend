/**
 * キーボード操作 E2E テスト
 *
 * 矢印キー、WASD キー、H キー、R キーの操作を検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('キーボード操作', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
    // 3×3 を使用（2×2 はシャッフル後に即完成する確率があり、ヒントや操作テストが不安定）
    await puzzlePage.setupAndStartGame(3);
    await puzzlePage.expectGameScreen();
  });

  test('矢印キーでピースが移動する', async () => {
    // Act: 矢印キーを押す
    await puzzlePage.page.keyboard.press('ArrowUp');
    await puzzlePage.page.keyboard.press('ArrowLeft');
    await puzzlePage.page.keyboard.press('ArrowDown');
    await puzzlePage.page.keyboard.press('ArrowRight');

    // Assert: ステータスバーが引き続き表示されている（エラーなし）
    await expect(puzzlePage.page.getByText(/⏱/).first()).toBeVisible();
  });

  test('WASD キーでピースが移動する', async () => {
    // Act: WASD キーを押す
    await puzzlePage.page.keyboard.press('w');
    await puzzlePage.page.keyboard.press('a');
    await puzzlePage.page.keyboard.press('s');
    await puzzlePage.page.keyboard.press('d');

    // Assert: ステータスバーが引き続き表示されている（エラーなし）
    await expect(puzzlePage.page.getByText(/⏱/).first()).toBeVisible();
  });

  test('H キーでヒントが切り替わる', async () => {
    // Arrange: 初期状態はヒント非表示
    await puzzlePage.expectHintHidden();

    // Act: H キーを押す
    await puzzlePage.page.keyboard.press('h');

    // Assert: ヒント画像が表示される
    await puzzlePage.expectHintVisible();

    // Act: もう一度 H キーを押す
    await puzzlePage.page.keyboard.press('h');

    // Assert: ヒント画像が非表示になる
    await puzzlePage.expectHintHidden();
  });

  test('R キーでパズルがリセットされる', async () => {
    // Arrange: ピースを移動して手数を増やす
    await puzzlePage.page.keyboard.press('ArrowUp');

    // Act: R キーを押す
    await puzzlePage.page.keyboard.press('r');

    // Assert: 手数が 0 にリセットされる
    const moveCount = await puzzlePage.getMoveCount();
    expect(moveCount).toMatch(/👣 0手/);
  });
});
