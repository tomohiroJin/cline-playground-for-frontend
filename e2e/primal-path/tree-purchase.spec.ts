/**
 * E2E テスト: 文明ツリー購入→効果反映
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('文明ツリー', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('文明ツリー画面にツリーノードが表示される', async ({ page }) => {
    // Act
    await game.goToTree();

    // Assert
    await expect(page.getByText('永続文明ツリー')).toBeVisible();
    await expect(page.getByText(/所持/)).toBeVisible();
    await expect(page.getByText(/取得/)).toBeVisible();
  });

  test('骨が不足している場合コストが表示される', async ({ page }) => {
    // Arrange
    await game.goToTree();

    // Assert
    await expect(page.getByText(/🦴\d+/).first()).toBeVisible();
  });
});
