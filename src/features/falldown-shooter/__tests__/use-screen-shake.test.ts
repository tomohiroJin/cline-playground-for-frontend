// 画面シェイクフックのユニットテスト

import { renderHook, act } from '@testing-library/react';
import { useScreenShake } from '../hooks/use-screen-shake';

describe('useScreenShake', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // matchMedia モック
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('初期状態', () => {
    it('初期状態ではシェイク無効', () => {
      const { result } = renderHook(() => useScreenShake());
      expect(result.current.isShaking).toBe(false);
      expect(result.current.shakeStyle).toEqual({});
    });
  });

  describe('シェイクトリガー', () => {
    it('triggerShakeでシェイクが開始される', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.triggerShake(4, 300);
      });
      expect(result.current.isShaking).toBe(true);
    });

    it('指定時間後にシェイクが停止する', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.triggerShake(4, 300);
      });
      expect(result.current.isShaking).toBe(true);

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(result.current.isShaking).toBe(false);
      expect(result.current.shakeStyle).toEqual({});
    });

    it('シェイク中はtransformスタイルが返される', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.triggerShake(4, 300);
      });
      expect(result.current.shakeStyle).toHaveProperty('animation');
    });
  });

  describe('prefers-reduced-motion対応', () => {
    it('reduced-motion有効時はシェイクしない', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.triggerShake(4, 300);
      });
      expect(result.current.isShaking).toBe(false);
      expect(result.current.shakeStyle).toEqual({});
    });
  });

  describe('プリセットトリガー', () => {
    it('bombShakeで爆弾用シェイクが発生する', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.bombShake();
      });
      expect(result.current.isShaking).toBe(true);
    });

    it('blastShakeでブラスト用シェイクが発生する', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.blastShake();
      });
      expect(result.current.isShaking).toBe(true);
    });

    it('gameOverShakeでゲームオーバー用シェイクが発生する', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.gameOverShake();
      });
      expect(result.current.isShaking).toBe(true);
    });

    it('lineShakeでライン消去用シェイクが発生する', () => {
      const { result } = renderHook(() => useScreenShake());

      act(() => {
        result.current.lineShake();
      });
      expect(result.current.isShaking).toBe(true);
    });
  });
});
