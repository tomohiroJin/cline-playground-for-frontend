/**
 * ゲームループのテスト
 *
 * 時間を進めるのは setInterval だけで、ロジックは domain にある。
 * このフックが持つのは「入力の受け取り」「タイマー」「ログ」だけ。
 */
import React, { StrictMode } from 'react';
import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import type { CellPos } from '../domain/board/stage-map';
import { PLAINS_MAP } from '../domain/board/stage-map';
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
    exportAll: () => ({ version: 3, events: events.map((e) => ({ ...e, at: 0 })) }),
  };
};

const swiftCards = (): string[] => [...PRESET_DECKS.swift!.cards];

/**
 * 燠火の再点火を検証するための専用デッキ（構築規則を満たす20枚）
 *
 * プリセットに業火が入っているかは較正のたびに変わる。検証したいのは
 * 「燠火のあるセルをクリックすると再点火される」というフックの振る舞いなので、
 * プリセットに依存させない。
 */
const emberDeckCards = (): string[] => [
  ...Array.from({ length: 8 }, () => 'reactor'),
  ...Array.from({ length: 3 }, () => 'ember-blast'),
  ...Array.from({ length: 3 }, () => 'arrow-tower'),
  ...Array.from({ length: 3 }, () => 'ballista'),
  ...Array.from({ length: 2 }, () => 'stone-wall'),
  'levy',
];

