/**
 * 迷宮の残響 E2E テスト: 基本フロー（seed 固定）
 *
 * タイトル画面 → 難易度選択 → フロア紹介 → イベント → 結果 → 次イベント のフロー。
 * seed 固定により決定論的なテストを実現。
 */
import { test, expect } from '@playwright/test';
import { LEPage } from './helpers/le-page';
import { SEED_BASIC_FLOW } from './helpers/seed-registry';

test.describe('迷宮の残響 - 基本フロー（UI操作）', () => {
  let game: LEPage;

  test.beforeEach(async ({ page }) => {
    game = new LEPage(page);
    await game.goto();
    await game.resetGameState();
    await game.reload();
  });

  test('タイトル画面が表示される', async ({ page }) => {
    await expect(page.getByText('迷宮の残響').first()).toBeVisible();
  });

  test('探索開始ボタンで難易度選択に遷移する', async ({ page }) => {
    await game.startGame();
    await expect(page.getByText('難易度選択')).toBeVisible();
  });

  test('難易度選択から戻るボタンでタイトルに戻れる', async ({ page }) => {
    await game.startGame();
    await expect(page.getByText('難易度選択')).toBeVisible();
    await game.goBack();
    await expect(page.getByText('迷宮の残響').first()).toBeVisible();
  });
});

test.describe('迷宮の残響 - seed 固定ゲームプレイ', () => {
  let game: LEPage;

  test.beforeEach(async ({ page }) => {
    game = new LEPage(page);
    // seed 注入は goto の前に統一（addInitScript はページ読み込み前に実行される）
    await game.injectSeededRng(SEED_BASIC_FLOW);
    await game.goto();
    await game.resetGameState();
    await game.reload();
  });

  test('難易度を選択するとフロア紹介が表示される', async ({ page }) => {
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });
  });

  test('フロア紹介から進入するとイベントが表示される', async ({ page }) => {
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });

    // フロアに進入
    await page.click('body');
    await page.waitForTimeout(1000);

    // イベントテキストが表示される
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('選択肢を選んで結果が表示される', async ({ page }) => {
    // ゲーム開始からフロア進入
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });
    await page.click('body');
    await page.waitForTimeout(1500);

    // 選択肢を選ぶ
    await game.makeChoice(0);
    await page.waitForTimeout(1000);

    // 結果テキストが表示される
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('1イベントサイクルを完了できる', async () => {
    // ゲーム開始からフロア進入
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(game.page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });
    await game.page.click('body');
    await game.page.waitForTimeout(1500);

    // 1イベントを完了
    const continued = await game.playOneEvent(0);
    expect(continued).toBe(true);
  });
});
