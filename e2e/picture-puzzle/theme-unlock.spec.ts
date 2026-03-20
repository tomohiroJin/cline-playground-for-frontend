/**
 * テーマアンロック E2E テスト
 *
 * 初期テーマの表示とロックされたテーマの表示を検証する。
 */
import { test, expect } from '@playwright/test';
import { PuzzlePage } from './helpers/puzzle-page';

test.describe('テーマアンロック', () => {
  let puzzlePage: PuzzlePage;

  test.beforeEach(async ({ page }) => {
    puzzlePage = new PuzzlePage(page);
    await puzzlePage.navigate();
    await puzzlePage.startFromTitle();
  });

  test('初期テーマの画像が選択可能', async () => {
    // Assert: テーマセレクターに画像が表示されている
    const images = puzzlePage.page.locator('img[alt]');
    const imageCount = await images.count();
    expect(imageCount).toBeGreaterThan(0);
  });

  test('ロックされたテーマにはロックアイコンが表示される', async () => {
    // Assert: ロック表示（🔒）を含むボタンが存在する
    const lockButtons = puzzlePage.page.getByRole('button', { name: /🔒/ });
    const lockCount = await lockButtons.count();
    expect(lockCount).toBeGreaterThan(0);
  });
});
