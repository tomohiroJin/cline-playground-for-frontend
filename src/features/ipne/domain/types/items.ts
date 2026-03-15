/**
 * アイテム関連の型定義
 * アイテムの種類とデータ構造
 */

/** アイテム種別 */
export const ItemType = {
  HEALTH_SMALL: 'health_small',
  HEALTH_LARGE: 'health_large',
  HEALTH_FULL: 'health_full',
  LEVEL_UP: 'level_up',
  MAP_REVEAL: 'map_reveal',
  KEY: 'key',
} as const;

export type ItemTypeValue = (typeof ItemType)[keyof typeof ItemType];

/** アイテムデータ */
export interface Item {
  id: string;
  x: number;
  y: number;
  type: ItemTypeValue;
  healAmount: number;
}
