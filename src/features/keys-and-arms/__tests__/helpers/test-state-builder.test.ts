/**
 * KEYS & ARMS — GameStateBuilder テスト
 */
import { gameState, GameStateBuilder } from './test-state-builder';

describe('GameStateBuilder', () => {
  describe('build', () => {
    it('デフォルト値で GameState を生成する', () => {
      // Arrange & Act
      const state = gameState().build();

      // Assert
      expect(state.state).toBe('title');
      expect(state.hp).toBe(3);
      expect(state.maxHp).toBe(3);
      expect(state.score).toBe(0);
      expect(state.loop).toBe(1);
      expect(state.paused).toBe(false);
    });

    it('デフォルトのステージ状態が初期化される', () => {
      // Arrange & Act
      const state = gameState().build();

      // Assert
      expect(state.cav.pos).toBe(0);
      expect(state.cav.keysPlaced).toBe(0);
      expect(state.grs.kills).toBe(0);
      expect(state.grs.goal).toBe(14);
      expect(state.bos.shields).toBe(1);
    });
  });

  describe('withScreen', () => {
    it('画面状態を設定する', () => {
      // Arrange & Act
      const state = gameState().withScreen('cave').build();

      // Assert
      expect(state.state).toBe('cave');
    });
  });

  describe('withHP', () => {
    it('HP を設定する', () => {
      // Arrange & Act
      const state = gameState().withHP(5).build();

      // Assert
      expect(state.hp).toBe(5);
    });
  });

  describe('withScore', () => {
    it('スコアを設定する', () => {
      // Arrange & Act
      const state = gameState().withScore(1000).build();

      // Assert
      expect(state.score).toBe(1000);
    });
  });

  describe('withLoop', () => {
    it('ループ数を設定する', () => {
      // Arrange & Act
      const state = gameState().withLoop(3).build();

      // Assert
      expect(state.loop).toBe(3);
    });
  });

  describe('withCave', () => {
    it('洞窟ステージの状態を部分的にオーバーライドする', () => {
      // Arrange & Act
      const state = gameState().withCave({ keysPlaced: 2, carrying: true }).build();

      // Assert
      expect(state.cav.keysPlaced).toBe(2);
      expect(state.cav.carrying).toBe(true);
      expect(state.cav.pos).toBe(0); // 未オーバーライド分はデフォルト
    });
  });

  describe('withPrairie', () => {
    it('草原ステージの状態を部分的にオーバーライドする', () => {
      // Arrange & Act
      const state = gameState().withPrairie({ kills: 10, combo: 3 }).build();

      // Assert
      expect(state.grs.kills).toBe(10);
      expect(state.grs.combo).toBe(3);
    });
  });

  describe('withBoss', () => {
    it('ボスステージの状態を部分的にオーバーライドする', () => {
      // Arrange & Act
      const state = gameState().withBoss({ shields: 3, won: true }).build();

      // Assert
      expect(state.bos.shields).toBe(3);
      expect(state.bos.won).toBe(true);
    });
  });

  describe('メソッドチェーン', () => {
    it('複数のオーバーライドを連鎖できる', () => {
      // Arrange & Act
      const state = gameState()
        .withScreen('cave')
        .withHP(5)
        .withScore(500)
        .withLoop(2)
        .withEarnedShields(3)
        .withCave({ keysPlaced: 1 })
        .build();

      // Assert
      expect(state.state).toBe('cave');
      expect(state.hp).toBe(5);
      expect(state.score).toBe(500);
      expect(state.loop).toBe(2);
      expect(state.earnedShields).toBe(3);
      expect(state.cav.keysPlaced).toBe(1);
    });

    it('GameStateBuilder インスタンスを返す', () => {
      // Arrange & Act
      const builder = gameState();

      // Assert
      expect(builder).toBeInstanceOf(GameStateBuilder);
    });
  });
});
