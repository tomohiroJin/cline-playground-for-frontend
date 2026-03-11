/**
 * Primal Path E2E テストヘルパー
 *
 * ゲームの各画面操作を抽象化し、テストの可読性と保守性を向上させる。
 * Page Object パターンに基づき、UI の詳細をカプセル化する。
 */
import { type Page, expect } from '@playwright/test';

/** localStorage のキー（GamePageWrapper の注意事項ダイアログ用） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/primal-path';

/** ゲームフェーズの識別に使うテキストマーカー */
const PHASE_MARKERS = {
  title: '原始進化録',
  diff: 'ステージ選択',
  battle: 'Wave',
  evo: '進化を選べ',
  biome: '次のバイオームを選べ',
  over: '部族は滅びた',
  victory: '神話を刻んだ',
  tree: '永続文明ツリー',
  challenge: 'チャレンジモード',
  event: 'ランダムイベント',
  endless: 'ウェーブ',
  how: 'あそびかた',
} as const;

export class PrimalPathHelper {
  constructor(readonly page: Page) {}

  /* ========== ナビゲーション ========== */

  /**
   * ゲーム画面に遷移する（注意事項ダイアログを自動スキップ）
   *
   * addInitScript を使い、ページ読み込み前に localStorage を設定する。
   * これによりダイアログが表示されず、リロードも不要になる。
   */
  async navigateToGame(): Promise<void> {
    // ページ読み込み前に localStorage を設定
    await this.page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, NOTICE_STORAGE_KEY);

