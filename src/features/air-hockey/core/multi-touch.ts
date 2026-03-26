/**
 * マルチタッチ入力のコアロジック
 * 2P モード: 画面を上下に分割し、1P（下半分）と 2P（上半分）のタッチを独立して追跡
 * 2v2 モード: 画面を4分割し、各プレイヤーのタッチを独立して追跡
 */
import { clamp } from '../../../utils/math-utils';
import type { GameConstants } from './constants';
import { getPlayerXBounds, getPlayerYBounds, getPlayerZone } from './constants';
import type { PlayerSlot } from '../domain/contracts/input';

/** タッチ位置（Canvas 座標系） */
export type TouchPosition = {
  x: number;
  y: number;
};

/** Canvas 座標系での入力位置 */
type CanvasPosition = {
  canvasX: number;
  canvasY: number;
};

/** マルチタッチの状態（イミュータブル） */
export type MultiTouchState = {
  readonly player1TouchId: number | undefined;
  readonly player2TouchId: number | undefined;
  readonly player3TouchId: number | undefined;
  readonly player4TouchId: number | undefined;
  readonly player1Position: TouchPosition | undefined;
  readonly player2Position: TouchPosition | undefined;
  readonly player3Position: TouchPosition | undefined;
  readonly player4Position: TouchPosition | undefined;
};

/** 初期状態を生成 */
export function createMultiTouchState(): MultiTouchState {
  return {
    player1TouchId: undefined,
    player2TouchId: undefined,
    player3TouchId: undefined,
    player4TouchId: undefined,
    player1Position: undefined,
    player2Position: undefined,
    player3Position: undefined,
    player4Position: undefined,
  };
}

/** Canvas 座標をプレイヤーゾーンにクランプする */
function clampToPlayerZone(
  pos: CanvasPosition,
  playerSlot: PlayerSlot,
  constants: GameConstants
): TouchPosition {
  // player3/player4 は getPlayerZone で4分割ゾーンを取得
  if (playerSlot === 'player3' || playerSlot === 'player4') {
    const zone = getPlayerZone(playerSlot, constants);
    return {
      x: clamp(pos.canvasX, zone.minX, zone.maxX),
      y: clamp(pos.canvasY, zone.minY, zone.maxY),
    };
  }
  // player1/player2 は既存ロジック（上下分割）を維持
  const { minX, maxX } = getPlayerXBounds(constants);
  const { minY, maxY } = getPlayerYBounds(playerSlot, constants);
  return {
    x: clamp(pos.canvasX, minX, maxX),
    y: clamp(pos.canvasY, minY, maxY),
  };
}

/**
 * タッチ位置がどのゾーンかを判定する
 * is4Zone=true（2v2モード）: 画面を4分割（左下/右下/左上/右上）
 * is4Zone=false（2Pモード）: 画面を上下2分割（下=player1, 上=player2）
 */
function detectZone(pos: CanvasPosition, constants: GameConstants, is4Zone: boolean): PlayerSlot {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const isBottom = pos.canvasY >= H / 2;

  if (!is4Zone) {
    // 2P モード: 従来の上下分割
    return isBottom ? 'player1' : 'player2';
  }

  // 2v2 モード: 4分割
  const isLeft = pos.canvasX < W / 2;
  if (isBottom && isLeft) return 'player1';
  if (isBottom && !isLeft) return 'player2';
  if (!isBottom && isLeft) return 'player3';
  return 'player4';
}

/** タッチIDとスロットのマッピング */
type SlotKey = `${PlayerSlot}TouchId`;
type PosKey = `${PlayerSlot}Position`;

function touchIdKey(slot: PlayerSlot): SlotKey {
  return `${slot}TouchId`;
}

function positionKey(slot: PlayerSlot): PosKey {
  return `${slot}Position`;
}

/**
 * タッチ開始を処理する
 * @param is4Zone true=4分割ゾーン（2v2）、false=上下2分割（2P）。デフォルト false。
 */
export function processTouchStart(
  state: MultiTouchState,
  touchId: number,
  pos: CanvasPosition,
  constants: GameConstants,
  is4Zone = false
): MultiTouchState {
  const zone = detectZone(pos, constants, is4Zone);
  const tidKey = touchIdKey(zone);
  const posKey = positionKey(zone);

  // 既にこのゾーンのタッチを追跡中なら無視
  if (state[tidKey] !== undefined) return state;

  return {
    ...state,
    [tidKey]: touchId,
    [posKey]: clampToPlayerZone(pos, zone, constants),
  };
}

/** タッチ移動を処理する */
export function processTouchMove(
  state: MultiTouchState,
  touchId: number,
  pos: CanvasPosition,
  constants: GameConstants
): MultiTouchState {
  const slots: PlayerSlot[] = ['player1', 'player2', 'player3', 'player4'];
  for (const slot of slots) {
    if (touchId === state[touchIdKey(slot)]) {
      return {
        ...state,
        [positionKey(slot)]: clampToPlayerZone(pos, slot, constants),
      };
    }
  }
  return state;
}

/** タッチ終了を処理する */
export function processTouchEnd(
  state: MultiTouchState,
  touchId: number
): MultiTouchState {
  const slots: PlayerSlot[] = ['player1', 'player2', 'player3', 'player4'];
  for (const slot of slots) {
    if (touchId === state[touchIdKey(slot)]) {
      return {
        ...state,
        [touchIdKey(slot)]: undefined,
        [positionKey(slot)]: undefined,
      };
    }
  }
  return state;
}

/** プレイヤーの現在位置を取得する */
export function getPlayerPosition(
  state: MultiTouchState,
  playerSlot: PlayerSlot
): TouchPosition | undefined {
  return state[positionKey(playerSlot)];
}
