/**
 * 原始進化録 - PRIMAL PATH - useGameScale フックテスト
 */
import { renderHook, act } from '@testing-library/react';
import { useGameScale } from '../hooks/use-game-scale';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants/ui';

describe('useGameScale', () => {
  let observerCallback: ResizeObserverCallback;
  const mockDisconnect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // ResizeObserver モック
    global.ResizeObserver = jest.fn((cb) => {
      observerCallback = cb;
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: mockDisconnect,
      };
    }) as unknown as typeof ResizeObserver;
  });

  it('初期スケールは1を返す', () => {
    const { result } = renderHook(() => useGameScale());
    expect(result.current).toBe(1);
  });

  it('ビューポートが基準サイズ以上の場合はスケール1を返す', () => {
    const { result } = renderHook(() => useGameScale());

    act(() => {
      observerCallback(
        [{ contentRect: { width: 1200, height: 1400 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    // min(1200/800, 1400/1200, 1.0) = 1.0
    expect(result.current).toBe(1);
  });

  it('ビューポートが基準サイズより小さい場合はスケールダウンする', () => {
    const { result } = renderHook(() => useGameScale());

    act(() => {
      observerCallback(
        [{ contentRect: { width: 400, height: 600 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    // min(400/800, 600/1200) = min(0.5, 0.5) = 0.5
    expect(result.current).toBe(0.5);
  });

  it('幅が制約の場合は幅ベースのスケールを返す', () => {
    const { result } = renderHook(() => useGameScale());

    act(() => {
      observerCallback(
        [{ contentRect: { width: 480, height: 1200 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    // min(480/800, 1200/1200) = min(0.6, 1.0) = 0.6
    expect(result.current).toBe(0.6);
  });

  it('高さが制約の場合は高さベースのスケールを返す', () => {
    const { result } = renderHook(() => useGameScale());

    act(() => {
      observerCallback(
        [{ contentRect: { width: 800, height: 600 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    // min(800/800, 600/1200) = min(1.0, 0.5) = 0.5
    expect(result.current).toBe(0.5);
  });

  it('最小スケールは0.4を下回らない', () => {
    const { result } = renderHook(() => useGameScale());

    act(() => {
      observerCallback(
        [{ contentRect: { width: 200, height: 300 } }] as unknown as ResizeObserverEntry[],
        {} as ResizeObserver,
      );
    });

    // min(200/800, 300/1200) = min(0.25, 0.25) → clamp to 0.4
    expect(result.current).toBe(0.4);
  });

  it('アンマウント時に ResizeObserver を disconnect する', () => {
    const { unmount } = renderHook(() => useGameScale());
    unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });
});

describe('UI定数', () => {
  it('ゲーム基準幅は800pxである', () => {
    expect(GAME_WIDTH).toBe(800);
  });

  it('ゲーム基準高さは1200pxである', () => {
    expect(GAME_HEIGHT).toBe(1200);
  });
});
