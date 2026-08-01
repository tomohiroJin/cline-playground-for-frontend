/**
 * ゲームループのテスト
 *
 * 時間を進めるのは setInterval だけで、ロジックは domain にある。
 * このフックが持つのは「入力の受け取り」「タイマー」「ログ」だけ。
 */
import React, { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { getCardDefinition, PRESET_DECKS } from '../domain/cards/card-pool';
import { placementKindOf } from '../domain/cards/card-definition';
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

const swiftCards = (): string[] => [...PRESET_DECKS.swift!.cards];

describe('useAshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('マウント時に run_started がシードとデッキ構成付きで1回記録される', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log }));
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ seed: 1, iteration: 2 });
  });

  it('StrictMode 下でもカードを1枚配置できる（指摘1の回帰: updater 内の副作用で操作が握り潰されていた）', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }), {
      wrapper: ({ children }) => React.createElement(StrictMode, null, children),
    });
    // 「盤面に置けて、いま払える」札を手札から探す。カード名の決め打ちだと
    // プリセット構成を変えたときに、置けない札や払えない札を選んで偽の赤になる
    const towerIndex = result.current.state.deck.hand.findIndex((id) => {
      const card = getCardDefinition(id);
      return placementKindOf(card) !== 'none' && card.cost <= result.current.state.mana;
    });
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
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 10);
    });
    expect(result.current.state.tick).toBe(10);
  });

  it('一時停止すると tick が進まず paused が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
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
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
    act(() => result.current.togglePause());
    act(() => result.current.togglePause());
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 5);
    });
    expect(log.events.filter((e) => e.kind === 'resumed')).toHaveLength(1);
    expect(result.current.state.tick).toBe(5);
  });

  it('カードを選ぶと置けるマスだけが返る', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    const towerIndex = result.current.state.deck.hand.findIndex((id) => id !== 'mud-time');
    act(() => result.current.selectCard(towerIndex));
    expect(result.current.placeableCells.length).toBeGreaterThan(0);
    expect(result.current.placeableCells.length).toBeLessThanOrEqual(12);
  });

  it('選択せずにセルを押しても何も起きない', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.towers).toHaveLength(0);
  });

  it('一時停止中は配置できない（戦術的優位を与えない）', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
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
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
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
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
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
    // シード2は速攻型プリセットの初期手札に業火（ember-blast）を2枚含む。
    // プリセット構成を変えると該当シードも変わるため、シード番号は決め打ちの前提として扱う
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 2, playLog: log })
    );
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
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * 20);
    });
    act(() => result.current.restart());
    expect(result.current.state.tick).toBe(0);
    expect(log.events.filter((e) => e.kind === 'run_started')).toHaveLength(2);
  });

  it('restart にシードを渡すと run_started に正しく反映される（指摘6: 別シードでの再現手順をUIから実行可能にする）', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
    act(() => result.current.restart(42));
    expect(result.current.runSeed).toBe(42);
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(2);
    expect(started[1]).toMatchObject({ seed: 42 });
  });

  it('restart を引数なしで呼ぶと毎回新しいシードになる（固定しない）', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
    act(() => result.current.restart());
    const firstRestartSeed = result.current.runSeed;
    act(() => result.current.restart());
    const secondRestartSeed = result.current.runSeed;
    expect(firstRestartSeed).not.toBe(secondRestartSeed);
  });

  describe('discardCard: 選択中の札との位置関係による selectedIndex 補正', () => {
    /**
     * 手札は配列で、捨てると後続の札が前へ詰まる。この3テストは
     * 「選択中より前」「選択中そのもの」「選択中より後ろ」の3ケースすべてを
     * 検証する。1つでも欠けると、詰めの向きが逆でも気づけない。
     *
     * seed:1・swift プリセットは、初期手札3枚＋1回目のドロー（40 tick）で
     * 必ず ['ballista', 'cannon-tower', 'ember-blast', 'arrow-tower'] になる
     * （4枚とも設置系カードなので selectCard で選択状態を作れる）。
     */
    const handToFourCards = () => {
      const cards = swiftCards();
      const rendered = renderHook(() => useAshenRampartGame({ cards, seed: 1 }));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 40);
      });
      expect(rendered.result.current.state.deck.hand).toHaveLength(4);
      return rendered;
    };

    it('選択中より前の札を捨てると selectedIndex が1つ減り、選択カードIDは変わらない', () => {
      const { result } = handToFourCards();
      const selectedCardId = result.current.state.deck.hand[1];
      const index = result.current.state.deck.hand.indexOf(selectedCardId as string);
      expect(index).toBeGreaterThanOrEqual(0);

      act(() => result.current.selectCard(index));
      expect(result.current.selectedIndex).toBe(index);

      act(() => result.current.discardCard(0));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      expect(result.current.selectedIndex).toBe(index - 1);
      expect(result.current.state.deck.hand[result.current.selectedIndex as number]).toBe(
        selectedCardId
      );
    });

    it('選択中の札そのものを捨てると selectedIndex が null になる', () => {
      const { result } = handToFourCards();
      const index = 1;
      act(() => result.current.selectCard(index));
      expect(result.current.selectedIndex).toBe(index);

      act(() => result.current.discardCard(index));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      expect(result.current.selectedIndex).toBeNull();
    });

    it('選択中より後ろの札を捨てても selectedIndex は変わらず、選択カードIDも変わらない', () => {
      const { result } = handToFourCards();
      const selectedCardId = result.current.state.deck.hand[1];
      const index = result.current.state.deck.hand.indexOf(selectedCardId as string);
      expect(index).toBeGreaterThanOrEqual(0);

      act(() => result.current.selectCard(index));
      expect(result.current.selectedIndex).toBe(index);

      act(() => result.current.discardCard(index + 1));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      expect(result.current.selectedIndex).toBe(index);
      expect(result.current.state.deck.hand[result.current.selectedIndex as number]).toBe(
        selectedCardId
      );
    });
  });

  describe('反復1: デッキ・シード・徴発', () => {
    it('渡したデッキでランが始まり、ログにデッキ構成が残る', () => {
      const log = createMockPlayLog();
      const cards = swiftCards();
      renderHook(() => useAshenRampartGame({ cards, seed: 5, playLog: log }));
      const started = log.events.filter(
        (e): e is Extract<PlayLogEventBody, { kind: 'run_started' }> => e.kind === 'run_started'
      );
      expect(started).toHaveLength(1);
      expect(started[0]?.seed).toBe(5);
      expect(started[0]?.deckCards).toHaveLength(20);
    });

    it('シードを明示すると2ランで同じ山札になる（再現性）', () => {
      const cards = swiftCards();
      const a = renderHook(() => useAshenRampartGame({ cards, seed: 99 }));
      const b = renderHook(() => useAshenRampartGame({ cards, seed: 99 }));
      expect(a.result.current.runSeed).toBe(99);
      expect(b.result.current.runSeed).toBe(99);
      expect(a.result.current.state.deck.drawPile).toEqual(b.result.current.state.deck.drawPile);
    });

    it('シードを省略すると2ランで異なるシードになる（毎ラン可変）', () => {
      const cards = swiftCards();
      const a = renderHook(() => useAshenRampartGame({ cards }));
      const b = renderHook(() => useAshenRampartGame({ cards }));
      // createSeed はカウンタを混ぜるため同一ミリ秒でも衝突しない
      expect(a.result.current.runSeed).not.toBe(b.result.current.runSeed);
      expect(a.result.current.runSeed).toBeGreaterThan(0);
    });

    it('徴発を出すと候補が出て、選ぶと手札に入る', () => {
      const cards = swiftCards();
      const { result } = renderHook(() => useAshenRampartGame({ cards, seed: 1 }));
      // 徴発が手札に来るまで進める（40tick ごとにドロー）
      for (let i = 0; i < 20; i++) {
        const index = result.current.state.deck.hand.indexOf('levy');
        if (index >= 0) {
          act(() => result.current.selectCard(index));
          act(() => {
            jest.advanceTimersByTime(TICK_INTERVAL_MS);
          });
          break;
        }
        act(() => {
          jest.advanceTimersByTime(TICK_INTERVAL_MS * 40);
        });
      }
      expect(result.current.levyOptions.length).toBeGreaterThan(0);
      const handBefore = result.current.state.deck.hand.length;
      act(() => result.current.chooseLevy(0));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      expect(result.current.levyOptions).toEqual([]);
      expect(result.current.state.deck.hand.length).toBe(handBefore + 1);
    });
  });
});
