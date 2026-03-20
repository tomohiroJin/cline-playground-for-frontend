/**
 * Picture Puzzle E2E テストヘルパー
 *
 * ゲームの各画面操作を抽象化し、テストの可読性と保守性を向上させる。
 * Page Object パターンに基づき、UI の詳細をカプセル化する。
 */
import { type Page, expect } from '@playwright/test';

/** デバッグモード起動用のキーシーケンス */
const DEBUG_KEY_SEQUENCE = 'jin';

export class PuzzlePage {
  constructor(readonly page: Page) {}

  /* ========== ナビゲーション ========== */

  /** パズルページに遷移する */
  async navigate(): Promise<void> {
    await this.page.goto('/puzzle', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    // 注意事項モーダルが表示される場合は OK をクリック
    const okButton = this.page.getByRole('dialog').getByText('OK');
    const isNoticeVisible = await okButton.isVisible({ timeout: 5_000 }).catch(() => false);
    if (isNoticeVisible) {
      await okButton.click();
    }
    await expect(
      this.page.getByText('ピクチャーパズル').first()
    ).toBeVisible({ timeout: 30_000 });
  }

  /* ========== タイトル画面 ========== */

  /** タイトル画面が表示されているか確認する */
  async expectTitleScreen(): Promise<void> {
    await expect(this.page.getByText('ピクチャーパズル')).toBeVisible();
    await expect(this.page.getByText('ピースを揃えて絵を完成させよう')).toBeVisible();
    await expect(this.page.getByText('はじめる')).toBeVisible();
  }

  /** 「はじめる」をクリックしてセットアップ画面に進む */
  async startFromTitle(): Promise<void> {
    await this.page.getByText('はじめる').click();
    // セットアップ画面のボタンが表示されるまで待機
    await expect(this.startPuzzleButton).toBeVisible({ timeout: 5_000 });
  }

  /** デバッグモードを有効化する */
  async activateDebugMode(): Promise<void> {
    for (const key of DEBUG_KEY_SEQUENCE) {
      await this.page.keyboard.press(key);
    }
    // キーイベント処理の完了を待機
    await this.page.waitForTimeout(300);
  }

  /* ========== セットアップ画面 ========== */

  /** 「パズルを開始」ボタンのロケーター */
  private get startPuzzleButton() {
    return this.page.getByRole('button', { name: 'パズルを開始' });
  }

  /** セットアップ画面が表示されているか確認する */
  async expectSetupScreen(): Promise<void> {
    await expect(this.startPuzzleButton).toBeVisible();
  }

  /** テーマの最初の画像を選択する */
  async selectFirstImage(): Promise<void> {
    const images = this.page.locator('img[alt]');
    await images.first().click({ timeout: 10_000 });
    // 画像選択後に難易度セレクターが有効化されるまで待機
    await expect(this.startPuzzleButton).toBeVisible();
  }

  /** 難易度（分割数）を選択する */
  async selectDifficulty(division: number): Promise<void> {
    const select = this.page.getByRole('combobox', { name: '難易度を選択' });
    await select.selectOption(String(division));
  }

  /** 「パズルを開始」をクリックしてゲームを開始する */
  async clickStartPuzzle(): Promise<void> {
    await this.startPuzzleButton.click();
    // ゲーム画面のステータスバーが表示されるまで待機
    await expect(this.statusTimer).toBeVisible({ timeout: 10_000 });
  }

  /** セットアップから画像選択 → ゲーム開始まで一括操作する */
  async setupAndStartGame(division: number = 2): Promise<void> {
    await this.startFromTitle();
    await this.selectFirstImage();
    await this.selectDifficulty(division);
    await this.clickStartPuzzle();
  }

  /* ========== ゲーム画面 ========== */

  /** ステータスバーのタイマー表示ロケーター */
  private get statusTimer() {
    return this.page.getByText(/⏱/).first();
  }

  /** ゲーム画面が表示されているか確認する */
  async expectGameScreen(): Promise<void> {
    await expect(this.statusTimer).toBeVisible();
    await expect(this.page.getByText(/👣/).first()).toBeVisible();
    await expect(this.page.getByText(/📊/).first()).toBeVisible();
    await expect(this.hintButton).toBeVisible();
  }

  /** ヒントボタンのロケーター */
  private get hintButton() {
    return this.page.getByRole('button', { name: /ヒントを(表示|隠す)/ });
  }

  /** ヒントボタンをクリックする */
  async toggleHint(): Promise<void> {
    await this.hintButton.click();
  }

  /** ヒント画像が表示されているか確認する */
  async expectHintVisible(): Promise<void> {
    await expect(this.page.getByTitle('ヒント画像')).toBeVisible();
  }

  /** ヒント画像が非表示であることを確認する */
  async expectHintHidden(): Promise<void> {
    await expect(this.page.getByTitle('ヒント画像')).not.toBeVisible();
  }

  /** ピースをクリックする（座標位置で指定） */
  async clickPieceAt(row: number, col: number, division: number): Promise<void> {
    const board = this.page.locator('[title="ボードグリッド"]');
    const box = await board.boundingBox();
    if (!box) throw new Error('ボードが見つかりません');

    const pieceWidth = box.width / division;
    const pieceHeight = box.height / division;
    const x = box.x + col * pieceWidth + pieceWidth / 2;
    const y = box.y + row * pieceHeight + pieceHeight / 2;

    await this.page.mouse.click(x, y);
  }

  /** 手数を取得する */
  async getMoveCount(): Promise<string> {
    const statusText = await this.page.getByText(/👣/).first().textContent();
    return statusText ?? '0';
  }

  /** デバッグ用のパズル完成ボタンをクリックする */
  async completePuzzleForDebug(): Promise<void> {
    const debugButton = this.page.getByText('テスト：パズルを完成させる');
    await debugButton.click({ timeout: 5_000 });
    // 完成アニメーションとリザルト画面表示を待機
    await expect(this.page.getByText('パズルが完成しました！')).toBeVisible({ timeout: 10_000 });
  }

  /** 「ゲームを終了して設定に戻る」をクリックする */
  async endGame(): Promise<void> {
    await this.page.getByRole('button', { name: /設定に戻る/ }).first().click();
    // セットアップ画面に戻るまで待機
    await expect(this.startPuzzleButton).toBeVisible({ timeout: 5_000 });
  }

  /* ========== リザルト画面 ========== */

  /** リザルト画面が表示されているか確認する */
  async expectResultScreen(): Promise<void> {
    await expect(this.page.getByText('パズルが完成しました！')).toBeVisible({ timeout: 10_000 });
  }

  /** 「もう一度」ボタンをクリックする */
  async clickRetry(): Promise<void> {
    await this.page.getByText('もう一度').click({ timeout: 5_000 });
    // ゲーム画面に戻るまで待機
    await expect(this.statusTimer).toBeVisible({ timeout: 10_000 });
  }

  /* ========== ユーティリティ ========== */

  /** localStorage をクリアする */
  async clearStorage(): Promise<void> {
    await this.page.evaluate(() => localStorage.clear());
  }
}
