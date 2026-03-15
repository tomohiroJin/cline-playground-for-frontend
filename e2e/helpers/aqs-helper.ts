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
 */
const PHASE_MARKERS = {
  title: 'アジャイル・クイズすごろく',
  story: '物語',
  sprintStart: 'Sprint',
  quiz: '残り時間',
  retro: '振り返り',
  result: 'グレード',
  guide: 'ガイド',
  studySelect: '勉強会',
  achievement: '実績',
  history: '履歴',
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
      this.page.getByText(PHASE_MARKERS.title).first()
    ).toBeVisible({ timeout: 30_000 });
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
}
