/**
 * 時刻抽象
 */

export interface ClockProvider {
  now(): number;
}

export const SYSTEM_CLOCK_PROVIDER: ClockProvider = {
  now: () => Date.now(),
};
