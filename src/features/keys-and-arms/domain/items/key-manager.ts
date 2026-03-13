/**
 * 鍵管理（純粋関数）
 *
 * 洞窟ステージの鍵の収集・設置ロジック。
 * 3 つの鍵（CAGE, BAT, BOX）を収集し、ドアに設置する。
 */
import { assert } from '../contracts/assertions';

/** 鍵の総数 */
const TOTAL_KEYS = 3;

/** 鍵状態 */
export interface KeyState {
  readonly keys: readonly boolean[];
  readonly keysPlaced: number;
  readonly carrying: boolean;
}

/** 鍵状態の初期値 */
export function createKeyState(): KeyState {
  return {
    keys: [false, false, false],
    keysPlaced: 0,
    carrying: false,
  };
}

/** 鍵を収集 */
export function collectKey(state: KeyState, index: number): KeyState {
  const newKeys = [...state.keys];
  newKeys[index] = true;
  return {
    ...state,
    keys: newKeys,
    carrying: true,
  };
}

/** 鍵を設置 */
export function placeKey(state: KeyState): KeyState {
  assert(state.carrying, '鍵を所持していること');
  return {
    ...state,
    keysPlaced: state.keysPlaced + 1,
    carrying: false,
  };
}

/** 全鍵設置完了判定 */
export function isAllKeysPlaced(keysPlaced: number): boolean {
  return keysPlaced >= TOTAL_KEYS;
}

/**
 * 鍵を落とす（スパイダーダメージ時）
 * 最も大きいインデックスの取得済み鍵を 1 つ落とす。
 * ゲーム仕様上、鍵は昇順（0→1→2）に取得されるため、
 * 逆順検索 = 最後に取得した鍵 と一致する。
 */
export function dropKey(state: KeyState): KeyState {
  if (!state.carrying) return state;

  const newKeys = [...state.keys];
  for (let i = newKeys.length - 1; i >= 0; i--) {
    if (newKeys[i]) {
      newKeys[i] = false;
      break;
    }
  }
  return {
    ...state,
    keys: newKeys,
    carrying: false,
  };
}
