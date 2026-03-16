/**
 * Agile Quiz Sugoroku 画面表示テスト
 *
 * 各サブ画面（履歴・実績・ガイド）への遷移と構成要素の表示を検証する。
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - 画面表示', () => {
  let aqs: AqsHelper;

  test.beforeEach(async ({ page }) => {
    aqs = new AqsHelper(page);
    await aqs.navigateToGame();
    await aqs.resetGameState();
  });

  test('履歴画面: 遷移と要素表示', async ({ page }) => {
    // Act
    await aqs.goToHistory();

    // Assert: 履歴画面の構成要素
    await expect(page.getByText('HISTORY').first()).toBeVisible();
    await expect(page.getByText('プレイ履歴').first()).toBeVisible();

    // Assert: 初期状態では履歴なしメッセージ
    await expect(page.getByText('まだプレイ履歴がありません').first()).toBeVisible();

    // Assert: 戻るボタンが存在する
    await expect(page.getByRole('button', { name: '戻る', exact: true })).toBeVisible();
  });

  test('実績画面: 遷移と要素表示', async ({ page }) => {
    // Act
    await aqs.goToAchievements();

    // Assert: 実績画面の構成要素
    await expect(page.getByText('ACHIEVEMENTS').first()).toBeVisible();
    await expect(page.getByText('実績一覧')).toBeVisible();

    // Assert: 達成数表示
    await expect(page.getByText(/\d+ \/ \d+ 達成/)).toBeVisible();

    // Assert: 戻るボタンが存在する
    await expect(page.getByText(/戻る/).first()).toBeVisible();
  });

  test('ガイド画面: 遷移と要素表示', async ({ page }) => {
    // Act
    await aqs.goToGuide();

    // Assert: ガイド画面の構成要素（GUIDE & TEAM ヘッダーと HOW TO PLAY セクション）
    await expect(page.getByText('GUIDE & TEAM')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('HOW TO PLAY')).toBeVisible();

    // Assert: タイトルに戻るボタンが存在する
    await expect(page.getByText('タイトルに戻る')).toBeVisible();
  });

  test('履歴画面から戻るボタンでタイトルに戻れる', async ({ page }) => {
    // Arrange
    await aqs.goToHistory();

    // Act
    await aqs.goBack();

    // Assert
    await expect(page.getByText('アジャイル・クイズすごろく')).toBeVisible({ timeout: 5_000 });
  });

  test('実績画面から戻るボタンでタイトルに戻れる', async ({ page }) => {
    // Arrange
    await aqs.goToAchievements();

    // Act
    await aqs.goBack();

    // Assert
    await expect(page.getByText('アジャイル・クイズすごろく')).toBeVisible({ timeout: 5_000 });
  });
});
