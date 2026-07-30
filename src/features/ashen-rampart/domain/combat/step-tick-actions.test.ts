/**
 * プレイヤー操作のテスト
 *
 * 「排他的な選択」（配置クールダウン）と「代償」（マナ・スロット消費）は
 * 仮説の必要条件そのものであり、ここが緩むと配分が発生しない（設計書 §4.1）。
 */
import { createCombatState, PLACE_COOLDOWN_TICKS, MANA_INITIAL, COUNTDOWN_TICKS } from './combat-state';
import type { CombatState, PlacedTower, ActiveEnemy } from './combat-state';
import { stepTick, canPlaceAt, effectiveDamage } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';
import { getCardDefinition } from '../cards/card-pool';
import { getEnemySpec } from './enemies';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

/** effectiveDamage の対象引数用ダミー（特効を持たない塔のテストでは値は結果に影響しない） */
const dummyTarget: ActiveEnemy = {
  id: 0,
  enemyId: 'grunt',
  hp: 20,
  maxHp: 20,
  progress: 0,
  spawnTick: 0,
  spawnPathIndex: 0,
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

  it('魔力炉が生むマナ量はカード定義の manaPerTick を実際に読む（指摘5の回帰: 以前は +1 固定だった）', () => {
    const reactorSpec = getCardDefinition('reactor').reactor;
    const intervalTicks = reactorSpec?.intervalTicks ?? 60;
    const manaPerTick = reactorSpec?.manaPerTick ?? 1;
    let state: CombatState = {
      ...stateWithHand([]),
      reactors: [{ pos: { x: 1, y: 2 }, ticksToMana: intervalTicks }],
    };
    const manaBefore = state.mana;
    for (let i = 0; i < intervalTicks; i++) {
      state = stepTick(state, [], PLAINS_MAP);
    }
    expect(state.mana).toBe(manaBefore + manaPerTick);
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
    // 前提: card-pool.ts の mud-time.spell.speedMultiplier がそのまま反映されること
    // （指摘5: 以前はここが読まれず 0.6 がハードコードされていた）
    expect(after.slowMultiplier).toBe(0.6);
    expect(after.deck.graveyard).toEqual(['mud-time']);
  });

  it('時泥の減速倍率が実際の敵移動に適用される（指摘5の回帰: 以前は 0.6 固定で card-pool を読んでいなかった）', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
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
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['ember-blast'], graveyard: [] }, wave);
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現まで進める
    for (let i = 0; i < COUNTDOWN_TICKS + 1; i++) state = stepTick(state, [], PLAINS_MAP); // 敵を出現させる
    const after = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: { x: 1, y: 2 } }], PLAINS_MAP);
    expect(after.embers).toHaveLength(1);
    expect(after.enemies[0]?.hp).toBe(12); // 20 - 8
  });

  it('同tickに配置した塔が、その tick に射程内の敵へダメージを与える', () => {
    // 敵は入口の次のセル (1,3) に出現させ、塔 (1,2) から距離1で射程1.6内に収める
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 1 }] },
    ];
    let state = createCombatState({ drawPile: [], hand: ['arrow-tower'], graveyard: [] }, wave);
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現 tick と play tick を合わせる
    for (let i = 0; i < COUNTDOWN_TICKS; i++) state = stepTick(state, [], PLAINS_MAP);
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
    let state: CombatState = {
      ...createCombatState({ drawPile: [], hand: ['beacon'], graveyard: [] }, wave),
      towers: [existingTower],
    };
    // ウェーブの startTick が COUNTDOWN_TICKS ぶんずれるため、出現 tick と play tick を合わせる
    for (let i = 0; i < COUNTDOWN_TICKS; i++) state = stepTick(state, [], PLAINS_MAP);
    const after = play(state, 0, { x: 2, y: 2 }); // 篝火を隣接スロットに配置
    expect(after.towers).toHaveLength(2);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    // round(6 × 1.25) = 8 を同 tick で受ける（二重計上なら round(6×1.25×1.25)=9 になるはず）
    expect(enemy?.hp).toBe(12); // 20 - 8
    expect(effectiveDamage(after, 0, PLAINS_MAP, dummyTarget)).toBe(8);
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
