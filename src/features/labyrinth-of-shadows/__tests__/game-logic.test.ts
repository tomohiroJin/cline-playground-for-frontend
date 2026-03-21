import { GameLogic } from '../game-logic';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';
import { setupAudioContextMock } from './helpers/audio-mock';
import { GameStateBuilder } from './helpers/game-state-builder';

// AudioContext のモック（共通ヘルパー使用）
beforeAll(() => {
  setupAudioContextMock();
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
      // Arrange: ビルダーで回復薬を確実に配置
      const testState = GameStateBuilder.create()
        .withLives(2, 5)
        .withItem('heal', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert
      expect(testState.lives).toBe(3);
    });

    test('ライフ満タン時の回復薬はスコアボーナス', () => {
      // Arrange: ライフ満タンで回復薬を配置
      const testState = GameStateBuilder.create()
        .withLives(5, 5)
        .withScore(0)
        .withItem('heal', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert
      expect(testState.score).toBe(50);
    });

    test('加速アイテムでspeedBoostが設定される', () => {
      // Arrange: 加速アイテムを確実に配置
      const testState = GameStateBuilder.create()
        .withItem('speed', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert
      expect(testState.speedBoost).toBeGreaterThan(0);
    });

    test('地図アイテムで周囲が探索済みになる', () => {
      // Arrange: 地図アイテムを確実に配置
      const testState = GameStateBuilder.create()
        .withItem('map', 3, 3)
        .withPlayer({ x: 3.5, y: 3.5 })
        .withEmptyExplored()
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert: 中心セルが探索済みになる
      expect(testState.explored['3,3']).toBe(true);
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
      // Arrange: ビルダーで wanderer を確実に配置
      const testState = GameStateBuilder.create()
        .withEnemy('wanderer', {
          x: 2.5,
          y: 1.5,
          active: true,
        })
        .build();
      const wanderer = testState.enemies[0];

      // Act
      GameLogic.updateEnemy(testState, wanderer, 16);

      // Assert: lastSeenX は更新されない（追跡しない）
      expect(wanderer.lastSeenX).toBe(-1);
      expect(typeof wanderer.dir).toBe('number');
    });

    test('追跡型（chaser）はプレイヤーの方向を記憶する', () => {
      // Arrange: ビルダーで chaser を確実にプレイヤーの近くに配置
      const testState = GameStateBuilder.create()
        .withEnemy('chaser', {
          x: 3.5,
          y: 1.5,
          active: true,
        })
        .build();
      const chaser = testState.enemies[0];

      // Act
      GameLogic.updateEnemy(testState, chaser, 16);

      // Assert: lastSeenX が更新される
      expect(chaser.lastSeenX).toBeGreaterThan(0);
    });

    test('テレポート型（teleporter）のクールダウンが減少する', () => {
      // Arrange: ビルダーで teleporter を確実に配置
      const testState = GameStateBuilder.create()
        .withEnemy('teleporter', {
          x: 5.5,
          y: 5.5,
          active: true,
          teleportCooldown: 5000,
        })
        .build();
      const teleporter = testState.enemies[0];

      // Act
      GameLogic.updateEnemy(testState, teleporter, 100);

      // Assert
      expect(teleporter.teleportCooldown).toBeLessThan(5000);
    });

    test('非アクティブな敵は更新されない（距離Infinity）', () => {
      // Arrange: 非アクティブな wanderer を配置
      const testState = GameStateBuilder.create()
        .withEnemy('wanderer', {
          x: 3.5,
          y: 3.5,
          active: false,
          actTime: 99999,
        })
        .build();
      const wanderer = testState.enemies[0];

      // Act
      const d = GameLogic.updateEnemy(testState, wanderer, 16);

      // Assert
      expect(d).toBe(Infinity);
    });

    test('updateEnemyはタイプに応じたAIを呼び出す', () => {
      // Arrange: 開放空間で wanderer を配置（壁衝突を回避）
      const testState = GameStateBuilder.create()
        .withOpenMaze()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('wanderer', {
          x: 3.5,
          y: 3.5,
          active: true,
        })
        .withEnemySpeed(0.006)
        .build();
      const wanderer = testState.enemies[0];
      const initX = wanderer.x;
      const initY = wanderer.y;

      // Act: 多くのフレームで更新
      for (let i = 0; i < 100; i++) {
        GameLogic.updateEnemy(testState, wanderer, 16);
      }

      // Assert: 100フレーム後、位置が変わっている
      const moved = wanderer.x !== initX || wanderer.y !== initY;
      expect(moved).toBe(true);
    });
  });

  describe('updatePlayer（加速ブースト）', () => {
    test('加速ブースト中は速度が上がる', () => {
      // Arrange: 開放空間で壁衝突を回避して比較
      const stateNormal = GameStateBuilder.create()
        .withOpenMaze()
        .withPlayer({ x: 3.5, y: 3.5, angle: 0, stamina: 100 })
        .build();
      const stateBoosted = GameStateBuilder.create()
        .withOpenMaze()
        .withPlayer({ x: 3.5, y: 3.5, angle: 0, stamina: 100 })
        .withSpeedBoost(5000)
        .build();

      const x0 = 3.5;
      const dt = 16;

      // Act
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

      // Assert: 開放空間なので両方必ず移動し、加速の方が大きい
      const movedNormal = Math.abs(stateNormal.player.x - x0);
      const movedBoosted = Math.abs(stateBoosted.player.x - x0);

      expect(movedNormal).toBeGreaterThan(0);
      expect(movedBoosted).toBeGreaterThan(movedNormal);
    });
  });
});
