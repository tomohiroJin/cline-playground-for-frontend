import React from 'react'; // React を明示的にインポート
import { renderHook, act } from '@testing-library/react';
import { useCompletionOverlay } from './useCompletionOverlay';
import { Provider, createStore } from 'jotai';
import { completionOverlayVisibleAtom } from '../store/atoms';

const renderWithProvider = (initialState: boolean) => {
  const store = createStore();
  store.set(completionOverlayVisibleAtom, initialState);
  return renderHook(() => useCompletionOverlay(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    ),
  });
};

describe('useCompletionOverlay', () => {
  it('初期状態で overlayVisible が false であること', () => {
    const { result } = renderWithProvider(false);
    expect(result.current.overlayVisible).toBe(false);
  });

  it('toggleOverlay を呼び出すと overlayVisible が切り替わること', () => {
    const { result } = renderWithProvider(false);

    act(() => {
      result.current.toggleOverlay();
    });
    expect(result.current.overlayVisible).toBe(true);

    act(() => {
      result.current.toggleOverlay();
    });
    expect(result.current.overlayVisible).toBe(false);
  });

  it('showOverlay を呼び出すと overlayVisible が true になること', () => {
    const { result } = renderWithProvider(false);

    act(() => {
      result.current.showOverlay();
    });
    expect(result.current.overlayVisible).toBe(true);
  });

  it('hideOverlay を呼び出すと overlayVisible が false になること', () => {
    const { result } = renderWithProvider(false);

    act(() => {
      result.current.showOverlay(); // まず true にする
    });

    act(() => {
      result.current.hideOverlay();
    });
    expect(result.current.overlayVisible).toBe(false);
  });
});
