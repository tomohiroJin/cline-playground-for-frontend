/**
 * ギミック関連の型定義
 * 罠（Trap）、壁（Wall）の種類・状態・データ構造
 */

/** 罠の種類 */
export const TrapType = {
  DAMAGE: 'damage',
  SLOW: 'slow',
  TELEPORT: 'teleport',
} as const;

export type TrapTypeValue = (typeof TrapType)[keyof typeof TrapType];

/** 罠の状態 */
export const TrapState = {
  HIDDEN: 'hidden',
  REVEALED: 'revealed',
  TRIGGERED: 'triggered',
} as const;

export type TrapStateValue = (typeof TrapState)[keyof typeof TrapState];

/** 罠データ */
export interface Trap {
  id: string;
  x: number;
  y: number;
  type: TrapTypeValue;
  state: TrapStateValue;
  isVisibleToThief: boolean;
  cooldownUntil?: number;
}

/** 壁の種類 */
export const WallType = {
  NORMAL: 'normal',
  BREAKABLE: 'breakable',
  PASSABLE: 'passable',
  INVISIBLE: 'invisible',
} as const;

export type WallTypeValue = (typeof WallType)[keyof typeof WallType];

/** 壁の状態 */
export const WallState = {
  INTACT: 'intact',
  DAMAGED: 'damaged',
  BROKEN: 'broken',
  REVEALED: 'revealed',
} as const;

export type WallStateValue = (typeof WallState)[keyof typeof WallState];

/** 壁データ */
export interface Wall {
  x: number;
  y: number;
  type: WallTypeValue;
  state: WallStateValue;
  hp?: number;
}
