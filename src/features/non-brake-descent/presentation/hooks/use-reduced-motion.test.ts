import { act, renderHook } from '@testing-library/react';
import { useReducedMotion } from './use-reduced-motion';

/** matchMedia をモックするヘルパー */
const mockMatchMedia = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });
};

describe('useReducedMotion', () => {
  describe('正常系', () => {
    it('prefers-reduced-motion が無効なら false を返す', () => {
      // Arrange
      mockMatchMedia(false);

      // Act
      const { result } = renderHook(() => useReducedMotion());

      // Assert
      expect(result.current).toBe(false);
    });

    it('prefers-reduced-motion が有効なら true を返す', () => {
      // Arrange
      mockMatchMedia(true);

      // Act
      const { result } = renderHook(() => useReducedMotion());

      // Assert
      expect(result.current).toBe(true);
    });

    it('OS設定が実行時に変化したら追従する', () => {
      // Arrange: change ハンドラを捕捉できるモック
      let changeHandler: ((event: MediaQueryListEvent) => void) | undefined;
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: (query: string) => ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) => {
            changeHandler = handler;
          },
          removeEventListener: jest.fn(),
          addListener: jest.fn(),
          removeListener: jest.fn(),
          dispatchEvent: jest.fn(),
        }),
      });
      const { result } = renderHook(() => useReducedMotion());
      expect(result.current).toBe(false);

      // Act: change イベントで reduce を有効化
      act(() => {
        changeHandler?.({ matches: true } as MediaQueryListEvent);
      });

      // Assert
      expect(result.current).toBe(true);
    });
  });
});
