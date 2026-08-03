/**
 * プレイヤー操作のテスト
 *
 * 「排他的な選択」（配置クールダウン）と「代償」（マナ・スロット消費）は
 * 仮説の必要条件そのものであり、ここが緩むと配分が発生しない（設計書 §4.1）。
 */
import { createCombatState, PLACE_COOLDOWN_TICKS, MANA_INITIAL, COUNTDOWN_TICKS } from './combat-state';
import type { CombatState, PlacedUnit, ActiveEnemy } from './combat-state';
import { stepTick, canPlaceAt, effectiveDamage } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP, offPathCells, fortressCell, laneOf } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';
import { getEnemySpec } from './enemies';
import { createDeck } from '../cards/deck';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

/** effectiveDamage の対象引数用ダミー（特効を持たない守り手のテストでは値は結果に影響しない） */
const dummyTarget: ActiveEnemy = {
  id: 0,
  enemyId: 'grunt',
  hp: 20,
  maxHp: 20,
  progress: 0,
  spawnTick: 0,
  laneIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
};

const stateWithHand = (hand: string[]): CombatState =>
  createCombatState({ drawPile: [], hand, graveyard: [] }, noWave);

const play = (state: CombatState, handIndex: number, pos?: { x: number; y: number }) =>
  stepTick(state, [{ kind: 'play-card', handIndex, pos }], PLAINS_MAP);

