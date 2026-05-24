// useCanvasAutoFit のテスト。
//
// フィードバック「バックすると小さい枠で固定される」対応の中核ロジック
// （表示サイズ確定時に内部解像度を再適用する判定）を保証する。

import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { shouldRedrawOnResize, useCanvasAutoFit } from './useCanvasAutoFit';

describe('shouldRedrawOnResize', () => {
  it('0（未確定）から正の値に確定したら true', () => {
    expect(shouldRedrawOnResize(0, 900)).toBe(true);
  });

  it('同じ幅のままなら false（不要な再適用を避ける）', () => {
    expect(shouldRedrawOnResize(900, 900)).toBe(false);
  });

  it('1px 以内の微小変化は false', () => {
    expect(shouldRedrawOnResize(900, 900.5)).toBe(false);
  });

  it('有意な幅変化（閾値超）は true', () => {
    expect(shouldRedrawOnResize(300, 900)).toBe(true);
  });

  it('次の幅が 0 なら（非表示など）false', () => {
    expect(shouldRedrawOnResize(900, 0)).toBe(false);
  });
});

describe('useCanvasAutoFit', () => {
  let observeMock: jest.Mock;
  let disconnectMock: jest.Mock;
  let capturedCallback: ResizeObserverCallback | null;

  beforeEach(() => {
    observeMock = jest.fn();
    disconnectMock = jest.fn();
    capturedCallback = null;
    // ResizeObserver をモックしてコールバックを捕捉する
    (global as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(cb: ResizeObserverCallback) {
        capturedCallback = cb;
      }
      observe = observeMock;
      disconnect = disconnectMock;
      unobserve = jest.fn();
    };
  });

  const makeCanvasRef = () => {
    const canvas = document.createElement('canvas');
    const ref = createRef<HTMLCanvasElement>();
    (ref as { current: HTMLCanvasElement }).current = canvas;
    return { canvas, ref };
  };

  const fireResize = (width: number) => {
    capturedCallback?.(
      [{ contentRect: { width } } as ResizeObserverEntry],
      {} as ResizeObserver,
    );
  };

  it('Canvas を observe する', () => {
    const { ref } = makeCanvasRef();
    renderHook(() => useCanvasAutoFit(ref, 900, 700));
    expect(observeMock).toHaveBeenCalledTimes(1);
  });

  it('表示サイズが 0→正値に確定したら内部解像度を再適用する', () => {
    const { canvas, ref } = makeCanvasRef();
    canvas.width = 300; // 未確定時の小さい状態を模す
    canvas.height = 150;
    renderHook(() => useCanvasAutoFit(ref, 900, 700));

    fireResize(900);

    expect(canvas.width).toBe(900);
    expect(canvas.height).toBe(700);
  });

  it('アンマウント時に observer を disconnect する', () => {
    const { ref } = makeCanvasRef();
    const { unmount } = renderHook(() => useCanvasAutoFit(ref, 900, 700));
    unmount();
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