    // webpack 初回バンドルコンパイルを考慮した長めのタイムアウト
    await this.page.goto('/primal-path', { waitUntil: 'domcontentloaded', timeout: 90_000 });
    await expect(this.page.getByText(PHASE_MARKERS.title).first()).toBeVisible({ timeout: 30_000 });
  }

  /* ========== タイトル画面 ========== */

  /** ランを開始する（タイトル→難易度選択→ステージクリック） */
  async startRun(difficulty?: string): Promise<void> {
    await this.page.getByRole('button', { name: /はじめる/ }).click();
    await expect(this.page.getByText(PHASE_MARKERS.diff)).toBeVisible({ timeout: 5_000 });

    const stageSelector = difficulty ?? '原始';
    await this.page.getByText(stageSelector).first().click();
  }

  /** 文明ツリー画面に遷移する */
  async goToTree(): Promise<void> {
    await this.page.getByRole('button', { name: /文明ツリー/ }).click();
    await expect(this.page.getByText(PHASE_MARKERS.tree)).toBeVisible({ timeout: 5_000 });
  }

  /** チャレンジモード画面に遷移する */
  async goToChallenge(): Promise<void> {
    await this.page.getByRole('button', { name: /チャレンジ/ }).click();
    await expect(this.page.getByText(PHASE_MARKERS.challenge)).toBeVisible({ timeout: 5_000 });
  }

  /** 戻るボタンをクリックする */
  async goBack(): Promise<void> {
    await this.page.getByText(/もどる|戻る/).first().click();
  }

  /** ランを開始しバトル画面まで遷移する（中間画面を自動処理） */
  async startRunAndReachBattle(difficulty?: string): Promise<void> {
    await this.startRun(difficulty);
    await this.advanceToPhase('battle');
  }

  /* ========== バトル画面 ========== */

  /** バトルが終了するまで待機する */
  async waitForBattleEnd(timeout = 60_000): Promise<'evo' | 'over' | 'event' | 'biome' | 'awakening'> {
    const result = await Promise.race([
      this.page.getByText(PHASE_MARKERS.evo).waitFor({ timeout }).then(() => 'evo' as const),
      this.page.getByText(/部族は滅びた|神話を刻んだ|探索を終えた/).waitFor({ timeout }).then(() => 'over' as const),
      this.page.getByText(PHASE_MARKERS.event).waitFor({ timeout }).then(() => 'event' as const),
      this.page.getByText(PHASE_MARKERS.biome).waitFor({ timeout }).then(() => 'biome' as const),
      this.page.getByText(/覚醒/).waitFor({ timeout }).then(() => 'awakening' as const),
    ]);
    return result;
  }

  /**
   * 降伏してゲームオーバーにする
   *
   * 現在のフェーズがバトル以外の場合は、中間画面を自動処理して
   * 次のバトル画面に到達してから降伏する。
   */
  async surrender(): Promise<void> {
    // バトル画面に到達するまで中間画面を処理
    await this.advanceToPhase('battle');

    // window.confirm ダイアログを自動承認するハンドラーを登録
    this.page.once('dialog', (dialog) => dialog.accept());

    // 降伏ボタンをクリック（確認ダイアログが表示される）
    const surrenderBtn = this.page.getByText('降伏');
    await surrenderBtn.waitFor({ timeout: 5_000 });
    await surrenderBtn.click();
  }

  /* ========== 進化画面 ========== */

  /** 進化を選択する（0-indexed） */
  async selectEvolution(index = 0): Promise<void> {
    // 進化カードはボタン要素で ATK/HP/DEF テキストを含む
    const cards = this.page.getByRole('button').filter({ hasText: /ATK/ });
    const count = await cards.count();
    if (count > index) {
      await cards.nth(index).click();
    }
  }

  /** 「バトルへ」ボタンをクリック（進化上限到達時） */
  async proceedToBattle(): Promise<void> {
    await this.page.getByText(/バトルへ/).click();
  }

  /* ========== イベント画面 ========== */

  /** イベントの選択肢を選ぶ（0-indexed、disabled ボタンは除外） */
  async chooseEvent(index = 0): Promise<void> {
    // 有効なイベント選択肢のみ対象（disabled=骨不足のボタンを除外）
    const choices = this.page.locator('main button:not([disabled])');
    const count = await choices.count();
    if (count > index) {
      await choices.nth(index).click();
    }
  }

  /* ========== ゲームオーバー画面 ========== */

  /** タイトルに戻る */
  async returnToTitle(): Promise<void> {
    await this.page.getByText('タイトルへ').click();
    await expect(this.page.getByText(PHASE_MARKERS.title).first()).toBeVisible({ timeout: 5_000 });
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

  /* ========== プライベートメソッド ========== */

  /**
   * 指定フェーズに到達するまで中間画面を自動処理する
   *
   * ゲームのフェーズ遷移に応じて適切なアクション（進化選択、イベント選択等）を
   * 自動実行し、目的のフェーズまで進行する。
   */
  private async advanceToPhase(target: 'battle' | 'over', maxIterations = 30): Promise<void> {
    for (let i = 0; i < maxIterations; i++) {
      const phase = await this.getCurrentPhase();

      // 目的フェーズに到達
      if (phase === target) return;
      // ゲームオーバーは常に終了条件
      if (phase === 'over' || phase === 'victory') return;

      // 中間画面を処理
      if (phase === 'evo') {
        await this.selectEvolution(0);
        await this.page.waitForTimeout(800);
        continue;
      }
      if (phase === 'event') {
        // disabled でない有効な選択肢をクリック + オーバーレイ表示(1.2秒)を待つ
        const choices = this.page.locator('main button:not([disabled])');
        const count = await choices.count();
        if (count > 0) {
          await choices.first().click();
          // イベント結果のオーバーレイアニメーション完了を待つ
          await this.page.waitForTimeout(2000);
        } else {
          await this.page.waitForTimeout(1000);
        }
        continue;
      }
      if (phase === 'biome') {
        await this.page.locator('main button').first().click();
        await this.page.waitForTimeout(1000);
        continue;
      }
      if (phase === 'awakening') {
        await this.page.locator('main button').first().click();
        await this.page.waitForTimeout(1000);
        continue;
      }

      // 未知のフェーズまたは遷移中は待機
      await this.page.waitForTimeout(1000);
    }
  }
}
