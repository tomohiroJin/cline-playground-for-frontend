/**
 * E2E: 戦闘中に盤面と手札が上下に動かない（反復7 段階2・設計書 §4.0 a）
 *
 * 段階1 の試遊で「画面のサイズがコロコロ変わり、戦闘開始時に慌てる」と言われた。
 * 一時表示（拒否理由・能力表示・溢れ・ライフが減った理由・予告）を操作と時間経過で
 * 起こしながら、盤面と手札の上端を何度も測り、変化が 0px であることを確かめる。
 *
 * 位置は文書座標（top + scrollY）で測る。Playwright のクリックは要素を画面内へ
 * スクロールさせるので、画面座標のままだとスクロールを「動いた」と誤読する。
 */
import { test, expect, type Page } from '@playwright/test';

/** localStorage のキー（expedition-flow.spec.ts と同じ） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/ashen-rampart';

/**
 * 最悪ケースのシード（expedition-flow.spec.ts と同じ）。速攻型の開始手札が
 * 弩砲・徹甲弩・火砲台の塔3枚になり、手札の幅を最も取る
 */
const WIDEST_HAND_SEED = '748559145';

/** 時間経過で起きる一時表示（予告の切り替え・手札の満杯・溢れ・漏れ）を拾う観測の長さ */
const OBSERVE_SECONDS = 30;
const OBSERVE_INTERVAL_MS = 1_000;
/** 操作が次の tick に反映されるのを待つ時間（1 tick = 100ms） */
const SETTLE_MS = 300;
/** 弩砲を置く経路外のセル（北レーンから距離2。弩砲の射程2.4 で北レーンを撃てる） */
const PLACE_CELL_TEST_ID = 'cell-4-0';

const VIEWPORTS = [
  { name: '1280x800', width: 1280, height: 800 },
  { name: '360x740', width: 360, height: 740 },
] as const;

interface Sample {
  label: string;
  board: number;
  hand: number;
  /** 拒否理由・手札通知・ライフ減少理由・危険表示の中身（何も出ていなければ空文字） */
  rejectionLine: string;
  handNotice: string;
  lifeLossReason: string;
  dangerSlot: string;
}

const startExpedition = async (page: Page): Promise<void> => {
  await page.addInitScript((noticeKey) => {
    localStorage.setItem(noticeKey, 'true');
    localStorage.removeItem('ashen-rampart:play-log-v7');
    localStorage.removeItem('ashen-rampart:briefing-seen-v1');
  }, NOTICE_STORAGE_KEY);
  await page.goto('/ashen-rampart', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await expect(page.getByRole('button', { name: /速攻型 を読み込む/ })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: /速攻型 を読み込む/ }).click();
  await page.getByLabel('シード（空欄なら毎回ランダム）').fill(WIDEST_HAND_SEED);
  await page.getByRole('button', { name: 'この構成で始める' }).click();
  await page.getByRole('button', { name: '開始' }).click();
  await expect(page.getByTestId('board-wrapper')).toBeVisible();
};

/**
 * 盤面と手札の上端（文書座標・px）に加え、一時表示4枠の中身を記録する
 *
 * 位置だけでは「一時表示を起こしながら測ったか」が残らない（修正ラウンド1・
 * レビュー指摘 Important 2）。枠の中身も毎回サンプルへ残し、後続の表明と
 * 添付JSONの両方で「実際に一時表示が出た」ことを検証できるようにする。
 */
const measure = async (page: Page, label: string): Promise<Sample> => {
  const result = await page.evaluate(() => {
    const topOf = (el: Element | null): number =>
      el ? el.getBoundingClientRect().top + window.scrollY : Number.NaN;
    const textOf = (el: Element | null): string => el?.textContent ?? '';
    return {
      board: topOf(document.querySelector('[data-testid="board-wrapper"]')),
      hand: topOf(document.querySelector('[role="group"][aria-label="手札"]')),
      rejectionLine: textOf(document.querySelector('[data-testid="rejection-line"]')),
      handNotice: textOf(document.querySelector('[data-testid="hand-notice-slot"]')),
      lifeLossReason: textOf(document.querySelector('[data-testid="life-loss-reason-slot"]')),
      dangerSlot: textOf(document.querySelector('[data-testid="danger-slot"]')),
    };
  });
  return { label, ...result };
};

