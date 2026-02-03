/**
 * アイテム管理モジュール
 */
import { Enemy, Item, ItemType, ItemTypeValue, Player, Position, Room } from './types';
import { healPlayer, getEffectiveHeal } from './player';

const ITEM_CONFIGS = {
  [ItemType.HEALTH_SMALL]: { healAmount: 3 },
  [ItemType.HEALTH_LARGE]: { healAmount: 7 },
  [ItemType.HEALTH_FULL]: { healAmount: 999 },
  [ItemType.LEVEL_UP]: { healAmount: 0 },
  [ItemType.MAP_REVEAL]: { healAmount: 0 },
} as const;

const SPAWN_CONFIG = {
  [ItemType.HEALTH_SMALL]: 8,
  [ItemType.HEALTH_LARGE]: 4,
  [ItemType.HEALTH_FULL]: 1,
  [ItemType.LEVEL_UP]: 2,
  [ItemType.MAP_REVEAL]: 1,
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

export const createHealthFull = (x: number, y: number): Item => {
  return createItem(ItemType.HEALTH_FULL, x, y);
};

export const createLevelUpItem = (x: number, y: number): Item => {
  return createItem(ItemType.LEVEL_UP, x, y);
};

export const createMapRevealItem = (x: number, y: number): Item => {
  return createItem(ItemType.MAP_REVEAL, x, y);
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

/** 全アイテムタイプの最大スポーン数を計算 */
const getTotalMaxItems = (): number => {
  return (
    SPAWN_CONFIG[ItemType.HEALTH_SMALL] +
    SPAWN_CONFIG[ItemType.HEALTH_LARGE] +
    SPAWN_CONFIG[ItemType.HEALTH_FULL] +
    SPAWN_CONFIG[ItemType.LEVEL_UP] +
    SPAWN_CONFIG[ItemType.MAP_REVEAL]
  );
};

export const spawnItems = (
  rooms: Room[],
  enemies: Enemy[],
  excluded: Position[]
): Item[] => {
  const tiles = shuffle(collectTiles(rooms));
  const items: Item[] = [];
  const maxItems = getTotalMaxItems();

  const createItemsOfType = (type: ItemTypeValue, count: number) => {
    for (const tile of tiles) {
      if (items.length >= maxItems) {
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

  // レアアイテムから優先的にスポーン
  createItemsOfType(ItemType.MAP_REVEAL, SPAWN_CONFIG[ItemType.MAP_REVEAL]);
  createItemsOfType(ItemType.HEALTH_FULL, SPAWN_CONFIG[ItemType.HEALTH_FULL]);
  createItemsOfType(ItemType.LEVEL_UP, SPAWN_CONFIG[ItemType.LEVEL_UP]);
  createItemsOfType(ItemType.HEALTH_LARGE, SPAWN_CONFIG[ItemType.HEALTH_LARGE]);
  createItemsOfType(ItemType.HEALTH_SMALL, SPAWN_CONFIG[ItemType.HEALTH_SMALL]);

  return items;
};

export const canPickupItem = (player: Position, item: Item): boolean => {
  return player.x === item.x && player.y === item.y;
};

/** アイテム取得効果の種類 */
export type ItemEffectType = 'heal' | 'level_up' | 'map_reveal';

/** アイテム取得結果 */
export interface ItemPickupResult {
  player: Player;
  itemId: string;
  effectType: ItemEffectType;
  /** LEVEL_UP時はレベルアップ選択画面を表示する必要がある */
  triggerLevelUp: boolean;
  /** MAP_REVEAL時はマップ全体を表示する必要がある */
  triggerMapReveal: boolean;
}

export const pickupItem = (player: Player, item: Item): ItemPickupResult => {
  let updatedPlayer = player;
  let effectType: ItemEffectType = 'heal';
  let triggerLevelUp = false;
  let triggerMapReveal = false;

  switch (item.type) {
    case ItemType.HEALTH_SMALL:
    case ItemType.HEALTH_LARGE:
      // healBonusを考慮した実効回復量を計算
      const effectiveHealAmount = getEffectiveHeal(player, item.healAmount);
      updatedPlayer = healPlayer(player, effectiveHealAmount);
      effectType = 'heal';
      break;

    case ItemType.HEALTH_FULL:
      // 全回復（maxHpまで回復）
      updatedPlayer = { ...player, hp: player.maxHp };
      effectType = 'heal';
      break;

    case ItemType.LEVEL_UP:
      // レベルアップアイテム：レベルアップ選択画面をトリガー
      effectType = 'level_up';
      triggerLevelUp = true;
      break;

    case ItemType.MAP_REVEAL:
      // マップ公開アイテム：マップ全体を公開
      effectType = 'map_reveal';
      triggerMapReveal = true;
      break;
  }

  return {
    player: updatedPlayer,
    itemId: item.id,
    effectType,
    triggerLevelUp,
    triggerMapReveal,
  };
};

export { ITEM_CONFIGS, SPAWN_CONFIG };
