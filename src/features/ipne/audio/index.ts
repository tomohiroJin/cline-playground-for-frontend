/**
 * IPNE 音声モジュール
 *
 * 効果音、BGM、音声設定をエクスポート
 */

// AudioContext管理
export {
  getAudioContext,
  enableAudio,
  isAudioInitialized,
  resetAudioContext,
} from './audioContext';

// 効果音
export {
  playSoundEffect,
  updateSoundSettings,
  getSoundSettings,
  resetSoundSettings,
  playPlayerDamageSound,
  playEnemyKillSound,
  playBossKillSound,
  playGameClearSound,
  playGameOverSound,
  playLevelUpSound,
  playAttackHitSound,
  playItemPickupSound,
  playHealSound,
  playTrapTriggeredSound,
} from './soundEffect';

// BGM
export {
  playBgm,
  stopBgm,
  pauseBgm,
  resumeBgm,
  getCurrentBgmType,
  isBgmPlaying,
  updateBgmSettings,
  resetBgmState,
  playTitleBgm,
  playGameBgm,
  playClearJingle,
  playGameOverJingle,
} from './bgm';

// 音声設定
export {
  initializeAudioSettings,
  setMasterVolume,
  setSeVolume,
  setBgmVolume,
  setMuted,
  toggleMute,
  getAudioSettings,
  resetAudioSettings,
  clearAudioSettings,
} from './audioSettings';
