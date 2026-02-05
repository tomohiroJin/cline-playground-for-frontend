/**
 * IPNE 音声設定モジュールのテスト
 */

import {
  initializeAudioSettings,
  setMasterVolume,
  setSeVolume,
  setBgmVolume,
  setMuted,
  toggleMute,
  getAudioSettings,
  resetAudioSettings,
  clearAudioSettings,
} from '../audioSettings';
import { resetAudioContext } from '../audioContext';
import { resetSoundSettings } from '../soundEffect';
import { resetBgmState } from '../bgm';
import { DEFAULT_AUDIO_SETTINGS } from '../../types';

describe('audioSettings', () => {
  beforeEach(() => {
    resetAudioContext();
    resetSoundSettings();
    resetBgmState();
    clearAudioSettings();
  });

  describe('initializeAudioSettings', () => {
    it('デフォルト設定で初期化される', () => {
      const settings = initializeAudioSettings();
      expect(settings.masterVolume).toBe(DEFAULT_AUDIO_SETTINGS.masterVolume);
      expect(settings.seVolume).toBe(DEFAULT_AUDIO_SETTINGS.seVolume);
      expect(settings.bgmVolume).toBe(DEFAULT_AUDIO_SETTINGS.bgmVolume);
      expect(settings.isMuted).toBe(false);
    });
  });

  describe('setMasterVolume', () => {
    it('マスター音量を設定できる', () => {
      initializeAudioSettings();
      setMasterVolume(0.5);
      const settings = getAudioSettings();
      expect(settings.masterVolume).toBe(0.5);
    });

    it('0未満の値は0にクランプされる', () => {
      initializeAudioSettings();
      setMasterVolume(-0.5);
      const settings = getAudioSettings();
      expect(settings.masterVolume).toBe(0);
    });

    it('1より大きい値は1にクランプされる', () => {
      initializeAudioSettings();
      setMasterVolume(1.5);
      const settings = getAudioSettings();
      expect(settings.masterVolume).toBe(1);
    });
  });

  describe('setSeVolume', () => {
    it('SE音量を設定できる', () => {
      initializeAudioSettings();
      setSeVolume(0.3);
      const settings = getAudioSettings();
      expect(settings.seVolume).toBe(0.3);
    });
  });

  describe('setBgmVolume', () => {
    it('BGM音量を設定できる', () => {
      initializeAudioSettings();
      setBgmVolume(0.4);
      const settings = getAudioSettings();
      expect(settings.bgmVolume).toBe(0.4);
    });
  });

  describe('setMuted', () => {
    it('ミュート状態を設定できる', () => {
      initializeAudioSettings();
      setMuted(true);
      const settings = getAudioSettings();
      expect(settings.isMuted).toBe(true);
    });
  });

  describe('toggleMute', () => {
    it('ミュート状態をトグルできる', () => {
      initializeAudioSettings();
      expect(getAudioSettings().isMuted).toBe(false);

      const result1 = toggleMute();
      expect(result1).toBe(true);
      expect(getAudioSettings().isMuted).toBe(true);

      const result2 = toggleMute();
      expect(result2).toBe(false);
      expect(getAudioSettings().isMuted).toBe(false);
    });
  });

  describe('resetAudioSettings', () => {
    it('設定をデフォルトにリセットする', () => {
      initializeAudioSettings();
      setMasterVolume(0.1);
      setMuted(true);

      resetAudioSettings();
      const settings = getAudioSettings();
      expect(settings.masterVolume).toBe(DEFAULT_AUDIO_SETTINGS.masterVolume);
      expect(settings.isMuted).toBe(false);
    });
  });
});
