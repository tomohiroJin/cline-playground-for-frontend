/** ゲームパッドの入力状態 */
export type GamepadState = {
  connected: boolean;
  axisX: number;
  axisY: number;
  /** このフェーズでは未使用。次フェーズ（S7）でアイテム使用に接続予定 */
  buttonA: boolean;
};

/** アナログスティックのデッドゾーン閾値 */
export const DEADZONE = 0.15;

/** ゲームパッド操作のマレット移動速度（px/frame、非線形カーブ適用後） */
export const GAMEPAD_MOVE_SPEED = 12;

/**
 * 指定インデックスのゲームパッド状態を読み取る
 * 未接続の場合は null を返す
 */
export function readGamepad(index: number): GamepadState | null {
  const gamepads = navigator.getGamepads();
  const gp = gamepads[index];
  if (!gp) return null;

  const rawX = gp.axes[0] ?? 0;
  const rawY = gp.axes[1] ?? 0;

  return {
    connected: true,
    axisX: Math.abs(rawX) < DEADZONE ? 0 : rawX,
    axisY: Math.abs(rawY) < DEADZONE ? 0 : rawY,
    buttonA: gp.buttons[0]?.pressed ?? false,
  };
}

/**
 * プレイヤースロット → ゲームパッドインデックスのマッピング
 * P1 は矢印キー/マウス、P2 は WASD/タッチのため、
 * ゲームパッドは P3（1台目）と P4（2台目）に割り当てる
 */
export const GAMEPAD_INDEX = { P3: 0, P4: 1 } as const;

/** Gamepad API がブラウザでサポートされているか */
export function isGamepadSupported(): boolean {
  return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
}

/**
 * 非線形カーブ（S-2: sign(x) * x^2）
 * 微調整が効きやすく、フルチルトで最大速度に到達する
 */
export function applyNonLinearCurve(axis: number): number {
  return Math.sign(axis) * axis * axis;
}
