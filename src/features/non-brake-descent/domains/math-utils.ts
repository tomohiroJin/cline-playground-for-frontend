const ensureFinite = (value: number, label: string): void => {
  if (!Number.isFinite(value)) {
    throw new Error(`Expected finite ${label}`);
  }
};

const ensureRange = (min: number, max: number): void => {
  if (min > max) {
    throw new Error('Expected min to be <= max');
  }
};

export const MathUtils = {
  clamp: (v: number, min: number, max: number): number => {
    ensureFinite(v, 'value');
    ensureFinite(min, 'min');
    ensureFinite(max, 'max');
    ensureRange(min, max);
    return Math.max(min, Math.min(max, v));
  },
  lerp: (a: number, b: number, t: number): number => {
    ensureFinite(a, 'a');
    ensureFinite(b, 'b');
    ensureFinite(t, 't');
    return a + (b - a) * t;
  },
  randomRange: (min: number, max: number): number => {
    ensureFinite(min, 'min');
    ensureFinite(max, 'max');
    ensureRange(min, max);
    return min + Math.random() * (max - min);
  },
  randomBool: (p = 0.5): boolean => {
    ensureFinite(p, 'probability');
    return Math.random() < p;
  },
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

export const FnUtils = {
  identity: <T,>(value: T): T => value,
  pipe:
    <T,>(...fns: Array<(value: T) => T>) =>
    (value: T): T =>
      fns.reduce((current, fn) => fn(current), value),
} as const;
