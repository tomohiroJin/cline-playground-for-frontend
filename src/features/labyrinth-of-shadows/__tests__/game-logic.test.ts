import { GameLogic } from '../game-logic';
import { GameStateFactory } from '../entity-factory';
import type { GameState } from '../types';
import { GAME_BALANCE } from '../domain/constants';
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

    test('ストレイフ右で進行方向の右（角度+90°）へ横移動し、向きは変わらない', () => {
      state.player.angle = 0; // +x を向く → 右は +y 方向
      const initialAngle = state.player.angle;
      const initialY = state.player.y;
      const moved = GameLogic.updatePlayer(
        state,
        { left: false, right: false, forward: false, backward: false, strafeRight: true },
        16
      );
      expect(moved).toBe(true);
      expect(state.player.y).toBeGreaterThan(initialY);
      expect(state.player.angle).toBe(initialAngle);
    });

    test('ストレイフ左で進行方向の左（角度-90°）へ横移動する', () => {
      state.player.angle = 0; // +x を向く → 左は -y 方向
      const initialY = state.player.y;
      GameLogic.updatePlayer(
        state,
        { left: false, right: false, forward: false, backward: false, strafeLeft: true },
        16
      );
      expect(state.player.y).toBeLessThan(initialY);
    });

    test('ストレイフ左右同時押しは相殺されて移動しない', () => {
      state.player.angle = 0;
      const initialX = state.player.x;
      const initialY = state.player.y;
      GameLogic.updatePlayer(
        state,
        {
          left: false, right: false, forward: false, backward: false,
          strafeLeft: true, strafeRight: true,
        },
        16
      );
      expect(state.player.x).toBe(initialX);
      expect(state.player.y).toBe(initialY);
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
    test('最も近い敵の距離・最寄り敵・alerts を含む結果を返す', () => {
      const result = GameLogic.updateEnemies(state, 16);
      expect(typeof result.closest).toBe('number');
      expect(Array.isArray(result.alerts)).toBe(true);
    });
  });

  describe('updateItems（罠の回避）', () => {
    test('罠は壁に寄れば（中心から0.3ずれれば）踏まずに通過できる', () => {
      // Arrange: 罠をプレイヤーの現在セルに配置し、プレイヤーはセル中心から 0.3 ずらす
      const px = Math.floor(state.player.x);
      const py = Math.floor(state.player.y);
      state.items = [{ x: px, y: py, type: 'trap', got: false }];
      state.player.x = px + 0.5 + 0.3;
      state.player.y = py + 0.5;
      const initialTime = state.time;

      // Act
      GameLogic.updateItems(state);

      // Assert: 罠は発動しない
      expect(state.items[0].got).toBe(false);
      expect(state.time).toBe(initialTime);
    });

    test('鍵は壁に寄っていても（中心から0.3ずれても）取得できる', () => {
      const px = Math.floor(state.player.x);
      const py = Math.floor(state.player.y);
      state.items = [{ x: px, y: py, type: 'key', got: false }];
      state.player.x = px + 0.5 + 0.3;
      state.player.y = py + 0.5;

      GameLogic.updateItems(state);

      expect(state.items[0].got).toBe(true);
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

    test('加速アイテムはストックに加算され即時発動しない', () => {
      // Arrange: 加速アイテムを確実に配置
      const testState = GameStateBuilder.create()
        .withItem('speed', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert
      expect(testState.speedCharges).toBe(1);
      expect(testState.speedBoost).toBe(0);
      expect(testState.items[0].got).toBe(true);
    });

    test('ストック満杯（2個）なら加速アイテムはフィールドに残る', () => {
      // Arrange: 加速アイテムを確実に配置し、ストックを満杯にしておく
      const testState = GameStateBuilder.create()
        .withItem('speed', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();
      testState.speedCharges = 2;

      // Act
      GameLogic.updateItems(testState);

      // Assert
      expect(testState.speedCharges).toBe(2);
      expect(testState.items[0].got).toBe(false);
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

    test('地図取得で敵表示タイマーが5秒セットされる', () => {
      // Arrange: プレイヤーの目の前に地図アイテムを配置
      const testState = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withItem('map', 1, 1)
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert: 敵表示タイマーが5秒（5000ms）でセットされる
      expect(testState.enemyRevealTimer).toBe(5000);
    });

    test('小石を拾うと所持数が増える', () => {
      // Arrange: 満杯未満の所持数で小石を配置
      const testState = GameStateBuilder.create()
        .withStones(3)
        .withItem('stone', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert
      expect(testState.stones).toBe(4);
      expect(testState.items[0].got).toBe(true);
    });

    test('所持数が MAX_COUNT のとき小石は拾わない', () => {
      // Arrange: 所持数を上限にして小石を配置
      const testState = GameStateBuilder.create()
        .withStones(GAME_BALANCE.stone.MAX_COUNT)
        .withItem('stone', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      // Act
      GameLogic.updateItems(testState);

      // Assert: フィールドに残り、所持数も変化しない
      expect(testState.items[0].got).toBe(false);
      expect(testState.stones).toBe(GAME_BALANCE.stone.MAX_COUNT);
    });
  });

  describe('updateItems（罠=騒音罠）', () => {
    test('罠を踏んでも時間は減らない（騒音罠化）', () => {
      const testState = GameStateBuilder.create()
        .withItem('trap', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();
      const before = testState.time;

      GameLogic.updateItems(testState);

      expect(testState.time).toBe(before);
      expect(testState.combo).toBe(0); // コンボリセットは維持
    });

    test('罠を踏むと半径8の騒音源を返す', () => {
      const testState = GameStateBuilder.create()
        .withItem('trap', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      const noise = GameLogic.updateItems(testState);

      expect(noise).toEqual({ x: 1.5, y: 1.5, radius: 8 });
    });

    test('罠以外のアイテムでは騒音源を返さない', () => {
      const testState = GameStateBuilder.create()
        .withItem('key', 1, 1)
        .withPlayer({ x: 1.5, y: 1.5 })
        .build();

      expect(GameLogic.updateItems(testState)).toBeUndefined();
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
      GameLogic.updateEnemyWithStrategy(testState, wanderer, 16);

      // Assert: lastSeenX は更新されない（追跡しない）
      expect(wanderer.lastSeenX).toBe(-1);
      expect(typeof wanderer.dir).toBe('number');
    });

    test('追跡型（chaser）はプレイヤーの方向を記憶する', () => {
      // Arrange: ビルダーで chaser を確実にプレイヤーの近くに、かつプレイヤー方向を向けて配置
      // (状態機械化により発見には視野角内である必要があるため dir をプレイヤー方向に合わせる)
      const testState = GameStateBuilder.create()
        .withEnemy('chaser', {
          x: 3.5,
          y: 1.5,
          dir: Math.PI, // プレイヤー(1.5,1.5)は -x 方向
          active: true,
        })
        .build();
      const chaser = testState.enemies[0];

      // Act
      GameLogic.updateEnemyWithStrategy(testState, chaser, 16);

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
      GameLogic.updateEnemyWithStrategy(testState, teleporter, 100);

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
      const d = GameLogic.updateEnemyWithStrategy(testState, wanderer, 16).distance;

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
        GameLogic.updateEnemyWithStrategy(testState, wanderer, 16);
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

  describe('捕縛時の鍵ドロップ', () => {
    test('鍵を持って接触すると鍵を1個落とす', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('chaser', { x: 1.5, y: 1.8, active: true })
        .withKeys(2, 3)
        .build();
      const enemy = s.enemies[0];

      GameLogic.updateEnemyWithStrategy(s, enemy, 16);

      expect(s.keys).toBe(1);
      const dropped = s.items.filter((i) => i.type === 'key' && i.dropped);
      expect(dropped).toHaveLength(1);
      // 着地セルは歩ける
      expect(s.maze[dropped[0].y][dropped[0].x]).toBe(0);
      expect(s.msg).toBe('🔑 鍵を落とした！');
    });

    test('鍵0で接触してもドロップせず keys は負にならない', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('chaser', { x: 1.5, y: 1.8, active: true })
        .withKeys(0, 3)
        .build();
      const enemy = s.enemies[0];

      GameLogic.updateEnemyWithStrategy(s, enemy, 16);

      expect(s.keys).toBe(0);
      expect(s.items.some((i) => i.dropped)).toBe(false);
      expect(s.msg).toBe('💔 ダメージ！');
    });

    test('無敵中は接触してもドロップしない（1接触=最大1ドロップ）', () => {
      const s = GameStateBuilder.create()
        .withPlayer({ x: 1.5, y: 1.5 })
        .withEnemy('chaser', { x: 1.5, y: 1.8, active: true })
        .withKeys(2, 3)
        .withInvincibility(1000)
        .build();
      const enemy = s.enemies[0];

      GameLogic.updateEnemyWithStrategy(s, enemy, 16);

      expect(s.keys).toBe(2);
      expect(s.items.some((i) => i.dropped)).toBe(false);
    });
  });
});
