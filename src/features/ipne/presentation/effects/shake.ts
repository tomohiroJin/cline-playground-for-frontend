/**
 * 画面シェイクのオフセット計算（純粋関数）
 *
 * 従来の Math.random() による無方向ジッタを置き換える。
 * 決定論的な正弦合成で「ヒット方向優勢の減衰振動」を作る。
 * 減衰は呼び出し側（EffectManager の shakeIntensity 減衰）が担う。
 */

/** シェイク方向ベクトル */
export interface ShakeDirection {
  x: number;
  y: number;
}

/** 主振動の角速度（rad/ms）。約 140ms 周期 */
const MAIN_ANGULAR_SPEED = 0.045;

/** ジッタ振動の角速度（rad/ms）。主振動と非整合な周期で自然な揺れを作る */
const JITTER_ANGULAR_SPEED = 0.031;

/** ジッタの位相オフセット（X/Y の同期を崩す） */
const JITTER_PHASE = 1.7;

/** 方向指定時の直交ジッタ比率 */
const CROSS_JITTER_RATIO = 0.3;

/**
 * シェイクオフセットを計算する
 *
 * @param intensity - 振幅（px）。0以下は無振動
 * @param elapsedMs - シェイク開始からの経過時間（ms）
 * @param direction - ヒット方向（省略・ゼロベクトル時は無方向振動）
 */
export function computeShakeOffset(
  intensity: number,
  elapsedMs: number,
  direction?: ShakeDirection
): { x: number; y: number } {
  if (intensity <= 0) return { x: 0, y: 0 };

  const main = Math.sin(elapsedMs * MAIN_ANGULAR_SPEED) * intensity;
  const jitter = Math.sin(elapsedMs * JITTER_ANGULAR_SPEED + JITTER_PHASE) * intensity;

  const length = direction ? Math.hypot(direction.x, direction.y) : 0;
  if (!direction || length === 0) {
    // 無方向: 2軸を非整合周期で振動させて擬似ランダムに見せる
    return { x: main, y: jitter };
  }

  // 方向あり: 主振動をヒット方向に、弱いジッタを直交方向に重ねる
  const nx = direction.x / length;
  const ny = direction.y / length;
  const cross = jitter * CROSS_JITTER_RATIO;
  return {
    x: nx * main - ny * cross,
    y: ny * main + nx * cross,
  };
}
