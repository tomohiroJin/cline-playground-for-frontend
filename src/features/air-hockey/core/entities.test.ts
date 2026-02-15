/**
 * Air Hockey - エンティティ生成のテスト
 */
import { EntityFactory } from './entities';
import { CONSTANTS } from './constants';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;

describe('Air Hockey - エンティティ生成', () => {
  // ── EntityFactory.createMallet ───────────────────────

  describe('EntityFactory.createMallet - マレット生成', () => {
    it('指定座標に生成される', () => {
      const mallet = EntityFactory.createMallet(100, 200);
      expect(mallet.x).toBe(100);
      expect(mallet.y).toBe(200);
    });

    it('初期速度は0', () => {
      const mallet = EntityFactory.createMallet(100, 200);
      expect(mallet.vx).toBe(0);
      expect(mallet.vy).toBe(0);
    });
  });

  // ── EntityFactory.createPuck ─────────────────────────

  describe('EntityFactory.createPuck - パック生成', () => {
    it('指定座標に生成される', () => {
      const puck = EntityFactory.createPuck(150, 300);
      expect(puck.x).toBe(150);
      expect(puck.y).toBe(300);
    });

    it('デフォルト初期速度 vy=1.5 で生成される', () => {
      const puck = EntityFactory.createPuck(150, 300);
      expect(puck.vx).toBe(0);
      expect(puck.vy).toBe(1.5);
    });

    it('カスタム速度で生成できる', () => {
      const puck = EntityFactory.createPuck(150, 300, 2, -3);
      expect(puck.vx).toBe(2);
      expect(puck.vy).toBe(-3);
    });

    it('パックは初期状態で可視', () => {
      const puck = EntityFactory.createPuck(150, 300);
      expect(puck.visible).toBe(true);
      expect(puck.invisibleCount).toBe(0);
    });
  });

  // ── EntityFactory.createGameState ────────────────────

  describe('EntityFactory.createGameState - ゲーム状態初期化', () => {
    it('プレイヤーとCPUのマレットが正しく配置される', () => {
      const state = EntityFactory.createGameState();
      expect(state.player.x).toBe(W / 2);
      expect(state.player.y).toBe(H - 70);
      expect(state.cpu.x).toBe(W / 2);
      expect(state.cpu.y).toBe(70);
    });

    it('パックが1つ生成される', () => {
      const state = EntityFactory.createGameState();
      expect(state.pucks).toHaveLength(1);
    });

    it('初期アイテムは空', () => {
      const state = EntityFactory.createGameState();
      expect(state.items).toEqual([]);
    });

    it('初期エフェクトがリセットされている', () => {
      const state = EntityFactory.createGameState();
      expect(state.effects.player.speed).toBeNull();
      expect(state.effects.player.invisible).toBe(0);
      expect(state.effects.cpu.speed).toBeNull();
      expect(state.effects.cpu.invisible).toBe(0);
    });

    it('ゴールエフェクトとフラッシュがnull', () => {
      const state = EntityFactory.createGameState();
      expect(state.goalEffect).toBeNull();
      expect(state.flash).toBeNull();
    });

    it('cpuStuckTimerが0で初期化される', () => {
      const state = EntityFactory.createGameState();
      expect(state.cpuStuckTimer).toBe(0);
    });

    it('field未指定時はobstacleStatesが空配列', () => {
      const state = EntityFactory.createGameState();
      expect(state.obstacleStates).toEqual([]);
    });

    it('破壊可能フィールド指定時はobstacleStatesが生成される', () => {
      const field = {
        id: 'test',
        name: 'Test',
        goalSize: 80,
        color: '#fff',
        destructible: true,
        obstacleHp: 3,
        obstacles: [
          { x: 100, y: 200, r: 15 },
          { x: 200, y: 300, r: 20 },
        ],
      };
      const state = EntityFactory.createGameState(field);
      expect(state.obstacleStates).toHaveLength(2);
      expect(state.obstacleStates[0]).toEqual({ hp: 3, maxHp: 3, destroyedAt: null });
      expect(state.obstacleStates[1]).toEqual({ hp: 3, maxHp: 3, destroyedAt: null });
    });

    it('非破壊フィールド指定時はobstacleStatesが空配列', () => {
      const field = {
        id: 'test',
        name: 'Test',
        goalSize: 80,
        color: '#fff',
        obstacles: [{ x: 100, y: 200, r: 15 }],
      };
      const state = EntityFactory.createGameState(field);
      expect(state.obstacleStates).toEqual([]);
    });
  });
});
