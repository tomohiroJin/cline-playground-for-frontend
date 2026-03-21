/**
 * マルチタッチ入力のコアロジック
 * 画面を上下に分割し、1P（下半分）と 2P（上半分）のタッチを独立して追跡する
 */
import { clamp } from '../../../utils/math-utils';
import type { GameConstants } from './constants';
import { MALLET_WALL_MARGIN, MALLET_CENTER_LINE_MARGIN } from './constants';
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
  readonly player1Position: TouchPosition | undefined;
  readonly player2Position: TouchPosition | undefined;
};

/** 初期状態を生成 */
export function createMultiTouchState(): MultiTouchState {
  return {
    player1TouchId: undefined,
    player2TouchId: undefined,
    player1Position: undefined,
    player2Position: undefined,
  };
}

/** Canvas 座標をプレイヤー側にクランプする */
function clampToPlayerZone(
  pos: CanvasPosition,
  playerSlot: PlayerSlot,
  constants: GameConstants
): TouchPosition {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const MR = constants.SIZES.MALLET;

  const x = clamp(pos.canvasX, MR + MALLET_WALL_MARGIN, W - MR - MALLET_WALL_MARGIN);

  const minY = playerSlot === 'player2'
    ? MR + MALLET_WALL_MARGIN
    : H / 2 + MR + MALLET_CENTER_LINE_MARGIN;
  const maxY = playerSlot === 'player2'
    ? H / 2 - MR - MALLET_CENTER_LINE_MARGIN
    : H - MR - MALLET_WALL_MARGIN;
  const y = clamp(pos.canvasY, minY, maxY);

  return { x, y };
}

/** タッチ位置がどちらのゾーンかを判定 */
function getZone(canvasY: number, constants: GameConstants): PlayerSlot {
  return canvasY < constants.CANVAS.HEIGHT / 2 ? 'player2' : 'player1';
}

/** タッチ開始を処理する */
export function processTouchStart(
  state: MultiTouchState,
  touchId: number,
  pos: CanvasPosition,
  constants: GameConstants
): MultiTouchState {
  const zone = getZone(pos.canvasY, constants);

  if (zone === 'player1') {
    // 既に 1P タッチを追跡中なら無視
    if (state.player1TouchId !== undefined) return state;
    return {
      ...state,
      player1TouchId: touchId,
      player1Position: clampToPlayerZone(pos, 'player1', constants),
    };
  }

  // 既に 2P タッチを追跡中なら無視
  if (state.player2TouchId !== undefined) return state;
  return {
    ...state,
    player2TouchId: touchId,
    player2Position: clampToPlayerZone(pos, 'player2', constants),
  };
}

/** タッチ移動を処理する */
export function processTouchMove(
  state: MultiTouchState,
  touchId: number,
  pos: CanvasPosition,
  constants: GameConstants
): MultiTouchState {
  if (touchId === state.player1TouchId) {
    return {
      ...state,
      player1Position: clampToPlayerZone(pos, 'player1', constants),
    };
  }
  if (touchId === state.player2TouchId) {
    return {
      ...state,
      player2Position: clampToPlayerZone(pos, 'player2', constants),
    };
  }
  return state;
}

/** タッチ終了を処理する */
export function processTouchEnd(
  state: MultiTouchState,
  touchId: number
): MultiTouchState {
  if (touchId === state.player1TouchId) {
    return {
      ...state,
      player1TouchId: undefined,
      player1Position: undefined,
    };
  }
  if (touchId === state.player2TouchId) {
    return {
      ...state,
      player2TouchId: undefined,
      player2Position: undefined,
    };
  }
  return state;
}

/** プレイヤーの現在位置を取得する */
export function getPlayerPosition(
  state: MultiTouchState,
  playerSlot: PlayerSlot
): TouchPosition | undefined {
  return playerSlot === 'player1' ? state.player1Position : state.player2Position;
}
