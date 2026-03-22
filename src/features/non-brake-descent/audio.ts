import { createWebAudioAdapter } from './infrastructure/audio/web-audio-adapter';

/**
 * オーディオシングルトン（後方互換性のために維持）
 * 内部では WebAudioAdapter に委譲する
 */
export const Audio = createWebAudioAdapter();
