/**
 * Agile Quiz Sugoroku 基本フロー E2E テスト
 *
 * ゲームの基本的な画面遷移と構造を検証する。
 * ランダムな「内容」ではなく「構造」と「遷移」のみを検証する。
 *
 * E2E テストで検証しないこと（ユニットテストで担保済み）:
 * - 特定の問題が出題されること（ランダム）
 * - 緊急対応イベントの発生/非発生（確率的）
 * - 特定のキャラクターコメントの内容（ランダム）
 * - 特定のコンボ数やスコア値（ランダムな問題選択に依存）
 */
import { test, expect } from '@playwright/test';
import { AqsHelper } from '../helpers/aqs-helper';

test.describe('Agile Quiz Sugoroku - 基本フロー', () => {
  let aqs: AqsHelper;

  test.beforeEach(async ({ page }) => {
    aqs = new AqsHelper(page);
    await aqs.navigateToGame();
    await aqs.resetGameState();
  });

  test('タイトル画面の構成要素が存在する', async ({ page }) => {
    // Assert: タイトルテキスト
    await expect(page.getByText('アジャイル・クイズすごろく')).toBeVisible();

    // Assert: ゲーム開始ボタン
    await expect(page.getByText('Sprint Start')).toBeVisible();

    // Assert: 難易度選択が存在する
    await expect(page.getByText('Easy')).toBeVisible();
    await expect(page.getByText('Normal')).toBeVisible();
    await expect(page.getByText('Hard')).toBeVisible();

    // Assert: 各機能ボタンが存在する
    await expect(page.getByText('勉強会モード')).toBeVisible();
    await expect(page.getByText('Daily Quiz')).toBeVisible();
    await expect(page.getByText('実績')).toBeVisible();
    await expect(page.getByText('履歴')).toBeVisible();
    await expect(page.getByText('遊び方')).toBeVisible();
  });

  test('ゲーム開始操作でスプリント開始画面に遷移する', async ({ page }) => {
    // Act: 1スプリントで開始
    await aqs.startGame({ sprints: 1 });

    // Assert: スプリント開始画面またはストーリー画面に遷移する
    const phase = await aqs.getCurrentPhase();
    expect(['sprintStart', 'story']).toContain(phase);
  });

  test('クイズ画面に問題テキストと4つの選択肢が表示される', async ({ page }) => {
    // Arrange: ゲームを開始してクイズ画面まで進行
    await aqs.startGame({ sprints: 1 });
    await aqs.waitForQuizScreen();

    // Assert: クイズ画面のマーカー（EVENT）が表示される
    await expect(page.getByText('EVENT').first()).toBeVisible();

    // Assert: 選択肢のラベル（A, B, C, D）が表示される
    // 選択肢はボタン内にラベルとして表示される
    const optionA = page.locator('button').filter({ hasText: 'A' });
    const optionB = page.locator('button').filter({ hasText: 'B' });
    const optionC = page.locator('button').filter({ hasText: 'C' });
    const optionD = page.locator('button').filter({ hasText: 'D' });
    await expect(optionA.first()).toBeVisible();
    await expect(optionB.first()).toBeVisible();
    await expect(optionC.first()).toBeVisible();
    await expect(optionD.first()).toBeVisible();
  });

  test('回答後にフィードバックが表示される', async ({ page }) => {
    // Arrange: ゲームを開始してクイズ画面まで進行
    await aqs.startGame({ sprints: 1 });
    await aqs.waitForQuizScreen();

    // Act: キーボードで即座に回答
    await aqs.answerAnyOption();

    // Assert: 正解/不正解/タイムアップいずれかのフィードバックが表示される
    const feedback = page.getByText(/CORRECT|INCORRECT|TIME UP/);
    await expect(feedback.first()).toBeVisible({ timeout: 5_000 });
  });

  test('ゲーム完走後に結果画面が表示されグレードが存在する', async ({ page }) => {
    // Arrange: 1スプリントで開始
    await aqs.startGame({ sprints: 1 });

    // Act: 結果画面まで自動進行
    await aqs.advanceToPhase('result');

    // Assert: 結果画面が表示される
    await aqs.waitForResult();

    // Assert: グレード（S/A/B/C/D のいずれか）が存在する
    const grade = await aqs.getGrade();
    expect(['S', 'A', 'B', 'C', 'D']).toContain(grade);
  });
});
