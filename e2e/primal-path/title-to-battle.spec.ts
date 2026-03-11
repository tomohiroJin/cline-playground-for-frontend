/**
 * E2E テスト: タイトル→ステージ選択→バトル開始
 *
 * ゲームの基本的な画面遷移フローを検証する。
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('タイトル→バトル開始フロー', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
    await game.resetGameState();
  });

  test('タイトル画面が表示される', async ({ page }) => {
    // Assert
    await expect(page.getByText('原始進化録').first()).toBeVisible();
    await expect(page.getByText('PRIMAL PATH')).toBeVisible();
    await expect(page.getByRole('button', { name: /はじめる/ })).toBeVisible();
  });

  test('はじめるボタンでステージ選択に遷移する', async ({ page }) => {
    // Act
    await page.getByRole('button', { name: /はじめる/ }).click();

    // Assert
    await expect(page.getByText('ステージ選択')).toBeVisible();
  });

  test('ステージ選択から戻るボタンでタイトルに戻れる', async ({ page }) => {
    // Arrange
    await page.getByRole('button', { name: /はじめる/ }).click();
    await expect(page.getByText('ステージ選択')).toBeVisible();

    // Act
    await game.goBack();

    // Assert
    await expect(page.getByText('原始進化録').first()).toBeVisible();
  });

  test('ステージ選択からバトルまで遷移できる', async ({ page }) => {
    // Act
    await game.startRun();

    // 次の画面に遷移するまで待機
    await page.waitForTimeout(2000);

    // Assert: バイオーム選択、進化画面、バトル画面、または難易度選択画面に遷移
    const phase = await game.getCurrentPhase();
    expect(['battle', 'evo', 'biome', 'diff']).toContain(phase);
  });

  test('文明ツリー画面に遷移できる', async ({ page }) => {
    // Act
    await game.goToTree();

    // Assert
    await expect(page.getByText('永続文明ツリー')).toBeVisible();
  });

  test('文明ツリーから戻れる', async ({ page }) => {
    // Arrange
    await game.goToTree();

    // Act
    await game.goBack();

    // Assert
    await expect(page.getByText('原始進化録').first()).toBeVisible();
  });
});
