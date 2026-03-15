/**
 * Agile Quiz Sugoroku スモークテスト
 *
 * フェーズ 0 の安全網として、タイトル画面の表示を確認する。
 * ランダム要素には依存せず、構造の存在のみを検証する。
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - スモークテスト', () => {
  test('タイトル画面が正しく表示される', async ({ page }) => {
    const aqs = new AqsHelper(page);
    await aqs.navigateToGame();

    // 構造検証: タイトルテキストが存在する
    await expect(page.getByText('アジャイル・クイズすごろく')).toBeVisible();
  });
});
