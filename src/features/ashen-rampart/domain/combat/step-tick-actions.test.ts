/**
 * プレイヤー操作のテスト
 *
 * 「排他的な選択」（配置クールダウン）と「代償」（マナ・スロット消費）は
 * 仮説の必要条件そのものであり、ここが緩むと配分が発生しない（設計書 §4.1）。
 */
import { createCombatState, PLACE_COOLDOWN_TICKS, MANA_INITIAL } from './combat-state';
import type { CombatState, PlacedTower } from './combat-state';
import { stepTick, canPlaceAt, effectiveDamage } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const stateWithHand = (hand: string[]): CombatState =>
  createCombatState({ drawPile: [], hand, graveyard: [] }, noWave);

const play = (state: CombatState, handIndex: number, pos?: { x: number; y: number }) =>
  stepTick(state, [{ kind: 'play-card', handIndex, pos }], PLAINS_MAP);

describe('canPlaceAt', () => {
  it('塔は設置スロットにだけ置ける', () => {
    const card = getCardDefinition('arrow-tower');
    const empty = stateWithHand([]);
    expect(canPlaceAt(empty, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(empty, card, { x: 1, y: 3 }, PLAINS_MAP)).toBe(false);
  });

  it('罠は経路にだけ置ける', () => {
    const card = getCardDefinition('spike-trap');
    const empty = stateWithHand([]);
    expect(canPlaceAt(empty, card, { x: 1, y: 3 }, PLAINS_MAP)).toBe(true);
    expect(canPlaceAt(empty, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(false);
  });

  it('埋まっているスロットには置けない', () => {
    const card = getCardDefinition('arrow-tower');
    const occupied: CombatState = {
      ...stateWithHand([]),
      towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
    };
    expect(canPlaceAt(occupied, card, { x: 1, y: 2 }, PLAINS_MAP)).toBe(false);
  });

  it('魔力炉も燠火もスロットを消費する', () => {
    const empty = stateWithHand([]);
    const occupied: CombatState = {
      ...empty,
      reactors: [{ pos: { x: 1, y: 2 }, ticksToMana: 60 }],
    };
    expect(canPlaceAt(occupied, getCardDefinition('ember-blast'), { x: 1, y: 2 }, PLAINS_MAP)).toBe(
      false
    );
  });
});

describe('カード配置', () => {
  it('塔を置くとマナが減り手札から墓地へ移る', () => {
    const state = stateWithHand(['arrow-tower']);
    const after = play(state, 0, { x: 1, y: 2 });
    expect(after.towers).toHaveLength(1);
    expect(after.mana).toBe(MANA_INITIAL - 2);
    expect(after.deck.hand).toEqual([]);
    expect(after.deck.graveyard).toEqual(['arrow-tower']);
  });

  it('配置クールダウンが立ち、次の tick では置けない', () => {
    const state = stateWithHand(['arrow-tower', 'spike-trap']);
    const first = play(state, 0, { x: 1, y: 2 });
    expect(first.placeCooldown).toBe(PLACE_COOLDOWN_TICKS);
    const second = play(first, 0, { x: 1, y: 3 });
    expect(second.traps).toHaveLength(0);
    expect(second.events).toContainEqual({ kind: 'rejected', reason: 'cooldown' });
  });

  it('マナが足りなければ置けない', () => {
    const state = stateWithHand(['ballista']); // コスト3、初期マナ2
    const after = play(state, 0, { x: 1, y: 2 });
    expect(after.towers).toHaveLength(0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'mana' });
  });

  it('魔力炉はコスト0なのでマナ0でも置ける', () => {
    const state: CombatState = { ...stateWithHand(['reactor']), mana: 0 };
    const after = play(state, 0, { x: 1, y: 2 });
    expect(after.reactors).toHaveLength(1);
  });

  it('置けない場所を指定すると拒否される', () => {
    const state = stateWithHand(['arrow-tower']);
    const after = play(state, 0, { x: 0, y: 0 });
    expect(after.towers).toHaveLength(0);
    expect(after.events).toContainEqual({ kind: 'rejected', reason: 'target' });
  });

  it('時泥は対象を取らず盤面に残らない', () => {
    const state = stateWithHand(['mud-time']);
    const after = play(state, 0);
    expect(after.towers).toHaveLength(0);
    expect(after.slowUntilTick).toBe(after.tick + 200);
    expect(after.deck.graveyard).toEqual(['mud-time']);
  });

  it('業火は即座にダメージを与え燠火として残る', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['ember-blast'], graveyard: [] }, wave);
    state = stepTick(state, [], PLAINS_MAP); // 敵を出現させる
    const after = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: { x: 1, y: 2 } }], PLAINS_MAP);
    expect(after.embers).toHaveLength(1);
    expect(after.enemies[0]?.hp).toBe(12); // 20 - 8
  });

  it('同tickに配置した塔が、その tick に射程内の敵へダメージを与える', () => {
    // 敵は入口の次のセル (1,3) に出現させ、塔 (1,2) から距離1で射程1.6内に収める
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 1 }] },
    ];
    const state = createCombatState({ drawPile: [], hand: ['arrow-tower'], graveyard: [] }, wave);
    const after = play(state, 0, { x: 1, y: 2 });
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy?.hp).toBe(14); // 20 - 6（配置と同じ tick で射撃が発生する）
  });

  it('同tickに配置した篝火のオーラが既存の隣接塔に同tickで乗り、二重計上しない', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 1 }] },
    ];
    const existingTower: PlacedTower = { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 };
    const state: CombatState = {
      ...createCombatState({ drawPile: [], hand: ['beacon'], graveyard: [] }, wave),
      towers: [existingTower],
    };
    const after = play(state, 0, { x: 2, y: 2 }); // 篝火を隣接スロットに配置
    expect(after.towers).toHaveLength(2);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    // round(6 × 1.25) = 8 を同 tick で受ける（二重計上なら round(6×1.25×1.25)=9 になるはず）
    expect(enemy?.hp).toBe(12); // 20 - 8
    expect(effectiveDamage(after, 0, PLAINS_MAP)).toBe(8);
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
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
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
