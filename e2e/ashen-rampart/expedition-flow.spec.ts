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

const startExpedition = async (page: Page): Promise<void> => {
  await page.goto('/ashen-rampart');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /速攻型 を読み込む/ }).click();
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
    await startExpedition(page);
    await expect(page.getByRole('group', { name: '手札' })).toBeVisible();

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const cardTops = await page
      .getByRole('group', { name: '手札' })
      .getByRole('button', { name: / コスト\d/ })
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)));
    const cardsPerRow = Math.max(...Object.values(
      cardTops.reduce<Record<number, number>>((acc, top) => ({ ...acc, [top]: (acc[top] ?? 0) + 1 }), {})
    ));

    await page.screenshot({ path: testInfo.outputPath('ashen-rampart-360.png'), fullPage: true });
    await testInfo.attach('hand-layout-360', {
      body: JSON.stringify({ scrollWidth, cardTops, cardsPerRow }),
      contentType: 'application/json',
    });

    expect(scrollWidth).toBeLessThanOrEqual(MIN_WIDTH);
    // 反復4 §6.1 の発動条件は「1行1枚に折り返す」。2枚以上並べば手順は発動しない
    expect(cardsPerRow).toBeGreaterThanOrEqual(2);
  });
});
