/**
 * 敵配置ロジック
 */
import { Enemy, EnemyType, EnemyTypeValue, Position, Room } from './types';
import { createBoss, createChargeEnemy, createSpecimenEnemy, createPatrolEnemy, createRangedEnemy } from './enemy';

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

export const distributeEnemyTypes = (): EnemyTypeValue[] => {
  const types: EnemyTypeValue[] = [];
  for (let i = 0; i < SPAWN_CONFIG.patrol; i++) types.push(EnemyType.PATROL);
  for (let i = 0; i < SPAWN_CONFIG.charge; i++) types.push(EnemyType.CHARGE);
  for (let i = 0; i < SPAWN_CONFIG.ranged; i++) types.push(EnemyType.RANGED);
  for (let i = 0; i < SPAWN_CONFIG.specimen; i++) types.push(EnemyType.SPECIMEN);
  return shuffle(types);
};

const getRoomSpawnCount = (room: Room): number => {
  const area = room.rect.width * room.rect.height;
  if (area >= 60) return 3;
  if (area >= 36) return 2;
  return 1;
};

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
      let enemy: Enemy;
      switch (type) {
        case EnemyType.PATROL:
          enemy = createPatrolEnemy(position.x, position.y);
          break;
        case EnemyType.CHARGE:
          enemy = createChargeEnemy(position.x, position.y);
          break;
        case EnemyType.RANGED:
          enemy = createRangedEnemy(position.x, position.y);
          break;
        case EnemyType.SPECIMEN:
        default:
          enemy = createSpecimenEnemy(position.x, position.y);
          break;
      }
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

export { SPAWN_CONFIG };
