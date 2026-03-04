import { renderHook, act } from '@testing-library/react';
import { useShrinkHeader } from '../useShrinkHeader';

describe('useShrinkHeader', () => {
  beforeEach(() => {
    // scrollY を書き換え可能にする
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
      configurable: true,
    });
  });

  describe('正常系', () => {
    it('初期状態で isScrolled が false であること', () => {
      const { result } = renderHook(() => useShrinkHeader());
      expect(result.current.isScrolled).toBe(false);
    });

    it('スクロール位置がしきい値を超えると isScrolled が true になること', () => {
      const { result } = renderHook(() => useShrinkHeader());

      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 60, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });

      expect(result.current.isScrolled).toBe(true);
    });

    it('スクロール位置がしきい値以下に戻ると isScrolled が false に戻ること', () => {
      const { result } = renderHook(() => useShrinkHeader());

      // スクロール下
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 100, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(result.current.isScrolled).toBe(true);

      // スクロール上に戻る
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 10, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(result.current.isScrolled).toBe(false);
    });

    it('デフォルトのしきい値が 50 であること', () => {
      const { result } = renderHook(() => useShrinkHeader());

      // ちょうど 50 では false（> threshold が条件）
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 50, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(result.current.isScrolled).toBe(false);

      // 51 で true
      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 51, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(result.current.isScrolled).toBe(true);
    });
  });

  describe('カスタムしきい値', () => {
    it('カスタムしきい値を指定できること', () => {
      const { result } = renderHook(() => useShrinkHeader(100));

      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 80, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(result.current.isScrolled).toBe(false);

      act(() => {
        Object.defineProperty(window, 'scrollY', { value: 101, writable: true, configurable: true });
        window.dispatchEvent(new Event('scroll'));
      });
      expect(result.current.isScrolled).toBe(true);
    });
  });

  describe('クリーンアップ', () => {
    it('アンマウント時にスクロールリスナーが解除されること', () => {
      const addSpy = jest.spyOn(window, 'addEventListener');
      const removeSpy = jest.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useShrinkHeader());

      // scroll リスナーが passive: true で登録されたことを確認
      expect(addSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );

      unmount();

      // scroll リスナーが解除されたことを確認
      expect(removeSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
