/**
 * Agile Quiz Sugoroku 勉強会モード E2E テスト
 *
 * 勉強会モードの画面遷移と構造を検証する。
 * ランダムな「内容」ではなく「構造」と「遷移」のみを検証する。
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - 勉強会モード', () => {
  let aqs: AqsHelper;

  test.beforeEach(async ({ page }) => {
    aqs = new AqsHelper(page);
    await aqs.navigateToGame();
    await aqs.resetGameState();
  });

  test('勉強会モード: ジャンル選択画面が表示される', async ({ page }) => {
    // Act
    await aqs.goToStudyMode();

    // Assert: STUDY MODE 画面の構成要素
    await expect(page.getByText('STUDY MODE').first()).toBeVisible();
    await expect(page.getByText('GENRE SELECT')).toBeVisible();
  });

  test('勉強会モード: ジャンルを選択して学習を開始できる', async ({ page }) => {
    // Arrange
    await aqs.goToStudyMode();

    // Act: 最初のジャンルボタンをクリック
    const genreButtons = page.locator('button').filter({ hasText: /スクラム|アジャイル/ });
    await genreButtons.first().click();

    // Act: 学習開始ボタンをクリック
    await page.getByText('学習開始').click();

    // Assert: クイズ画面（STUDY MODE のまま問題表示）
    await expect(page.getByText('STUDY MODE').first()).toBeVisible({ timeout: 5_000 });
  });

  test('勉強会モード: 問題と選択肢が表示される', async ({ page }) => {
    // Arrange: 勉強会を開始
    await aqs.goToStudyMode();
    const genreButtons = page.locator('button').filter({ hasText: /スクラム|アジャイル/ });
    await genreButtons.first().click();
    await page.getByText('学習開始').click();
    await page.waitForTimeout(1000);

    // Assert: 選択肢ボタンが表示される
    const optionA = page.locator('button').filter({ hasText: 'A' });
    await expect(optionA.first()).toBeVisible({ timeout: 5_000 });
  });

  test('勉強会モード: 回答後に結果画面に到達する', async ({ page }) => {
    // Arrange: 10問モードで勉強会を開始
    await aqs.goToStudyMode();
    const genreButtons = page.locator('button').filter({ hasText: /スクラム|アジャイル/ });
    await genreButtons.first().click();
    await page.getByText('学習開始').click();
    await page.waitForTimeout(1000);

    // Act: 10問回答する
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('1');
      await page.waitForTimeout(500);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
    }

    // Assert: 結果画面が表示される
    await expect(
      page.getByText('STUDY RESULT').first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('勉強会モード: 戻るボタンでタイトルに戻れる', async ({ page }) => {
    // Arrange
    await aqs.goToStudyMode();

    // Act
    await aqs.goBack();

    // Assert
    await expect(page.getByText('アジャイル・クイズすごろく')).toBeVisible({ timeout: 5_000 });
  });
});
