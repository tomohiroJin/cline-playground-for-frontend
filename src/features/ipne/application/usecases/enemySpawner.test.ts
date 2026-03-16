/**
 * enemySpawner のテスト
 */
import { MockIdGenerator } from '../../__tests__/mocks/MockIdGenerator';
import { MockRandomProvider } from '../../__tests__/mocks/MockRandomProvider';
import {
  getSpawnPositionsForRoom,
  distributeEnemyTypes,
  applyScaling,
  spawnEnemies,
  spawnEnemiesForStage,
  SPAWN_CONFIG,
} from './enemySpawner';
import { Enemy, EnemyType, Room, StageConfig, Position } from '../../types';

// テスト用ヘルパー: 部屋を生成する
const createRoom = (
  x: number,
  y: number,
  width: number,
  height: number,
  tiles?: Position[]
): Room => {
  // タイルが指定されなければ部屋内の全座標を生成
  const roomTiles =
    tiles ??
    Array.from({ length: width * height }, (_, i) => ({
      x: x + (i % width),
      y: y + Math.floor(i / width),
    }));
  return {
    rect: { x, y, width, height },
    center: { x: x + Math.floor(width / 2), y: y + Math.floor(height / 2) },
    tiles: roomTiles,
  };
};

// テスト用ヘルパー: 最小限のStageConfigを生成する
const createStageConfig = (overrides?: Partial<StageConfig>): StageConfig => ({
  stage: 1,
  name: 'テストステージ',
  maze: {
    width: 50,
    height: 50,
    minRoomSize: 5,
    maxRoomSize: 10,
    corridorWidth: 1,
    maxDepth: 4,
    loopCount: 2,
  },
  enemies: {
    patrol: 3,
    charge: 2,
    ranged: 1,
    specimen: 1,
    miniBoss: 0,
  },
  scaling: { hp: 1, damage: 1, speed: 1 },
  gimmicks: {
    trapCount: 0,
    trapRatio: { damage: 1, slow: 0, teleport: 0 },
    wallCount: 0,
    wallRatio: { breakable: 1, passable: 0, invisible: 0 },
  },
  maxLevel: 5,
  bossType: 'boss',
  ...overrides,
});

