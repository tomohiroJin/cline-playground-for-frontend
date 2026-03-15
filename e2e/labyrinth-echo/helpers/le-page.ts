/**
 * 迷宮の残響 E2E テストヘルパー
 *
 * Page Object Model パターンで UI 操作を抽象化する。
 * テストの可読性と保守性を向上させる。
 */
import { type Page, expect } from '@playwright/test';

/** localStorage のキー（GamePageWrapper の注意事項ダイアログ用） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/labyrinth-echo';

/** ゲームフェーズの識別に使うテキストマーカー */
const PHASE_MARKERS = {
  title: '迷宮の残響',
  difficulty: '難易度選択',
  floorIntro: '表層回廊',
  event: '選択肢',
  result: '先に進む',
  gameOver: '探索失敗',
  ending: '脱出',
  unlocks: '知見の継承',
  settings: '設定',
} as const;

export class LEPage {
  constructor(readonly page: Page) {}

  /* ========== ナビゲーション ========== */

  /**
   * ゲーム画面に遷移する（注意事項ダイアログを自動スキップ）
   *
   * addInitScript を使い、ページ読み込み前に localStorage を設定する。
   */
  async goto(): Promise<void> {
    // ページ読み込み前に localStorage を設定
    await this.page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, NOTICE_STORAGE_KEY);

    // webpack 初回バンドルコンパイルを考慮した長めのタイムアウト
    await this.page.goto('/labyrinth-echo', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(this.page.getByText(PHASE_MARKERS.title).first()).toBeVisible({ timeout: 30_000 });
  }

  /* ========== タイトル画面 ========== */

  /** ゲームを開始する（タイトル→難易度選択） */
  async startGame(): Promise<void> {
    await this.page.getByText(/探索を開始/).click();
    await expect(this.page.getByText(PHASE_MARKERS.difficulty)).toBeVisible({ timeout: 5_000 });
  }

  /* ========== 難易度選択画面 ========== */

  /** 難易度を選択する */
  async selectDifficulty(name: string = '探索者'): Promise<void> {
    await this.page.getByText(name).first().click();
  }

  /* ========== seed 注入 ========== */

  /**
   * テスト用 seed 固定乱数を window.__LE_TEST_RNG__ に注入する。
   *
   * addInitScript を使い、ページ読み込み前に window に seed を設定する。
   * ゲームロジック側で window.__LE_TEST_RNG__ が存在する場合に
   * SeededRandomSource として使用することを想定。
   */
  async injectSeededRng(seed: number): Promise<void> {
    await this.page.addInitScript((s) => {
      (window as unknown as Record<string, unknown>).__LE_TEST_RNG__ = s;
    }, seed);
  }

  /* ========== フェーズ検出 ========== */

  /** 現在のフェーズをテキストマーカーから推定する */
  async getCurrentPhase(): Promise<string> {
    for (const [phase, marker] of Object.entries(PHASE_MARKERS)) {
      const isVisible = await this.page.getByText(marker).first().isVisible().catch(() => false);
      if (isVisible) return phase;
    }
    return 'unknown';
  }

  /* ========== ユーティリティ ========== */

  /** localStorage をクリアしてゲーム状態をリセットする（注意事項の受諾は維持） */
  async resetGameState(): Promise<void> {
    await this.page.evaluate((key) => {
      const noticeAccepted = localStorage.getItem(key);
      localStorage.clear();
      if (noticeAccepted) {
        localStorage.setItem(key, noticeAccepted);
      }
    }, NOTICE_STORAGE_KEY);
  }

  /** ページをリロードする */
  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await expect(this.page.getByText(PHASE_MARKERS.title).first()).toBeVisible({ timeout: 15_000 });
  }

  /** 指定テキストが画面に表示されるまで待機する */
  async waitForText(text: string | RegExp, timeout = 10_000): Promise<void> {
    await this.page.getByText(text).first().waitFor({ timeout });
  }

  /** 指定テキストが画面に表示されていることを検証する */
  async expectVisible(text: string | RegExp): Promise<void> {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  /** 戻るボタンをクリックする */
  async goBack(): Promise<void> {
    await this.page.getByText(/戻る/).first().click();
  }
}
