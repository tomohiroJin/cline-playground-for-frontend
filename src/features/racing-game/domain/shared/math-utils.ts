// 数学ユーティリティ関数（純粋関数）

/** 値を範囲内にクランプ */
export const clamp = (value: number, min: number, max: number): number => {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
};

/** 角度を [-π, π] に正規化 */
export const normalizeAngle = (angle: number): number => {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
};

/** 2 点間の距離 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number =>
  Math.hypot(x2 - x1, y2 - y1);

/** ランダム整数 [0, max) */
export const randomInt = (max: number): number =>
  Math.floor(Math.random() * Math.max(1, Math.floor(max)));

/** ランダム浮動小数 [min, max) */
export const randomRange = (min: number, max: number): number =>
  min >= max ? min : Math.random() * (max - min) + min;

/** 時間フォーマット（M:SS.C） */
export const formatTime = (ms: number): string => {
  if (typeof ms !== 'number' || Number.isNaN(ms)) return '-:--.-';
  const abs = Math.abs(ms);
  const m = Math.floor(abs / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const c = Math.floor((abs % 1000) / 100);
  return `${m}:${String(s).padStart(2, '0')}.${c}`;
};

/** 安全な配列アクセス */
export const safeIndex = <T,>(arr: readonly T[], idx: number, fallback: T): T =>
  Array.isArray(arr) && idx >= 0 && idx < arr.length ? arr[idx] : fallback;

/** 配列の最小値（reduce 方式でスタックオーバーフロー回避） */
export const min = (arr: number[]): number =>
  Array.isArray(arr) && arr.length > 0
    ? arr.reduce((a, b) => (a < b ? a : b), arr[0])
    : Infinity;