describe('canPlaceAt', () => {
  // 反復3 Task 8 で設置マスの規則を廃止した。守り手（unit 種別）は砦以外の
  // どこにでも置けるため、経路上か経路外かは canPlaceAt の判定を左右しない。
  it('守り手は経路にも経路外にも置ける', () => {
    const card = getCardDefinition('arrow-tower');
    const empty = stateWithHand([]);
    expect(canPlaceAt(empty, card, { x: 1, y: 1 }, PLAINS_MAP)).toBe(true); // 経路外
    expect(canPlaceAt(empty, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(true); // 経路上
  });

  it('罠は経路にだけ置ける', () => {
    const card = getCardDefinition('spike-trap');
    const empty = stateWithHand([]);
    expect(canPlaceAt(empty, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(true); // 経路上
    expect(canPlaceAt(empty, card, { x: 1, y: 1 }, PLAINS_MAP)).toBe(false); // 経路外
  });

  it('既に何か置かれているマスには置けない', () => {
    const card = getCardDefinition('arrow-tower');
    const occupied: CombatState = {
      ...stateWithHand([]),
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    };
    expect(canPlaceAt(occupied, card, { x: 1, y: 1 }, PLAINS_MAP)).toBe(false);
  });

  // 反復3 Task 8 で魔力炉は経路外専用、燠火は経路専用に分離されたため、
  // 同じマスを奪い合うことはもう無い。それぞれが自分の配置先でだけ占有をブロックされる
  it('魔力炉は経路外専用、燠火は経路専用で、それぞれ既存の同種と競合する', () => {
    const empty = stateWithHand([]);
    const reactorOccupied: CombatState = {
      ...empty,
      reactors: [{ pos: { x: 1, y: 1 }, ticksToMana: 60 }],
    };
    // 既に魔力炉がある経路外セルには別の魔力炉を置けない
    expect(
      canPlaceAt(reactorOccupied, getCardDefinition('reactor'), { x: 1, y: 1 }, PLAINS_MAP)
    ).toBe(false);
    // 燠火はそもそも経路外に置けない（占有以前に配置先種別で弾かれる）
    expect(
      canPlaceAt(reactorOccupied, getCardDefinition('ember-blast'), { x: 1, y: 1 }, PLAINS_MAP)
    ).toBe(false);
  });
});

describe('配置先の規則', () => {
  const emptyState = () => createCombatState(createDeck(['arrow-tower'], () => 0), []);

  it('守り手は経路上にも経路外にも置ける', () => {
    const state = emptyState();
    const card = getCardDefinition('arrow-tower');
    expect(canPlaceAt(state, card, laneOf(PLAINS_MAP, 0)[3]!, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(state, card, offPathCells(PLAINS_MAP)[0]!, PLAINS_MAP)).toBe(true);
  });

  it('砦セルには何も置けない（2レーンの合流点を1体で塞げてしまうため）', () => {
    const state = emptyState();
    const fortress = fortressCell(PLAINS_MAP)!;
    expect(canPlaceAt(state, getCardDefinition('arrow-tower'), fortress, PLAINS_MAP)).toBe(false);
    expect(canPlaceAt(state, getCardDefinition('spike-trap'), fortress, PLAINS_MAP)).toBe(false);
  });

  it('魔力炉は経路外にしか置けない（コスト0・上限なしの壁になるため）', () => {
    const state = emptyState();
    const card = getCardDefinition('reactor');
    expect(canPlaceAt(state, card, laneOf(PLAINS_MAP, 0)[3]!, PLAINS_MAP)).toBe(false);
    expect(canPlaceAt(state, card, offPathCells(PLAINS_MAP)[0]!, PLAINS_MAP)).toBe(true);
  });

  it('罠は経路上にしか置けない', () => {
    const state = emptyState();
    const card = getCardDefinition('spike-trap');
    expect(canPlaceAt(state, card, laneOf(PLAINS_MAP, 0)[3]!, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(state, card, offPathCells(PLAINS_MAP)[0]!, PLAINS_MAP)).toBe(false);
  });

  it('1セルに置けるのは守り手1体か罠1つのどちらか', () => {
    const deck = createDeck(['arrow-tower', 'spike-trap'], () => 0);
    let state = { ...createCombatState(deck, []), mana: 10 };
    const cell = laneOf(PLAINS_MAP, 0)[3]!;
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: cell }], PLAINS_MAP);
    expect(canPlaceAt(state, getCardDefinition('spike-trap'), cell, PLAINS_MAP)).toBe(false);
  });
});

describe('カード配置', () => {
  it('守り手を置くとマナが減り手札から墓地へ移る', () => {
    const state = stateWithHand(['arrow-tower']);
    const after = play(state, 0, { x: 1, y: 1 });
    expect(after.units).toHaveLength(1);
    expect(after.mana).toBe(MANA_INITIAL - 2);
    expect(after.deck.hand).toEqual([]);
    expect(after.deck.graveyard).toEqual(['arrow-tower']);
  });

  it('魔力炉の配置クールダウンが立ち、次の tick では別の魔力炉を置けない', () => {
    // 反復3: 配置クールダウンは魔力炉だけに課す（他の札はマナが唯一の律速）。
    // このテストはクールダウンそのものの検証なので、対象を魔力炉に絞る。
    const state = stateWithHand(['reactor', 'reactor']);
    const first = play(state, 0, { x: 1, y: 1 });
    expect(first.placeCooldown).toBe(PLACE_COOLDOWN_TICKS);
    const second = play(first, 0, { x: 1, y: 2 });
    expect(second.reactors).toHaveLength(1);
    expect(second.events).toContainEqual({ kind: 'rejected', reason: 'cooldown' });
  });

  it('マナが足りなければ置けない', () => {
    const state = stateWithHand(['ballista']); // コスト3、初期マナ2
    const after = play(state, 0, { x: 1, y: 1 });
    expect(after.units).toHaveLength(0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'mana' });
  });

  it('魔力炉はコスト0なのでマナ0でも置ける', () => {
    const state: CombatState = { ...stateWithHand(['reactor']), mana: 0 };
    const after = play(state, 0, { x: 1, y: 1 });
    expect(after.reactors).toHaveLength(1);
  });

  it('魔力炉が生むマナ量はカード定義の manaPerTick を実際に読む（指摘5の回帰: 以前は +1 固定だった）', () => {
    const reactorSpec = getCardDefinition('reactor').reactor;
    const intervalTicks = reactorSpec?.intervalTicks ?? 60;
    const manaPerTick = reactorSpec?.manaPerTick ?? 1;
    let state: CombatState = {
      ...stateWithHand([]),
      reactors: [{ pos: { x: 1, y: 1 }, ticksToMana: intervalTicks }],
    };
    const manaBefore = state.mana;
    for (let i = 0; i < intervalTicks; i++) {
      state = stepTick(state, [], PLAINS_MAP);
    }
    expect(state.mana).toBe(manaBefore + manaPerTick);
  });

  it('置けない場所を指定すると拒否される（砦セルは両レーンの合流点のため唯一の例外）', () => {
    // 反復3 Task 8 で設置マスの規則を廃止し、守り手は砦以外のどこにでも置けるように
    // なった。砦だけは置くと1体で両レーンを同時に塞げてしまうため禁止のまま残る。
    const state = stateWithHand(['arrow-tower']);
    const fortress = fortressCell(PLAINS_MAP)!;
    const after = play(state, 0, fortress);
    expect(after.units).toHaveLength(0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'target' });
  });

  it('時泥は対象を取らず盤面に残らない', () => {
    const state = stateWithHand(['mud-time']);
    const after = play(state, 0);
    expect(after.units).toHaveLength(0);
    expect(after.slowUntilTick).toBe(after.tick + 200);
    // 前提: card-pool.ts の mud-time.spell.speedMultiplier がそのまま反映されること
    // （指摘5: 以前はここが読まれず 0.6 がハードコードされていた）
    expect(after.slowMultiplier).toBe(0.6);
    expect(after.deck.graveyard).toEqual(['mud-time']);
  });

  it('時泥の減速倍率が実際の敵移動に適用される（指摘5の回帰: 以前は 0.6 固定で card-pool を読んでいなかった）', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['mud-time'], graveyard: [] }, wave);
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現まで空 tick を進める
    for (let i = 0; i < COUNTDOWN_TICKS; i++) state = stepTick(state, [], PLAINS_MAP);
    state = stepTick(state, [], PLAINS_MAP); // tick=COUNTDOWN_TICKS+1: 出現（出現した tick は移動しない）
    state = stepTick(state, [], PLAINS_MAP); // 通常速度で1 tick 移動
    const speed = getEnemySpec('grunt').speed;
    const baseline = state.enemies[0]?.progress ?? 0;
    expect(baseline).toBeCloseTo(speed, 5);

    state = play(state, 0); // 時泥を発動。同じ tick から減速が適用される
    const slowMultiplier = getCardDefinition('mud-time').spell?.speedMultiplier ?? 1;
    const expected = baseline + speed * slowMultiplier;
    expect(state.enemies[0]?.progress).toBeCloseTo(expected, 5);
  });

  it('業火は即座にダメージを与え燠火として残る', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['ember-blast'], graveyard: [] }, wave);
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現まで進める
    for (let i = 0; i < COUNTDOWN_TICKS + 1; i++) state = stepTick(state, [], PLAINS_MAP); // 敵を出現させる
    // 反復3 Task 8: 業火の配置先は path（経路上）に是正された。北レーンの入口
    // （敵の出現地点）に置けば、半径2の範囲に確実に入る
    const entrance = laneOf(PLAINS_MAP, 0)[0]!;
    const after = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: entrance }], PLAINS_MAP);
    expect(after.embers).toHaveLength(1);
    expect(after.enemies[0]?.hp).toBe(12); // 20 - 8
  });

  it('同tickに配置した守り手が、その tick に射程内の敵へダメージを与える', () => {
    // 敵は入口 (0,2) に出現する。守り手 (0,1) から距離1で射程1.6内に収める
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['arrow-tower'], graveyard: [] }, wave);
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現 tick と play tick を合わせる
    for (let i = 0; i < COUNTDOWN_TICKS; i++) state = stepTick(state, [], PLAINS_MAP);
    const after = play(state, 0, { x: 0, y: 1 });
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy?.hp).toBe(14); // 20 - 6（配置と同じ tick で射撃が発生する）
  });

  it('同tickに配置した篝火のオーラが既存の隣接守り手に同tickで乗り、二重計上しない', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    const existingUnit: PlacedUnit = { cardId: 'arrow-tower', pos: { x: 0, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 };
    let state: CombatState = {
      ...createCombatState({ drawPile: [], hand: ['beacon'], graveyard: [] }, wave),
      units: [existingUnit],
    };
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現 tick と play tick を合わせる
    for (let i = 0; i < COUNTDOWN_TICKS; i++) state = stepTick(state, [], PLAINS_MAP);
    const after = play(state, 0, { x: 1, y: 1 }); // 篝火を隣接スロットに配置
    expect(after.units).toHaveLength(2);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    // round(6 × 1.25) = 8 を同 tick で受ける（二重計上なら round(6×1.25×1.25)=9 になるはず）
    expect(enemy?.hp).toBe(12); // 20 - 8
    expect(effectiveDamage(after, 0, PLAINS_MAP, dummyTarget)).toBe(8);
  });
});

