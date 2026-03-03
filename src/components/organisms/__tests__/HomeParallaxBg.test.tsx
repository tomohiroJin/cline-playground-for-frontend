import React from 'react';
import { render, screen } from '@testing-library/react';
import { HomeParallaxBg } from '../HomeParallaxBg';

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

describe('HomeParallaxBg', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  describe('正常系', () => {
    it('コンポーネントが正常にレンダリングされること', () => {
      const { container } = render(<HomeParallaxBg />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('3つのレイヤーが存在すること', () => {
      render(<HomeParallaxBg />);

      const layers = screen.getAllByTestId(/^parallax-layer-/);
      expect(layers).toHaveLength(3);
    });

    it('Far / Mid / Near の各レイヤーが識別できること', () => {
      render(<HomeParallaxBg />);

      expect(screen.getByTestId('parallax-layer-far')).toBeInTheDocument();
      expect(screen.getByTestId('parallax-layer-mid')).toBeInTheDocument();
      expect(screen.getByTestId('parallax-layer-near')).toBeInTheDocument();
    });

    it('aria-hidden="true" が設定されていること', () => {
      render(<HomeParallaxBg />);

      const container = screen.getByTestId('parallax-container');
      expect(container).toHaveAttribute('aria-hidden', 'true');
    });

    it('オーバーレイレイヤーが存在すること', () => {
      render(<HomeParallaxBg />);

      expect(screen.getByTestId('parallax-overlay')).toBeInTheDocument();
    });
  });

  describe('className prop', () => {
    it('className prop が適用されること', () => {
      render(<HomeParallaxBg className="custom-class" />);

      const container = screen.getByTestId('parallax-container');
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('prefers-reduced-motion', () => {
    it('reduced-motion 設定時にアニメーションが無効化されること', () => {
      mockMatchMedia(true);

      render(<HomeParallaxBg />);

      const layers = screen.getAllByTestId(/^parallax-layer-/);
      layers.forEach((layer) => {
        // アニメーションが 'none' に設定されていることを確認
        expect(layer.style.animation).toBe('none');
      });
    });
  });
});
