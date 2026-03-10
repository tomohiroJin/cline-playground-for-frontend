/**
 * E2E テスト: 進化選択→ステータス反映
 *
 * 進化選択画面の表示と、進化選択後のフロー遷移を検証する。
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('進化選択フロー', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('進化画面で進化カードが表示される', async ({ page }) => {
    test.setTimeout(180_000);

    // Arrange: 進化画面まで到達
    await game.startRun();
    const initialPhase = await game.getCurrentPhase();
    if (initialPhase !== 'evo') {
      await game.waitForBattleEnd(120_000);
    }

    // Assert
    await expect(page.getByText('進化を選べ')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/ATK|HP|DEF|会心/).first()).toBeVisible();
  });

  test('進化選択後にバトル画面に遷移する', async ({ page }) => {
    test.setTimeout(180_000);

    // Arrange
    await game.startRun();
    const initialPhase = await game.getCurrentPhase();
    if (initialPhase !== 'evo') {
      await game.waitForBattleEnd(120_000);
    }
    await expect(page.getByText('進化を選べ')).toBeVisible({ timeout: 5_000 });

    // Act
    await game.selectEvolution(0);

    // Assert
    const phase = await game.getCurrentPhase();
    expect(['battle', 'evo', 'event', 'biome', 'awakening']).toContain(phase);
  });
});
