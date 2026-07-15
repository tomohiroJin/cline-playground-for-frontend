import { renderHook, act } from '@testing-library/react';
import { useChainFeedback } from '../hooks/use-chain-feedback';
import type { ChainStep } from '../types';

/** chain 1..n の連鎖ステップ列を作る */
const mkSteps = (n: number): ChainStep[] =>
  Array.from({ length: n }, (_, i) => ({
    chain: i + 1,
    clearedCells: [],
    clearedRows: [],
    grid: [],
    cellsCleared: 0,
  }));

describe('useChainFeedback', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('2連鎖以上で currentChain が最大連鎖まで段階上昇し、その後0に戻ること', () => {
    const shakes: number[] = [];
    const { result } = renderHook(() =>
      useChainFeedback({ soundEnabled: true, triggerShake: (i) => shakes.push(i) })
    );

    act(() => {
      result.current.celebrate(mkSteps(3));
    });

    act(() => {
      jest.advanceTimersByTime(140); // level 2
    });
    expect(result.current.currentChain).toBe(2);

    act(() => {
      jest.advanceTimersByTime(140); // level 3
    });
    expect(result.current.currentChain).toBe(3);
    expect(shakes.length).toBeGreaterThanOrEqual(2);

    act(() => {
      jest.advanceTimersByTime(1000); // HOLD 経過
    });
    expect(result.current.currentChain).toBe(0);
  });

  test('1連鎖以下では発火しないこと', () => {
    const { result } = renderHook(() => useChainFeedback({ soundEnabled: true }));
    act(() => {
      result.current.celebrate(mkSteps(1));
    });
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current.currentChain).toBe(0);
  });
});
