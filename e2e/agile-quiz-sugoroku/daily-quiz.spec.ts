/**
 * Agile Quiz Sugoroku デイリークイズ E2E テスト
 *
 * デイリークイズの画面遷移と構造を検証する。
 * 日付シード付きで問題が安定するため、比較的安定したテストが可能。
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - デイリークイズ', () => {
  let aqs: AqsHelper;

  test.beforeEach(async ({ page }) => {
    aqs = new AqsHelper(page);
    await aqs.navigateToGame();
    await aqs.resetGameState();
  });

  test('デイリークイズ画面が表示される', async ({ page }) => {
    // Act
    await aqs.goToDailyQuiz();

    // Assert: DAILY QUIZ 画面の構成要素
    await expect(page.getByText('DAILY QUIZ').first()).toBeVisible();
  });

  test('デイリークイズ: 問題に回答してスコアが表示される', async ({ page }) => {
    // Arrange
    await aqs.goToDailyQuiz();

    // Act: 5問回答する（デイリークイズは5問固定）
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('1');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }

    // Assert: 結果画面にスコアが表示される
    await expect(page.getByText('RESULT')).toBeVisible({ timeout: 10_000 });
    // 正解数が表示される（X / 5 の形式）
    await expect(page.getByText(/\d+ \/ 5/)).toBeVisible();
  });
});
