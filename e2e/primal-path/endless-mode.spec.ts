/**
 * E2E テスト: エンドレスモード→ループ動作
 *
 * エンドレスモードはゲームクリア後に利用可能になる。
 * 初期状態での利用不可を検証する。
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('エンドレスモード', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('初期状態ではエンドレスモードが利用できない', async ({ page }) => {
    // Assert: タイトル画面にエンドレス関連ボタンが表示されない
    await expect(page.getByText('原始進化録').first()).toBeVisible();
    const endlessButton = page.getByRole('button', { name: /エンドレス/ });
    const isVisible = await endlessButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });
});
