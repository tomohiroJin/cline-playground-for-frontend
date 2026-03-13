/**
 * KEYS & ARMS — NullAudioService（テスト用）
 * Proxy ベースの自動 noop AudioModule 実装。
 * テストで音声副作用を除去するために使用する。
 * SoundEffects に新メソッドが追加されても自動で noop を返す。
 */
import type { AudioModule, SoundEffects } from '../types/audio';

const noop = (): void => { /* no-op */ };

/**
 * 全プロパティアクセスに対して noop 関数を返す Proxy を生成
 * 注: 'S' プロパティのみ再帰的に Proxy を返す。
 * AudioModule に他のオブジェクト型プロパティが追加された場合は要更新。
 */
function createNoopProxy<T extends object>(): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      if (prop === 'S') return createNoopProxy<SoundEffects>();
      return noop;
    },
  });
}

/** テスト用の no-op AudioModule を生成 */
export function createNullAudioService(): AudioModule {
  return createNoopProxy<AudioModule>();
}
