import { renderHook } from '@testing-library/react';
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
  });
});
