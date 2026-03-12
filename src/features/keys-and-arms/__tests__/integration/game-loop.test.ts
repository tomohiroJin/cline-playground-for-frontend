/**
 * KEYS & ARMS — ゲームループ統合テスト
 *
 * ステージ間遷移・ループ進行・ハイスコア保存を検証する。
 */
import { createTestEngine } from '../helpers/test-engine';

describe('ゲームループ統合テスト', () => {
  it('ゲーム開始時はループ1で洞窟ステージから始まる', () => {
    // Arrange
    const engine = createTestEngine();

    // Act
    engine.startGame();

    // Assert
    expect(engine.G.loop).toBe(1);
    expect(engine.G.state).toBe('cave');
    expect(engine.G.score).toBe(0);
  });

  it('タイトル画面で↑キーを押すとヘルプに遷移する', () => {
    // Arrange
    const engine = createTestEngine();

    // Act
    engine.pressKeyAndTick('ArrowUp');

    // Assert
    expect(engine.G.state).toBe('help');
    expect(engine.G.helpPage).toBe(0);
  });

  it('ポーズ中にESCでリセット確認に遷移する', () => {
    // Arrange
    const engine = createTestEngine();
    engine.startGame();

    // Act — ポーズ → ESC
    engine.pressKeyAndTick('p');
    expect(engine.G.paused).toBe(true);

    engine.pressKeyAndTick('Escape');

    // Assert
    expect(engine.G.paused).toBe(false);
    expect(engine.G.resetConfirm).toBe(90);
  });

  it('リセット確認中にアクションキーでタイトルに戻る', () => {
    // Arrange
    const engine = createTestEngine();
    engine.startGame();
    engine.G.score = 100;
    engine.G.resetConfirm = 90;

    // Act
    engine.pressKeyAndTick('z');

    // Assert
    expect(engine.G.state).toBe('title');
    expect(engine.G.resetConfirm).toBe(0);
  });

  it('ハイスコアがストレージに保存される', () => {
    // Arrange
    const engine = createTestEngine();
    engine.startGame();
    engine.G.score = 500;
    engine.G.hi = 0;
    engine.G.resetConfirm = 90;

    // Act — リセット確認でタイトルに戻る（ハイスコア保存トリガー）
    engine.pressKeyAndTick('z');

    // Assert
    expect(engine.G.hi).toBe(500);
    expect(engine.storage.getHighScore()).toBe(500);
  });

  it('ヒットストップ中はゲームティックがスキップされる', () => {
    // Arrange
    const engine = createTestEngine();
    engine.startGame();
    engine.G.hitStop = 3;
    const cavPosBefore = engine.G.cav.pos;

    // Act
    engine.advanceTicks(3);

    // Assert — ヒットストップ消化後もステージ位置は変わらない
    expect(engine.G.hitStop).toBe(0);
    expect(engine.G.cav.pos).toBe(cavPosBefore);
  });

  it('初期ハイスコアがストレージから読み込まれる', () => {
    // Arrange & Act
    const engine = createTestEngine({ initialHighScore: 1000 });

    // Assert
    expect(engine.G.hi).toBe(1000);
  });
});
