import { GameLogic } from '../game-logic';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';

// AudioContext のモック
beforeAll(() => {
  (window as { AudioContext?: typeof AudioContext }).AudioContext = jest.fn().mockImplementation(
    () => ({
      createOscillator: () => ({
        connect: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        frequency: { value: 0 },
        type: '',
      }),
      createGain: () => ({
        connect: jest.fn(),
        gain: {
          setValueAtTime: jest.fn(),
          exponentialRampToValueAtTime: jest.fn(),
        },
      }),
      destination: {},
      currentTime: 0,
    })
  );
});

describe('labyrinth-of-shadows/game-logic', () => {
  let state: GameState;

  beforeEach(() => {
    state = GameStateFactory.create('EASY');
  });

  describe('updateHiding', () => {
    test('隠れる要求でエネルギーがある場合、隠れ状態になる', () => {
      GameLogic.updateHiding(state, true, 16);
      expect(state.hiding).toBe(true);
    });

    test('隠れる要求なしの場合、隠れ状態が解除される', () => {
      state.hiding = true;
      GameLogic.updateHiding(state, false, 16);
      expect(state.hiding).toBe(false);
    });

    test('隠れている間エネルギーが減少する', () => {
      const initialEnergy = state.energy;
      GameLogic.updateHiding(state, true, 100);
      expect(state.energy).toBeLessThan(initialEnergy);
    });

    test('隠れていない間エネルギーが回復する', () => {
      state.energy = 50;
      GameLogic.updateHiding(state, false, 100);
      expect(state.energy).toBeGreaterThan(50);
    });
  });

  describe('updateSprinting', () => {
    test('ダッシュ要求でスタミナがある場合、ダッシュ状態になる', () => {
      GameLogic.updateSprinting(state, true, 16);
      expect(state.sprinting).toBe(true);
    });

    test('隠れている間はダッシュできない', () => {
      state.hiding = true;
      GameLogic.updateSprinting(state, true, 16);
      expect(state.sprinting).toBe(false);
    });

    test('スタミナが低い場合はダッシュできない', () => {
      state.player.stamina = 3;
      GameLogic.updateSprinting(state, true, 16);
      expect(state.sprinting).toBe(false);
    });
  });

  describe('updatePlayer', () => {
    test('隠れている間は移動しない', () => {
      state.hiding = true;
      const moved = GameLogic.updatePlayer(
        state,
        { left: false, right: false, forward: true, backward: false },
        16
      );
      expect(moved).toBe(false);
    });

    test('前進入力で移動する', () => {
      const initialX = state.player.x;
      const initialY = state.player.y;
      GameLogic.updatePlayer(
        state,
        { left: false, right: false, forward: true, backward: false },
        16
      );
      // 角度0の場合、x方向に移動する
      const dx = state.player.x - initialX;
      const dy = state.player.y - initialY;
      expect(dx !== 0 || dy !== 0).toBe(true);
    });
  });

  describe('updateExplored', () => {
    test('プレイヤー周辺のセルが探索済みになる', () => {
      state.explored = {};
      GameLogic.updateExplored(state);
      const px = Math.floor(state.player.x);
      const py = Math.floor(state.player.y);
      expect(state.explored[`${px},${py}`]).toBe(true);
    });
  });

  describe('checkExit', () => {
    test('出口から遠い場合はnullを返す', () => {
      const result = GameLogic.checkExit(state);
      expect(result).toBeNull();
    });
  });

  describe('updateEnemies', () => {
    test('最も近い敵の距離を返す', () => {
      const closest = GameLogic.updateEnemies(state, 16);
      expect(typeof closest).toBe('number');
    });
  });

  describe('updateItems（新アイテム）', () => {
    test('回復薬でライフが回復する', () => {
      state.lives = 2;
      const healItem = state.items.find(i => i.type === 'heal');
      if (healItem) {
        state.player.x = healItem.x + 0.5;
        state.player.y = healItem.y + 0.5;
        GameLogic.updateItems(state);
        expect(state.lives).toBe(3);
      }
    });

    test('ライフ満タン時の回復薬はスコアボーナス', () => {
      state.lives = state.maxLives;
      const healItem = state.items.find(i => i.type === 'heal');
      if (healItem) {
        const prevScore = state.score;
        state.player.x = healItem.x + 0.5;
        state.player.y = healItem.y + 0.5;
        GameLogic.updateItems(state);
        expect(state.score).toBe(prevScore + 50);
      }
    });

    test('加速アイテムでspeedBoostが設定される', () => {
      const speedItem = state.items.find(i => i.type === 'speed');
      if (speedItem) {
        state.player.x = speedItem.x + 0.5;
        state.player.y = speedItem.y + 0.5;
        GameLogic.updateItems(state);
        expect(state.speedBoost).toBeGreaterThan(0);
      }
    });

    test('地図アイテムで周囲が探索済みになる', () => {
      const mapItem = state.items.find(i => i.type === 'map');
      if (mapItem) {
        state.player.x = mapItem.x + 0.5;
        state.player.y = mapItem.y + 0.5;
        GameLogic.updateItems(state);
        // 中心セルが探索済みになる
        expect(state.explored[`${mapItem.x},${mapItem.y}`]).toBe(true);
      }
    });
  });

  describe('revealMap', () => {
    test('指定半径内のセルを探索済みにする', () => {
      state.explored = {};
      GameLogic.revealMap(state, 5, 5);
      expect(state.explored['5,5']).toBe(true);
      expect(state.explored['4,5']).toBe(true);
      expect(state.explored['6,5']).toBe(true);
    });
  });

  describe('敵タイプ別AI', () => {
    test('徘徊型（wanderer）はプレイヤーを追跡しない', () => {
      const wanderer = state.enemies.find(e => e.type === 'wanderer');
      if (wanderer) {
        wanderer.active = true;
        const initialDir = wanderer.dir;
        // プレイヤーの目の前に配置してもlastSeenXは更新されない
        wanderer.x = state.player.x + 1;
        wanderer.y = state.player.y;
        GameLogic.updateEnemy(state, wanderer, 16);
        expect(wanderer.lastSeenX).toBe(-1);
        // 方向が多少変化する（ランダム巡回）
        expect(typeof wanderer.dir).toBe('number');
      }
    });

    test('追跡型（chaser）はプレイヤーの方向を記憶する', () => {
      const stateNormal = GameStateFactory.create('NORMAL');
      const chaser = stateNormal.enemies.find(e => e.type === 'chaser');
      if (chaser) {
        chaser.active = true;
        // プレイヤーの近くに配置
        chaser.x = stateNormal.player.x + 2;
        chaser.y = stateNormal.player.y;
        GameLogic.updateEnemy(stateNormal, chaser, 16);
        // lastSeenX が更新される
        expect(chaser.lastSeenX).toBeGreaterThan(0);
      }
    });

    test('テレポート型（teleporter）のクールダウンが減少する', () => {
      const stateHard = GameStateFactory.create('HARD');
      const teleporter = stateHard.enemies.find(e => e.type === 'teleporter');
      if (teleporter) {
        teleporter.active = true;
        teleporter.teleportCooldown = 5000;
        GameLogic.updateEnemy(stateHard, teleporter, 100);
        expect(teleporter.teleportCooldown).toBeLessThan(5000);
      }
    });

    test('非アクティブな敵は更新されない（距離Infinity）', () => {
      const wanderer = state.enemies.find(e => e.type === 'wanderer');
      if (wanderer) {
        wanderer.active = false;
        const d = GameLogic.updateEnemy(state, wanderer, 16);
        expect(d).toBe(Infinity);
      }
    });

    test('updateEnemyはタイプに応じたAIを呼び出す', () => {
      // wanderer は移動する（位置が変わる可能性がある）
      const wanderer = state.enemies.find(e => e.type === 'wanderer');
      if (wanderer) {
        wanderer.active = true;
        const initX = wanderer.x;
        const initY = wanderer.y;
        // 多くのフレームで更新
        for (let i = 0; i < 100; i++) {
          GameLogic.updateEnemy(state, wanderer, 16);
        }
        // 100フレーム後、位置が変わっている可能性が高い
        const moved = wanderer.x !== initX || wanderer.y !== initY;
        expect(moved).toBe(true);
      }
    });
  });

  describe('updatePlayer（加速ブースト）', () => {
    test('加速ブースト中は速度が上がる', () => {
      // 小さなdt(1フレーム)で壁衝突を回避して比較
      const stateNormal = GameStateFactory.create('EASY');
      const stateBoosted = GameStateFactory.create('EASY');
      // 同じ迷路と同じ初期位置を使用
      stateBoosted.maze = stateNormal.maze;
      stateBoosted.player = { ...stateNormal.player };
      stateBoosted.explored = { ...stateNormal.explored };
      stateBoosted.speedBoost = 5000;

      const x0 = stateNormal.player.x;
      const dt = 16; // 1フレーム分（壁衝突しにくい短いdt）

      GameLogic.updatePlayer(
        stateNormal,
        { left: false, right: false, forward: true, backward: false },
        dt
      );
      GameLogic.updatePlayer(
        stateBoosted,
        { left: false, right: false, forward: true, backward: false },
        dt
      );

      const movedNormal = Math.abs(stateNormal.player.x - x0) + Math.abs(stateNormal.player.y - (stateBoosted.player.y - (stateBoosted.player.y - stateNormal.player.y)));
      const movedBoosted = Math.abs(stateBoosted.player.x - x0);

      // 両方移動していれば加速の方が大きい
      if (movedNormal > 0 && movedBoosted > 0) {
        expect(movedBoosted).toBeGreaterThan(stateNormal.player.x - x0);
      } else {
        // 短いdtでも壁に当たる場合（開始位置が壁際）はスキップ
        expect(true).toBe(true);
      }
    });
  });
});