/** 決着パネルが出たら「戦闘中」ではないので測らない */
const isPlaying = async (page: Page): Promise<boolean> =>
  (await page.getByRole('button', { name: /獲得へ進む|遠征の結果へ/ }).count()) === 0;

const spreadOf = (values: readonly number[]): number => Math.max(...values) - Math.min(...values);

/** どのサンプルかで一度でも中身が入っていたか（一時表示が実際に起きたかの表明に使う） */
const wasEverShown = (values: readonly string[]): boolean => values.some((value) => value.trim().length > 0);

for (const viewport of VIEWPORTS) {
  test(`${viewport.name}: 戦闘中に盤面と手札の上端が動かない`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await startExpedition(page);
    const samples: Sample[] = [await measure(page, '開始直後')];

    // 札を選ぶ（置けるセルの縁取りと、射程の斜線が出る）
    await page.getByRole('button', { name: /弩砲 コスト2/ }).click();
    samples.push(await measure(page, '札を選択'));

    // 砦のセルに置こうとして拒否理由を出す。表示は REJECTION_NOTICE_TICKS(6 tick=600ms)
    // しか保たないため、固定の待ちではなく「出たこと」を表明してから測る
    // （修正ラウンド1・レビュー指摘 Important 1。固定待ちだと出ないまま緑になりうる）
    await page.getByTestId('cell-8-3').click();
    await expect(page.getByTestId('rejection-line')).not.toBeEmpty();
    samples.push(await measure(page, '拒否理由'));

    // 経路外の (4,0) に置き、そのセルをタップして能力表示を開く。
    // 左上の角のセルは、スクロール後に固定表示のホームボタン（左上 40px）の下に入りうるので避ける
    await page.getByRole('button', { name: /弩砲 コスト2/ }).click();
    await expect(page.getByTestId(PLACE_CELL_TEST_ID)).toHaveAttribute('aria-label', /ここに置ける/);
    await page.getByTestId(PLACE_CELL_TEST_ID).click();
    await page.waitForTimeout(SETTLE_MS);
    samples.push(await measure(page, '配置'));
    await page.getByTestId(PLACE_CELL_TEST_ID).click();
    await expect(page.getByTestId('inspect-panel')).toBeVisible();
    samples.push(await measure(page, '能力表示'));

    // 凡例から敵の能力表示を開く（設置物の能力表示と交互に開いても枠の高さが
    // 変わらないことを測る。盾衛は層1 から凡例に出るため、この敵で確かめる）
    await page.getByRole('button', { name: '盾衛 の能力を見る' }).click();
    await expect(page.getByTestId('enemy-inspect-panel')).toBeVisible();
    samples.push(await measure(page, '敵の能力表示'));

    // 時間経過で起きる一時表示（予告の切り替え・手札の満杯と溢れ・漏れ）を観測する
    for (let second = 1; second <= OBSERVE_SECONDS; second += 1) {
      await page.waitForTimeout(OBSERVE_INTERVAL_MS);
      if (!(await isPlaying(page))) break;
      samples.push(await measure(page, `${second}秒後`));
    }

    await testInfo.attach(`layout-${viewport.name}`, {
      body: JSON.stringify({ viewport, samples }, null, 2),
      contentType: 'application/json',
    });

    expect(samples.length).toBeGreaterThan(OBSERVE_SECONDS / 2);
    expect(spreadOf(samples.map((s) => s.board))).toBe(0);
    expect(spreadOf(samples.map((s) => s.hand))).toBe(0);

    // 位置が動かなかったことだけでは「一時表示を起こしながら測ったか」が分からない
    // （修正ラウンド1・レビュー指摘 Important 2）。手札の上の通知とライフ減少理由が
    // 30秒の観測のうちどこかで実際に出たことを表明する
    expect(wasEverShown(samples.map((s) => s.handNotice))).toBe(true);
    expect(wasEverShown(samples.map((s) => s.lifeLossReason))).toBe(true);
  });
}
