/**
 * E2E テスト: チャレンジモード選択→制約反映
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('チャレンジモード', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('チャレンジモード画面が表示される', async ({ page }) => {
    // Act
    await game.goToChallenge();

    // Assert
    await expect(page.getByText('チャレンジモード')).toBeVisible();
    await expect(page.getByText(/特殊なルール/)).toBeVisible();
  });

  test('チャレンジ一覧にカードが表示される', async ({ page }) => {
    // Act
    await game.goToChallenge();

    // Assert
    await expect(page.getByText(/HP|進化上限|制限時間|敵ATK/).first()).toBeVisible();
  });

  test('チャレンジ画面から戻れる', async ({ page }) => {
    // Arrange
    await game.goToChallenge();

    // Act
    await game.goBack();

    // Assert
    await expect(page.getByText('原始進化録').first()).toBeVisible();
  });
});