describe('配置クールダウンは魔力炉のみ', () => {
  // ブリーフ原文は createCombatState(deck, []) だが、waves を空配列にすると
  // isCleared が tick=1 で真になり outcome が 'won' に変わってしまい、
  // 2回目の stepTick が「outcome !== 'playing' なら何もしない」の早期 return で
  // 無視される（このファイルの他のテストが軒並み noWave を使っているのはこのため）。
  // クールダウンの検証とは無関係な副作用なので、noWave に差し替える。
  it('守り手は同じ tick に複数置ける（マナがある限り）', () => {
    const deck = createDeck(['arrow-tower', 'arrow-tower'], () => 0);
    let state = { ...createCombatState(deck, noWave), mana: 10 };
    const [a, b] = offPathCells(PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: a! }], PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: b! }], PLAINS_MAP);
    expect(state.units).toHaveLength(2);
  });

  it('魔力炉には引き続きクールダウンが課される', () => {
    const deck = createDeck(['reactor', 'reactor'], () => 0);
    let state = { ...createCombatState(deck, noWave), mana: 10 };
    const [a, b] = offPathCells(PLAINS_MAP);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: a! }], PLAINS_MAP);
    expect(state.placeCooldown).toBeGreaterThan(0);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: b! }], PLAINS_MAP);
    expect(state.reactors).toHaveLength(1);
    expect(state.events.some((e) => e.kind === 'rejected' && e.reason === 'cooldown')).toBe(true);
  });
});

