/**
 * 連続移動機能
 * キー押し続けで自動的に移動を繰り返す
 */

import { DirectionValue } from './types';

/** 移動設定 */
export interface MovementConfig {
  /** 移動間隔（ミリ秒） - 小さいほど速い */
  moveInterval: number;
  /** 初回移動の遅延（ミリ秒） - キーリピート開始までの待機 */
  initialDelay: number;
}

/** デフォルトの移動設定 */
export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  moveInterval: 140, // 140ms間隔（秒速7マス程度）
  initialDelay: 180, // 初回は180ms後に連続移動開始
};

/** 連続移動状態 */
export interface MovementState {
  /** 現在押下中の方向キー */
  activeDirection: DirectionValue | null;
  /** キー押下開始時刻 */
  pressStartTime: number;
  /** 最後の移動時刻 */
  lastMoveTime: number;
  /** 連続移動が開始されたか */
  isRepeating: boolean;
}

/** 移動状態の初期値 */
export const INITIAL_MOVEMENT_STATE: MovementState = {
  activeDirection: null,
  pressStartTime: 0,
  lastMoveTime: 0,
  isRepeating: false,
};

/**
 * キーコードから方向を取得
 *
 * @param key - キーボードイベントのkey
 * @returns 方向、または移動キーでない場合はnull
 */
export function getDirectionFromKey(key: string): DirectionValue | null {
  switch (key.toLowerCase()) {
    case 'arrowup':
    case 'w':
      return 'up';
    case 'arrowdown':
    case 's':
      return 'down';
    case 'arrowleft':
    case 'a':
      return 'left';
    case 'arrowright':
    case 'd':
      return 'right';
    default:
      return null;
  }
}

/**
 * 移動キーかどうかを判定
 *
 * @param key - キーボードイベントのkey
 * @returns 移動キーかどうか
 */
export function isMovementKey(key: string): boolean {
  return getDirectionFromKey(key) !== null;
}

/**
 * キー押下開始時の状態更新
 *
 * @param state - 現在の移動状態
 * @param direction - 押下された方向
 * @param currentTime - 現在時刻
 * @returns 更新された移動状態
 */
export function startMovement(
  state: MovementState,
  direction: DirectionValue,
  currentTime: number
): MovementState {
  // 既に同じキーが押されている場合は無視
  if (state.activeDirection === direction) {
    return state;
  }

  return {
    activeDirection: direction,
    pressStartTime: currentTime,
    lastMoveTime: currentTime,
    isRepeating: false,
  };
}

/**
 * キー離し時の状態更新
 *
 * @param state - 現在の移動状態
 * @param direction - 離された方向
 * @returns 更新された移動状態
 */
export function stopMovement(state: MovementState, direction: DirectionValue): MovementState {
  // 押下中のキーと異なる場合は無視
  if (state.activeDirection !== direction) {
    return state;
  }

  return INITIAL_MOVEMENT_STATE;
}

/**
 * 連続移動の更新処理
 * requestAnimationFrameのコールバック内で呼び出す
 *
 * @param state - 現在の移動状態
 * @param currentTime - 現在時刻
 * @param config - 移動設定
 * @returns 移動を実行すべきか、および更新された状態
 */
export function updateMovement(
  state: MovementState,
  currentTime: number,
  config: MovementConfig = DEFAULT_MOVEMENT_CONFIG
): { shouldMove: boolean; newState: MovementState } {
  // キーが押されていない場合
  if (state.activeDirection === null) {
    return { shouldMove: false, newState: state };
  }

  const elapsed = currentTime - state.pressStartTime;
  const timeSinceLastMove = currentTime - state.lastMoveTime;

  // まだ初回遅延中
  if (!state.isRepeating && elapsed < config.initialDelay) {
    return { shouldMove: false, newState: state };
  }

  // 連続移動開始
  if (!state.isRepeating) {
    return {
      shouldMove: true,
      newState: {
        ...state,
        isRepeating: true,
        lastMoveTime: currentTime,
      },
    };
  }

  // 移動間隔チェック
  if (timeSinceLastMove >= config.moveInterval) {
    return {
      shouldMove: true,
      newState: {
        ...state,
        lastMoveTime: currentTime,
      },
    };
  }

  return { shouldMove: false, newState: state };
}
