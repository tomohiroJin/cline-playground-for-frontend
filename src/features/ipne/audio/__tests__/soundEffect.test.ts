/**
 * IPNE 効果音モジュールのテスト
 */

import {
  playSoundEffect,
  updateSoundSettings,
  getSoundSettings,
  resetSoundSettings,
  playPlayerDamageSound,
  playEnemyKillSound,
  playGameClearSound,
  playGameOverSound,
  playLevelUpSound,
  playAttackHitSound,
  playItemPickupSound,
  playHealSound,
} from '../soundEffect';
import { resetAudioContext } from '../audioContext';
import { SoundEffectType, DEFAULT_AUDIO_SETTINGS } from '../../types';

describe('soundEffect', () => {
  beforeEach(() => {
    resetAudioContext();
    resetSoundSettings();
  });

  describe('getSoundSettings', () => {
    it('デフォルト設定を返す', () => {
      const settings = getSoundSettings();
      expect(settings.masterVolume).toBe(DEFAULT_AUDIO_SETTINGS.masterVolume);
      expect(settings.seVolume).toBe(DEFAULT_AUDIO_SETTINGS.seVolume);
      expect(settings.isMuted).toBe(false);
    });
  });

  describe('updateSoundSettings', () => {
    it('音量設定を更新できる', () => {
      updateSoundSettings({ masterVolume: 0.5 });
      const settings = getSoundSettings();
      expect(settings.masterVolume).toBe(0.5);
    });

    it('ミュート設定を更新できる', () => {
      updateSoundSettings({ isMuted: true });
      const settings = getSoundSettings();
      expect(settings.isMuted).toBe(true);
    });

    it('複数の設定を同時に更新できる', () => {
      updateSoundSettings({ masterVolume: 0.3, seVolume: 0.6, isMuted: true });
      const settings = getSoundSettings();
      expect(settings.masterVolume).toBe(0.3);
      expect(settings.seVolume).toBe(0.6);
      expect(settings.isMuted).toBe(true);
    });
  });

  describe('resetSoundSettings', () => {
    it('設定をデフォルトにリセットする', () => {
      updateSoundSettings({ masterVolume: 0.1, isMuted: true });
      resetSoundSettings();
      const settings = getSoundSettings();
      expect(settings.masterVolume).toBe(DEFAULT_AUDIO_SETTINGS.masterVolume);
      expect(settings.isMuted).toBe(false);
    });
  });

  describe('playSoundEffect', () => {
    it('AudioContextがない場合でもエラーにならない', () => {
      // AudioContextが初期化されていない状態で呼び出し
      expect(() => playSoundEffect(SoundEffectType.PLAYER_DAMAGE)).not.toThrow();
    });

    it('ミュート中は再生しない（エラーにならない）', () => {
      updateSoundSettings({ isMuted: true });
      expect(() => playSoundEffect(SoundEffectType.ENEMY_KILL)).not.toThrow();
    });
  });

  describe('ヘルパー関数', () => {
    it('playPlayerDamageSound がエラーなく呼び出せる', () => {
      expect(() => playPlayerDamageSound()).not.toThrow();
    });

    it('playEnemyKillSound がエラーなく呼び出せる', () => {
      expect(() => playEnemyKillSound()).not.toThrow();
    });

    it('playGameClearSound がエラーなく呼び出せる', () => {
      expect(() => playGameClearSound()).not.toThrow();
    });

    it('playGameOverSound がエラーなく呼び出せる', () => {
      expect(() => playGameOverSound()).not.toThrow();
    });

    it('playLevelUpSound がエラーなく呼び出せる', () => {
      expect(() => playLevelUpSound()).not.toThrow();
    });

    it('playAttackHitSound がエラーなく呼び出せる', () => {
      expect(() => playAttackHitSound()).not.toThrow();
    });

    it('playItemPickupSound がエラーなく呼び出せる', () => {
      expect(() => playItemPickupSound()).not.toThrow();
    });

    it('playHealSound がエラーなく呼び出せる', () => {
      expect(() => playHealSound()).not.toThrow();
    });
  });
});
