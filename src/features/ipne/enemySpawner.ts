/**
 * 敵配置ロジック
 */
import { Enemy, EnemyType, EnemyTypeValue, Position, Room, StageConfig } from './types';
import {
  createBoss,
  createChargeEnemy,
  createSpecimenEnemy,
  createPatrolEnemy,
  createRangedEnemy,
  createMiniBoss,
  createMegaBoss,
} from './enemy';

const SPAWN_CONFIG = {
  total: 25,
  patrol: 10,
  charge: 6,
  ranged: 5,
  specimen: 4,
} as const;

const MAX_PER_ROOM = 3;

const isPositionInRoom = (room: Room, position: Position): boolean => {
  const { x, y, width, height } = room.rect;
  return position.x >= x && position.x < x + width && position.y >= y && position.y < y + height;
};

const pickLargestRoom = (rooms: Room[]): Room | undefined => {
  if (rooms.length === 0) return undefined;
  return rooms.reduce((largest, room) => {
    const area = room.rect.width * room.rect.height;
    const largestArea = largest.rect.width * largest.rect.height;
    return area > largestArea ? room : largest;
  }, rooms[0]);
};

const pickRoomByPosition = (rooms: Room[], position: Position): Room | undefined => {
  return rooms.find(room => isPositionInRoom(room, position));
};

