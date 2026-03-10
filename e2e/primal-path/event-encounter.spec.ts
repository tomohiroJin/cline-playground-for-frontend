/**
 * E2E テスト: ランダムイベント→選択→効果
 *
 * イベントは確率で発生するため、発生しない場合はスキップする。
 */
import { test, expect } from '@playwright/test';
import { PrimalPathHelper } from '../helpers/primal-path-helper';

test.describe('ランダムイベント', () => {
  let game: PrimalPathHelper;

  test.beforeEach(async ({ page }) => {
    game = new PrimalPathHelper(page);
    await game.navigateToGame();
  });

  test('イベント発生時に選択肢が表示される', async ({ page }) => {
    test.setTimeout(300_000);

    // Arrange: バトルを繰り返してイベント発生を待つ
    await game.startRun();

    let eventFound = false;
    for (let i = 0; i < 5; i++) {
      const phase = await game.getCurrentPhase();
      if (phase === 'event') { eventFound = true; break; }
      if (phase === 'over') break;
      if (phase === 'evo') { await game.selectEvolution(0); continue; }
      if (phase === 'biome') { await page.locator('button').first().click(); continue; }
      if (phase === 'awakening') { await page.getByRole('button').first().click(); continue; }
      if (phase === 'battle') {
        const result = await game.waitForBattleEnd(120_000);
        if (result === 'event') { eventFound = true; break; }
        continue;
      }
      break;
    }

    if (!eventFound) { test.skip(); return; }

    // Assert
    await expect(page.getByText('ランダムイベント')).toBeVisible();
    expect(await page.getByRole('button').count()).toBeGreaterThan(0);
  });
});
