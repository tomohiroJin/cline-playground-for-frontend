import { Config } from '../../config';

/** コンボ管理ドメインサービス */
export const ComboDomain = {
  /** コンボが発動可能かどうか判定する */
  shouldActivate: (speed: number, min = 8): boolean => speed >= min,
  /** コンボカウントを加算する */
  increment: (combo: number, timer: number) => ({
    combo: timer > 0 ? Math.min(combo + 1, Config.combo.maxMultiplier) : 1,
    timer: Config.combo.timeout,
  }),
  /** コンボをリセットする */
  reset: () => ({ combo: 0, timer: 0 }),
  /** コンボタイマーを1フレーム進める */
  tick: (timer: number) => Math.max(0, timer - 1),
} as const;
