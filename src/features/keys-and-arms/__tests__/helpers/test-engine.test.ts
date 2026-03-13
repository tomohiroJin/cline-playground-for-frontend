/**
 * KEYS & ARMS — TestEngine テスト
 */
import { createTestEngine } from './test-engine';

describe('TestEngine', () => {
  it('初期状態はタイトル画面', () => {
    // Arrange & Act
    const engine = createTestEngine();

    // Assert
    expect(engine.G.state).toBe('title');
    expect(engine.G.hp).toBe(3);
    expect(engine.G.loop).toBe(1);
  });

  it('ティックを進行できる', () => {
    // Arrange
    const engine = createTestEngine();

    // Act
    engine.advanceTicks(10);

    // Assert
    expect(engine.G.tick).toBe(10);
  });

  it('キー入力でヘルプ画面に遷移する', () => {
    // Arrange
    const engine = createTestEngine();

    // Act
    engine.pressKeyAndTick('ArrowUp');

    // Assert
    expect(engine.G.state).toBe('help');
  });

  it('ゲームを開始できる', () => {
    // Arrange
    const engine = createTestEngine();

    // Act
    engine.startGame();

    // Assert
    expect(engine.G.state).toBe('cave');
  });

  it('初期ハイスコアを設定できる', () => {
    // Arrange & Act
    const engine = createTestEngine({ initialHighScore: 500 });

    // Assert
    expect(engine.G.hi).toBe(500);
  });

  it('ポーズの切り替えができる', () => {
    // Arrange
    const engine = createTestEngine();
    engine.startGame();

    // Act
    engine.pressKeyAndTick('p');

    // Assert
    expect(engine.G.paused).toBe(true);

    // Act
    engine.pressKeyAndTick('p');

    // Assert
    expect(engine.G.paused).toBe(false);
  });

  it('advanceUntilScreen で指定画面まで進行する', () => {
    // Arrange
    const engine = createTestEngine();

    // Act（タイトルから開始するので既に title）
    engine.advanceUntilScreen('title');

    // Assert
    expect(engine.G.state).toBe('title');
  });

  it('advanceUntilScreen で到達できない場合エラーを投げる', () => {
    // Arrange
    const engine = createTestEngine();

    // Act & Assert
    expect(() => engine.advanceUntilScreen('boss', 10)).toThrow('10 ティック以内に画面');
  });
});
