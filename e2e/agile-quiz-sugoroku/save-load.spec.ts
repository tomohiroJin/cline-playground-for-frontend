/**
 * Agile Quiz Sugoroku セーブ/ロード E2E テスト
 *
 * ゲーム状態の永続化と復元を検証する。
 * 具体的な問題内容は検証しない（ランダム要素）。
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - セーブ/ロード', () => {
  let aqs: AqsHelper;

  test.beforeEach(async ({ page }) => {
    aqs = new AqsHelper(page);
    await aqs.navigateToGame();
    await aqs.resetGameState();
  });

  test('ゲーム途中でページリロードしても状態が復元される', async ({ page }) => {
    // Arrange: ゲームを開始して振り返り画面まで進行（セーブポイント）
    await aqs.startGame({ sprints: 3 });
    await aqs.advanceToPhase('retro');

    // Act: 振り返り画面で保存ボタンを押す
    const saveBtn = page.getByText('保存して中断');
    const saveVisible = await saveBtn.isVisible().catch(() => false);
    if (saveVisible) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
    }

    // Act: ページをリロード
    await aqs.reload();

    // Assert: タイトル画面に「続きから」ボタンが表示される
    await expect(
      page.getByText(/続きから/).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test('セーブデータがない場合は「続きから」ボタンが表示されない', async ({ page }) => {
    // Assert: リセット済みなので「続きから」ボタンは非表示
    await expect(page.getByText(/続きから/)).not.toBeVisible();

    // Assert: Sprint Start ボタンのみ表示
    await expect(page.getByText('Sprint Start')).toBeVisible();
  });
});
