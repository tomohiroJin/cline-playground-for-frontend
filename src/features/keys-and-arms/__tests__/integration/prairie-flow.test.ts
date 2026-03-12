/**
 * KEYS & ARMS — 草原ステージ統合テスト
 *
 * TestEngine を使用し、草原ステージの状態遷移を検証する。
 */
import { createTestEngine } from '../helpers/test-engine';

describe('草原ステージ統合テスト', () => {
  /** 草原ステージまで進行するヘルパー */
  function startPrairie() {
    const engine = createTestEngine();
    engine.startGame();
    // 洞窟を直接クリアして草原に遷移
    engine.G.cav.keysPlaced = 3;
    engine.G.cav.won = true;
    engine.G.state = 'grass';
    engine.G.grsInit?.();
    return engine;
  }

  it('草原ステージが初期化される', () => {
    // Arrange & Act
    const engine = startPrairie();

    // Assert
    expect(engine.G.state).toBe('grass');
    expect(engine.G.grs.kills).toBe(0);
    expect(engine.G.grs.goal).toBeGreaterThan(0);
    expect(engine.G.grs.combo).toBe(0);
  });

  it('草原ステージで敵リストが初期化される', () => {
    // Arrange & Act
    const engine = startPrairie();

    // Assert
    expect(engine.G.grs.ens).toBeDefined();
    expect(Array.isArray(engine.G.grs.ens)).toBe(true);
  });

  it('草原ステージのキル目標はループに応じて設定される', () => {
    // Arrange & Act
    const engine = startPrairie();

    // Assert — ループ1のデフォルト目標は14
    expect(engine.G.grs.goal).toBe(14);
  });

  it('草原ステージでティックが正常に進行する', () => {
    // Arrange
    const engine = startPrairie();
    const tickBefore = engine.G.tick;

    // Act
    engine.advanceTicks(50);

    // Assert
    expect(engine.G.tick).toBe(tickBefore + 50);
    expect(engine.G.state).toBe('grass');
  });

  it('草原ステージでシールド獲得の閾値が設定される', () => {
    // Arrange & Act
    const engine = startPrairie();

    // Assert
    expect(engine.G.grs.nextShieldAt).toBe(5);
  });
});
