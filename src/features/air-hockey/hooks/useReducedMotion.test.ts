/**
 * useReducedMotion フックのテスト
 *
 * - prefers-reduced-motion: reduce が true のとき reduced=true を返す
 * - matchMedia の change イベントで再レンダリングされる
 */
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from './useReducedMotion';

type MqlListener = (e: MediaQueryListEvent) => void;

type MockMql = {
  matches: boolean;
  media: string;
  addEventListener: (type: 'change', listener: MqlListener) => void;
  removeEventListener: (type: 'change', listener: MqlListener) => void;
  dispatchChange: (matches: boolean) => void;
};

function installMatchMediaMock(initialMatches: boolean): MockMql {
  const listeners = new Set<MqlListener>();
  const mql: MockMql = {
    matches: initialMatches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type, listener) => listeners.add(listener),
    removeEventListener: (_type, listener) => listeners.delete(listener),
    dispatchChange: (matches) => {
      mql.matches = matches;
      const ev = { matches } as MediaQueryListEvent;
      listeners.forEach((l) => l(ev));
    },
  };
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: jest.fn().mockReturnValue(mql),
  });
  return mql;
}

describe('useReducedMotion', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('初期状態で matchMedia.matches を返す（false）', () => {
    installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it('初期状態で matchMedia.matches を返す（true）', () => {
    installMatchMediaMock(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it('matchMedia change イベントで値が更新される', () => {
    const mql = installMatchMediaMock(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      mql.dispatchChange(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      mql.dispatchChange(false);
    });
    expect(result.current).toBe(false);
  });

  it('アンマウント時にイベントリスナーを解除する', () => {
    const mql = installMatchMediaMock(false);
    const removeSpy = jest.spyOn(mql, 'removeEventListener');
    const { unmount } = renderHook(() => useReducedMotion());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
