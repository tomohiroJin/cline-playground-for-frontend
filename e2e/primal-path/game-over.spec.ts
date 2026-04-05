/**
 * E2E テスト: ゲームオーバー→リザルト→タイトル
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('ゲームオーバーフロー', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  /** バトル画面到達→降伏の共通手順 */
  async function surrenderFromBattle(game: PrimalPathHelper, page: PrimalPathHelper['page']) {
    await game.startRunAndReachBattle();
    await game.surrender();
    await expect(page.getByText(/部族は撤退/)).toBeVisible({ timeout: 15_000 });
  }

  test('降伏後にリザルト画面が表示される', async ({ page }) => {
    // Arrange & Act
    await surrenderFromBattle(game, page);

    // Assert
    await expect(page.getByText(/ラン統計/)).toBeVisible();
    await expect(page.getByText(/撃破数/)).toBeVisible();
    await expect(page.getByText('タイトルへ')).toBeVisible();
  });

  test('リザルト画面からタイトルに戻れる', async ({ page }) => {
    // Arrange
    await surrenderFromBattle(game, page);

    // Act
    await game.returnToTitle();

    // Assert
    await expect(page.getByText('原始進化録').first()).toBeVisible();
  });

  test('骨の報酬が表示される', async ({ page }) => {
    // Arrange & Act
    await surrenderFromBattle(game, page);

    // Assert
    await expect(page.getByText(/🦴/).first()).toBeVisible();
  });
});
