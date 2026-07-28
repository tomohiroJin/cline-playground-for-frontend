import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { SeededRandom } from '../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { MAX_TICKS } from '../domain/combat/simulate-wave';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

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

/** 記録イベントを配列に貯めるだけのモックポート */
const createMockPlayLog = (): PlayLogPort & { events: PlayLogEventBody[] } => {
  const events: PlayLogEventBody[] = [];
  return {
    events,
    record: (e) => {
      events.push(e);
    },
    exportAll: () => ({ version: 1, events: events.map((e) => ({ ...e, at: 0 })) }),
  };
};

describe('行動ログ記録', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('マウント時に run_started が1回だけ記録される', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    expect(log.events.filter((e) => e.kind === 'run_started')).toHaveLength(1);
  });

  it('ウェーブ開始で wave_started が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    const started = log.events.filter((e) => e.kind === 'wave_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ wave: 0 });
  });

  it('リプレイ完走で wave_ended が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    // リプレイを完走させる（tick 数 × 間隔ぶん進める）
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (MAX_TICKS + 1));
    });
    expect(log.events.filter((e) => e.kind === 'wave_ended')).toHaveLength(1);
  });

  it('restart で新しい runId の run_started が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.restart());
    const started = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'run_started' }> => e.kind === 'run_started'
    );
    expect(started).toHaveLength(2);
    expect(started[0].runId).not.toBe(started[1].runId);
  });
});
