// Racing Game ユーティリティ関数

export const Utils = {
  clamp: (v: number, min: number, max: number) => {
    const n = Number(v);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  },
  sum: (arr: number[]) =>
    Array.isArray(arr) && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : 0,
  min: (arr: number[]) => (Array.isArray(arr) && arr.length > 0 ? Math.min(...arr) : Infinity),
  randInt: (max: number) => Math.floor(Math.random() * Math.max(1, Math.floor(max))),
  randRange: (min: number, max: number) => (min >= max ? min : Math.random() * (max - min) + min),
  randChoice: <T,>(arr: readonly T[]) =>
    Array.isArray(arr) && arr.length > 0 ? arr[Utils.randInt(arr.length)] : null,

  normalizeAngle: (angle: number) => {
    let a = angle % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  },

  formatTime: (ms: number) => {
    if (typeof ms !== 'number' || Number.isNaN(ms)) return '-:--.-';
    const abs = Math.abs(ms);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    const c = Math.floor((abs % 1000) / 100);
    return `${m}:${String(s).padStart(2, '0')}.${c}`;
  },

  safeIndex: <T,>(arr: readonly T[], idx: number, fallback: T) =>
    Array.isArray(arr) && idx >= 0 && idx < arr.length ? arr[idx] : fallback,

  dist: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
};