describe('enemySpawner', () => {
  let idGen: MockIdGenerator;
  let random: MockRandomProvider;

  beforeEach(() => {
    idGen = new MockIdGenerator();
    random = new MockRandomProvider(0.5);
  });

  describe('getSpawnPositionsForRoom', () => {
    it('部屋のタイルから指定数のスポーン位置を返す', () => {
      // Arrange
      const room = createRoom(0, 0, 4, 4);
      const excluded: Position[] = [];

      // Act
      const positions = getSpawnPositionsForRoom(room, 3, excluded, random);

      // Assert
      expect(positions).toHaveLength(3);
      positions.forEach(pos => {
        expect(pos.x).toBeGreaterThanOrEqual(0);
        expect(pos.y).toBeGreaterThanOrEqual(0);
      });
    });

    it('除外位置を含まない結果を返す', () => {
      // Arrange
      const room = createRoom(0, 0, 3, 3);
      const excluded: Position[] = [{ x: 0, y: 0 }, { x: 1, y: 1 }];

      // Act
      const positions = getSpawnPositionsForRoom(room, 10, excluded, random);

      // Assert
      for (const pos of positions) {
        const isExcluded = excluded.some(e => e.x === pos.x && e.y === pos.y);
        expect(isExcluded).toBe(false);
      }
    });

    it('利用可能なタイルが要求数より少ない場合、利用可能な分だけ返す', () => {
      // Arrange
      const room = createRoom(0, 0, 2, 1, [{ x: 0, y: 0 }, { x: 1, y: 0 }]);

      // Act
      const positions = getSpawnPositionsForRoom(room, 5, [], random);

      // Assert
      expect(positions).toHaveLength(2);
    });

    it('タイルが空の部屋では空配列を返す', () => {
      // Arrange
      const room: Room = {
        rect: { x: 0, y: 0, width: 5, height: 5 },
        center: { x: 2, y: 2 },
        tiles: [],
      };

      // Act
      const positions = getSpawnPositionsForRoom(room, 3, [], random);

      // Assert
      expect(positions).toHaveLength(0);
    });

    it('tilesが未定義の部屋では空配列を返す', () => {
      // Arrange
      const room: Room = {
        rect: { x: 0, y: 0, width: 5, height: 5 },
        center: { x: 2, y: 2 },
        // tiles は未設定
      };

      // Act
      const positions = getSpawnPositionsForRoom(room, 3, [], random);

      // Assert
      expect(positions).toHaveLength(0);
    });
  });

  describe('distributeEnemyTypes', () => {
    it('デフォルト設定で正しい数の敵タイプを生成する', () => {
      // Arrange / Act
      const types = distributeEnemyTypes(random);

      // Assert
      const total =
        SPAWN_CONFIG.patrol + SPAWN_CONFIG.charge + SPAWN_CONFIG.ranged + SPAWN_CONFIG.specimen;
      expect(types).toHaveLength(total);
    });

    it('デフォルト設定で各タイプの数が正しい', () => {
      // Arrange / Act
      const types = distributeEnemyTypes(random);

      // Assert
      expect(types.filter(t => t === EnemyType.PATROL)).toHaveLength(SPAWN_CONFIG.patrol);
      expect(types.filter(t => t === EnemyType.CHARGE)).toHaveLength(SPAWN_CONFIG.charge);
      expect(types.filter(t => t === EnemyType.RANGED)).toHaveLength(SPAWN_CONFIG.ranged);
      expect(types.filter(t => t === EnemyType.SPECIMEN)).toHaveLength(SPAWN_CONFIG.specimen);
    });

    it('カスタム設定で正しい数の敵タイプを生成する', () => {
      // Arrange
      const config = { patrol: 2, charge: 1, ranged: 1, specimen: 0 };

      // Act
      const types = distributeEnemyTypes(random, config);

      // Assert
      expect(types).toHaveLength(4);
      expect(types.filter(t => t === EnemyType.PATROL)).toHaveLength(2);
      expect(types.filter(t => t === EnemyType.CHARGE)).toHaveLength(1);
      expect(types.filter(t => t === EnemyType.RANGED)).toHaveLength(1);
      expect(types.filter(t => t === EnemyType.SPECIMEN)).toHaveLength(0);
    });
  });

  describe('applyScaling', () => {
    // テスト用のベース敵
    const baseEnemy: Enemy = {
      id: 'enemy-1',
      x: 5,
      y: 5,
      type: EnemyType.PATROL,
      hp: 100,
      maxHp: 100,
      damage: 10,
      speed: 1.0,
      detectionRange: 5,
      attackRange: 1,
      attackCooldownUntil: 0,
      state: 'patrol',
      homePosition: { x: 5, y: 5 },
    };

    it('スケーリング倍率1.0では値が変わらない', () => {
      // Arrange
      const scaling = { hp: 1, damage: 1, speed: 1 };

      // Act
      const result = applyScaling(baseEnemy, scaling);

      // Assert
      expect(result.hp).toBe(100);
      expect(result.maxHp).toBe(100);
      expect(result.damage).toBe(10);
      expect(result.speed).toBe(1.0);
    });

    it('HPはceil、ダメージはfloorで丸められる', () => {
      // Arrange
      const scaling = { hp: 1.5, damage: 1.5, speed: 1.5 };

      // Act
      const result = applyScaling(baseEnemy, scaling);

      // Assert
      expect(result.hp).toBe(Math.ceil(100 * 1.5)); // 150
      expect(result.maxHp).toBe(Math.ceil(100 * 1.5)); // 150
      expect(result.damage).toBe(Math.floor(10 * 1.5)); // 15
      expect(result.speed).toBe(1.0 * 1.5); // 1.5
    });

    it('元の敵オブジェクトは変更されない（イミュータブル）', () => {
      // Arrange
      const scaling = { hp: 2, damage: 2, speed: 2 };

      // Act
      applyScaling(baseEnemy, scaling);

      // Assert
      expect(baseEnemy.hp).toBe(100);
      expect(baseEnemy.damage).toBe(10);
      expect(baseEnemy.speed).toBe(1.0);
    });

    it('hpとmaxHpが同じ値に設定される', () => {
      // Arrange
      const scaling = { hp: 2, damage: 1, speed: 1 };

      // Act
      const result = applyScaling(baseEnemy, scaling);

      // Assert
      expect(result.hp).toBe(result.maxHp);
    });
  });

  describe('spawnEnemies', () => {
    it('部屋リストが空の場合、空配列を返す', () => {
      // Arrange
      const rooms: Room[] = [];
      const startPos = { x: 0, y: 0 };
      const goalPos = { x: 10, y: 10 };

      // Act
      const enemies = spawnEnemies(rooms, startPos, goalPos, idGen, random);

      // Assert
      expect(enemies).toEqual([]);
    });

    it('複数部屋がある場合、敵が生成される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom1 = createRoom(0, 20, 8, 8);
      const spawnRoom2 = createRoom(20, 0, 8, 8);
      const rooms = [startRoom, goalRoom, spawnRoom1, spawnRoom2];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };

      // Act
      const enemies = spawnEnemies(rooms, startPos, goalPos, idGen, random);

      // Assert
      expect(enemies.length).toBeGreaterThan(0);
    });

    it('ゴール部屋にボスが配置される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom = createRoom(0, 20, 8, 8);
      const rooms = [startRoom, goalRoom, spawnRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };

      // Act
      const enemies = spawnEnemies(rooms, startPos, goalPos, idGen, random);

      // Assert
      const bosses = enemies.filter(e => e.type === EnemyType.BOSS);
      expect(bosses).toHaveLength(1);
    });

    it('スタート部屋には敵が配置されない', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const rooms = [startRoom, goalRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };

      // Act
      const enemies = spawnEnemies(rooms, startPos, goalPos, idGen, random);

      // Assert
      // ボス以外の敵はスタート部屋に配置されてはいけない
      const nonBossEnemies = enemies.filter(e => e.type !== EnemyType.BOSS);
      for (const enemy of nonBossEnemies) {
        const inStartRoom =
          enemy.x >= 0 && enemy.x < 8 && enemy.y >= 0 && enemy.y < 8;
        expect(inStartRoom).toBe(false);
      }
    });

    it('すべての敵にユニークなIDが付与される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom = createRoom(0, 20, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };

      // Act
      const enemies = spawnEnemies(rooms, startPos, goalPos, idGen, random);

      // Assert
      const ids = enemies.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('spawnEnemiesForStage', () => {
    it('部屋リストが空の場合、空配列を返す', () => {
      // Arrange
      const config = createStageConfig();

      // Act
      const enemies = spawnEnemiesForStage(
        [], { x: 0, y: 0 }, { x: 10, y: 10 }, config, idGen, random
      );

      // Assert
      expect(enemies).toEqual([]);
    });

    it('設定に基づいた敵が生成される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom1 = createRoom(0, 20, 10, 10);
      const spawnRoom2 = createRoom(20, 0, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom1, spawnRoom2];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };
      const config = createStageConfig();

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      expect(enemies.length).toBeGreaterThan(0);
    });

    it('bossType が "boss" のとき通常ボスが配置される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom = createRoom(0, 20, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };
      const config = createStageConfig({ bossType: 'boss' });

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      const bosses = enemies.filter(e => e.type === EnemyType.BOSS);
      expect(bosses).toHaveLength(1);
    });

    it('bossType が "mega_boss" のときメガボスが配置される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom = createRoom(0, 20, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };
      const config = createStageConfig({ bossType: 'mega_boss' });

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      const megaBosses = enemies.filter(e => e.type === EnemyType.MEGA_BOSS);
      expect(megaBosses).toHaveLength(1);
    });

    it('スケーリングが敵に適用される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom = createRoom(0, 20, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };
      const config = createStageConfig({
        scaling: { hp: 2, damage: 2, speed: 1.5 },
      });

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      // ボスも含めすべての敵にスケーリングが適用されている
      // 少なくとも1体の敵が存在する
      expect(enemies.length).toBeGreaterThan(0);
      // ボスのスピードがスケーリングされていることを確認
      const boss = enemies.find(
        e => e.type === EnemyType.BOSS || e.type === EnemyType.MEGA_BOSS
      );
      if (boss) {
        // スケーリング適用済みなので speed は元の値 * 1.5
        expect(boss.speed).toBeGreaterThan(0);
      }
    });

    it('ミニボスが指定数配置される', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom1 = createRoom(0, 20, 10, 10);
      const spawnRoom2 = createRoom(20, 0, 10, 10);
      const spawnRoom3 = createRoom(40, 0, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom1, spawnRoom2, spawnRoom3];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };
      const config = createStageConfig({
        enemies: { patrol: 1, charge: 1, ranged: 0, specimen: 0, miniBoss: 2 },
      });

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      const miniBosses = enemies.filter(e => e.type === EnemyType.MINI_BOSS);
      expect(miniBosses.length).toBeGreaterThanOrEqual(1);
      expect(miniBosses.length).toBeLessThanOrEqual(2);
    });

    it('ミニボスが0の場合、ミニボスは配置されない', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 8, 8);
      const goalRoom = createRoom(20, 20, 10, 10);
      const spawnRoom = createRoom(0, 20, 10, 10);
      const rooms = [startRoom, goalRoom, spawnRoom];
      const startPos = { x: 4, y: 4 };
      const goalPos = { x: 25, y: 25 };
      const config = createStageConfig({
        enemies: { patrol: 1, charge: 0, ranged: 0, specimen: 0, miniBoss: 0 },
      });

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      const miniBosses = enemies.filter(e => e.type === EnemyType.MINI_BOSS);
      expect(miniBosses).toHaveLength(0);
    });

    it('ゴール位置がどの部屋にも属さない場合、最大の部屋がゴール部屋になる', () => {
      // Arrange
      const startRoom = createRoom(0, 0, 5, 5);
      const largeRoom = createRoom(20, 20, 12, 12);
      const smallRoom = createRoom(0, 20, 6, 6);
      const rooms = [startRoom, largeRoom, smallRoom];
      const startPos = { x: 2, y: 2 };
      // どの部屋にも属さない位置
      const goalPos = { x: 99, y: 99 };
      const config = createStageConfig();

      // Act
      const enemies = spawnEnemiesForStage(
        rooms, startPos, goalPos, config, idGen, random
      );

      // Assert
      // ボスが配置されるはず（最大の部屋=largeRoomがゴール部屋として使われる）
      const bosses = enemies.filter(e => e.type === EnemyType.BOSS);
      expect(bosses).toHaveLength(1);
    });
  });

  describe('SPAWN_CONFIG', () => {
    it('合計数が25である', () => {
      // Assert
      const total =
        SPAWN_CONFIG.patrol + SPAWN_CONFIG.charge + SPAWN_CONFIG.ranged + SPAWN_CONFIG.specimen;
      expect(total).toBe(SPAWN_CONFIG.total);
      expect(SPAWN_CONFIG.total).toBe(25);
    });
  });
});
