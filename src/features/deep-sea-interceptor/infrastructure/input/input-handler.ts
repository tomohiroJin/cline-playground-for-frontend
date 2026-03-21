// ============================================================================
// Deep Sea Interceptor - 入力ハンドラインターフェース
// ============================================================================

/** 入力状態 */
export interface InputState {
  readonly dx: number;
  readonly dy: number;
  readonly shoot: boolean;
  readonly chargeStart: boolean;
  readonly chargeEnd: boolean;
}

/** 入力アダプタインターフェース */
export interface InputAdapter {
  /** 現在の入力状態を取得 */
  getState(): InputState;
  /** イベントリスナーを接続 */
  attach(): void;
  /** イベントリスナーを切断 */
  detach(): void;
}

/** 入力状態の初期値 */
export function createEmptyInputState(): InputState {
  return {
    dx: 0,
    dy: 0,
    shoot: false,
    chargeStart: false,
    chargeEnd: false,
  };
}
