/**
 * KEYS & ARMS — NullAudioService（テスト用）
 * 全メソッドが no-op の AudioModule 実装。
 * テストで音声副作用を除去するために使用する。
 */
import type { AudioModule, SoundEffects } from '../types/audio';

const noop = (): void => { /* no-op */ };

/** テスト用の no-op AudioModule を生成 */
export function createNullAudioService(): AudioModule {
  const S: SoundEffects = {
    tick: noop,
    move: noop,
    grab: noop,
    hit: noop,
    kill: noop,
    pry: noop,
    guard: noop,
    clear: noop,
    over: noop,
    start: noop,
    warn: noop,
    steal: noop,
    shieldBreak: noop,
    gem: noop,
    zap: noop,
    set: noop,
    step: noop,
    ladder: noop,
    safe: noop,
    drip: noop,
    combo: noop,
    bossDie: noop,
  };

  return {
    ea: noop,
    tn: noop,
    noise: noop,
    bgmTick: noop,
    S,
  };
}
