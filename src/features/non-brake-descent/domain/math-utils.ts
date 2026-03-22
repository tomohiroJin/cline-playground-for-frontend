/** 有限数であることを検証する */
const ensureFinite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`Expected finite ${label}`);
  }
};

/** min <= max であることを検証する */
const ensureRange = (min: number, max: number): void => {
  if (min > max) {
    throw new Error('Expected min to be <= max');
  }
};

/** 数学ユーティリティ関数群 */
export const MathUtils = {
  /** 値を指定範囲内にクランプする */
  clamp: (v: number, min: number, max: number): number => {
    ensureFinite(v, 'value');
    ensureFinite(min, 'min');
    ensureFinite(max, 'max');
    ensureRange(min, max);
    return Math.max(min, Math.min(max, v));
  },
  /** 線形補間を行う */
  lerp: (a: number, b: number, t: number): number => {
    ensureFinite(a, 'a');
    ensureFinite(b, 'b');
    ensureFinite(t, 't');
    return a + (b - a) * t;
  },
  /** 指定範囲内のランダムな数値を返す */
  randomRange: (min: number, max: number): number => {
    ensureFinite(min, 'min');
    ensureFinite(max, 'max');
    ensureRange(min, max);
    return min + Math.random() * (max - min);
  },
  /** 指定確率でランダムな真偽値を返す */
  randomBool: (p = 0.5): boolean => {
    ensureFinite(p, 'probability');
    return Math.random() < p;
  },
  /** 値を指定範囲で正規化する（0〜1に変換） */
  normalize: (v: number, min: number, max: number): number => {
    ensureFinite(v, 'value');
    ensureFinite(min, 'min');
    ensureFinite(max, 'max');
    ensureRange(min, max);
    if (min === max) {
      return 0;
    }
    return (v - min) / (max - min);
  },
} as const;

/** 関数合成ユーティリティ */
export const FnUtils = {
  identity: <T,>(value: T): T => value,
  pipe:
    <T,>(...fns: Array<(value: T) => T>) =>
    (value: T): T =>
      fns.reduce((current, fn) => fn(current), value),
} as const;
