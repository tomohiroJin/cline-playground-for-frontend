/**
 * E2E テスト: Non-Brake Descent 基本フロー
 *
 * タイトル画面の表示、Space キーによるカウントダウン開始、
 * プレイ画面への遷移といった基本的なハッピーパスを検証する。
 */
import { test, expect } from '@playwright/test';

/** localStorage のキー（GamePageWrapper の注意事項ダイアログ用） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/non-brake-descent';

test.describe('Non-Brake Descent 基本フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 注意事項ダイアログをスキップ
    await page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, NOTICE_STORAGE_KEY);

    // ゲームページに遷移（webpack 初回コンパイルを考慮）
    await page.goto('/non-brake-descent', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
  });

  test('タイトル画面が表示される', async ({ page }) => {
    // Assert: タイトルテキストが表示されること
    await expect(page.getByText('NON-BRAKE').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('DESCENT').first()).toBeVisible();
    await expect(page.getByText('PRESS SPACE')).toBeVisible();
  });

  test('タイトル画面にキー操作説明が表示される', async ({ page }) => {
    // Assert: 操作説明が表示されること
    await expect(page.getByText('NON-BRAKE').first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('← → 移動 / Z 加速 / X ジャンプ').first()).toBeVisible();
  });

  test('Space キーでカウントダウンが開始される', async ({ page }) => {
    // Arrange: タイトル画面が表示されるまで待機
    await expect(page.getByText('NON-BRAKE').first()).toBeVisible({ timeout: 30_000 });

    // Act: Space キーを押す
    await page.keyboard.press('Space');

    // Assert: タイトル画面の「PRESS SPACE」が非表示になるか、
    // カウントダウン数字が表示されること
    await expect(
      page.getByText(/^[123]$/).first()
    ).toBeVisible({ timeout: 5_000 });
  });

  test('カウントダウン後にプレイ画面に遷移する', async ({ page }) => {
    // Arrange: タイトル画面が表示されるまで待機
    await expect(page.getByText('NON-BRAKE').first()).toBeVisible({ timeout: 30_000 });

    // Act: Space キーを押してゲーム開始
    await page.keyboard.press('Space');

    // Assert: カウントダウンが終了してプレイ画面に遷移する
    // NON-BRAKE DESCENT のタイトルは h1 に常時表示されるため、
    // タイトルオーバーレイの「PRESS SPACE」が消えることで遷移を確認
    await expect(page.getByText('PRESS SPACE')).toBeHidden({ timeout: 10_000 });
  });
});
