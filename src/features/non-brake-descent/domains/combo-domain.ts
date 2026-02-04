import { Config } from '../config';

export const ComboDomain = {
  shouldActivate: (speed: number, min = 8): boolean => speed >= min,
  increment: (combo: number, timer: number) => ({
    combo: timer > 0 ? Math.min(combo + 1, Config.combo.maxMultiplier) : 1,
    timer: Config.combo.timeout,
  }),
  reset: () => ({ combo: 0, timer: 0 }),
  tick: (timer: number) => Math.max(0, timer - 1),
} as const;
