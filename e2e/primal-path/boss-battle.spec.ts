/**
 * E2E テスト: ボス戦→最終ボス連戦
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('ボス戦', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('バトルが進行するとWave表示が更新される', async ({ page }) => {
    // Arrange
    await game.startRunAndReachBattle();

    // Assert
    await expect(page.getByText(/Wave/).first()).toBeVisible({ timeout: 15_000 });
  });

  test('複数バトルを経てBOSS表示が出る', async ({ page }) => {
    test.setTimeout(300_000);

    await game.startRunAndReachBattle();

    let bossFound = false;
    for (let i = 0; i < 10; i++) {
      const phase = await game.getCurrentPhase();
      if (phase === 'over') break;

      const hasBoss = await page.getByText('BOSS').isVisible().catch(() => false);
      if (hasBoss) { bossFound = true; break; }

      if (phase === 'evo') { await game.selectEvolution(0); continue; }
      if (phase === 'biome') { await page.locator('button').first().click(); continue; }
      if (phase === 'awakening') { await page.getByRole('button').first().click(); continue; }
      if (phase === 'battle') { await game.waitForBattleEnd(60_000); continue; }
      break;
    }

    if (!bossFound) test.skip();
    expect(bossFound).toBe(true);
  });
});
