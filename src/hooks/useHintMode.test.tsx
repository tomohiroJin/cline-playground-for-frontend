import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useHintMode } from './useHintMode';
import { Provider } from 'jotai';

// Providerでラップするためのユーティリティ関数
const renderHookWithJotai = <Result, Props>(
  callback: (props: Props) => Result,
  initialProps?: Props
) => {
  return renderHook(callback, {
    wrapper: ({ children }: { children: React.ReactNode }) => <Provider>{children}</Provider>,
    initialProps,
  });
};

describe('useHintMode', () => {
  it('初期状態ではヒントは非表示である', () => {
    const { result } = renderHookWithJotai(() => useHintMode());

    expect(result.current.hintModeEnabled).toBe(false);
  });

  describe('ヒント表示状態の切り替え', () => {
    it('ユーザーが『ヒント表示』操作を行うと、ヒントが表示される', () => {
      const { result } = renderHookWithJotai(() => useHintMode());
      act(() => {
        result.current.enableHintMode();
      });
      expect(result.current.hintModeEnabled).toBe(true);
    });

    it('ユーザーが『ヒント表示切替』操作を行うと、ヒントの表示状態が反転する', () => {
      const { result } = renderHookWithJotai(() => useHintMode());

      act(() => {
        result.current.toggleHintMode();
        result.current.toggleHintMode();
      });

      expect(result.current.hintModeEnabled).toBe(false);
    });
  });

  it('ユーザーが『ヒント表示』操作を行うと、ヒントが表示になる', () => {
    const { result } = renderHookWithJotai(() => useHintMode());

    act(() => {
      result.current.enableHintMode();
    });

    expect(result.current.hintModeEnabled).toBe(true);
  });

  it('ユーザーが『ヒント非表示』操作を行うと、ヒントが非表示になる', () => {
    const { result } = renderHookWithJotai(() => useHintMode());

    // 一度表示にしてから非表示にする
    act(() => {
      result.current.enableHintMode();
    });

    act(() => {
      result.current.disableHintMode();
    });

    expect(result.current.hintModeEnabled).toBe(false);
  });
});
