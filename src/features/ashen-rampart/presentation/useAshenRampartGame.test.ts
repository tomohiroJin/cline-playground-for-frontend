import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { SeededRandom } from '../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';

describe('useAshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('準備フェーズ・手札5枚で開始する', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    expect(result.current.run.phase).toBe('preparation');
    expect(result.current.run.deck.hand).toHaveLength(5);
  });

  it('タワーカードを選択して設置マスに置ける', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    const idx = result.current.run.deck.hand.findIndex(
      (id) => getCardDefinition(id).type === 'tower'
    );
    // シード42の初期手札にタワーがあることを前提（無ければシードを変更）
    expect(idx).toBeGreaterThanOrEqual(0);
    act(() => result.current.selectCard(idx));
    expect(result.current.selectedHandIndex).toBe(idx);
    act(() => result.current.placeAt(PLAINS_MAP.buildSlots[0]));
    expect(result.current.run.board.towers).toHaveLength(1);
    expect(result.current.selectedHandIndex).toBeNull();
  });

  it('不正配置は error に格納されクラッシュしない', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    const idx = result.current.run.deck.hand.findIndex(
      (id) => getCardDefinition(id).type === 'tower'
    );
    act(() => result.current.selectCard(idx));
    act(() => result.current.placeAt(PLAINS_MAP.path[0]));
    expect(result.current.error).not.toBeNull();
    expect(result.current.run.board.towers).toHaveLength(0);
  });

  it('ウェーブ開始→リプレイ完走→自動で次フェーズへ進む', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    act(() => result.current.beginWave());
    expect(result.current.run.phase).toBe('combat');
    const totalTicks = result.current.run.lastResult?.ticks.length ?? 0;
    act(() => {
      jest.advanceTimersByTime((totalTicks + 2) * TICK_INTERVAL_MS);
    });
    // タワーなし全漏れでもライフ10>漏れ数なので報酬フェーズへ
    expect(['reward', 'result']).toContain(result.current.run.phase);
  });

  it('restart で新しいランが始まる', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(42)));
    act(() => result.current.beginWave());
    act(() => result.current.restart());
    expect(result.current.run.phase).toBe('preparation');
    expect(result.current.run.waveIndex).toBe(0);
  });
});
