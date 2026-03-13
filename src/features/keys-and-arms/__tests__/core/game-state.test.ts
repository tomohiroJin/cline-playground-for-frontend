import { createInitialGameState } from '../../core/game-state';

describe('createInitialGameState', () => {
  it('初期画面状態が title である', () => {
    // Arrange
    const kd: Record<string, boolean> = {};
    const jp: Record<string, boolean> = {};

    // Act
    const G = createInitialGameState(kd, jp, 0);

    // Assert
    expect(G.state).toBe('title');
  });

  it('初期HPが3である', () => {
    // Arrange
    const kd: Record<string, boolean> = {};
    const jp: Record<string, boolean> = {};

    // Act
    const G = createInitialGameState(kd, jp, 0);

    // Assert
    expect(G.hp).toBe(3);
    expect(G.maxHp).toBe(3);
  });

  it('入力オブジェクトが共有される', () => {
    // Arrange
    const kd: Record<string, boolean> = {};
    const jp: Record<string, boolean> = {};

    // Act
    const G = createInitialGameState(kd, jp, 0);

    // Assert
    expect(G.kd).toBe(kd);
    expect(G.jp).toBe(jp);
  });

  it('初期スコアが0である', () => {
    // Arrange
    const kd: Record<string, boolean> = {};
    const jp: Record<string, boolean> = {};

    // Act
    const G = createInitialGameState(kd, jp, 0);

    // Assert
    expect(G.score).toBe(0);
    expect(G.dispScore).toBe(0);
  });

  it('初期ループが1である', () => {
    // Arrange
    const kd: Record<string, boolean> = {};
    const jp: Record<string, boolean> = {};

    // Act
    const G = createInitialGameState(kd, jp, 0);

    // Assert
    expect(G.loop).toBe(1);
  });

  it('ハイスコアが引数で注入される', () => {
    // Arrange
    const kd: Record<string, boolean> = {};
    const jp: Record<string, boolean> = {};

    // Act
    const G = createInitialGameState(kd, jp, 5000);

    // Assert
    expect(G.hi).toBe(5000);
  });
});
