/**
 * E2E テスト: バトル→進化→次バトルの基本フロー
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('バトルフロー', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('バトル画面でターン表示が進行する', async ({ page }) => {
    // Arrange
    await game.startRunAndReachBattle();

    // Assert
    await expect(page.getByText(/T\d+/).first()).toBeVisible({ timeout: 15_000 });
  });

  test('バトル終了後に進化画面またはゲームオーバーに遷移する', async ({ page }) => {
    test.setTimeout(180_000);

    // Arrange
    await game.startRunAndReachBattle();

    // Act
    const result = await game.waitForBattleEnd(120_000);

    // Assert
    expect(['evo', 'over', 'event', 'biome', 'awakening']).toContain(result);
  });

  test('降伏するとゲームオーバーになる', async ({ page }) => {
    // Arrange: バトル画面到達
    await game.startRunAndReachBattle();

    // Act: 降伏（バトルが終了していた場合は次のバトルまで進んで降伏）
    await game.surrender();

    // Assert
    await expect(page.getByText(/部族は撤退/)).toBeVisible({ timeout: 15_000 });
  });
});
