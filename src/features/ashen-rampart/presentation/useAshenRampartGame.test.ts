/**
 * ゲームループのテスト
 *
 * 時間を進めるのは setInterval だけで、ロジックは domain にある。
 * このフックが持つのは「入力の受け取り」「タイマー」「ログ」だけ。
 */
import React, { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { getCardDefinition } from '../domain/cards/card-pool';
import { COUNTDOWN_TICKS } from '../domain/combat/combat-state';
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

  it('StrictMode 下でもカードを1枚配置できる（指摘1の回帰: updater 内の副作用で操作が握り潰されていた）', () => {
    const { result } = renderHook(() => useAshenRampartGame(1), {
      wrapper: ({ children }) => React.createElement(StrictMode, null, children),
    });
    const towerIndex = result.current.state.deck.hand.findIndex((id) => id !== 'mud-time');
    expect(towerIndex).toBeGreaterThanOrEqual(0);
    act(() => result.current.selectCard(towerIndex));
    const pos = result.current.placeableCells[0];
    expect(pos).toBeDefined();
    act(() => result.current.clickCell(pos!));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    const totalPlaced =
      result.current.state.towers.length +
      result.current.state.reactors.length +
      result.current.state.traps.length +
      result.current.state.embers.length;
    // StrictMode の二重呼び出しで pendingRef が空のまま消費されると、この配置は握り潰されて0になる
    expect(totalPlaced).toBe(1);
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
    // 実際のウェーブ startTick は COUNTDOWN_TICKS ぶん後ろにずれる（開始カウントダウン、Task 7）。
    // マウント時点（tick 0）ではウェーブ1（雑兵3）もまだ始まっていないため、
    // 「次」の予告はウェーブ1そのものになる。
    expect(previewsAtMount).toHaveLength(1);
    expect(previewsAtMount[0]).toMatchObject({ tick: 0, content: '雑兵3' });

    // ウェーブ1開始 tick（COUNTDOWN_TICKS）に到達するまでは予告が変わらないため追加記録は無い
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (COUNTDOWN_TICKS - 1));
    });
    expect(log.events.filter((e) => e.kind === 'wave_preview_shown')).toHaveLength(1);

    // tick が COUNTDOWN_TICKS に達すると予告がウェーブ2（雑兵3 俊足2）へ切り替わり、
    // そのときだけ1件追加される
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    const previewsAfterSwitch = log.events.filter((e) => e.kind === 'wave_preview_shown');
    expect(previewsAfterSwitch).toHaveLength(2);
    expect(previewsAfterSwitch[1]).toMatchObject({ tick: COUNTDOWN_TICKS, content: '雑兵3 俊足2' });
    expect(result.current.state.tick).toBe(COUNTDOWN_TICKS);
  });

  it('interactCell: 再点火可能な燠火のあるセルを選択なしでクリックすると reactivated が記録される（クールダウン中は記録されない）', () => {
    const log = createMockPlayLog();
    // シード3は初期手札に業火（ember-blast）を2枚含む（他シードは1枚以下か0枚のため選定）
    const { result } = renderHook(() => useAshenRampartGame(3, log));
    const emberHandIndex = result.current.state.deck.hand.findIndex((id) => id === 'ember-blast');
    expect(emberHandIndex).toBeGreaterThanOrEqual(0);

    // 業火を選択し、設置可能マスの先頭に置く
    act(() => result.current.selectCard(emberHandIndex));
    const placePos = result.current.placeableCells[0];
    expect(placePos).toBeDefined();
    act(() => result.current.interactCell(placePos!));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    expect(result.current.state.embers).toHaveLength(1);
    const emberPos = result.current.state.embers[0]!.pos;
    expect(result.current.state.embers[0]!.cooldownLeft).toBeGreaterThan(0);

    // クールダウン中に選択なしで同じセルをクリックしても再点火されない
    act(() => result.current.interactCell(emberPos));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    expect(log.events.filter((e) => e.kind === 'reactivated')).toHaveLength(0);

    // クールダウンが明けるまで進める（業火の再点火間隔は300 tick）
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 300);
    });
    expect(result.current.state.embers[0]!.cooldownLeft).toBe(0);

    // 選択なしでクリックすると今度は再点火され、reactivated が記録される
    act(() => result.current.interactCell(emberPos));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    expect(log.events.filter((e) => e.kind === 'reactivated')).toHaveLength(1);
    expect(result.current.state.embers[0]!.cooldownLeft).toBeGreaterThan(0);
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

  it('restart にシードとプリセットを渡すと run_started に正しく反映される（指摘6: 別シードでの再現手順をUIから実行可能にする）', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => result.current.restart(42, 'heavy'));
    expect(result.current.runSeed).toBe(42);
    expect(result.current.presetId).toBe('heavy');
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(2);
    expect(started[1]).toMatchObject({ seed: 42, presetId: 'heavy' });
  });

  it('restart を引数なしで呼ぶと直前のシード・プリセットを維持する', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(1, log));
    act(() => result.current.restart(7, 'heavy'));
    act(() => result.current.restart());
    expect(result.current.runSeed).toBe(7);
    expect(result.current.presetId).toBe('heavy');
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started[2]).toMatchObject({ seed: 7, presetId: 'heavy' });
  });
});
