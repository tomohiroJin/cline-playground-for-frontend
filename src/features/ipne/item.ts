/**
 * アイテム管理モジュール
 */
import { Enemy, Item, ItemType, ItemTypeValue, Player, Position, Room } from './types';
import { healPlayer } from './player';

const ITEM_CONFIGS = {
  [ItemType.HEALTH_SMALL]: { healAmount: 3 },
  [ItemType.HEALTH_LARGE]: { healAmount: 7 },
} as const;

const SPAWN_CONFIG = {
  [ItemType.HEALTH_SMALL]: 8,
  [ItemType.HEALTH_LARGE]: 3,
} as const;

let itemIdCounter = 0;

export const generateItemId = (): string => {
  itemIdCounter += 1;
  return `item-${itemIdCounter}`;
};

export const resetItemIdCounter = (): void => {
  itemIdCounter = 0;
};

export const createItem = (type: ItemTypeValue, x: number, y: number): Item => {
  const config = ITEM_CONFIGS[type];
  return {
    id: generateItemId(),
    x,
    y,
    type,
    healAmount: config.healAmount,
  };
};

export const createHealthSmall = (x: number, y: number): Item => {
  return createItem(ItemType.HEALTH_SMALL, x, y);
};

export const createHealthLarge = (x: number, y: number): Item => {
  return createItem(ItemType.HEALTH_LARGE, x, y);
};

const shuffle = <T>(items: T[]): T[] => {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

const collectTiles = (rooms: Room[]): Position[] => {
  const tiles: Position[] = [];
  for (const room of rooms) {
    if (room.tiles) {
      tiles.push(...room.tiles);
    }
  }
  return tiles;
};

const isPositionOccupied = (position: Position, enemies: Enemy[], items: Item[]): boolean => {
  return (
    enemies.some(enemy => enemy.x === position.x && enemy.y === position.y) ||
    items.some(item => item.x === position.x && item.y === position.y)
  );
};

export const spawnItems = (
  rooms: Room[],
  enemies: Enemy[],
  excluded: Position[]
): Item[] => {
  const tiles = shuffle(collectTiles(rooms));
  const items: Item[] = [];

  const createItemsOfType = (type: ItemTypeValue, count: number) => {
    for (const tile of tiles) {
      if (items.length >= SPAWN_CONFIG[ItemType.HEALTH_SMALL] + SPAWN_CONFIG[ItemType.HEALTH_LARGE]) {
        return;
      }
      if (items.filter(item => item.type === type).length >= count) {
        return;
      }
      if (excluded.some(pos => pos.x === tile.x && pos.y === tile.y)) continue;
      if (isPositionOccupied(tile, enemies, items)) continue;

      items.push(createItem(type, tile.x, tile.y));
      if (items.filter(item => item.type === type).length >= count) {
        return;
      }
    }
  };

  createItemsOfType(ItemType.HEALTH_LARGE, SPAWN_CONFIG[ItemType.HEALTH_LARGE]);
  createItemsOfType(ItemType.HEALTH_SMALL, SPAWN_CONFIG[ItemType.HEALTH_SMALL]);

  return items;
};

export const canPickupItem = (player: Position, item: Item): boolean => {
  return player.x === item.x && player.y === item.y;
};

export const pickupItem = (player: Player, item: Item) => {
  const updatedPlayer = healPlayer(player, item.healAmount);
  return { player: updatedPlayer, itemId: item.id };
};

export { ITEM_CONFIGS, SPAWN_CONFIG };
