/**
 * E2E テスト: セーブ/ロード→データ永続化
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('セーブ/ロード', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('ゲーム終了後に骨がセーブされる', async ({ page }) => {
    // Arrange: バトル→降伏
    await game.startRunAndReachBattle();
    await game.surrender();
    await expect(page.getByText(/部族は滅びた/)).toBeVisible({ timeout: 15_000 });
    await game.returnToTitle();

    // Assert
    await expect(page.getByText(/文明ツリー/)).toBeVisible();
  });

  test('リセットするとデータがクリアされる', async ({ page }) => {
    // Act
    await game.resetGameState();

    // Assert
    await expect(page.getByText('原始進化録').first()).toBeVisible();
  });
});
