import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CountUp } from '../CountUp';

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

// IntersectionObserver のモック
const mockObserve = jest.fn();
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
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      };
    }
  );
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CountUp', () => {
  describe('正常系', () => {
    it('初期値が 0 であること', () => {
      render(<CountUp end={13} />);
      const element = screen.getByTestId('count-up');
      expect(element.textContent).toBe('0');
    });

    it('IntersectionObserver が登録されること', () => {
      render(<CountUp end={13} />);
      expect(mockObserve).toHaveBeenCalled();
    });

    it('viewport に入ると目標値に到達すること', () => {
      render(<CountUp end={13} duration={1500} />);

      // viewport に入る
      act(() => {
        intersectionCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      // duration 以上時間を進める
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const element = screen.getByTestId('count-up');
      expect(element.textContent).toBe('13');
    });

    it('suffix が正しく表示されること', () => {
      render(<CountUp end={13} suffix=" Games" />);

      // viewport に入る
      act(() => {
        intersectionCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      // 完了まで待つ
      act(() => {
        jest.advanceTimersByTime(2000);
      });

      const element = screen.getByTestId('count-up');
      expect(element.textContent).toBe('13 Games');
    });

    it('viewport に入る前はカウントアップが始まらないこと', () => {
      render(<CountUp end={13} duration={100} />);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      const element = screen.getByTestId('count-up');
      expect(element.textContent).toBe('0');
    });
  });

  describe('prefers-reduced-motion', () => {
    it('reduced-motion 時は即座に目標値が表示されること', () => {
      mockMatchMedia(true);
      render(<CountUp end={13} />);

      // viewport に入る
      act(() => {
        intersectionCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      const element = screen.getByTestId('count-up');
      expect(element.textContent).toBe('13');
    });
  });

  describe('props', () => {
    it('className prop が適用されること', () => {
      render(<CountUp end={10} className="custom" />);
      const element = screen.getByTestId('count-up');
      expect(element).toHaveClass('custom');
    });
  });

  describe('アンマウント', () => {
    it('アンマウント時に IntersectionObserver が解除されること', () => {
      const { unmount } = render(<CountUp end={13} />);
      unmount();
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('アンマウント時にタイマーがクリアされてエラーにならないこと', () => {
      const { unmount } = render(<CountUp end={13} />);

      // viewport に入る
      act(() => {
        intersectionCallback(
          [{ isIntersecting: true } as IntersectionObserverEntry],
          {} as IntersectionObserver
        );
      });

      expect(() => unmount()).not.toThrow();

      act(() => {
        jest.advanceTimersByTime(2000);
      });
    });
  });
});
