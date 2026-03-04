import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TypeWriter } from '../TypeWriter';

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

beforeEach(() => {
  mockMatchMedia(false);
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TypeWriter', () => {
  const sampleText = 'こんにちは';

  describe('正常系', () => {
    it('初期状態では空文字が表示されること', () => {
      render(<TypeWriter text={sampleText} />);
      const element = screen.getByTestId('typewriter');
      // 初期は空文字 + カーソル
      expect(element.textContent).toBe('|');
    });

    it('テキストが1文字ずつ順次表示されること', () => {
      render(<TypeWriter text={sampleText} speed={50} />);
      const element = screen.getByTestId('typewriter');

      // 1文字目
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(element.textContent).toContain('こ');

      // 2文字目
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(element.textContent).toContain('こん');

      // 全文字表示
      act(() => {
        jest.advanceTimersByTime(50 * 3);
      });
      expect(element.textContent).toContain(sampleText);
    });

    it('表示完了後にカーソルが表示されていること', () => {
      render(<TypeWriter text="AB" speed={50} />);

      act(() => {
        jest.advanceTimersByTime(50 * 2);
      });

      const cursor = screen.getByTestId('typewriter-cursor');
      expect(cursor).toBeInTheDocument();
      expect(cursor.textContent).toBe('|');
    });

    it('表示完了後3秒でカーソルが消えること', () => {
      render(<TypeWriter text="AB" speed={50} />);

      // テキスト全表示
      act(() => {
        jest.advanceTimersByTime(50 * 2);
      });

      // カーソルはまだ表示中
      expect(screen.getByTestId('typewriter-cursor')).toBeInTheDocument();

      // 3秒後
      act(() => {
        jest.advanceTimersByTime(3000);
      });

      expect(screen.queryByTestId('typewriter-cursor')).not.toBeInTheDocument();
    });
  });

  describe('prefers-reduced-motion', () => {
    it('reduced-motion 時は全文が即時表示されること', () => {
      mockMatchMedia(true);
      render(<TypeWriter text={sampleText} />);
      const element = screen.getByTestId('typewriter');
      expect(element.textContent).toContain(sampleText);
    });
  });

  describe('props', () => {
    it('speed prop で表示間隔を変更できること', () => {
      render(<TypeWriter text="AB" speed={100} />);
      const element = screen.getByTestId('typewriter');

      // 50ms ではまだ1文字も表示されない
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(element.textContent).toBe('|');

      // 100ms で1文字目
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(element.textContent).toContain('A');
    });

    it('cursorChar prop でカーソル文字を変更できること', () => {
      render(<TypeWriter text="A" cursorChar="_" />);
      const cursor = screen.getByTestId('typewriter-cursor');
      expect(cursor.textContent).toBe('_');
    });

    it('className prop が適用されること', () => {
      render(<TypeWriter text="test" className="custom" />);
      const element = screen.getByTestId('typewriter');
      expect(element).toHaveClass('custom');
    });
  });

  describe('アンマウント', () => {
    it('アンマウント時にタイマーがクリアされてエラーにならないこと', () => {
      const { unmount } = render(<TypeWriter text={sampleText} speed={50} />);

      // テキスト途中でアンマウント
      act(() => {
        jest.advanceTimersByTime(50 * 2);
      });

      expect(() => unmount()).not.toThrow();

      // アンマウント後にタイマーが発火してもエラーにならない
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    });
  });
});
