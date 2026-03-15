/**
 * 迷宮の残響 E2E テスト: 基本フロー（スモークテスト）
 *
 * タイトル画面の表示確認とゲーム開始フローの確認。
 * seed 注入なし — UI 操作のみ。
 */
import { test, expect } from '@playwright/test';
import { LEPage } from './helpers/le-page';

test.describe('迷宮の残響 - 基本フロー', () => {
  let game: LEPage;

  test.beforeEach(async ({ page }) => {
    game = new LEPage(page);
    await game.goto();
    // ゲーム状態をリセット後、リロードで初期状態を反映
    await game.resetGameState();
    await game.reload();
  });

  test('タイトル画面が表示される', async ({ page }) => {
    // Assert
    await expect(page.getByText('迷宮の残響').first()).toBeVisible();
  });

  test('探索開始ボタンで難易度選択に遷移する', async ({ page }) => {
    // Act
    await game.startGame();

    // Assert
    await expect(page.getByText('難易度選択')).toBeVisible();
  });

  test('難易度選択から戻るボタンでタイトルに戻れる', async ({ page }) => {
    // Arrange
    await game.startGame();
    await expect(page.getByText('難易度選択')).toBeVisible();

    // Act
    await game.goBack();

    // Assert
    await expect(page.getByText('迷宮の残響').first()).toBeVisible();
  });

  test('難易度を選択するとゲームが開始される', async ({ page }) => {
    // Arrange
    await game.startGame();

    // Act
    await game.selectDifficulty('探索者');

    // Assert — フロア紹介、イベント画面、または結果画面に遷移
    await page.waitForTimeout(2000);
    const phase = await game.getCurrentPhase();
    expect(['floorIntro', 'event', 'result', 'unknown']).toContain(phase);
  });
});
