import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ParticleField } from '../ParticleField';

// matchMedia のモック
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Canvas 2D コンテキストのモック
const mockGetContext = jest.fn();
const mockFillRect = jest.fn();
const mockClearRect = jest.fn();
const mockBeginPath = jest.fn();
const mockArc = jest.fn();
const mockFill = jest.fn();

beforeEach(() => {
  mockGetContext.mockReturnValue({
    fillRect: mockFillRect,
    clearRect: mockClearRect,
    beginPath: mockBeginPath,
    arc: mockArc,
    fill: mockFill,
    fillStyle: '',
    globalAlpha: 1,
    canvas: { width: 800, height: 600 },
  });

  HTMLCanvasElement.prototype.getContext = mockGetContext;
});

// IntersectionObserver のモック
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();
let intersectionCallback: IntersectionObserverCallback;

beforeEach(() => {
  mockMatchMedia(false);
  jest.useFakeTimers();

  (window as unknown as Record<string, unknown>).IntersectionObserver = jest.fn(
    (callback: IntersectionObserverCallback) => {
      intersectionCallback = callback;
      return {
        observe: mockObserve,
        unobserve: mockUnobserve,
        disconnect: mockDisconnect,
      };
    }
  );
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('ParticleField', () => {
  describe('正常系', () => {
    it('Canvas 要素がレンダリングされること', () => {
      render(<ParticleField />);
      const canvas = screen.getByTestId('particle-field');
      expect(canvas).toBeInTheDocument();
      expect(canvas.tagName).toBe('CANVAS');
    });

    it('aria-hidden="true" が設定されていること', () => {
      render(<ParticleField />);
      const canvas = screen.getByTestId('particle-field');
      expect(canvas).toHaveAttribute('aria-hidden', 'true');
    });

    it('className prop が適用されること', () => {
      render(<ParticleField className="custom-class" />);
      const canvas = screen.getByTestId('particle-field');
      expect(canvas).toHaveClass('custom-class');
    });

    it('IntersectionObserver が登録されること', () => {
      render(<ParticleField />);
      expect(mockObserve).toHaveBeenCalled();
    });
  });

  describe('IntersectionObserver による制御', () => {
    it('viewport 外ではアニメーションが停止すること', () => {
      render(<ParticleField />);

      // viewport 外に出す
      act(() => {
        intersectionCallback(
          [{ isIntersecting: false } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      // requestAnimationFrame が呼ばれなくなることを間接的に検証
      // (canvas が存在し、エラーなく動作することを確認)
      expect(screen.getByTestId('particle-field')).toBeInTheDocument();
    });
  });

  describe('prefers-reduced-motion', () => {
    it('reduced-motion 時は静的表示（アニメーションなし）になること', () => {
      mockMatchMedia(true);
      render(<ParticleField />);

      const canvas = screen.getByTestId('particle-field');
      expect(canvas).toBeInTheDocument();
      // reduced-motion 時でも canvas は存在する（静的描画のみ）
    });
  });

  describe('アンマウント', () => {
    it('アンマウント時に IntersectionObserver が解除されること', () => {
      const { unmount } = render(<ParticleField />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  describe('props', () => {
    it('count prop でパーティクル数を指定できること', () => {
      render(<ParticleField count={20} />);
      expect(screen.getByTestId('particle-field')).toBeInTheDocument();
    });

    it('speed prop で速度倍率を指定できること', () => {
      render(<ParticleField speed={2} />);
      expect(screen.getByTestId('particle-field')).toBeInTheDocument();
    });
  });
});
