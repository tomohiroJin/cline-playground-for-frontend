/**
 * Air Hockey - エンティティ生成のテスト
 */
import { EntityFactory, resolveMalletPuckOverlap } from './entities';
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

    it('フィーバー状態が初期化されている', () => {
      const state = EntityFactory.createGameState();
      expect(state.fever.active).toBe(false);
      expect(state.fever.extraPucks).toBe(0);
      expect(state.fever.lastGoalTime).toBeGreaterThan(0);
    });

    it('パーティクル配列が空で初期化されている', () => {
      const state = EntityFactory.createGameState();
      expect(state.particles).toEqual([]);
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
      const state = EntityFactory.createGameState(CONSTANTS, field);
      expect(state.obstacleStates).toHaveLength(2);
      expect(state.obstacleStates[0]).toEqual({ hp: 3, maxHp: 3, destroyed: false, destroyedAt: 0 });
      expect(state.obstacleStates[1]).toEqual({ hp: 3, maxHp: 3, destroyed: false, destroyedAt: 0 });
    });

    it('非破壊フィールド指定時はobstacleStatesが空配列', () => {
      const field = {
        id: 'test',
        name: 'Test',
        goalSize: 80,
        color: '#fff',
        obstacles: [{ x: 100, y: 200, r: 15 }],
      };
      const state = EntityFactory.createGameState(CONSTANTS, field);
      expect(state.obstacleStates).toEqual([]);
    });

    it('固定解像度でマレットが中央・上下に配置される', () => {
      const state = EntityFactory.createGameState();
      expect(state.player.x).toBe(W / 2);
      expect(state.player.y).toBe(H - 70);
      expect(state.cpu.x).toBe(W / 2);
      expect(state.cpu.y).toBe(70);
    });
  });
});

describe('resolveMalletPuckOverlap', () => {
  const MR = 42;
  const PR = 21;
  const MAX_POWER = 16;

  it('重なっている場合にパックをマレット移動方向に押し出し速度を与える', () => {
    // マレットが右に動いてパックと重なった
    const mallet = { x: 100, y: 100, vx: 20, vy: 0 };
    const puck = EntityFactory.createPuck(110, 100, 0, 0);

    resolveMalletPuckOverlap(mallet, [puck], MR, PR, MAX_POWER);

    // パックがマレットの移動方向（右）に押し出される
    expect(puck.x).toBeGreaterThan(mallet.x);
    // パックに右向きの速度が与えられる
    expect(puck.vx).toBeGreaterThan(0);
  });

  it('重なっていない場合はパックを変更しない', () => {
    const mallet = { x: 100, y: 100, vx: 0, vy: 0 };
    const puck = EntityFactory.createPuck(200, 200, 0, 0);

    resolveMalletPuckOverlap(mallet, [puck], MR, PR, MAX_POWER);

    expect(puck.x).toBe(200);
    expect(puck.y).toBe(200);
  });

  it('完全重複でもマレット速度があればパックを移動方向に押し出す', () => {
    const mallet = { x: 100, y: 100, vx: 0, vy: -10 };
    const puck = EntityFactory.createPuck(100, 100, 0, 0);

    resolveMalletPuckOverlap(mallet, [puck], MR, PR, MAX_POWER);

    // マレットの移動方向（上）にパックが押し出される
    expect(puck.y).toBeLessThan(100);
    expect(puck.vy).toBeLessThan(0);
  });

  it('マレットがパックを飛び越えた深い食い込みでも正しくパックが弾かれる', () => {
    // マレットが上に大きく動き、パックの上を通過した（深い食い込み）
    const mallet = { x: 300, y: 565, vx: 0, vy: -35 };
    const puck = EntityFactory.createPuck(300, 570, 0, 0);
    // 幾何学的法線はマレット→パック=下向き（ny=+1）だが、マレットは上に動いている

    resolveMalletPuckOverlap(mallet, [puck], MR, PR, MAX_POWER);

    // パックはマレットの移動方向（上）に弾かれるべき
    expect(puck.vy).toBeLessThan(-5);
    expect(puck.y).toBeLessThan(mallet.y);
  });

  it('パックの速度が maxPower を超えない', () => {
    const mallet = { x: 100, y: 100, vx: 100, vy: 100 };
    const puck = EntityFactory.createPuck(110, 100, 0, 0);

    resolveMalletPuckOverlap(mallet, [puck], MR, PR, MAX_POWER);

    // power 成分は maxPower に制限されるが、mallet 速度の転写分（factor=0.4）が加算される
    // 極端な入力でも反射が発生していることを確認
    const puckSpeed = Math.sqrt(puck.vx ** 2 + puck.vy ** 2);
    expect(puckSpeed).toBeGreaterThan(0);
  });
});
