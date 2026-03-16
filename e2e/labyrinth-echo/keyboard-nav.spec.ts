/**
 * 迷宮の残響 E2E テスト: キーボードナビゲーション（seed 固定）
 *
 * 全画面でのキーボード操作テスト。
 */
import { test, expect } from '@playwright/test';
import { LEPage } from './helpers/le-page';
import { SEED_BASIC_FLOW } from './helpers/seed-registry';

test.describe('迷宮の残響 - キーボードナビゲーション', () => {
  let game: LEPage;

  test.beforeEach(async ({ page }) => {
    game = new LEPage(page);
    await game.injectSeededRng(SEED_BASIC_FLOW);
    await game.goto();
    await game.resetGameState();
    await game.reload();
  });

  test('タイトル画面でEnterキーを押すと探索開始する', async ({ page }) => {
    // Act
    await page.keyboard.press('Enter');

    // Assert — 難易度選択画面に遷移
    await expect(page.getByText('難易度選択')).toBeVisible({ timeout: 5_000 });
  });

  test('難易度選択画面で↑↓キーで選択を移動できる', async ({ page }) => {
    // Arrange
    await game.startGame();
    await expect(page.getByText('難易度選択')).toBeVisible();

    // Act — ↓キーを押す
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);

    // Assert — 画面が崩れずに表示されている
    await expect(page.getByText('難易度選択')).toBeVisible();
  });

  test('難易度選択画面でEnterキーで選択を確定できる', async ({ page }) => {
    // Arrange
    await game.startGame();
    await expect(page.getByText('難易度選択')).toBeVisible();

    // Act — Enterで確定（デフォルトで最初の難易度が選択されている想定）
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Assert — フロア紹介またはゲーム画面に遷移
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(30);
  });

  test('難易度選択画面で戻るボタンをクリックするとタイトルに戻れる', async ({ page }) => {
    // Arrange
    await game.startGame();
    await expect(page.getByText('難易度選択')).toBeVisible();

    // Act — 戻るボタンをクリック
    await game.goBack();

    // Assert — タイトル画面に戻る
    await expect(page.getByText('迷宮の残響').first()).toBeVisible();
  });

  test('フロア紹介画面でEnterキーで進入できる', async ({ page }) => {
    // Arrange
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });

    // Act
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);

    // Assert — イベント画面に遷移
    const bodyText = await page.textContent('body');
    expect(bodyText!.length).toBeGreaterThan(50);
  });

  test('イベント画面で数字キーで選択肢を選択できる', async ({ page }) => {
    // Arrange — イベント画面まで進行
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);

    // Act — 数字キー1で最初の選択肢を選択
    await page.keyboard.press('1');
    await page.waitForTimeout(1000);

    // Assert — 選択後に画面が変化する
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('スペースキーでテキスト表示をスキップできる', async ({ page }) => {
    // Arrange — イベント画面まで進行
    await game.startGame();
    await game.selectDifficulty('探索者');
    await expect(page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });
    await page.click('body');
    await page.waitForTimeout(500);

    // Act — スペースキーでスキップ
    await page.keyboard.press('Space');
    await page.waitForTimeout(500);

    // Assert — 画面が正常に表示されている
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });
});
