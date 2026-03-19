/**
 * 迷宮の残響 - infrastructure 層 barrel export
 */
export { LocalStorageAdapter, META_KEY, AUDIO_SETTINGS_KEY, DEFAULT_AUDIO_SETTINGS } from './storage/local-storage-adapter';
export { AudioAdapter, NullAudioAdapter } from './audio/audio-adapter';
export type { AudioEngineType } from './audio/audio-adapter';
