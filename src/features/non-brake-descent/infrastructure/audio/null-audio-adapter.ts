import { AudioPort } from './audio-port';

/**
 * テスト用の空オーディオアダプター
 * すべてのメソッドが何もしない実装を提供する
 */
export const createNullAudioAdapter = (): AudioPort => ({
  init: () => {},
  play: () => {},
  playMelody: () => {},
  playCombo: () => {},
  startBGM: () => {},
  stopBGM: () => {},
  cleanup: () => {},
});
