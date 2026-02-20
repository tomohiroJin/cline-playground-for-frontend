import { renderHook, act } from '@testing-library/react';
import { useSwipe } from './useSwipe';

const createTouchEvent = (clientX: number, clientY: number) => ({
  touches: [{ clientX, clientY }],
  changedTouches: [{ clientX, clientY }],
  preventDefault: jest.fn(),
});

describe('useSwipe', () => {
  it('右スワイプを検出すること', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(onSwipe, 30));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100) as unknown as React.TouchEvent);
    });
    act(() => {
      result.current.onTouchEnd(createTouchEvent(200, 100) as unknown as React.TouchEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith('right');
  });

  it('左スワイプを検出すること', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(onSwipe, 30));

    act(() => {
      result.current.onTouchStart(createTouchEvent(200, 100) as unknown as React.TouchEvent);
    });
    act(() => {
      result.current.onTouchEnd(createTouchEvent(100, 100) as unknown as React.TouchEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith('left');
  });

  it('上スワイプを検出すること', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(onSwipe, 30));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 200) as unknown as React.TouchEvent);
    });
    act(() => {
      result.current.onTouchEnd(createTouchEvent(100, 100) as unknown as React.TouchEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith('up');
  });

  it('下スワイプを検出すること', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(onSwipe, 30));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100) as unknown as React.TouchEvent);
    });
    act(() => {
      result.current.onTouchEnd(createTouchEvent(100, 200) as unknown as React.TouchEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith('down');
  });

  it('閾値未満の移動はスワイプとして検出しないこと', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(onSwipe, 30));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100) as unknown as React.TouchEvent);
    });
    act(() => {
      result.current.onTouchEnd(createTouchEvent(110, 105) as unknown as React.TouchEvent);
    });

    expect(onSwipe).not.toHaveBeenCalled();
  });

  it('斜め移動は水平方向が優先されること', () => {
    const onSwipe = jest.fn();
    const { result } = renderHook(() => useSwipe(onSwipe, 30));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100, 100) as unknown as React.TouchEvent);
    });
    act(() => {
      result.current.onTouchEnd(createTouchEvent(200, 150) as unknown as React.TouchEvent);
    });

    expect(onSwipe).toHaveBeenCalledWith('right');
  });
});
