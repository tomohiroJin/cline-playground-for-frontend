/**
 * useScrollReveal フックのテスト
 *
 * IntersectionObserver を使ったスクロールアニメーションフックの
 * 振る舞いを検証する。
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { useScrollReveal } from './useScrollReveal';

// IntersectionObserver のモック
type IntersectionCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

interface MockObserver {
  observe: ReturnType<typeof vi.fn>;
  unobserve: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

let mockObserverCallback: IntersectionCallback;
let mockObserverInstance: MockObserver;

beforeEach(() => {
  mockObserverInstance = {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };

  // クラスベースのモック（new で呼び出し可能）
  class MockIntersectionObserver {
    constructor(callback: IntersectionCallback) {
      mockObserverCallback = callback;
      return mockObserverInstance as unknown as MockIntersectionObserver;
    }
    observe() { /* noop */ }
    unobserve() { /* noop */ }
    disconnect() { /* noop */ }
  }

  (globalThis as Record<string, unknown>).IntersectionObserver = MockIntersectionObserver;

  // matchMedia のモック（prefers-reduced-motion: アニメーション有効）
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });
});

afterEach(() => {
  cleanup();
});

/**
 * テスト用のラッパーコンポーネント
 * useScrollReveal の ref を実際の DOM 要素に紐づける
 */
const TestComponent: React.FC<{ childCount: number }> = ({ childCount }) => {
  const ref = useScrollReveal<HTMLDivElement>();
  return React.createElement(
    'div',
    { ref, 'data-testid': 'container' },
    ...Array.from({ length: childCount }, (_, i) =>
      React.createElement('div', { key: i, 'data-testid': `child-${i}` })
    )
  );
};

describe('useScrollReveal', () => {
  describe('正常系', () => {
    it('子要素に初期スタイルが適用される', () => {
      // Arrange & Act
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );

      // Assert
      const child0 = getByTestId('child-0');
      const child1 = getByTestId('child-1');
      const child2 = getByTestId('child-2');

      expect(child0.style.opacity).toBe('0');
      expect(child0.style.transform).toBe('translateY(30px)');
      expect(child1.style.opacity).toBe('0');
      expect(child2.style.opacity).toBe('0');
    });

    it('各子要素に transitionDelay が index × 0.08s で設定される', () => {
      // Arrange & Act
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 5 })
      );

      // Assert
      expect(getByTestId('child-0').style.transitionDelay).toBe('0s');
      expect(getByTestId('child-1').style.transitionDelay).toBe('0.08s');
      expect(getByTestId('child-2').style.transitionDelay).toBe('0.16s');
      expect(getByTestId('child-3').style.transitionDelay).toBe('0.24s');
      expect(getByTestId('child-4').style.transitionDelay).toBe('0.32s');
    });

    it('子要素が IntersectionObserver で監視される', () => {
      // Arrange & Act
      render(React.createElement(TestComponent, { childCount: 3 }));

      // Assert: 各子要素に対して observe が呼ばれる
      expect(mockObserverInstance.observe).toHaveBeenCalledTimes(3);
    });

    it('子要素が画面に入ったときに表示スタイルが適用される', () => {
      // Arrange
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );
      const child0 = getByTestId('child-0');

      // Act: IntersectionObserver のコールバックを発火
      mockObserverCallback([
        {
          isIntersecting: true,
          target: child0,
        },
      ]);

      // Assert: 表示スタイルが適用される
      expect(child0.style.opacity).toBe('1');
      expect(child0.style.transform).toBe('translateY(0)');
    });

    it('画面外に出たら非表示状態に戻る', () => {
      // Arrange
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );
      const child0 = getByTestId('child-0');

      // Act: 一度画面に入って表示
      mockObserverCallback([
        { isIntersecting: true, target: child0 },
      ]);
      expect(child0.style.opacity).toBe('1');

      // Act: 画面外に出る
      mockObserverCallback([
        { isIntersecting: false, target: child0 },
      ]);

      // Assert: 非表示状態に戻る
      expect(child0.style.opacity).toBe('0');
      expect(child0.style.transform).toBe('translateY(30px)');
    });

    it('要素は unobserve されず監視が継続される', () => {
      // Arrange
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );
      const child0 = getByTestId('child-0');

      // Act: 画面に入る
      mockObserverCallback([
        { isIntersecting: true, target: child0 },
      ]);

      // Assert: unobserve が呼ばれない（監視を継続）
      expect(mockObserverInstance.unobserve).not.toHaveBeenCalled();
    });

    it('何度でもフェードイン・フェードアウトを繰り返す', () => {
      // Arrange
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );
      const child0 = getByTestId('child-0');

      // 1回目: 表示 → 非表示 → 表示
      mockObserverCallback([{ isIntersecting: true, target: child0 }]);
      expect(child0.style.opacity).toBe('1');

      mockObserverCallback([{ isIntersecting: false, target: child0 }]);
      expect(child0.style.opacity).toBe('0');

      mockObserverCallback([{ isIntersecting: true, target: child0 }]);
      expect(child0.style.opacity).toBe('1');
      expect(child0.style.transform).toBe('translateY(0)');
    });
  });

  describe('アクセシビリティ', () => {
    it('prefers-reduced-motion が有効な場合はアニメーションをスキップする', () => {
      // Arrange: reduced motion を有効に
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: vi.fn().mockImplementation((query: string) => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      // Act
      const { getByTestId } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );
      const child0 = getByTestId('child-0');

      // Assert: 初期スタイルが適用されない（通常表示のまま）
      expect(child0.style.opacity).toBe('');
      expect(child0.style.transform).toBe('');
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時に observer が disconnect される', () => {
      // Arrange
      const { unmount } = render(
        React.createElement(TestComponent, { childCount: 3 })
      );

      // Act
      unmount();

      // Assert
      expect(mockObserverInstance.disconnect).toHaveBeenCalled();
    });
  });
});
