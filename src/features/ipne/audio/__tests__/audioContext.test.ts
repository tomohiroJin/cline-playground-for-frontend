/**
 * audioContext のユニットテスト
 *
 * AudioContext 管理モジュールの動作を検証する。
 */

import { getAudioContext, enableAudio, isAudioInitialized, resetAudioContext } from '../audioContext';

// AudioContext のモック
const mockResume = jest.fn().mockResolvedValue(undefined);
const mockClose = jest.fn();

class MockAudioContext {
  state: AudioContextState = 'suspended';
  resume = mockResume;
  close = mockClose;
}

describe('audioContext', () => {
  beforeEach(() => {
    resetAudioContext();
    mockResume.mockClear();
    mockClose.mockClear();
    // AudioContext をモックに設定
    (window as unknown as { AudioContext: typeof AudioContext }).AudioContext =
      MockAudioContext as unknown as typeof AudioContext;
  });

  afterEach(() => {
    resetAudioContext();
  });

  describe('getAudioContext', () => {
    it('AudioContext インスタンスを返す', () => {
      const ctx = getAudioContext();
      expect(ctx).toBeInstanceOf(MockAudioContext);
    });

    it('同じインスタンスを再利用する', () => {
      const ctx1 = getAudioContext();
      const ctx2 = getAudioContext();
      expect(ctx1).toBe(ctx2);
    });

    it('AudioContext が利用不可の場合 undefined を返す', () => {
      delete (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
      delete (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const ctx = getAudioContext();
      expect(ctx).toBeUndefined();
    });
  });

  describe('enableAudio', () => {
    it('suspended 状態の場合 resume を呼ぶ', async () => {
      const result = await enableAudio();
      expect(result).toBe(true);
      expect(mockResume).toHaveBeenCalledTimes(1);
    });

    it('AudioContext が利用不可の場合 false を返す', async () => {
      delete (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext;
      delete (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      const result = await enableAudio();
      expect(result).toBe(false);
    });

    it('resume がエラーを投げた場合 false を返す', async () => {
      mockResume.mockRejectedValueOnce(new Error('resume failed'));
      const result = await enableAudio();
      expect(result).toBe(false);
    });
  });

  describe('isAudioInitialized', () => {
    it('初期状態では false を返す', () => {
      expect(isAudioInitialized()).toBe(false);
    });

    it('enableAudio 成功後に AudioContext が running なら true を返す', async () => {
      // resume 後に state を running に変更
      mockResume.mockImplementationOnce(function (this: MockAudioContext) {
        this.state = 'running';
        return Promise.resolve();
      });
      await enableAudio();
      const ctx = getAudioContext() as unknown as MockAudioContext;
      // state が running に変更された場合
      if (ctx) {
        ctx.state = 'running';
      }
      expect(isAudioInitialized()).toBe(true);
    });

    it('resetAudioContext 後は false を返す', async () => {
      await enableAudio();
      resetAudioContext();
      expect(isAudioInitialized()).toBe(false);
    });
  });

  describe('resetAudioContext', () => {
    it('AudioContext の close を呼ぶ', () => {
      getAudioContext(); // インスタンス生成
      resetAudioContext();
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it('リセット後は新しいインスタンスが生成される', () => {
      const ctx1 = getAudioContext();
      resetAudioContext();
      const ctx2 = getAudioContext();
      expect(ctx1).not.toBe(ctx2);
    });
  });
});
