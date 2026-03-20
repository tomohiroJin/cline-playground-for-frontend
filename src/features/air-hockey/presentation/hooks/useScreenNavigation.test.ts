import { renderHook, act } from '@testing-library/react';
import { useScreenNavigation } from './useScreenNavigation';

describe('useScreenNavigation', () => {
  describe('初期状態', () => {
    it('初期画面は menu である', () => {
      const { result } = renderHook(() => useScreenNavigation());
      expect(result.current.screen).toBe('menu');
    });

    it('トランジション状態は false である', () => {
      const { result } = renderHook(() => useScreenNavigation());
      expect(result.current.transitioning).toBe(false);
    });
  });

  describe('画面遷移', () => {
    it('navigateTo で指定した画面に遷移する', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateTo('game');
      });

      expect(result.current.screen).toBe('game');
    });

    it('navigateTo を連続で呼ぶと最後の画面が表示される', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateTo('achievements');
      });
      act(() => {
        result.current.navigateTo('characterDex');
      });

      expect(result.current.screen).toBe('characterDex');
    });

    it('navigateWithTransition でトランジション付き遷移ができる', () => {
      jest.useFakeTimers();
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateWithTransition('game');
      });

      // トランジション中
      expect(result.current.transitioning).toBe(true);

      // タイマー完了後に画面遷移
      act(() => {
        jest.advanceTimersByTime(300);
      });

      expect(result.current.screen).toBe('game');
      expect(result.current.transitioning).toBe(false);

      jest.useRealTimers();
    });
  });

  describe('goToMenu', () => {
    it('メニュー以外の画面から goToMenu でメニューに戻る', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.navigateTo('achievements');
      });
      expect(result.current.screen).toBe('achievements');

      act(() => {
        result.current.goToMenu();
      });
      expect(result.current.screen).toBe('menu');
    });

    it('メニュー画面で goToMenu しても menu のまま', () => {
      const { result } = renderHook(() => useScreenNavigation());

      act(() => {
        result.current.goToMenu();
      });
      expect(result.current.screen).toBe('menu');
    });
  });
});