describe('useAshenRampartGame', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('マウント時に run_started がシードとデッキ構成付きで1回記録される', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log }));
    const started = log.events.filter((e) => e.kind === 'run_started');
    expect(started).toHaveLength(1);
    expect(started[0]).toMatchObject({ seed: 1, iteration: 5 });
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
      result.current.state.units.length +
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

  it('カードを選ぶと置けるマスだけが返る（上限はカード種別で決まる）', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    // 反復3 で設置マスの規則を廃止したため、置ける上限はカード種別ごとに決まった
    // 定数になる（9×7=63マス・経路21マス・砦1マスの前提から導く。stage-map.ts 参照）:
    //   守り手（'unit'）  … 63 - 砦1               = 62
    //   魔力炉（'reactor'）… 63 - 経路21             = 42
    //   罠・燠火（'path'）… 経路21 - 砦1             = 20
    // 選ばれる先頭札はデッキのシャッフル順に依存するため、実際に選んだ札の種別に
    // 対応する上限を都度引く（特定の札が先頭に来ることを前提にしない）。
    const EXPECTED_MAX_BY_KIND: Record<'unit' | 'reactor' | 'path', number> = {
      unit: 62,
      reactor: 42,
      path: 20,
    };
    const towerIndex = result.current.state.deck.hand.findIndex(
      (id) => placementKindOf(getCardDefinition(id)) !== 'none'
    );
    expect(towerIndex).toBeGreaterThanOrEqual(0);
    const selectedCard = getCardDefinition(result.current.state.deck.hand[towerIndex]!);
    const kind = placementKindOf(selectedCard);
    expect(kind).not.toBe('none');

    act(() => result.current.selectCard(towerIndex));
    expect(result.current.placeableCells.length).toBeGreaterThan(0);
    expect(result.current.placeableCells.length).toBe(
      EXPECTED_MAX_BY_KIND[kind as 'unit' | 'reactor' | 'path']
    );
  });

  it('選択せずにセルを押しても何も起きない', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.units).toHaveLength(0);
  });

  it('一時停止中は配置できない（戦術的優位を与えない）', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    act(() => result.current.togglePause());
    // 手札の中身に依存させない: 一時停止中は選択しても置ける場所が無く、
    // セルを押しても設置物が増えないことを検証する
    act(() => result.current.selectCard(0));
    expect(result.current.placeableCells).toEqual([]);
    act(() => result.current.clickCell({ x: 1, y: 2 }));
    expect(result.current.state.units).toHaveLength(0);
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

  describe('lifeLossReason: ライフが減った理由の持続表示（反復5・修正ラウンド1）', () => {
    // state.events は毎 tick 置き換わるため、RunStatusBar が直接描くと発生した
    // 1 tick（100ms）しか見えない（実プレイで読めないという反証で発覚）。
    // useAshenRampartGame が複数 tick 保持することを検証する。
    it('溢れが起きた tick で理由が立つ', () => {
      const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
      // 初期手札3枚・上限5枚・一度も出さないので、3回目のドロー（120 tick）で必ず溢れる
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 120);
      });
      expect(result.current.lifeLossReason).toBe('手札があふれました');
    });

    it('発生した tick を過ぎても、保持 tick 数のうちは理由が消えない（1 tick しか出ない、の再発防止）', () => {
      const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 120);
      });
      expect(result.current.lifeLossReason).toBe('手札があふれました');
      // 次のドロー（160 tick）より前なので、この間に新たな溢れは起きない
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 5);
      });
      expect(result.current.lifeLossReason).toBe('手札があふれました');
    });

    it('保持 tick 数を過ぎると理由が消える', () => {
      const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 120);
      });
      expect(result.current.lifeLossReason).toBeDefined();
      // LIFE_LOSS_REASON_TICKS(8) ぶん進める。次のドロー（160 tick）より前なので、
      // 「消えた」ことだけを検証できる（新しい理由による再設定と区別できる）
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 8);
      });
      expect(result.current.lifeLossReason).toBeUndefined();
    });

    it('restart するとライフが減った理由の表示がクリアされる', () => {
      const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 120);
      });
      expect(result.current.lifeLossReason).toBeDefined();
      act(() => result.current.restart());
      expect(result.current.lifeLossReason).toBeUndefined();
    });
  });

  it('予告が切り替わったときにだけ wave_preview_shown が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
    );
    const previewsAtMount = log.events.filter((e) => e.kind === 'wave_preview_shown');
    // 実際のウェーブ startTick は COUNTDOWN_TICKS ぶん後ろにずれる（開始カウントダウン、Task 7）。
    // マウント時点（tick 0）ではウェーブ1（雑兵2）もまだ始まっていないため、
    // 「次」の予告はウェーブ1そのものになる。
    expect(previewsAtMount).toHaveLength(1);
    // ウェーブ1は北レーンだけの構成なので「北 雑兵2」（レーン表記込み）
    expect(previewsAtMount[0]).toMatchObject({ tick: 0, content: '北 雑兵2' });

    // ウェーブ1開始 tick（COUNTDOWN_TICKS）に到達するまでは予告が変わらないため追加記録は無い
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (COUNTDOWN_TICKS - 1));
    });
    expect(log.events.filter((e) => e.kind === 'wave_preview_shown')).toHaveLength(1);

    // tick が COUNTDOWN_TICKS に達すると予告がウェーブ2（北 雑兵2 / 南 俊足2）へ切り替わり、
    // そのときだけ1件追加される
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS);
    });
    const previewsAfterSwitch = log.events.filter((e) => e.kind === 'wave_preview_shown');
    expect(previewsAfterSwitch).toHaveLength(2);
    expect(previewsAfterSwitch[1]).toMatchObject({
      tick: COUNTDOWN_TICKS,
      content: '北 雑兵2 / 南 俊足2',
    });
    expect(result.current.state.tick).toBe(COUNTDOWN_TICKS);
  });

  it('ウェーブ境界（COUNTDOWN_TICKS）に到達すると announcement に読み上げが出る', () => {
    const { result } = renderHook(() => useAshenRampartGame({ cards: swiftCards(), seed: 1 }));
    expect(result.current.announcement).toBeUndefined();
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * COUNTDOWN_TICKS);
    });
    expect(result.current.state.tick).toBe(COUNTDOWN_TICKS);
    expect(result.current.announcement).toBe('第1波が始まった');
  });

  it('interactCell: 再点火可能な燠火のあるセルを選択なしでクリックすると reactivated が記録される（クールダウン中は記録されない）', () => {
    const log = createMockPlayLog();
    // 反復3 のプリセット再構成で両プリセットから業火が抜けた。プリセット構成が変わるたびに
    // 「業火を初期手札に含むシード」を探し直すのは較正に引きずられて脆いため、
    // この検証専用の合法デッキ（業火3枚）を直に渡す。シード3でこの並びの初期手札に業火が入る
    const { result } = renderHook(() =>
      useAshenRampartGame({ cards: emberDeckCards(), seed: 3, playLog: log })
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

  describe('反復4: 能力表示（射程リングと能力チップ）', () => {
    /**
     * emberDeckCards・シード3 の初期手札は ['ember-blast','stone-wall','ballista']
     * になる（224行目のテストと同じ組み合わせ）。守り手を1つ置ければよいだけなので、
     * 初期手札に確実に含まれる 'ballista' を使う。
     *
     * brief は 'arrow-tower' を例示しているが、このデッキ・シードの組み合わせでは
     * arrow-tower は山札20枚中7番目に位置し、手札上限5枚に達するまで引かれない
     * （実測で確認済み）。224行目のテストの前半部分（カードを選び→セルをクリックして
     * 配置し→tick を進める）を複製し、カードIDだけ実際に手札へ来る 'ballista' に
     * 差し替えた。座標 (1,1) は経路外・砦(8,3)でもないため、守り手カードなら
     * 常に置ける（domain/combat/step-tick.ts の canPlaceAt を確認済み）。
     */
    const placeTowerAt1_1 = (log: PlayLogPort & { events: PlayLogEventBody[] }) => {
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards: emberDeckCards(), seed: 3, playLog: log })
      );
      const towerHandIndex = result.current.state.deck.hand.findIndex((id) => id === 'ballista');
      expect(towerHandIndex).toBeGreaterThanOrEqual(0);
      act(() => result.current.selectCard(towerHandIndex));
      act(() => result.current.interactCell({ x: 1, y: 1 }));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      expect(
        result.current.state.units.some(
          (u) => u.pos.x === 1 && u.pos.y === 1 && u.cardId === 'ballista'
        )
      ).toBe(true);
      return result;
    };

    it('一時停止中はセルをクリックしても能力表示は開かない（優先順位1: 無反応）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);
      act(() => result.current.togglePause());

      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate).toBeUndefined();
    });

    it('カード選択中に設置物のあるセルをクリックすると能力表示ではなく配置が優先される（優先順位2）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      // 手札に残る別の守り手（石壁）を選び、既に置いた (1,1) を再びクリックする。
      // 配置(2)が能力表示(4)より先に評価されるため、能力表示は開かず、
      // clickCell が動いて配置が試みられる（占有済みなのでドメイン側で拒否される。
      // マナ不足で 'mana' 拒否になる場合もあるため、reason は問わず rejected の
      // 発生だけを見る）
      const secondTowerIndex = result.current.state.deck.hand.findIndex((id) => id === 'stone-wall');
      expect(secondTowerIndex).toBeGreaterThanOrEqual(0);
      act(() => result.current.selectCard(secondTowerIndex));
      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate).toBeUndefined();
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      expect(result.current.state.events.some((e) => e.kind === 'rejected')).toBe(true);
      // 能力表示は一度も開かない（配置が優先されたことの証跡）
      expect(log.events.filter((e) => e.kind === 'inspect_opened')).toHaveLength(0);
      // 占有済みのため配置は成立せず、設置物は増えない
      expect(result.current.state.units).toHaveLength(1);
    });

    it('再点火可能な燠火は能力表示より再点火が優先される。クールダウン中は能力表示が開く（優先順位3・4）', () => {
      const log = createMockPlayLog();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards: emberDeckCards(), seed: 3, playLog: log })
      );
      const emberHandIndex = result.current.state.deck.hand.findIndex((id) => id === 'ember-blast');
      expect(emberHandIndex).toBeGreaterThanOrEqual(0);

      // 業火を選択し、設置可能マスの先頭に置く（224行目のテストの前半部分と同じ手順）。
      // 置いた直後はまだ発動済みなのでクールダウン中になる（cooldownLeft > 0）
      act(() => result.current.selectCard(emberHandIndex));
      const placePos = result.current.placeableCells[0];
      expect(placePos).toBeDefined();
      act(() => result.current.interactCell(placePos!));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      const emberPos = result.current.state.embers[0]!.pos;
      expect(result.current.state.embers[0]!.cooldownLeft).toBeGreaterThan(0);

      // クールダウン中（再点火できない）は他の設置物と同じく能力表示を開ける
      act(() => result.current.interactCell(emberPos));
      expect(result.current.inspectedPlate?.cardId).toBe('ember-blast');

      // クールダウンが明けるまで進める（業火の再点火間隔は300 tick）
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 300);
      });
      expect(result.current.state.embers[0]!.cooldownLeft).toBe(0);

      // cooldownLeft === 0（再点火可能）になると、能力表示が開いたままでも
      // 再点火が優先して動く（reactivated が記録される。優先順位3 が4より先）
      act(() => result.current.interactCell(emberPos));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      expect(log.events.filter((e) => e.kind === 'reactivated')).toHaveLength(1);
      expect(result.current.state.embers[0]!.cooldownLeft).toBeGreaterThan(0);
    });

    it('選択なしで設置物のあるセルをクリックすると能力表示が開き、再クリックで閉じる（優先順位4）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate?.cardId).toBe('ballista');

      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate).toBeUndefined();
    });

    it('能力表示を開くと inspect_opened が記録される（開いたときだけで、閉じたときは記録しない）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 })); // 開く
      act(() => result.current.interactCell({ x: 1, y: 1 })); // 閉じる

      expect(log.events.filter((e) => e.kind === 'inspect_opened')).toHaveLength(1);
    });

    it('空マスをクリックすると能力表示は開かず、開いていれば閉じる（優先順位5）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 })); // 開く
      expect(result.current.inspectedPlate).toBeDefined();

      act(() => result.current.interactCell({ x: 2, y: 2 })); // 何もない空マス
      expect(result.current.inspectedPlate).toBeUndefined();
    });

    it('カードを選ぶと能力表示は閉じる（前のチップが残ると誤読するため）', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate).toBeDefined();

      act(() => result.current.selectCard(0));
      expect(result.current.inspectedPlate).toBeUndefined();
    });

    it('一時停止をトグルすると能力表示は閉じる', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate).toBeDefined();

      act(() => result.current.togglePause());
      expect(result.current.inspectedPlate).toBeUndefined();
    });

    it('restart すると能力表示は閉じる', () => {
      const log = createMockPlayLog();
      const result = placeTowerAt1_1(log);

      act(() => result.current.interactCell({ x: 1, y: 1 }));
      expect(result.current.inspectedPlate).toBeDefined();

      act(() => result.current.restart());
      expect(result.current.inspectedPlate).toBeUndefined();
    });

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
     * seed:10・swift プリセットは、初期手札3枚＋1回目のドロー（40 tick）で
     * 必ず ['spike-trap', 'ballista', 'reactor', 'arrow-tower'] になる。
     * 4枚とも設置系カードなので selectCard で選択状態を作れる。
     *
     * **4枚がすべて異なる札であることが要点。** 反復2 で魔力炉が8枚になった結果、
     * seed:1 では手札が ['reactor','reactor','spike-trap','spike-trap'] となり、
     * 「捨てた後も選択カードIDが変わらない」という主張が、インデックス追従が
     * 壊れていても通ってしまう空虚なテストになっていた（レビュー指摘4）。
     * 同名札が並ばないシードを選び、手札配列そのものを比較して検証する。
     */
    const handToFourCards = () => {
      const cards = swiftCards();
      const rendered = renderHook(() => useAshenRampartGame({ cards, seed: 10 }));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS * 40);
      });
      const hand = rendered.result.current.state.deck.hand;
      expect(hand).toHaveLength(4);
      // 前提の明示: 同名札が並ぶと以下の検証が空虚になる
      expect(new Set(hand).size).toBe(4);
      return rendered;
    };

    it('選択中より前の札を捨てると selectedIndex が1つ減り、選択カードIDは変わらない', () => {
      const { result } = handToFourCards();
      const handBefore = [...result.current.state.deck.hand];
      const index = 1;
      const selectedCardId = handBefore[index];

      act(() => result.current.selectCard(index));
      expect(result.current.selectedIndex).toBe(index);

      act(() => result.current.discardCard(0));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      // 手札配列ごと比較する（捨てた1枚だけが消えていること）
      expect(result.current.state.deck.hand).toEqual(handBefore.slice(1));
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
      const handBefore = [...result.current.state.deck.hand];
      const index = 1;
      const selectedCardId = handBefore[index];

      act(() => result.current.selectCard(index));
      expect(result.current.selectedIndex).toBe(index);

      act(() => result.current.discardCard(index + 1));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      // 手札配列ごと比較する（捨てた1枚だけが消えていること）
      expect(result.current.state.deck.hand).toEqual([
        ...handBefore.slice(0, index + 1),
        ...handBefore.slice(index + 2),
      ]);
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
      // 手札が上限に達するとドローが止まるため、札を出さずに待つだけでは徴発が来ない。
      // シード7は速攻型の初期手札に徴発を含む（反復2 で徴発が2→1枚になった影響）
      const { result } = renderHook(() => useAshenRampartGame({ cards, seed: 7 }));
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

  describe('反復4: run_tally と card_discarded_manual', () => {
    /**
     * 何も配置せずに tick を進め、決着まで到達させる。
     * swift・seed1・無配置は約700 tick で決着する（AshenRampartGame.test.tsx の
     * advanceUntilRunEnds のコメントを参照）ため、十分な余裕を持たせた上限で進める。
     */
    const MAX_ADVANCE_TICKS = 1200;
    const ADVANCE_STEP_TICKS = 50;

    const advanceUntilOutcome = (
      result: { current: ReturnType<typeof useAshenRampartGame> }
    ): void => {
      for (let advanced = 0; advanced < MAX_ADVANCE_TICKS; advanced += ADVANCE_STEP_TICKS) {
        if (result.current.state.outcome !== 'playing') return;
        act(() => {
          jest.advanceTimersByTime(TICK_INTERVAL_MS * ADVANCE_STEP_TICKS);
        });
      }
      if (result.current.state.outcome === 'playing') {
        throw new Error(
          `ランが ${MAX_ADVANCE_TICKS} tick 進めても決着しませんでした（ラン長の較正を確認すること）`
        );
      }
    };

    /** 盤面の全マス。「置けない場所」を選ぶために使う */
    const allCells = (): CellPos[] => {
      const cells: CellPos[] = [];
      for (let y = 0; y < PLAINS_MAP.height; y++) {
        for (let x = 0; x < PLAINS_MAP.width; x++) cells.push({ x, y });
      }
      return cells;
    };

    /**
     * 「置けない場所」を1回叩いて rejected(target) を出す
     *
     * 決着した tick にも判定対象の出来事を載せるための仕掛け。拒否は
     * イベントを1件積むだけで盤面を変えないため、ランの長さは変わらない。
     */
    const tapUnplaceableCell = (
      result: { current: ReturnType<typeof useAshenRampartGame> }
    ): void => {
      const handIndex = result.current.state.deck.hand.findIndex((id) => {
        const card = getCardDefinition(id);
        // 魔力炉は設置間隔で cooldown 拒否になるため除く（欲しいのは target 拒否）
        return (
          placementKindOf(card) !== 'none' &&
          card.type !== 'reactor' &&
          card.cost <= result.current.state.mana
        );
      });
      if (handIndex < 0) {
        throw new Error('置ける札が手札に無く、拒否を発生させられませんでした（較正を確認すること）');
      }
      act(() => result.current.selectCard(handIndex));
      const placeable = result.current.placeableCells;
      const target = allCells().find(
        (cell) => !placeable.some((p) => p.x === cell.x && p.y === cell.y)
      );
      if (!target) throw new Error('置けないマスが1つもありませんでした（較正を確認すること）');
      act(() => result.current.clickCell(target));
    };

    it('決着すると run_tally が1件だけ記録される（talliedRunIdRef ガードの実効性）', () => {
      // run_tally effect の依存配列は [state.outcome, runId, cards]。決着後も
      // 親からの再レンダーで cards の参照が変われば再実行されうる（次のテストで
      // その経路を明示的に踏む）。ここでは通常の決着で2件書かれないことを見る。
      const log = createMockPlayLog();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
      );
      advanceUntilOutcome(result);
      const tallies = log.events.filter((e) => e.kind === 'run_tally');
      expect(tallies).toHaveLength(1);
      expect(tallies[0]).toMatchObject({ iteration: 5 });
    });

    it('決着後に外部からの再レンダーで run_tally effect が再実行されても2件目は記録されない', () => {
      // 上のテストは「決着で1件だけ書かれる」ことしか見ない。ガードそのものは
      // effect が2回走らないと検証できないため、ここでは明示的に二重発火させる。
      // run_tally effect の依存配列 [state.outcome, runId, cards] のうち
      // cards の参照が変わるため、React は Object.is 比較の結果 effect を
      // 実際に再実行する（内容が同じでも別配列なら再実行対象になる）。
      // runId と outcome は変わらないため、talliedRunIdRef が効いていれば
      // 2件目は記録されないはずである。
      const log = createMockPlayLog();
      const initialCards = swiftCards();
      const { result, rerender } = renderHook(
        (props: { cards: string[] }) =>
          useAshenRampartGame({ cards: props.cards, seed: 1, playLog: log }),
        { initialProps: { cards: initialCards } }
      );
      advanceUntilOutcome(result);
      expect(log.events.filter((e) => e.kind === 'run_tally')).toHaveLength(1);

      // 内容は同じだが参照は別の配列を渡し、effect の依存配列を変化させる
      rerender({ cards: [...initialCards] });

      expect(log.events.filter((e) => e.kind === 'run_tally')).toHaveLength(1);
    });

    /**
     * jest.advanceTimersByTime に大きな値を渡すと、複数 tick 分の setState が
     * 1つの React コミットへまとめられ、間の tick で起きた events（overflow・
     * played 等）が一度も描画されずに失われる（tallyRef の更新は「判定用の
     * 集計を累積する」effect 経由なので、コミットされない tick には触れない）。
     * 実ブラウザでは setInterval の発火が毎回別タスクになるため起きないが、
     * テストで overflowCount 等を確実に非ゼロへ育てるには 1 tick ずつ進める
     * 必要がある（advanceUntilOutcome の 50 tick ジャンプはこの理由により、
     * 決着の有無だけを見るテストにしか使えない）。
     */
    const advanceOneTick = (): void => {
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
    };

    it('run_tally の数値が画面の集計（RunSummary）と一致する', () => {
      // 判定者は画面の集計と、貼り付けた JSON の両方を見る。両者が食い違うと
      // 同じランに対して2つの数値が存在することになり、判定が成立しない。
      // このテストは「1 tick ずれ」の再発防止が目的なので、突き合わせる項目は
      // すべて非ゼロに育ててから比較する（0 と 0 の一致は何も守らない）。
      const log = createMockPlayLog();
      const cards = swiftCards();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards, seed: 1, playLog: log })
      );
      advanceOneTick();

      // 判定項目6: 開始直後に魔力炉を1枚置く（lastPlayTick を非ゼロにする）。
      // 魔力炉はコスト0・経路外専用で、前線の守り手ではないため敵の経路取りや
      // 決着タイミングに影響しない（run-summary.ts の applyPlayedEvent も
      // placementKind === 'unit' のときしか placedOnPath/placedOffPath を
      // 増やさないため、ブロッカー集計にも影響しない）。
      const reactorIndex = result.current.state.deck.hand.findIndex(
        (id) => getCardDefinition(id).type === 'reactor'
      );
      expect(reactorIndex).toBeGreaterThanOrEqual(0);
      act(() => result.current.selectCard(reactorIndex));
      const reactorAt = result.current.placeableCells[0];
      expect(reactorAt).toBeDefined();
      act(() => result.current.clickCell(reactorAt!));
      advanceOneTick();

      // 決着するまで、毎 tick「置けない場所」を叩き続ける。決着がいつかを
      // 事前に知らなくても、拒否は毎 tick 積むため決着 tick にも必ず載る。
      // 手札上限で手札が埋まって draw に失敗すると tapUnplaceableCell が
      // 選べる札を見つけられずに例外を投げるため、そのときはこの tick の
      // 拒否だけを諦めて進める（rejectedTarget が画面より少なくなることはない。
      // 画面側の view も同じ tallyRef から計算するため、突き合わせは崩れない）。
      const MAX_TICKS = 1500;
      for (let i = 0; i < MAX_TICKS && result.current.state.outcome === 'playing'; i++) {
        try {
          tapUnplaceableCell(result);
        } catch {
          // 置ける札が無い tick はスキップする（上のコメント参照）
        }
        advanceOneTick();
      }
      expect(result.current.state.outcome).not.toBe('playing');

      const view = result.current.summary;
      // 各項目が「非ゼロで」画面とログで一致することを先に確かめる
      // （0 同士の一致では 1 tick ずれの再発を検知できない）
      expect(view.rejectionDetail.find((d) => d.label === '置けない場所')?.count).toBeGreaterThan(0);
      expect(view.overflowCount).toBeGreaterThan(0);
      expect(view.lifeLostToOverflow).toBeGreaterThan(0);
      expect(view.lastPlayTick).toBeGreaterThan(0);

      const tally = log.events.find((e) => e.kind === 'run_tally');
      expect(tally).toMatchObject({
        unusedCardIds: view.unusedCardIds,
        rejectedTarget: view.rejectionDetail.find((d) => d.label === '置けない場所')?.count,
        laneAllocation: view.laneAllocation,
        placedOnPath: view.placedOnPath,
        placedOffPath: view.placedOffPath,
        unitsLost: view.unitsLost,
        ravenDefeatAverage: view.ravenDefeatAverage,
        ravenDefeatCount: view.ravenDefeatCount,
        costHistogram: view.costHistogram,
        overflowCount: view.overflowCount,
        lifeLostToOverflow: view.lifeLostToOverflow,
        lifeLostToLeak: view.lifeLostToLeak,
        lastPlayTick: view.lastPlayTick,
        // drawPileExhaustedTick はここでは意図的に対象から外している。
        // 非ゼロへ育てるには山札（drawPile）を使い切る必要があるが、
        // `startRunWithDeck` は `validateDeck` でデッキがちょうど20枚である
        // ことを強制する（実際に5枚のデッキで試したところ
        // 「デッキが構築規則を満たしていません」で即エラーになることを確認済み）。
        // 20枚なら drawPile は必ず 17 枚（20 − INITIAL_HAND_SIZE）残り、
        // DRAW_INTERVAL_TICKS=40 のため尽きるまで最短でも 680 tick かかる。
        // このテストの無防備な swift デッキ（守り手をほぼ置かない）は
        // tick 440 前後で決着する（実測。魔力炉を1枚置くだけでは前線が
        // 保たない）ため、drawPile が尽きる前に必ず決着してしまい、
        // この統合テストの中では「非ゼロで一致」を作れない。
        // 山札を使い切るところまで生き延びさせるには実際に前線を組んで
        // 20シード規模の勝率検証（balance.test.ts の greedyStrategy 相当）が
        // 要る対応で、この統合テストの目的（1 tick ずれの再発検知）に対して
        // 不釣り合いに重い。drawPileExhaustedTick の正しさ（最初に空になった
        // tick だけを覚える／以後は上書きしない）は run-summary.test.ts の
        // 単体テスト（「山札が尽きた tick を、最初に空になった時点で覚える」）
        // が直接・決定的に保証しており、変異テストでも確認済み。
      });
      // endTick は RunTally 経由ではなく決着 tick を直接使うため、画面側の
      // state.tick と突き合わせる（view には endTick 相当のフィールドが無い）
      expect((tally as { endTick: number }).endTick).toBe(result.current.state.tick);
    });

    it('run_tally に判定項目1〜4 の実測値が載る', () => {
      // 「1行で壊せる」を塞ぐ。inspectOpens を 0 固定にする / manualDiscards を
      // 0 固定にする / rejectedTarget を 0 固定にすると、それぞれここで落ちる。
      const log = createMockPlayLog();
      const cards = swiftCards();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards, seed: 1, playLog: log })
      );

      // 項目4: 置けない場所を1回叩く
      tapUnplaceableCell(result);
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      // 1枚実際に置く（項目3 の能力表示を開く対象を作るため）。
      // 燠火は再点火がタップを横取りするため対象から外す（設計書 §5.2 の優先順位）
      const handIndex = result.current.state.deck.hand.findIndex((id) => {
        const card = getCardDefinition(id);
        return (
          placementKindOf(card) !== 'none' &&
          card.type !== 'ember' &&
          card.cost <= result.current.state.mana
        );
      });
      expect(handIndex).toBeGreaterThanOrEqual(0);
      const placedCardId = result.current.state.deck.hand[handIndex];
      act(() => result.current.selectCard(handIndex));
      const placedAt = result.current.placeableCells[0];
      expect(placedAt).toBeDefined();
      act(() => result.current.clickCell(placedAt!));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      // 項目3: 能力表示を2回開く（間に閉じる）
      act(() => result.current.interactCell(placedAt!));
      act(() => result.current.interactCell(placedAt!));
      act(() => result.current.interactCell(placedAt!));

      // 項目2: 手動で2回捨てる
      act(() => result.current.discardCard(0));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      act(() => result.current.discardCard(0));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });

      advanceUntilOutcome(result);

      const tally = log.events.find((e) => e.kind === 'run_tally');
      expect(tally).toMatchObject({
        iteration: 5,
        manualDiscards: 2,
        inspectOpens: 2,
        rejectedTarget: 1,
      });
      // 項目1: 一度も出さなかった札。1枚は出しているので全種にはならない
      const unused = (tally as { unusedCardIds: string[] }).unusedCardIds;
      expect(unused).not.toContain(placedCardId);
      expect(unused.length).toBeLessThan(new Set(cards).size);
    });

    it('手動で捨てると card_discarded_manual に捨てた札の id が入る', () => {
      const log = createMockPlayLog();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
      );
      const discarded = result.current.state.deck.hand[0];
      expect(discarded).toBeDefined();
      act(() => result.current.discardCard(0));
      const events = log.events.filter((e) => e.kind === 'card_discarded_manual');
      expect(events).toHaveLength(1);
      expect(events[0]).toMatchObject({ cardId: discarded });
    });

    it('inspect_opened には開いた設置物の cardId が入る', () => {
      const log = createMockPlayLog();
      const { result } = renderHook(() =>
        useAshenRampartGame({ cards: swiftCards(), seed: 1, playLog: log })
      );
      const handIndex = result.current.state.deck.hand.findIndex((id) => {
        const card = getCardDefinition(id);
        return (
          placementKindOf(card) !== 'none' &&
          card.type !== 'ember' &&
          card.cost <= result.current.state.mana
        );
      });
      expect(handIndex).toBeGreaterThanOrEqual(0);
      const placedCardId = result.current.state.deck.hand[handIndex];
      act(() => result.current.selectCard(handIndex));
      const pos = result.current.placeableCells[0];
      expect(pos).toBeDefined();
      act(() => result.current.clickCell(pos!));
      act(() => {
        jest.advanceTimersByTime(TICK_INTERVAL_MS);
      });
      act(() => result.current.interactCell(pos!));
      const opened = log.events.filter((e) => e.kind === 'inspect_opened');
      expect(opened).toHaveLength(1);
      expect(opened[0]).toMatchObject({ cardId: placedCardId });
    });
  });
});
