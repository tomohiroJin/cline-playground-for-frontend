// ============================================================================
// Deep Sea Interceptor - オーディオシステムインターフェースと実装
// ============================================================================

/** オーディオポートインターフェース */
export interface AudioPort {
  /** オーディオシステムを初期化 */
  init(): void;
  /** サウンドを再生 */
  play(soundName: string): void;
}

// 既存の createAudioSystem を AudioPort として提供
export { createAudioSystem as createWebAudioSystem } from '../../audio';

/** テスト用のヌルオーディオシステム（何も再生しない） */
export function createNullAudioSystem(): AudioPort {
  return {
    init: () => { /* ノーオペレーション */ },
    play: () => { /* ノーオペレーション */ },
  };
}
