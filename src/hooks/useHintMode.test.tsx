import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useHintMode } from "./useHintMode";
import { Provider } from "jotai";

// Providerでラップするためのユーティリティ関数
const renderHookWithJotai = <Result, Props>(
  callback: (props: Props) => Result,
  initialProps?: Props
) => {
  return renderHook(callback, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Provider>{children}</Provider>
    ),
    initialProps,
  });
};

describe("useHintMode", () => {
  it("初期状態ではヒントモードが無効であること", () => {
    const { result } = renderHookWithJotai(() => useHintMode());
    expect(result.current.hintModeEnabled).toBe(false);
  });

  it("toggleHintModeを呼び出すとヒントモードが切り替わること", () => {
    const { result } = renderHookWithJotai(() => useHintMode());

    // 初期状態は無効
    expect(result.current.hintModeEnabled).toBe(false);

    // 有効に切り替え
    act(() => {
      result.current.toggleHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(true);

    // 無効に切り替え
    act(() => {
      result.current.toggleHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(false);
  });

  it("enableHintModeを呼び出すとヒントモードが有効になること", () => {
    const { result } = renderHookWithJotai(() => useHintMode());

    // 初期状態は無効
    expect(result.current.hintModeEnabled).toBe(false);

    // 有効にする
    act(() => {
      result.current.enableHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(true);

    // すでに有効な状態で再度有効にしても変わらない
    act(() => {
      result.current.enableHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(true);
  });

  it("disableHintModeを呼び出すとヒントモードが無効になること", () => {
    const { result } = renderHookWithJotai(() => useHintMode());

    // まず有効にする
    act(() => {
      result.current.enableHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(true);

    // 無効にする
    act(() => {
      result.current.disableHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(false);

    // すでに無効な状態で再度無効にしても変わらない
    act(() => {
      result.current.disableHintMode();
    });
    expect(result.current.hintModeEnabled).toBe(false);
  });
});
