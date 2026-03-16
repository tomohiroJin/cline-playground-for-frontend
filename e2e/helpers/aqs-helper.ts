/**
 * Agile Quiz Sugoroku E2E テストヘルパー
 *
 * ゲームの各画面操作を抽象化し、テストの可読性と保守性を向上させる。
 * Page Object パターンに基づき、UI の詳細をカプセル化する。
 *
 * 設計方針:
 * - ランダムな「内容」ではなく「構造」と「遷移」を検証する
 * - 確率的要素（緊急対応の発生等）はE2Eの検証対象外
 * - 中間画面は自動処理して目的のフェーズまで進行する
 */
import { type Page, expect } from '@playwright/test';

/** localStorage のキー（GamePageWrapper の注意事項ダイアログ用） */
const NOTICE_STORAGE_KEY = 'game-notice-accepted:/agile-quiz-sugoroku';

/**
 * ゲームフェーズの識別に使うテキストマーカー
 *
 * 各フェーズで画面上に表示されるテキストをもとにフェーズを判定する。
 * 検出順序が重要: より限定的なマーカーを先に配置する。
 *
 * 注意: 実際の UI テキストに合わせて設定（コンポーネントソース確認済み）
 */
const PHASE_MARKERS = {
  studyResult: 'STUDY RESULT',
  dailyQuiz: 'DAILY QUIZ',
  studySelect: 'STUDY MODE',
  achievement: 'ACHIEVEMENTS',
  history: 'HISTORY',
  result: 'BUILD SUCCESS',
  retro: 'RETROSPECTIVE',
  story: 'スキップ',
  sprintStart: 'Begin Sprint',
  quiz: 'EVENT',
  guide: '遊び方',
  title: 'Sprint Start',
} as const;

export class AqsHelper {
  constructor(readonly page: Page) {}

  /* ========== ナビゲーション ========== */

  /**
   * ゲーム画面に遷移する（注意事項ダイアログを自動スキップ）
   *
   * addInitScript を使い、ページ読み込み前に localStorage を設定する。
   * これによりダイアログが表示されず、リロードも不要になる。
   */
  async navigateToGame(): Promise<void> {
    await this.page.addInitScript((key) => {
      localStorage.setItem(key, 'true');
    }, NOTICE_STORAGE_KEY);

    // webpack 初回バンドルコンパイルを考慮した長めのタイムアウト
    await this.page.goto('/agile-quiz-sugoroku', {
      waitUntil: 'domcontentloaded',
      timeout: 90_000,
    });
    await expect(
      this.page.getByText('アジャイル・クイズすごろく').first()
    ).toBeVisible({ timeout: 30_000 });
  }

  /**
   * ゲームを開始する（難易度・スプリント数を指定可能）
   *
   * タイトル画面から難易度・スプリント数を選択し、Sprint Start をクリック。
   * セーブデータ上書き確認ダイアログが出た場合は自動承認する。
   */
  async startGame(options?: {
    difficulty?: string;
    sprints?: number;
  }): Promise<void> {
    // スプリント数の選択（デフォルトはそのまま）
    if (options?.sprints) {
      await this.page
        .getByText(`${options.sprints}`, { exact: true })
        .click();
    }

    // 難易度の選択（デフォルトはそのまま）
    if (options?.difficulty) {
      await this.page.getByText(options.difficulty).first().click();
    }

    // window.confirm ダイアログを自動承認するハンドラーを登録
    this.page.once('dialog', (dialog) => dialog.accept());

    // Sprint Start をクリック
    await this.page.getByText('Sprint Start').click();

    // 画面遷移を待機
    await this.page.waitForTimeout(1000);
  }

  /** 勉強会モード画面に遷移する */
  async goToStudyMode(): Promise<void> {
    await this.page.getByText('勉強会モード').click();
    await expect(
      this.page.getByText('STUDY MODE').first()
    ).toBeVisible({ timeout: 5_000 });
  }

  /** 履歴画面に遷移する */
  async goToHistory(): Promise<void> {
    await this.page.getByText('履歴').click();
    await expect(
      this.page.getByText('HISTORY').first()
    ).toBeVisible({ timeout: 5_000 });
  }

  /** 実績画面に遷移する */
  async goToAchievements(): Promise<void> {
    await this.page.getByText('実績').click();
    await expect(
      this.page.getByText('ACHIEVEMENTS').first()
    ).toBeVisible({ timeout: 5_000 });
  }

  /** ガイド画面に遷移する */
  async goToGuide(): Promise<void> {
    await this.page.getByText('遊び方').click();
    await this.page.waitForTimeout(500);
  }

