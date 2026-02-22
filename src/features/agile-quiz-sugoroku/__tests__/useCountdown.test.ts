/**
 * useCountdown フックのテスト
 */

// tone モジュールのモック
jest.mock('tone', () => ({
  Synth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  PolySynth: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    triggerAttackRelease: jest.fn(),
  })),
  start: jest.fn(),
  now: jest.fn().mockReturnValue(0),
  Transport: { bpm: { value: 120 }, start: jest.fn(), stop: jest.fn(), cancel: jest.fn() },
  Loop: jest.fn().mockImplementation(() => ({
    start: jest.fn().mockReturnThis(),
    stop: jest.fn(),
    dispose: jest.fn(),
  })),
}));

import { renderHook, act } from '@testing-library/react';
import { useCountdown } from '../hooks/useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('初期値はlimitと一致する', () => {
    const { result } = renderHook(() => useCountdown(15));
    expect(result.current.time).toBe(15);
  });

  it('start後に毎秒1ずつ減少する', () => {
    const { result } = renderHook(() => useCountdown(15));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.time).toBe(14);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.time).toBe(13);
  });

  it('stopでカウントダウンが停止する', () => {
    const { result } = renderHook(() => useCountdown(15));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.time).toBe(12);

    act(() => {
      result.current.stop();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    // stopした時点の値から変わらない
    expect(result.current.time).toBe(12);
  });

  it('0になったらタイマーが停止する', () => {
    const { result } = renderHook(() => useCountdown(3));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.time).toBe(0);

    // それ以降は減少しない
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.time).toBe(0);
  });

  it('時間切れ時にonExpireコールバックが発火する', () => {
    const onExpire = jest.fn();
    const { result } = renderHook(() => useCountdown(3, onExpire));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // onExpireはsetTimeoutで非同期に呼ばれる
    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('onExpireが未指定でもエラーにならない', () => {
    const { result } = renderHook(() => useCountdown(2));

    act(() => {
      result.current.start();
    });

    expect(() => {
      act(() => {
        jest.advanceTimersByTime(3000);
      });
    }).not.toThrow();
  });

  it('startを再度呼ぶとlimitにリセットされる', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.time).toBe(5);

    act(() => {
      result.current.start();
    });
    expect(result.current.time).toBe(10);
  });

  it('stop後にstartで再開できる', () => {
    const { result } = renderHook(() => useCountdown(10));

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.stop();
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(result.current.time).toBe(8);
  });
});
