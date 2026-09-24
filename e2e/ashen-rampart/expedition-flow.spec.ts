/**
 * E2E: 灰燼の城壁の遠征（反復7 段階1）
 *
 * 単体テストはタイマーを偽装して進めるので、実ブラウザで
 * 「構築 → 説明 → ステージ1 の盤面」まで通ることをここで守る。
 * 360px の計測は反復4 から持ち越した実機確認（3回目）の前段である。
 */
import { test, expect, type Page } from '@playwright/test';

const MIN_WIDTH = 360;
const MIN_HEIGHT = 740;

/** localStorage のキー（GamePageWrapper の注意事項ダイアログ用。primal-path-helper.ts と同じ命名） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/ashen-rampart';

/**
 * 360px 計測用の固定シード。
 * 速攻型 でこのシードの開始手札は 弩砲・徹甲弩・火砲台 の塔3枚（数値とバッジを
 * 最も多く持つ組み合わせ）で、360px の幅の最悪ケースになる（2026-09-23 に実ブラウザで確認）。
 */
const WIDEST_HAND_SEED = '748559145';

const startExpedition = async (page: Page, seedText?: string): Promise<void> => {
  // ページ読み込み前に localStorage を設定する。注意事項ダイアログを既読にしつつ、
  // このゲーム固有のキーだけ消して各テストを未プレイ状態から始める。
  // localStorage を丸ごと clear すると既読フラグも消えてダイアログが復活するので避ける。
  await page.addInitScript((noticeKey) => {
    localStorage.setItem(noticeKey, 'true');
    localStorage.removeItem('ashen-rampart:play-log-v6');
    localStorage.removeItem('ashen-rampart:briefing-seen-v1');
  }, NOTICE_STORAGE_KEY);

  // webpack 初回バンドルコンパイルを考慮した長めのタイムアウト（reload はしない）
  await page.goto('/ashen-rampart', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByRole('button', { name: /速攻型 を読み込む/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /速攻型 を読み込む/ }).click();
  if (seedText !== undefined) {
    // シードを指定して開始手札を固定する（未指定時は毎回ランダムのまま）
    await page.getByLabel('シード（空欄なら毎回ランダム）').fill(seedText);
  }
  await page.getByRole('button', { name: 'この構成で始める' }).click();
  await page.getByRole('button', { name: '開始' }).click();
};

test.describe('灰燼の城壁 遠征', () => {
  test('構築 → 説明 → ステージ1 の盤面と遠征の帯が出る', async ({ page }) => {
    await startExpedition(page);

    await expect(page.getByRole('button', { name: '一時停止' })).toBeVisible();
    await expect(page.getByRole('status', { name: '遠征の進み具合' })).toContainText('層 1 / 3');
    await expect(page.getByRole('group', { name: '手札' })).toBeVisible();
  });

  test('最小幅360px で横スクロールが出ず、手札の1行あたりの枚数を記録する', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: MIN_WIDTH, height: MIN_HEIGHT });
    // 乱数任せの開始手札では最悪ケースを測れないため、幅を最も取る手札になるシードで固定する
    await startExpedition(page, WIDEST_HAND_SEED);
    await expect(page.getByRole('group', { name: '手札' })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const handCards = page
      .getByRole('group', { name: '手札' })
      .getByRole('button', { name: / コスト\d/ });
    const cardTops = await handCards.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    const handCardNames = await handCards.evaluateAll((els) => els.map((el) => el.getAttribute('aria-label') ?? ''));
    const cardsPerRow = Math.max(...Object.values(
      cardTops.reduce<Record<number, number>>((acc, top) => ({ ...acc, [top]: (acc[top] ?? 0) + 1 }), {})
    ));

    await page.screenshot({ path: testInfo.outputPath('ashen-rampart-360.png'), fullPage: true });
    await testInfo.attach('hand-layout-360', {
      body: JSON.stringify({ scrollWidth, cardTops, cardsPerRow, handCardNames }),
      contentType: 'application/json',
    });

    expect(scrollWidth).toBeLessThanOrEqual(MIN_WIDTH);
    // 反復4 §6.1 の発動条件は「1行1枚に折り返す」。2枚以上並べば手順は発動しない
    expect(cardsPerRow).toBeGreaterThanOrEqual(2);
  });
});
