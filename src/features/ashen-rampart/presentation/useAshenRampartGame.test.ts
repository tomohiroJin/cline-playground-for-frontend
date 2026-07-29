/**
 * ゲームループのテスト
 *
 * 時間を進めるのは setInterval だけで、ロジックは domain にある。
 * このフックが持つのは「入力の受け取り」「タイマー」「ログ」だけ。
 */
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { getCardDefinition } from '../domain/cards/card-pool';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';

const createMockPlayLog = (): PlayLogPort & { events: PlayLogEventBody[] } => {
  const events: PlayLogEventBody[] = [];
  return {
    events,
    record: (e) => {
      events.push(e);
    },
    exportAll: () => ({ version: 2, events: events.map((e) => ({ ...e, at: 0 })) }),
  };
};

describe('useAshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('マウント時に run_started がシードとプリセット付きで1回記録される', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame(1, log));
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ seed: 1, iteration: 0 });
  });

  it('時間経過で tick が進む', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 10);
    });
    expect(result.current.state.tick).toBe(10);
  });

  it('一時停止すると tick が進まず paused が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => result.current.togglePause());
    const before = result.current.state.tick;
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 10);
    });
    expect(result.current.state.tick).toBe(before);
    expect(log.events.filter((e) => e.kind === 'paused')).toHaveLength(1);
  });

  it('再開すると resumed が記録され tick が再び進む', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => result.current.togglePause());
    act(() => result.current.togglePause());
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 5);
    });
    expect(log.events.filter((e) => e.kind === 'resumed')).toHaveLength(1);
    expect(result.current.state.tick).toBe(5);
  });

  it('カードを選ぶと置けるマスだけが返る', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    const towerIndex = result.current.state.deck.hand.findIndex((id) => id !== 'mud-time');
    act(() => result.current.selectCard(towerIndex));
    expect(result.current.placeableCells.length).toBeGreaterThan(0);
    expect(result.current.placeableCells.length).toBeLessThanOrEqual(12);
  });

  it('選択せずにセルを押しても何も起きない', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.towers).toHaveLength(0);
  });

  it('一時停止中は配置できない（戦術的優位を与えない）', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    act(() => result.current.togglePause());
    // 手札の中身に依存させない: 一時停止中は選択しても置ける場所が無く、
    // セルを押しても設置物が増えないことを検証する
    act(() => result.current.selectCard(0));
    expect(result.current.placeableCells).toEqual([]);
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.towers).toHaveLength(0);
    expect(result.current.state.reactors).toHaveLength(0);
    expect(result.current.state.embers).toHaveLength(0);
    expect(result.current.state.traps).toHaveLength(0);
  });

  it('手札が溢れると失った札名が通知される', () => {
    const { result } = renderHook(() => useAshenRampartGame(1));
    // 初期手札3枚・上限5枚・一度も出さないので、3回目のドロー（120 tick）で必ず溢れる
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 120);
    });
    expect(result.current.state.deck.hand).toHaveLength(5);
    expect(result.current.state.deck.graveyard).toHaveLength(1);
    const lost = result.current.state.deck.graveyard[0];
    expect(typeof lost).toBe('string');
    expect(result.current.overflowNotice).toBe(getCardDefinition(lost as string).name);
  });

  it('予告が切り替わったときにだけ wave_preview_shown が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    const previewsAtMount = log.events.filter((e) => e.kind === 'wave_preview_shown');
    // マウント時点で最初の予告（雑兵8 俊足5）が1回だけ記録される
    expect(previewsAtMount).toHaveLength(1);
    expect(previewsAtMount[0]).toMatchObject({ tick: 0, content: '雑兵8 俊足5' });

    // 次ウェーブ開始 tick（250）に到達するまでは予告が変わらないため追加記録は無い
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 249);
    });
    expect(log.events.filter((e) => e.kind === 'wave_preview_shown')).toHaveLength(1);

    // tick 250 で予告が切り替わり、そのときだけ1件追加される
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    const previewsAfterSwitch = log.events.filter((e) => e.kind === 'wave_preview_shown');
    expect(previewsAfterSwitch).toHaveLength(2);
    expect(previewsAfterSwitch[1]).toMatchObject({ tick: 250, content: '群れ12 雑兵5' });
    expect(result.current.state.tick).toBe(250);
  });

  it('restart で新しいランが始まる', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 20);
    });
    act(() => result.current.restart());
    expect(result.current.state.tick).toBe(0);
    expect(log.events.filter((e) => e.kind === 'run_started')).toHaveLength(2);
  });
});
