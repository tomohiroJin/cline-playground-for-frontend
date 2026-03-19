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

  /** ゲーム開始 → 難易度選択 → フロア進入 までを一括で行う */
  async startAndEnterFloor(difficulty: string = '探索者'): Promise<void> {
    await this.startGame();
    await this.selectDifficulty(difficulty);
    await expect(this.page.getByText(/表層回廊/).first()).toBeVisible({ timeout: 10_000 });
    await this.page.click('body');
    await this.page.waitForTimeout(1500);
  }

  /* ========== フロア紹介画面 ========== */

  /** フロア紹介画面に進入する（画面上のクリック可能な要素をクリック） */
  async enterFloor(): Promise<void> {
    // フロア紹介画面ではクリックまたはキー押下で進行
    await this.page.keyboard.press('Enter');
  }

  /* ========== イベント画面 ========== */

  /** 選択肢をインデックスで選択する（0始まり） */
  async makeChoice(index: number): Promise<void> {
    // 選択肢はテキストを含むボタン/要素として表示される
    // 数字キーで選択（1始まり）
    await this.page.keyboard.press(`${index + 1}`);
  }

  /* ========== 結果画面 ========== */

  /** 結果画面で「先に進む」をクリックする */
  async proceed(): Promise<void> {
    await this.page.getByText(/先に進む/).first().click({ timeout: 10_000 });
  }

  /* ========== テキスト表示 ========== */

  /** テキスト表示の完了を待つ（スペースキーでスキップ） */
  async skipTextReveal(): Promise<void> {
    await this.page.keyboard.press('Space');
    // 少し待って表示が完了するのを確認
    await this.page.waitForTimeout(300);
  }

  /* ========== ゲームオーバー / エンディング ========== */

  /** ゲームオーバー画面からタイトルに戻る */
  async returnToTitle(): Promise<void> {
    await this.page.getByText(/タイトルに戻る|タイトルへ/).first().click({ timeout: 10_000 });
    await expect(this.page.getByText(PHASE_MARKERS.title).first()).toBeVisible({ timeout: 10_000 });
  }

  /* ========== アンロック画面 ========== */

  /** タイトル画面からアンロック画面に遷移する */
  async goToUnlocks(): Promise<void> {
    await this.page.getByText(/知見の継承/).first().click({ timeout: 15_000 });
  }

  /** アンロック画面でアイテムを購入する */
  async purchaseUnlock(name: string): Promise<void> {
    await this.page.getByText(name).first().click({ timeout: 5_000 });
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

  /** 指定フェーズになるまで待機する */
  async waitForPhase(phase: keyof typeof PHASE_MARKERS, timeout = 15_000): Promise<void> {
    const marker = PHASE_MARKERS[phase];
    await this.page.getByText(marker).first().waitFor({ state: 'visible', timeout });
  }

  /** ゲームオーバー画面を待機する */
  async waitForGameOver(timeout = 15_000): Promise<void> {
    await this.page.getByText(PHASE_MARKERS.gameOver).first().waitFor({ state: 'visible', timeout });
  }

  /** エンディング/勝利画面を待機する */
  async waitForVictory(timeout = 15_000): Promise<void> {
    // 勝利画面にはエンディング名が表示される
    await this.page.getByText(/帰還|脱出|覇者|生還/).first().waitFor({ state: 'visible', timeout });
  }

  /* ========== ステータス取得 ========== */

  /** 画面上のKP表示を取得する */
  async getKP(): Promise<string | null> {
    const kpElement = this.page.getByText(/KP|知見/).first();
    const isVisible = await kpElement.isVisible().catch(() => false);
    if (!isVisible) return null;
    return kpElement.textContent();
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

  /**
   * イベント→結果→次イベントを1サイクル進める
   * @returns true: 次イベントに進めた / false: ゲームオーバー等で進行不能
   */
  async playOneEvent(choiceIndex = 0): Promise<boolean> {
    try {
      // ゲームオーバーやエンディングの場合は進行不能
      const isGameOver = await this.page.getByText('探索失敗').first().isVisible().catch(() => false);
      if (isGameOver) return false;

      // テキスト表示をスキップ（連打で確実にスキップ）
      for (let i = 0; i < 3; i++) {
        await this.page.keyboard.press('Space');
        await this.page.waitForTimeout(200);
      }

      // 選択肢が表示されるのを待つ（選択肢ボタンの出現を確認）
      const choiceBtn = this.page.locator(`button:has-text("[${choiceIndex + 1}]")`).first();
      try {
        await choiceBtn.waitFor({ state: 'visible', timeout: 5_000 });
      } catch {
        // 選択肢が見つからない — ゲームオーバーかもしれない
        return false;
      }

      // 選択肢を選ぶ（数字キー）
      await this.makeChoice(choiceIndex);

      // 結果画面の表示を待つ: 「先に進む」or「探索失敗」のいずれかが表示されるまで待機
      const advanceBtn = this.page.getByText(/先に進む/).first();
      const gameOverText = this.page.getByText('探索失敗').first();

      // テキスト表示スキップを繰り返しながら待機
      for (let i = 0; i < 20; i++) {
        await this.page.keyboard.press('Space');
        await this.page.waitForTimeout(500);

        const hasAdvance = await advanceBtn.isVisible().catch(() => false);
        if (hasAdvance) {
          await advanceBtn.click();
          await this.page.waitForTimeout(1000);

          // フロア紹介画面の場合は自動で進入
          const isFloorIntro = await this.page.getByText(
            /表層回廊|灰色の迷路|深淵の間|忘却の底|迷宮の心臓/
          ).first().isVisible().catch(() => false);
          if (isFloorIntro) {
            await this.page.click('body');
            await this.page.waitForTimeout(1500);
          }
          return true;
        }

        const isDead = await gameOverText.isVisible().catch(() => false);
        if (isDead) return false;
      }

      // タイムアウト — 進行不能
      return false;
    } catch {
      return false;
    }
  }

  /**
   * 指定フェーズに到達するまでイベントを進行する
   * @param targetPhase 到達したいフェーズ
   * @param maxEvents 最大イベント数（安全弁）
   * @returns 到達したフェーズ
   */
  async playUntilPhase(
    targetPhase: 'gameOver' | 'ending' | 'title',
    maxEvents = 20,
  ): Promise<string> {
    for (let i = 0; i < maxEvents; i++) {
      const phase = await this.getCurrentPhase();
      if (phase === targetPhase) return phase;
      if (phase === 'gameOver' || phase === 'ending') return phase;

      const continued = await this.playOneEvent(0);
      if (!continued) break;
    }
    return this.getCurrentPhase();
  }
}