  /** デイリークイズ画面に遷移する */
  async goToDailyQuiz(): Promise<void> {
    await this.page.getByText('Daily Quiz').click();
    await expect(
      this.page.getByText('DAILY QUIZ').first()
    ).toBeVisible({ timeout: 5_000 });
  }

  /** 戻るボタンをクリックする */
  async goBack(): Promise<void> {
    await this.page.getByText(/戻る/).first().click();
  }

  /* ========== クイズ操作 ========== */

  /**
   * 表示されている選択肢のうち任意の1つをクリックする。
   * キーボードショートカット（数字キー 1）を使用して即座に回答する。
   */
  async answerAnyOption(): Promise<void> {
    await this.page.keyboard.press('1');
  }

  /**
   * クイズ画面が表示されるまで待機する。
   * ストーリー画面やスプリント開始画面が表示されている場合は自動スキップする。
   */
  async waitForQuizScreen(): Promise<void> {
    const maxAttempts = 30;
    for (let i = 0; i < maxAttempts; i++) {
      const phase = await this.getCurrentPhase();
      if (phase === 'quiz') return;

      // ストーリー画面はスキップ
      if (phase === 'story') {
        await this.skipStory();
        continue;
      }

      // スプリント開始画面は Enter で進む
      if (phase === 'sprintStart') {
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(1000);
        continue;
      }

      await this.page.waitForTimeout(1000);
    }
  }

  /* ========== フェーズ検出 ========== */

  /**
   * 現在のフェーズを取得する。
   * 複数のフェーズマーカーを監視し、最初にマッチしたフェーズを返す。
   */
  async getCurrentPhase(): Promise<string> {
    for (const [phase, marker] of Object.entries(PHASE_MARKERS)) {
      const isVisible = await this.page
        .getByText(marker)
        .first()
        .isVisible()
        .catch(() => false);
      if (isVisible) return phase;
    }
    return 'unknown';
  }

  /**
   * 中間画面を自動処理しながら目的フェーズまで進行する。
   *
   * ストーリー画面はスキップ、スプリント開始画面は Enter で進む、
   * クイズ画面はキーボードで即座に回答、振り返り画面は Enter で進む。
   */
  async advanceToPhase(
    target: string,
    maxIterations = 80
  ): Promise<void> {
    for (let i = 0; i < maxIterations; i++) {
      const phase = await this.getCurrentPhase();

      // 目的フェーズに到達
      if (phase === target) return;

      // ストーリー画面はスキップ
      if (phase === 'story') {
        await this.skipStory();
        continue;
      }

      // スプリント開始画面は Enter で進む
      if (phase === 'sprintStart') {
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(1000);
        continue;
      }

      // クイズ画面は即座にキーボードで回答 → Enter で次へ
      if (phase === 'quiz') {
        // まず回答（タイマーが切れる前に即座に）
        await this.page.keyboard.press('1');
        await this.page.waitForTimeout(1000);
        // Next / Retrospective ボタンを Enter で押す
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(500);
        continue;
      }

      // 振り返り画面は Enter で次のスプリントまたはリリースへ
      if (phase === 'retro') {
        await this.page.keyboard.press('Enter');
        await this.page.waitForTimeout(1000);
        continue;
      }

      // 未知のフェーズまたは遷移中は待機
      await this.page.waitForTimeout(1000);
    }
  }

  /** 結果画面が表示されるまで待機する */
  async waitForResult(): Promise<void> {
    // 結果画面はアニメーションシーケンスがあるため長めに待機
    // BUILD SUCCESS → グレード表示のシーケンス
    await expect(
      this.page.getByText('BUILD SUCCESS').first()
    ).toBeVisible({ timeout: 60_000 });
    // アニメーション完了を待機（step 0: 800ms + step 1: 1500ms + step 2: 1000ms）
    await this.page.waitForTimeout(5000);
  }

  /** 結果画面からグレード（S/A/B/C/D）を取得する */
  async getGrade(): Promise<string> {
    await this.waitForResult();
    // グレードは大きな円の中に表示される（S, A, B, C, D）
    for (const grade of ['S', 'A', 'B', 'C', 'D']) {
      const isVisible = await this.page
        .getByText(grade, { exact: true })
        .first()
        .isVisible()
        .catch(() => false);
      if (isVisible) return grade;
    }
    return 'unknown';
  }

  /* ========== ストーリー ========== */

  /** ストーリー画面をスキップする（Escape キーで即座にスキップ） */
  async skipStory(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(1000);
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
    await this.page.waitForTimeout(3000);
  }
}
