/**
 * KEYS & ARMS — ボスステージ統合テスト
 *
 * TestEngine を使用し、ボスステージの状態遷移を検証する。
 */
import { createTestEngine } from '../helpers/test-engine';

describe('ボスステージ統合テスト', () => {
  /** ボスステージまで進行するヘルパー */
  function startBoss() {
    const engine = createTestEngine();
    engine.startGame();
    // ボスステージに直接遷移
    engine.G.state = 'boss';
    engine.G.bosInit?.();
    return engine;
  }

  it('ボスステージが初期化される', () => {
    // Arrange & Act
    const engine = startBoss();

    // Assert
    expect(engine.G.state).toBe('boss');
    expect(engine.G.bos.peds).toHaveLength(6);
    expect(engine.G.bos.armStage).toHaveLength(6);
    expect(engine.G.bos.won).toBe(false);
  });

  it('ボスステージの台座は全て空で初期化される', () => {
    // Arrange & Act
    const engine = startBoss();

    // Assert
    expect(engine.G.bos.peds.every((p: number) => p === 0)).toBe(true);
  });

  it('ボスステージのシールド数はearnedShieldsに基づく', () => {
    // Arrange
    const engine = createTestEngine();
    engine.startGame();
    engine.G.earnedShields = 2;
    engine.G.state = 'boss';
    engine.G.bosInit?.();

    // Assert — Difficulty.bossShields(2) = min(5, 1 + 2) = 3
    expect(engine.G.bos.shields).toBe(3);
  });

  it('ボスステージでティックが正常に進行する', () => {
    // Arrange
    const engine = startBoss();
    const tickBefore = engine.G.tick;

    // Act
    engine.advanceTicks(50);

    // Assert
    expect(engine.G.tick).toBe(tickBefore + 50);
    expect(engine.G.state).toBe('boss');
  });

  it('ボスステージの腕は休止状態で初期化される', () => {
    // Arrange & Act
    const engine = startBoss();

    // Assert
    expect(engine.G.bos.armResting.every((r: boolean) => r === true)).toBe(true);
  });
});
