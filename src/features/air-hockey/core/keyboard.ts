/**
 * キーボード操作のコアロジック
 * 1P（矢印キー）/ 2P（WASD）でマレットを移動する
 */
import { clamp } from '../../../utils/math-utils';
import { GameConstants } from './constants';
import { PlayerSlot } from '../domain/contracts/input';

/** キーボードの押下状態 */
export type KeyboardState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
};

/** キーボード移動速度（マウスより遅め） */
export const KEYBOARD_MOVE_SPEED = 6;

/** マレットと壁の間のマージン */
const WALL_MARGIN = 5;

/** マレットと中央ラインの間のマージン */
const CENTER_LINE_MARGIN = 10;

/** キーボード状態の初期値を生成 */
export function createKeyboardState(): KeyboardState {
  return { up: false, down: false, left: false, right: false };
}

/** 1P 用キーマッピング（矢印キーのみ） */
export const PLAYER1_KEY_MAP: Record<string, keyof KeyboardState> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** 2P 用キーマッピング（WASD のみ） */
export const PLAYER2_KEY_MAP: Record<string, keyof KeyboardState> = {
  w: 'up',
  W: 'up',
  a: 'left',
  A: 'left',
  s: 'down',
  S: 'down',
  d: 'right',
  D: 'right',
};

// 後方互換: 全キーを含む統合マッピング
const KEY_MAP: Record<string, keyof KeyboardState> = {
  ...PLAYER1_KEY_MAP,
  ...PLAYER2_KEY_MAP,
};

/** キーマップを使ってキーボード状態を更新する共通ロジック */
function applyKeyMap(
  state: KeyboardState,
  key: string,
  isPressed: boolean,
  keyMap: Record<string, keyof KeyboardState>
): KeyboardState {
  const action = keyMap[key];
  if (!action) return state;
  return { ...state, [action]: isPressed };
}

/**
 * キーイベントに応じてキーボード状態を更新する（後方互換）
 * 1P モードで使用: 矢印キーと WASD の両方を受け付ける
 * 関係ないキーの場合は元の状態をそのまま返す
 */
export function updateKeyboardState(
  state: KeyboardState,
  key: string,
  isPressed: boolean
): KeyboardState {
  return applyKeyMap(state, key, isPressed, KEY_MAP);
}

/**
 * プレイヤー別にキーボード状態を更新する
 * 2P モードで使用: 各プレイヤーが自分のキーマッピングのみ受け付ける
 */
export function updateKeyboardStateForPlayer(
  state: KeyboardState,
  key: string,
  isPressed: boolean,
  playerSlot: PlayerSlot
): KeyboardState {
  const keyMap = playerSlot === 'player1' ? PLAYER1_KEY_MAP : PLAYER2_KEY_MAP;
  return applyKeyMap(state, key, isPressed, keyMap);
}

/**
 * キーボード状態からマレットの新しい位置を計算する
 * playerSlot に応じてクランプ範囲を切り替える:
 *   - player1（デフォルト）: 下半分にクランプ
 *   - player2: 上半分にクランプ
 */
export function calculateKeyboardMovement(
  state: KeyboardState,
  currentPos: { x: number; y: number },
  constants: GameConstants,
  playerSlot: PlayerSlot = 'player1'
): { x: number; y: number; vx: number; vy: number } {
  const { WIDTH: W, HEIGHT: H } = constants.CANVAS;
  const { MALLET: MR } = constants.SIZES;

  let dx = 0;
  let dy = 0;

  if (state.left) dx -= KEYBOARD_MOVE_SPEED;
  if (state.right) dx += KEYBOARD_MOVE_SPEED;
  if (state.up) dy -= KEYBOARD_MOVE_SPEED;
  if (state.down) dy += KEYBOARD_MOVE_SPEED;

  const newX = clamp(currentPos.x + dx, MR + WALL_MARGIN, W - MR - WALL_MARGIN);

  // プレイヤーごとの Y 軸クランプ範囲
  const minY = playerSlot === 'player2'
    ? MR + WALL_MARGIN
    : H / 2 + MR + CENTER_LINE_MARGIN;
  const maxY = playerSlot === 'player2'
    ? H / 2 - MR - CENTER_LINE_MARGIN
    : H - MR - WALL_MARGIN;
  const newY = clamp(currentPos.y + dy, minY, maxY);

  return {
    x: newX,
    y: newY,
    vx: newX - currentPos.x,
    vy: newY - currentPos.y,
  };
}
