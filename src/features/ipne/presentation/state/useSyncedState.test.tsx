import { act, renderHook } from '@testing-library/react';
import { useSyncedState } from './useSyncedState';

describe('useSyncedState', () => {
  it('初期値で state と ref が同期される', () => {
    const { result } = renderHook(() => useSyncedState(10));
    expect(result.current[0]).toBe(10);
    expect(result.current[2].current).toBe(10);
  });

  it('値更新で state と ref が同期される', () => {
    const { result } = renderHook(() => useSyncedState(1));

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(5);
    expect(result.current[2].current).toBe(5);
  });

  it('関数更新を連続適用しても同期される', () => {
    const { result } = renderHook(() => useSyncedState(0));

    act(() => {
      result.current[1](prev => prev + 1);
      result.current[1](prev => prev + 1);
      result.current[1](prev => prev + 1);
    });

    expect(result.current[0]).toBe(3);
    expect(result.current[2].current).toBe(3);
  });
});
