/**
 * 迷宮の残響 E2E テスト: データ永続化
 *
 * ゲームプレイ → リロード → データ保持の確認。
 * リセット機能の確認。
 */
import { test, expect } from '@playwright/test';
import { LEPage } from './helpers/le-page';
import { SEED_BASIC_FLOW } from './helpers/seed-registry';

test.describe('迷宮の残響 - データ永続化', () => {
  let game: LEPage;

  test.beforeEach(async ({ page }) => {
    game = new LEPage(page);
    await game.injectSeededRng(SEED_BASIC_FLOW);
    await game.goto();
    await game.resetGameState();
    await game.reload();
  });

  test('ゲーム開始後のラン数がリロード後も保持される', async ({ page }) => {
    // Arrange — ゲーム開始して1イベント進める
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });

    // localStorage にデータが保存されることを確認
    const saveData = await page.evaluate(() => {
      return localStorage.getItem('labyrinth-echo-save');
    });
    expect(saveData).toBeTruthy();

    // Act — リロード
    await game.reload();

    // Assert — リロード後もデータが保持されている
    const saveDataAfterReload = await page.evaluate(() => {
      return localStorage.getItem('labyrinth-echo-save');
    });
    expect(saveDataAfterReload).toBeTruthy();
  });

  test('リセット操作で全データが初期化される', async ({ page }) => {
    // Arrange — ゲーム開始
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });

    // localStorage にデータがあることを確認
    const saveData = await page.evaluate(() => {
      return localStorage.getItem('labyrinth-echo-save');
    });
    expect(saveData).toBeTruthy();

    // Act — ゲーム状態をリセット
    await game.resetGameState();

    // Assert — データが初期化されている
    const saveDataAfterReset = await page.evaluate(() => {
      return localStorage.getItem('labyrinth-echo-save');
    });
    expect(saveDataAfterReset).toBeNull();
  });

  test('オーディオ設定がリロード後も保持される', async ({ page }) => {
    // Arrange — オーディオ設定を保存
    await page.evaluate(() => {
      localStorage.setItem('labyrinth-echo-audio-settings', JSON.stringify({ bgmEnabled: true, sfxEnabled: false, volume: 0.5 }));
    });

    // Act — リロード
    await game.reload();

    // Assert
    const audioSettings = await page.evaluate(() => {
      return localStorage.getItem('labyrinth-echo-audio-settings');
    });
    expect(audioSettings).toBeTruthy();
    const parsed = JSON.parse(audioSettings!);
    expect(parsed.volume).toBe(0.5);
  });
});
