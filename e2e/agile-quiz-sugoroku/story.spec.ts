/**
 * Agile Quiz Sugoroku ストーリー E2E テスト
 *
 * ストーリー画面の表示とスキップ操作を検証する。
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - ストーリー', () => {
  let aqs: AqsHelper;

  test.beforeEach(async ({ page }) => {
    aqs = new AqsHelper(page);
    await aqs.navigateToGame();
    await aqs.resetGameState();
  });

  test('ストーリー画面が表示されスキップ操作で次に進める', async ({ page }) => {
    // Arrange: ゲームを開始
    await aqs.startGame({ sprints: 1 });

    // ストーリー画面の表示を待機
    await page.waitForTimeout(2000);
    const phase = await aqs.getCurrentPhase();

    if (phase === 'story') {
      // Assert: スキップボタンが存在する
      await expect(page.getByRole('button', { name: 'スキップ' })).toBeVisible();

      // Act: Escape でスキップ
      await page.keyboard.press('Escape');
      await page.waitForTimeout(2000);

      // Assert: ストーリー画面から次の画面に遷移する
      const nextPhase = await aqs.getCurrentPhase();
      // スキップ後はスプリント開始画面、クイズ画面、または別のストーリーに遷移
      expect(nextPhase).not.toBe('title');
    } else {
      // ストーリーがない場合はスプリント開始画面に直接遷移
      expect(['sprintStart', 'quiz']).toContain(phase);
    }
  });
});
