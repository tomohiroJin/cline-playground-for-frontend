import { renderHook, act } from '@testing-library/react';
import { useAshenRampartGame, TICK_INTERVAL_MS } from './useAshenRampartGame';
import { SeededRandom } from '../infrastructure/random/seeded-random';
import { PLAINS_MAP } from '../domain/board/stage-map';
import { getCardDefinition } from '../domain/cards/card-pool';
import { MAX_TICKS } from '../domain/combat/simulate-wave';
import type { PlayLogEventBody, PlayLogPort } from '../application/ports/play-log-port';
import { CURRENT_ITERATION } from '../application/ports/play-log-port';

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

  it('run_started の iteration は CURRENT_ITERATION 定数を参照する（反復1以降との混在を防ぐ）', () => {
    const log = createMockPlayLog();
    renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    const started = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'run_started' }> => e.kind === 'run_started'
    );
    expect(started[0].iteration).toBe(CURRENT_ITERATION);
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

  it('wave_ended には lifeBefore/lifeAfter が実値で記録される（勝利ウェーブ）', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (MAX_TICKS + 1));
    });
    const ended = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'wave_ended' }> => e.kind === 'wave_ended'
    );
    expect(ended).toHaveLength(1);
    // タワーなし・ウェーブ1(雑兵6体)で全漏れ: 10 - 6 = 4
    expect(ended[0].lifeBefore).toBe(10);
    expect(ended[0].lifeAfter).toBe(10 - ended[0].leaks);
    expect('lifeDelta' in ended[0]).toBe(false);
  });

  it('敗北ウェーブでは lifeAfter が finishWave のクランプ規則どおり 0 になる', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    // ウェーブ1をタワーなしで完走（life 10 -> 4、報酬フェーズへ）
    act(() => result.current.beginWave());
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (MAX_TICKS + 1));
    });
    expect(result.current.run.phase).toBe('reward');
    act(() => result.current.pickReward(null));
    // ウェーブ2をタワーなしで完走（雑兵6+俊足4=10体漏れ > 残ライフ4 で敗北）
    act(() => result.current.beginWave());
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS * (MAX_TICKS + 1));
    });
    const ended = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'wave_ended' }> => e.kind === 'wave_ended'
    );
    expect(ended).toHaveLength(2);
    const lastWave = ended[1];
    expect(lastWave.lifeBefore).toBeGreaterThan(0);
    expect(lastWave.leaks).toBeGreaterThan(lastWave.lifeBefore);
    expect(lastWave.lifeAfter).toBe(0);
    expect(result.current.run.status).toBe('lost');
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

  it('塔カードの配置で prep_action が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    // 手札から塔カードを探して選択→設置スロットに配置
    const towerIndex = result.current.run.deck.hand.findIndex(
      (id) => getCardDefinition(id).type === 'tower'
    );
    expect(towerIndex).toBeGreaterThanOrEqual(0);
    const slot = result.current.run.board.map.buildSlots[0];
    act(() => result.current.selectCard(towerIndex));
    act(() => result.current.placeAt(slot));
    const actions = log.events.filter(
      (e): e is Extract<PlayLogEventBody, { kind: 'prep_action' }> => e.kind === 'prep_action'
    );
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe('place-tower');
    expect(actions[0].target).toContain('@');
    expect(actions[0].wave).toBe(0);
  });

  it('スペルカードの即時使用で prep_action が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    // シード1の初期手札にはスペルが含まれる（seed-check で確認済み）ため無条件に検証する
    const spellIndex = result.current.run.deck.hand.findIndex((id) => {
      const t = getCardDefinition(id).type;
      return t === 'spell' || t === 'tactic';
    });
    expect(spellIndex).toBeGreaterThanOrEqual(0);
    act(() => result.current.selectCard(spellIndex));
    expect(log.events.some((e) => e.kind === 'prep_action')).toBe(true);
  });
});

describe('再生速度とスキップ', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('changeSpeed で速度が変わり battle_speed が記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => result.current.changeSpeed(4));
    expect(result.current.speed).toBe(4);
    // ウェーブ開始時（速度1）と changeSpeed(4) の2件が記録される
    const speeds = log.events.filter((e) => e.kind === 'battle_speed');
    expect(speeds).toHaveLength(2);
    expect(speeds[speeds.length - 1]).toMatchObject({ speed: 4 });
  });

  it('ウェーブ開始のたびに現在の実効速度が battle_speed として記録される（非スキップ率の復元用）', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    const speeds = log.events.filter((e) => e.kind === 'battle_speed');
    expect(speeds).toHaveLength(1);
    expect(speeds[0]).toMatchObject({ wave: 0, speed: 1 });
  });

  it('戦闘中に速度を変更しても wave_started は二重記録されない', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => result.current.changeSpeed(2));
    act(() => result.current.changeSpeed(4));
    const started = log.events.filter((e) => e.kind === 'wave_started');
    expect(started).toHaveLength(1);
  });

  it('速度変更後に restart しても sticky な速度が新しいランのウェーブ開始時に記録される', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => result.current.changeSpeed(4));
    act(() => result.current.restart());
    act(() => result.current.beginWave());
    expect(result.current.speed).toBe(4); // 速度は restart でリセットされない（sticky）
    const speeds = log.events.filter((e) => e.kind === 'battle_speed');
    // run1: wave_started時(1x) + changeSpeed(4x) / run2: wave_started時(4x) の計3件
    expect(speeds).toHaveLength(3);
    expect(speeds[2]).toMatchObject({ wave: 0, speed: 4 });
  });

  it('4x は 1x の 1/4 の時間でリプレイが進む', () => {
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1)));
    act(() => result.current.beginWave());
    act(() => result.current.changeSpeed(4));
    act(() => {
      jest.advanceTimersByTime(TICK_INTERVAL_MS); // 1x の1tick分の時間
    });
    expect(result.current.replayTick).toBe(4);
  });

  it('skipBattle でリプレイが即完走しウェーブが終了する', () => {
    const log = createMockPlayLog();
    const { result } = renderHook(() => useAshenRampartGame(new SeededRandom(1), log));
    act(() => result.current.beginWave());
    act(() => result.current.skipBattle());
    // combat フェーズを抜けている（reward または result）
    expect(result.current.run.phase).not.toBe('combat');
    expect(
      log.events.filter((e) => e.kind === 'battle_speed' && e.speed === 'skip')
    ).toHaveLength(1);
    expect(log.events.filter((e) => e.kind === 'wave_ended')).toHaveLength(1);
  });
});
