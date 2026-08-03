/**
 * stepTick のテスト（時間進行・敵の移動・漏れ・勝敗）
 *
 * stepTick は乱数を取らない純粋関数であり、同じ入力からは常に同じ結果になる。
 * この決定性がリプレイと事故の事後判別を支えている。
 */
import { createCombatState, LIFE_INITIAL, DRAW_INTERVAL_TICKS, COUNTDOWN_TICKS } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

/** 雑兵1体だけの最小ウェーブ */
const oneGrunt: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
];

/** n tick 進める */
const advance = (state: ReturnType<typeof createCombatState>, n: number) => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('stepTick の時間進行', () => {
  it('1 tick で tick が1進む', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    expect(stepTick(state, [], PLAINS_MAP).tick).toBe(1);
  });

  it('元の状態を変更しない', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    stepTick(state, [], PLAINS_MAP);
    expect(state.tick).toBe(0);
  });

  it('決定的: 同じ入力から同じ結果が出る', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    const a = advance(state, 50);
    const b = advance(state, 50);
    expect(a).toEqual(b);
  });
});

describe('敵の出現と移動', () => {
  it('開始 tick に達すると敵が出現する', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    // カウントダウンぶん startTick が後ろにずれるため、その分進める
    const after = advance(state, COUNTDOWN_TICKS + 1);
    expect(after.enemies.filter((e) => e.alive)).toHaveLength(1);
  });

  it('速度ぶんだけ経路を進む', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    const after = advance(state, COUNTDOWN_TICKS + 11);
    const enemy = after.enemies[0];
    // 出現後10tick × 速度0.1 = 進行度1.0
    expect(enemy?.progress).toBeCloseTo(1.0, 5);
  });

  it('滞留セルでは移動が遅くなる（南レーンの滞留セル）', () => {
    // 滞留セルは南レーン専用（2レーン化・設計書 §5.2）。北レーンでは検証できない
    const southGrunt: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 1 }] },
    ];
    const state = createCombatState(emptyDeck, southGrunt);
    // 南レーンの滞留セルは index 5,6。境界ちょうど（progress=5.0）は浮動小数の丸めで
    // floor が前後にぶれうるため、余裕を持って index 5 の内側（progress≈5.5）まで進める
    const before = advance(state, COUNTDOWN_TICKS + 56);
    const after = stepTick(before, [], PLAINS_MAP);
    const delta = (after.enemies[0]?.progress ?? 0) - (before.enemies[0]?.progress ?? 0);
    expect(delta).toBeCloseTo(0.06, 5);
  });

  it('ウェーブの開始 tick まで敵は出ない', () => {
    const late: WaveDefinition[] = [
      { startTick: 100, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    const state = createCombatState(emptyDeck, late);
    // startTick も COUNTDOWN_TICKS ぶんずれるため、境界を +COUNTDOWN_TICKS する
    expect(advance(state, 50 + COUNTDOWN_TICKS).enemies.filter((e) => e.alive)).toHaveLength(0);
    expect(advance(state, 101 + COUNTDOWN_TICKS).enemies.filter((e) => e.alive)).toHaveLength(1);
  });

  it('鴉も入口から出現する（フィードバック#4: 経路中盤スポーンを廃止）', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    const after = advance(createCombatState(emptyDeck, ravens), COUNTDOWN_TICKS + 1);
    expect(after.enemies[0]?.progress).toBe(0);
  });
});

describe('漏れと勝敗', () => {
  it('砦に到達するとライフが1減り leak イベントが出る', () => {
    const state = createCombatState(emptyDeck, oneGrunt);
    // 北レーンは経路10セル・滞留なし。余裕を持って進める（カウントダウンぶん加算）
    const after = advance(state, 200 + COUNTDOWN_TICKS);
    expect(after.life).toBe(LIFE_INITIAL - 1);
    expect(after.enemies[0]?.leaked).toBe(true);
  });

  it('漏れた敵は二重にライフを減らさない', () => {
    const after = advance(createCombatState(emptyDeck, oneGrunt), 300 + COUNTDOWN_TICKS);
    expect(after.life).toBe(LIFE_INITIAL - 1);
  });

  it('ライフが0になると敗北で止まる', () => {
    const many: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: LIFE_INITIAL, spawnIntervalTicks: 1, laneIndex: 0 }] },
    ];
    const after = advance(createCombatState(emptyDeck, many), 400 + COUNTDOWN_TICKS);
    expect(after.life).toBe(0);
    expect(after.outcome).toBe('lost');
  });

  it('全ての敵を処理し終えると勝利する', () => {
    // 敵0体のウェーブは即座に勝利条件を満たす（startTick が COUNTDOWN_TICKS ぶんずれた後）
    const none: WaveDefinition[] = [{ startTick: 0, entries: [] }];
    expect(advance(createCombatState(emptyDeck, none), COUNTDOWN_TICKS + 1).outcome).toBe('won');
  });

  it('決着後は状態が変化しない', () => {
    const none: WaveDefinition[] = [{ startTick: 0, entries: [] }];
    const won = advance(createCombatState(emptyDeck, none), COUNTDOWN_TICKS + 1);
    expect(stepTick(won, [], PLAINS_MAP)).toEqual(won);
  });
});

describe('ドロー', () => {
  it('DRAW_INTERVAL_TICKS ごとに1枚引く', () => {
    const deck = { drawPile: ['arrow-tower', 'ballista'], hand: [], graveyard: [] };
    const state = createCombatState(deck, oneGrunt);
    expect(advance(state, DRAW_INTERVAL_TICKS).deck.hand).toEqual(['arrow-tower']);
    expect(advance(state, DRAW_INTERVAL_TICKS * 2).deck.hand).toEqual([
      'arrow-tower',
      'ballista',
    ]);
  });

  it('手札が上限なら溢れイベントが出る', () => {
    // 手札溢れの判定はカードのコストを見るため、実在する（コスト0ではない）カードIDを使う
    const full = ['arrow-tower', 'ballista', 'cannon-tower', 'beacon', 'spike-trap'];
    const deck = { drawPile: ['arrow-tower'], hand: full, graveyard: [] };
    const after = advance(createCombatState(deck, oneGrunt), DRAW_INTERVAL_TICKS);
    expect(after.deck.graveyard).toEqual(['arrow-tower']);
    expect(after.events).toContainEqual({ kind: 'overflow', cardId: 'arrow-tower' });
  });
});
