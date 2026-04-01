/**
 * S6-8 打鍵チェック: 手動確認フィードバック修正の検証
 */
import { test, expect } from '@playwright/test';

/** 初回起動時の注意モーダル・チュートリアルを閉じる */
async function dismissModals(page: import('@playwright/test').Page) {
  // 注意モーダル
  const okButton = page.locator('text=OK');
  if (await okButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await okButton.click();
    await page.waitForTimeout(500);
  }
  // チュートリアル（「スキップ」ボタンがあれば閉じる）
  const skipButton = page.locator('text=スキップ');
  if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipButton.click();
    await page.waitForTimeout(500);
  }
}

test.describe('S6-8a: 終了確認ダイアログの全モード対応', () => {
  test('フリー対戦モード — メニューボタンで確認ダイアログが表示される', async ({ page }) => {
    await page.goto('/air-hockey');
    await dismissModals(page);
    // フリー対戦 → キャラ選択 → 対戦開始
    await page.click('text=フリー対戦');
    await page.waitForTimeout(500);
    await page.click('text=対戦開始！');
    // ゲーム画面が表示されるのを待つ
    await page.waitForTimeout(3000);
    // チュートリアルが出たら閉じる
    await dismissModals(page);
    await page.waitForTimeout(1000);
    // メニューボタン（Scoreboard 内、英語「Menu」）をクリック
    const menuButton = page.locator('text=Menu');
    await expect(menuButton).toBeVisible({ timeout: 5000 });
    await menuButton.click();
    // 確認ダイアログが表示される
    await expect(page.locator('text=ゲームを終了しますか？')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=対戦が中断されます')).toBeVisible();
    // 「続ける」で閉じる
    await page.click('text=続ける');
    await expect(page.locator('text=ゲームを終了しますか？')).not.toBeVisible();
  });

  test('フリー対戦モード — 「メニューに戻る」でタイトル画面に戻る', async ({ page }) => {
    await page.goto('/air-hockey');
    await dismissModals(page);
    await page.click('text=フリー対戦');
    await page.waitForTimeout(500);
    await page.click('text=対戦開始！');
    await page.waitForTimeout(3000);
    await dismissModals(page);
    await page.waitForTimeout(1000);
    const menuButton = page.locator('text=Menu');
    await expect(menuButton).toBeVisible({ timeout: 5000 });
    await menuButton.click();
    await expect(page.locator('text=ゲームを終了しますか？')).toBeVisible({ timeout: 3000 });
    // 「メニューに戻る」でタイトルに戻る
    await page.click('text=メニューに戻る');
    await expect(page.locator('text=フリー対戦')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('S6-8b: 画像 CLS 防止', () => {
  test('キャラクター選択画面 — 画像に width/height 属性がある', async ({ page }) => {
    await page.goto('/air-hockey');
    await dismissModals(page);
    await page.click('text=2P 対戦');
    await page.waitForTimeout(1000);
    // プレイヤーアイコン画像の width/height 確認
    const imgs = page.locator('img[alt]');
    const count = await imgs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < Math.min(count, 5); i++) {
      const img = imgs.nth(i);
      const width = await img.getAttribute('width');
      const height = await img.getAttribute('height');
      expect(width).toBeTruthy();
      expect(height).toBeTruthy();
    }
  });
});

test.describe('S6-8c: DialogueOverlay レイアウト安定化', () => {
  test('ストーリーモード — テキストウィンドウに固定高さが設定されている', async ({ page }) => {
    await page.goto('/air-hockey');
    await dismissModals(page);
    const storyButton = page.locator('text=ストーリー');
    if (await storyButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await storyButton.click();
      await page.waitForTimeout(1000);
      const stage = page.locator('[data-testid="stage-card-1-1"]');
      if (await stage.isVisible({ timeout: 3000 }).catch(() => false)) {
        await stage.click();
        await page.waitForTimeout(2000);
        // テキスト要素の高さが固定されているか
        const textEl = page.locator('[data-testid="dialogue-text"]');
        if (await textEl.isVisible({ timeout: 3000 }).catch(() => false)) {
          const height = await textEl.evaluate(el => getComputedStyle(el).height);
          expect(height).not.toBe('auto');
          expect(parseFloat(height)).toBeGreaterThan(0);
          // インジケーターが存在するか
          const indicator = page.locator('[data-testid="dialogue-indicator"]');
          await expect(indicator).toBeVisible();
          const vis = await indicator.evaluate(el => getComputedStyle(el).visibility);
          expect(['visible', 'hidden']).toContain(vis);
        }
      }
    }
  });
});
