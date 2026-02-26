import { renderHook, act } from '@testing-library/react';
import { useInterval, useKeyboard, useIdleTimer } from '../hooks';
import type { KeyboardHandlers } from '../types';

// フェイクタイマーを使用
jest.useFakeTimers();

describe('useInterval', () => {
  test('enabled=true の場合コールバックが定期的に呼ばれること', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 100, true));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });

  test('enabled=false の場合コールバックが呼ばれないこと', () => {
    const callback = jest.fn();
    renderHook(() => useInterval(callback, 100, false));

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  test('enabled を true→false に変更するとコールバックが停止すること', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ enabled }) => useInterval(callback, 100, enabled),
      { initialProps: { enabled: true } }
    );

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(callback).toHaveBeenCalledTimes(2);

    rerender({ enabled: false });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    // 停止後は呼ばれない
    expect(callback).toHaveBeenCalledTimes(2);
  });

  test('delay 変更時にインターバルがリセットされること', () => {
    const callback = jest.fn();
    const { rerender } = renderHook(
      ({ delay }) => useInterval(callback, delay, true),
      { initialProps: { delay: 100 } }
    );

    act(() => {
      jest.advanceTimersByTime(250);
    });
    expect(callback).toHaveBeenCalledTimes(2);

    callback.mockClear();
    rerender({ delay: 200 });

    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(callback).toHaveBeenCalledTimes(2);
  });
});

describe('useKeyboard', () => {
  const createHandlers = (): KeyboardHandlers => ({
    left: jest.fn(),
    right: jest.fn(),
    fire: jest.fn(),
    skill1: jest.fn(),
    skill2: jest.fn(),
    skill3: jest.fn(),
  });

  test('ArrowLeft キーで left ハンドラーが呼ばれること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    });

    expect(handlers.left).toHaveBeenCalledTimes(1);
  });

  test('ArrowRight キーで right ハンドラーが呼ばれること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
    });

    expect(handlers.right).toHaveBeenCalledTimes(1);
  });

  test('スペースキーで fire ハンドラーが呼ばれること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    });

    expect(handlers.fire).toHaveBeenCalledTimes(1);
  });

  test('ArrowUp キーで fire ハンドラーが呼ばれること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    });

    expect(handlers.fire).toHaveBeenCalledTimes(1);
  });

  test('1,2,3 キーでスキルハンドラーが呼ばれること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '1' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '2' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '3' }));
    });

    expect(handlers.skill1).toHaveBeenCalledTimes(1);
    expect(handlers.skill2).toHaveBeenCalledTimes(1);
    expect(handlers.skill3).toHaveBeenCalledTimes(1);
  });

  test('enabled=false の場合キーイベントが無視されること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(false, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    });

    expect(handlers.left).not.toHaveBeenCalled();
    expect(handlers.fire).not.toHaveBeenCalled();
  });

  test('repeat キーイベントが無視されること', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', repeat: true }));
    });

    expect(handlers.left).not.toHaveBeenCalled();
  });

  test('未登録キーは何もしないこと', () => {
    const handlers = createHandlers();
    renderHook(() => useKeyboard(true, handlers));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });

    // どのハンドラーも呼ばれない
    Object.values(handlers).forEach(h => {
      expect(h).not.toHaveBeenCalled();
    });
  });
});

describe('useIdleTimer', () => {
  test('タイムアウト後に onIdle が呼ばれること', () => {
    const onIdle = jest.fn();
    renderHook(() => useIdleTimer(3000, onIdle, true));

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  test('enabled=false の場合 onIdle が呼ばれないこと', () => {
    const onIdle = jest.fn();
    renderHook(() => useIdleTimer(3000, onIdle, false));

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(onIdle).not.toHaveBeenCalled();
  });

  test('reset を呼ぶとタイマーがリセットされること', () => {
    const onIdle = jest.fn();
    const { result } = renderHook(() => useIdleTimer(3000, onIdle, true));

    // 2秒経過
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onIdle).not.toHaveBeenCalled();

    // リセット
    act(() => {
      result.current();
    });

    // さらに2秒（リセットから計2秒なので発火しない）
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onIdle).not.toHaveBeenCalled();

    // さらに1秒（リセットから計3秒で発火）
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onIdle).toHaveBeenCalledTimes(1);
  });
});
