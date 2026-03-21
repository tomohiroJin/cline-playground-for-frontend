/**
 * Labyrinth of Shadows 画面遷移 E2E テスト
 * DOM ベースの画面遷移フローのみ検証（Canvas 描画は対象外）
 */
import { test, expect } from '@playwright/test';

const GAME_URL = '/maze-horror';

test.describe('Labyrinth of Shadows - 画面遷移', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(GAME_URL);
    // タイトル画面が表示されるまで待機
    await page.waitForSelector('text=LABYRINTH', { timeout: 30000 });
  });

  test('タイトル画面が表示される', async ({ page }) => {
    // タイトル文字の確認
    await expect(page.getByText('LABYRINTH')).toBeVisible();
    await expect(page.getByText('OF SHADOWS')).toBeVisible();

    // 難易度ボタン3つの確認
    await expect(page.getByText('初級')).toBeVisible();
    await expect(page.getByText('中級')).toBeVisible();
    await expect(page.getByText('上級')).toBeVisible();
  });

  test('難易度選択でストーリー画面に遷移する', async ({ page }) => {
    // 中級ボタンをクリック
    await page.getByText('中級').click();

    // ストーリーテキストが表示されることを確認
    await expect(page.getByText('ここは...どこだ...')).toBeVisible({ timeout: 5000 });
  });

  test('ストーリースキップでゲーム画面に遷移する', async ({ page }) => {
    // 初級ボタンをクリック
    await page.getByText('初級').click();

    // スキップボタンをクリック
    await page.getByText('スキップ').click();

    // Canvas が表示されることを確認
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });
  });

  test('ポーズ機能が動作する', async ({ page }) => {
    // ゲーム画面に遷移
    await page.getByText('初級').click();
    await page.getByText('スキップ').click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

    // Escape キーでポーズ
    await page.keyboard.press('Escape');

    // ポーズモーダルが表示される
    await expect(page.getByText('ポーズ')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('再開')).toBeVisible();
    await expect(page.getByText('タイトルへ')).toBeVisible();
  });

  test('ポーズから再開できる', async ({ page }) => {
    // ゲーム画面に遷移
    await page.getByText('初級').click();
    await page.getByText('スキップ').click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

    // ポーズ
    await page.keyboard.press('Escape');
    await expect(page.getByText('ポーズ')).toBeVisible({ timeout: 5000 });

    // 再開
    await page.getByText('再開').click();

    // ポーズモーダルが消える
    await expect(page.getByText('ポーズ')).not.toBeVisible({ timeout: 5000 });
  });

  test('ポーズからタイトルに戻れる', async ({ page }) => {
    // ゲーム画面に遷移
    await page.getByText('初級').click();
    await page.getByText('スキップ').click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

    // ポーズ
    await page.keyboard.press('Escape');
    await expect(page.getByText('ポーズ')).toBeVisible({ timeout: 5000 });

    // タイトルへ
    await page.getByText('タイトルへ').click();

    // ストーリー（ゲームオーバー）経由でタイトルに戻る
    // ゲームオーバーストーリーが表示される
    await page.waitForTimeout(2000);
    // スキップでタイトルへ
    const skipBtn = page.getByText('スキップ');
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }

    // タイトル画面に戻る
    await expect(page.getByText('LABYRINTH')).toBeVisible({ timeout: 10000 });
  });
});
