/**
 * IPNE BGMモジュールのテスト
 */

import {
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
} from '../bgm';
import { resetAudioContext } from '../audioContext';
import { BgmType } from '../../types';

describe('bgm', () => {
  beforeEach(() => {
    resetAudioContext();
    resetBgmState();
  });

  describe('playBgm / stopBgm', () => {
    it('BGMを再生・停止できる', () => {
      // AudioContextがない状態でもエラーにならない
      expect(() => playBgm(BgmType.TITLE)).not.toThrow();
      expect(() => stopBgm()).not.toThrow();
    });
  });

  describe('getCurrentBgmType', () => {
    it('停止中はnullを返す', () => {
      stopBgm();
      expect(getCurrentBgmType()).toBeNull();
    });
  });

  describe('isBgmPlaying', () => {
    it('停止中はfalseを返す', () => {
      stopBgm();
      expect(isBgmPlaying()).toBe(false);
    });
  });

  describe('pauseBgm / resumeBgm', () => {
    it('一時停止と再開がエラーなく呼び出せる', () => {
      expect(() => pauseBgm()).not.toThrow();
      expect(() => resumeBgm()).not.toThrow();
    });
  });

  describe('updateBgmSettings', () => {
    it('設定を更新できる', () => {
      expect(() => updateBgmSettings({ bgmVolume: 0.5 })).not.toThrow();
      expect(() => updateBgmSettings({ isMuted: true })).not.toThrow();
    });
  });

  describe('ヘルパー関数', () => {
    it('playTitleBgm がエラーなく呼び出せる', () => {
      expect(() => playTitleBgm()).not.toThrow();
      stopBgm();
    });

    it('playGameBgm がエラーなく呼び出せる', () => {
      expect(() => playGameBgm()).not.toThrow();
      stopBgm();
    });

    it('playClearJingle がエラーなく呼び出せる', () => {
      expect(() => playClearJingle()).not.toThrow();
      stopBgm();
    });

    it('playGameOverJingle がエラーなく呼び出せる', () => {
      expect(() => playGameOverJingle()).not.toThrow();
      stopBgm();
    });
  });
});