describe('燠火の再点火', () => {
  it('クールダウン中は点火できない', () => {
    const state: CombatState = {
      ...stateWithHand([]),
      embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 100 }],
    };
    const after = stepTick(state, [{ kind: 'reactivate', emberIndex: 0 }], PLAINS_MAP);
    expect(after.events).not.toContainEqual({ kind: 'ember', emberIndex: 0 });
  });

  it('クールダウン0なら点火でき、マナも配置クールダウンも消費しない', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: [], graveyard: [] }, wave);
    state = { ...stepTick(state, [], PLAINS_MAP), embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 0 }] };
    const after = stepTick(state, [{ kind: 'reactivate', emberIndex: 0 }], PLAINS_MAP);
    expect(after.events).toContainEqual({ kind: 'ember', emberIndex: 0 });
    expect(after.mana).toBe(MANA_INITIAL);
    expect(after.placeCooldown).toBe(0);
    expect(after.embers[0]?.cooldownLeft).toBe(300);
  });

  it('再点火可能な状態はクールダウンが0で止まり消えない', () => {
    let state: CombatState = {
      ...stateWithHand([]),
      embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 2 }],
    };
    for (let i = 0; i < 10; i++) state = stepTick(state, [], PLAINS_MAP);
    expect(state.embers[0]?.cooldownLeft).toBe(0);
  });
});

describe('能動的な捨て札', () => {
  it('指定した札が手札から墓地へ移る', () => {
    const state = createCombatState(
      createDeck(['arrow-tower', 'reactor', 'reactor', 'reactor'], () => 0),
      noWave
    );
    const before = state.deck.hand.length;
    const next = stepTick(state, [{ kind: 'discard', handIndex: 0 }], PLAINS_MAP);

    expect(next.deck.hand).toHaveLength(before - 1);
    expect(next.deck.graveyard).toContain(state.deck.hand[0]);
  });

  it('捨て札はマナも配置クールダウンも消費しない', () => {
    const state = {
      ...createCombatState(createDeck(['arrow-tower', 'reactor', 'reactor', 'reactor'], () => 0), noWave),
      mana: 3,
    };
    const next = stepTick(state, [{ kind: 'discard', handIndex: 0 }], PLAINS_MAP);

    expect(next.mana).toBe(3);
    expect(next.placeCooldown).toBe(0);
  });

  it('存在しない index は何も起こさない', () => {
    const state = createCombatState(createDeck(['reactor'], () => 0), noWave);
    const next = stepTick(state, [{ kind: 'discard', handIndex: 99 }], PLAINS_MAP);
    expect(next.deck.hand).toEqual(state.deck.hand);
  });
});