const shuffle = <T>(items: T[]): T[] => {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

export const getSpawnPositionsForRoom = (
  room: Room,
  count: number,
  excluded: Position[]
): Position[] => {
  const roomTiles = room.tiles ?? [];
  const filtered = roomTiles.filter(tile =>
    !excluded.some(pos => pos.x === tile.x && pos.y === tile.y)
  );
  const shuffled = shuffle(filtered);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const distributeEnemyTypes = (
  config?: { patrol: number; charge: number; ranged: number; specimen: number }
): EnemyTypeValue[] => {
  const c = config ?? SPAWN_CONFIG;
  const types: EnemyTypeValue[] = [];
  for (let i = 0; i < c.patrol; i++) types.push(EnemyType.PATROL);
  for (let i = 0; i < c.charge; i++) types.push(EnemyType.CHARGE);
  for (let i = 0; i < c.ranged; i++) types.push(EnemyType.RANGED);
  for (let i = 0; i < c.specimen; i++) types.push(EnemyType.SPECIMEN);
  return shuffle(types);
};

const getRoomSpawnCount = (room: Room): number => {
  const area = room.rect.width * room.rect.height;
  if (area >= 60) return 3;
  if (area >= 36) return 2;
  return 1;
};

/**
 * 敵にスケーリング倍率を適用する
 * @param enemy 敵
 * @param scaling スケーリング倍率
 * @returns スケーリング適用後の敵
 */
export const applyScaling = (
  enemy: Enemy,
  scaling: { hp: number; damage: number; speed: number }
): Enemy => {
  const scaledHp = Math.ceil(enemy.hp * scaling.hp);
  const scaledDamage = Math.floor(enemy.damage * scaling.damage);
  const scaledSpeed = enemy.speed * scaling.speed;
  return {
    ...enemy,
    hp: scaledHp,
    maxHp: scaledHp,
    damage: scaledDamage,
    speed: scaledSpeed,
  };
};

/**
 * 敵タイプに応じた敵を生成する
 */
const createEnemyByType = (type: EnemyTypeValue, x: number, y: number): Enemy => {
  switch (type) {
    case EnemyType.PATROL:
      return createPatrolEnemy(x, y);
    case EnemyType.CHARGE:
      return createChargeEnemy(x, y);
    case EnemyType.RANGED:
      return createRangedEnemy(x, y);
    case EnemyType.MINI_BOSS:
      return createMiniBoss(x, y);
    case EnemyType.MEGA_BOSS:
      return createMegaBoss(x, y);
    case EnemyType.BOSS:
      return createBoss(x, y);
    case EnemyType.SPECIMEN:
    default:
      return createSpecimenEnemy(x, y);
  }
};

/**
 * 既存の spawnEnemies（後方互換性維持）
 */
export const spawnEnemies = (
  rooms: Room[],
  startPos: Position,
  goalPos: Position
): Enemy[] => {
  if (rooms.length === 0) return [];

  const startRoom = pickRoomByPosition(rooms, startPos);
  const goalRoom = pickRoomByPosition(rooms, goalPos) ?? pickLargestRoom(rooms);

  const spawnRooms = rooms.filter(room => room !== startRoom && room !== goalRoom);
  const enemyTypes = distributeEnemyTypes();
  const enemies: Enemy[] = [];
  const usedPositions: Position[] = [startPos, goalPos];

  for (const room of spawnRooms) {
    if (enemyTypes.length === 0) break;
    const spawnCount = Math.min(getRoomSpawnCount(room), MAX_PER_ROOM, enemyTypes.length);
    const positions = getSpawnPositionsForRoom(room, spawnCount, usedPositions);

    for (const position of positions) {
      const type = enemyTypes.shift();
      if (!type) break;
      const enemy = createEnemyByType(type, position.x, position.y);
      enemies.push(enemy);
      usedPositions.push(position);
    }
  }

  if (goalRoom) {
    const bossPosition =
      getSpawnPositionsForRoom(goalRoom, 1, usedPositions)[0] ?? goalRoom.center;
    enemies.push(createBoss(bossPosition.x, bossPosition.y));
  }

  return enemies;
};

/**
 * StageConfig に基づいて敵を配置する（5ステージ制対応）
 * @param rooms 部屋リスト
 * @param startPos スタート位置
 * @param goalPos ゴール位置
 * @param stageConfig ステージ設定
 * @returns 配置された敵の配列
 */
export const spawnEnemiesForStage = (
  rooms: Room[],
  startPos: Position,
  goalPos: Position,
  stageConfig: StageConfig
): Enemy[] => {
  if (rooms.length === 0) return [];

  const startRoom = pickRoomByPosition(rooms, startPos);
  const goalRoom = pickRoomByPosition(rooms, goalPos) ?? pickLargestRoom(rooms);

  // 通常の雑魚敵をスポーン（ゴール部屋とスタート部屋を除外）
  const spawnRooms = rooms.filter(room => room !== startRoom && room !== goalRoom);
  const enemyTypes = distributeEnemyTypes(stageConfig.enemies);
  const enemies: Enemy[] = [];
  const usedPositions: Position[] = [startPos, goalPos];

  for (const room of spawnRooms) {
    if (enemyTypes.length === 0) break;
    const spawnCount = Math.min(getRoomSpawnCount(room), MAX_PER_ROOM, enemyTypes.length);
    const positions = getSpawnPositionsForRoom(room, spawnCount, usedPositions);

    for (const position of positions) {
      const type = enemyTypes.shift();
      if (!type) break;
      let enemy = createEnemyByType(type, position.x, position.y);
      enemy = applyScaling(enemy, stageConfig.scaling);
      enemies.push(enemy);
      usedPositions.push(position);
    }
  }

  // ミニボスをゴール部屋以外のランダムな部屋に配置
  if (stageConfig.enemies.miniBoss > 0) {
    const miniBossRooms = shuffle(spawnRooms.filter(room =>
      !usedPositions.every(pos => isPositionInRoom(room, pos))
    ));
    let placedMiniBoss = 0;
    for (const room of miniBossRooms) {
      if (placedMiniBoss >= stageConfig.enemies.miniBoss) break;
      const positions = getSpawnPositionsForRoom(room, 1, usedPositions);
      if (positions.length === 0) continue;
      let miniBoss = createMiniBoss(positions[0].x, positions[0].y);
      miniBoss = applyScaling(miniBoss, stageConfig.scaling);
      enemies.push(miniBoss);
      usedPositions.push(positions[0]);
      placedMiniBoss++;
    }
  }

  // ボスまたはメガボスをゴール部屋に配置
  if (goalRoom) {
    const bossPosition =
      getSpawnPositionsForRoom(goalRoom, 1, usedPositions)[0] ?? goalRoom.center;
    if (stageConfig.bossType === 'mega_boss') {
      let megaBoss = createMegaBoss(bossPosition.x, bossPosition.y);
      megaBoss = applyScaling(megaBoss, stageConfig.scaling);
      enemies.push(megaBoss);
    } else {
      let boss = createBoss(bossPosition.x, bossPosition.y);
      boss = applyScaling(boss, stageConfig.scaling);
      enemies.push(boss);
    }
  }

  return enemies;
};

export { SPAWN_CONFIG };
