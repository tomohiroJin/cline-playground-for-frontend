/**
 * キーボード操作のコアロジック
 * WASD / 矢印キーでマレットを移動する
 */
import { clamp } from '../../../utils/math-utils';
import { GameConstants } from './constants';

/** キーボードの押下状態 */
export type KeyboardState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

/** キーボード移動速度（マウスより遅め） */
export const KEYBOARD_MOVE_SPEED = 6;

/** キーボード状態の初期値を生成 */
export function createKeyboardState(): KeyboardState {
  return { up: false, down: false, left: false, right: false };
}

// キーとアクションのマッピング
const KEY_MAP: Record<string, keyof KeyboardState> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
};

/**
 * キーイベントに応じてキーボード状態を更新する
 * 関係ないキーの場合は元の状態をそのまま返す
 */
export function updateKeyboardState(
  state: KeyboardState,
  key: string,
  isPressed: boolean
): KeyboardState {
  const action = KEY_MAP[key];
  if (!action) return state;
  return { ...state, [action]: isPressed };
}

/**
 * キーボード状態からマレットの新しい位置を計算する
 * プレイヤー側半面（下半分）にクランプされる
 */
export function calculateKeyboardMovement(
  state: KeyboardState,
  currentPos: { x: number; y: number },
  constants: GameConstants
): { x: number; y: number; vx: number; vy: number } {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const { MALLET: MR } = constants.SIZES;

  let dx = 0;
  let dy = 0;

  if (state.left) dx -= KEYBOARD_MOVE_SPEED;
  if (state.right) dx += KEYBOARD_MOVE_SPEED;
  if (state.up) dy -= KEYBOARD_MOVE_SPEED;
  if (state.down) dy += KEYBOARD_MOVE_SPEED;

  const newX = clamp(currentPos.x + dx, MR + 5, W - MR - 5);
  const newY = clamp(currentPos.y + dy, H / 2 + MR + 10, H - MR - 5);

  return {
    x: newX,
    y: newY,
    vx: newX - currentPos.x,
    vy: newY - currentPos.y,
  };
}
