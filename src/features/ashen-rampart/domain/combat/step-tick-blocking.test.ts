/**
 * stepTick 経由のブロック判定テスト
 *
 * 「止まる」「削れる」「消滅して再開する」を別々に検証する（設計書 §12）。
 * 1つのテストで全部を通そうとすると、どれかがゼロのまま緑になる。
 *
 * 守り手は play-card 経由ではなく state.units への直接注入で置く。canPlaceAt は
 * 砦セルを除く全マスに守り手（塔）を置くことを許可しており、経路上への配置も
 * play-card 経由で到達できる（AshenRampartGame.test.tsx で確認済み）。このファイルが
 * 直接注入を使うのは、手札・マナ・配置クールダウンの成立を気にせず「その位置に
 * 守り手がいる」状態だけを直接組み立てたいためであり、経路上に置く手段が無いから
 * ではない。stepTick 内の combat 系テストが既に使っているパターン（state を
 * 直接組み立てる）に倣う。
 *
 * cardId には 'stone-wall' を使うことが多い。石壁は攻撃しない守り手
 * （getCardDefinition('stone-wall').tower.damage === 0）のため、守り手側の攻撃と
 * 混同せず「殴られる側」の観察に適している。逆に消滅を早く起こしたいテストでは、
 * カード定義上は hp:8 の 'arrow-tower'（弓兵）を使い、hp をこのテストの中で
 * 明示的に10へ上書きしている（下記 withBlockerOn の呼び出し箇所を参照）。
 */
import { createCombatState } from './combat-state';
import { createDeck } from '../cards/deck';
import { stepTick } from './step-tick';
import { PLAINS_MAP, laneOf } from '../board/stage-map';
import type { CombatState, PlacedUnit, ActiveEnemy } from './combat-state';
import type { CellPos } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const runTicks = (state: CombatState, count: number): CombatState => {
  let s = state;
  for (let i = 0; i < count; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

/** 経路セル上に守り手を1基置いた状態を作る。省略時は非攻撃の石壁（HP60） */
const withBlockerOn = (
  state: CombatState,
  pos: CellPos,
  overrides: Partial<PlacedUnit> = {}
): CombatState => ({
  ...state,
  units: [
    ...state.units,
    { cardId: 'stone-wall', pos, hp: 60, maxHp: 60, cooldownLeft: 0, ...overrides },
  ],
});

describe('ブロック判定（stepTick 経由）', () => {
  it('経路上に守り手がいると、地上の敵はそこで止まる', () => {
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    let state = createCombatState(emptyDeck, wave);
    state = withBlockerOn(state, blockCell);
    state = runTicks(state, 200);

    const enemy = state.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy!.alive).toBe(true);
    // セル3 に進入していない
    expect(enemy!.progress).toBeLessThan(3);
  });

  it('守り手がいなければ同じ条件で砦まで到達する', () => {
    const wave = [{
      startTick: 0,
      entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
    }];
    let state = createCombatState(emptyDeck, wave);
    state = runTicks(state, 200);
    expect(state.life).toBeLessThan(12);
  });
});

describe('敵の攻撃（stepTick 経由）', () => {
  const singleGrunt = [{
    startTick: 0,
    entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
  }];
  const singleBrute = [{
    startTick: 0,
    entries: [{ enemyId: 'brute', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
  }];

  it('止められた敵は守り手のHPを削る', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    let state = createCombatState(emptyDeck, singleGrunt);
    // 非攻撃の石壁を置く。守り手側の攻撃と混同せず「削れる」だけを見る
    state = withBlockerOn(state, blockCell);
    const maxHp = state.units[0]!.maxHp;
    state = runTicks(state, 200);
    const unit = state.units[0];
    expect(unit).toBeDefined();
    expect(unit!.hp).toBeLessThan(maxHp);
  });

  it('HPが0になると守り手は消滅し、敵の前進が再開する', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    // 重装（攻撃10 / 30tick）でHP10の弓兵を確実に壊す
    let state = createCombatState(emptyDeck, singleBrute);
    state = withBlockerOn(state, blockCell, { cardId: 'arrow-tower', hp: 10, maxHp: 10 });
    state = runTicks(state, 400);
    expect(state.units).toHaveLength(0);
    // 守り手が消えたので、セル3 より先へ進んでいる
    expect(state.enemies[0]!.progress).toBeGreaterThan(3);
  });

  it('守り手の消滅は unit-lost イベントとして発行される', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const blockCell = lane[3]!;
    let state = createCombatState(emptyDeck, singleBrute);
    state = withBlockerOn(state, blockCell, { cardId: 'arrow-tower', hp: 10, maxHp: 10 });
    let sawLost = false;
    for (let i = 0; i < 400; i++) {
      state = stepTick(state, [], PLAINS_MAP);
      if (state.events.some((e) => e.kind === 'unit-lost')) sawLost = true;
    }
    expect(sawLost).toBe(true);
  });

  it('レーンは独立している（片方を塞いでも、もう片方は砦に届く）', () => {
    const wave = [{
      startTick: 0,
      entries: [
        { enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 0 },
        { enemyId: 'grunt', count: 1, spawnIntervalTicks: 1, laneIndex: 1 },
      ],
    }];
    const northCell = laneOf(PLAINS_MAP, 0)[3]!;
    let state = createCombatState(emptyDeck, wave);
    state = withBlockerOn(state, northCell);
    state = runTicks(state, 400);
    // 南レーンの敵は止められていないので漏れる
    expect(state.life).toBeLessThan(12);
  });
});

/**
 * 飛行（鴉）とブロックの関係（Task 6）
 *
 * 「ブロッカーの無い盤面で飛行が届く」だけでは何も検証したことにならない
 * （ブロックしない飛行にとって当たり前の結果のため）。必ずブロッカーを
 * 置いた状態で確認し、置けていること自体もアサートする。
 *
 * tick の目安は実測に基づく（このマップ・敵速度での経験値）:
 *   - 落網（netCell = lane[2]）は tick 102 前後で発動し、地上化は120tick 続く
 *   - 地上化中の鴉は blockCell = lane[4] の手前（progress 3.08 付近）で止まる
 *   - 攻撃間隔20tick ごとに守り手を殴るため、150tick 進めれば削れているのがわかる
 */
describe('飛行とブロック', () => {
  const ravenWave = [{
    startTick: 0,
    entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 1, laneIndex: 0 }],
  }];

  it('飛行はブロッカーを無視して通過する', () => {
    const blockCell = laneOf(PLAINS_MAP, 0)[3]!;
    let state = createCombatState(emptyDeck, ravenWave);
    state = withBlockerOn(state, blockCell);
    // ブロッカーは確かに置かれている（無い盤面で通っても何も検証していない）
    expect(state.units).toHaveLength(1);
    state = runTicks(state, 200);
    // 飛行は素通りして砦に届く
    expect(state.life).toBeLessThan(12);
  });

  it('地上化している間はブロックされる', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    // 落網を手前に、石壁をその先に置く
    const netCell = lane[2]!;
    const blockCell = lane[4]!;
    const deck = createDeck(['snare-net'], () => 0);
    let state = createCombatState(deck, ravenWave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: netCell }], PLAINS_MAP);
    state = withBlockerOn(state, blockCell);
    expect(state.units).toHaveLength(1);
    state = runTicks(state, 150);
    const enemy = state.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy!.alive).toBe(true);
    // 地上化中なので石壁の手前で止まっている
    expect(enemy!.progress).toBeLessThan(4);
  });

  it('地上化している飛行は守り手を殴る（膠着しない）', () => {
    const lane = laneOf(PLAINS_MAP, 0);
    const netCell = lane[2]!;
    const blockCell = lane[4]!;
    const deck = createDeck(['snare-net'], () => 0);
    let state = createCombatState(deck, ravenWave);
    state = stepTick(state, [{ kind: 'play-card', handIndex: 0, pos: netCell }], PLAINS_MAP);
    // 非攻撃の石壁（withBlockerOn の既定）を置く。守り手側の攻撃と
    // 混同せず「殴られる」だけを見る
    state = withBlockerOn(state, blockCell);
    expect(state.units).toHaveLength(1);
    const maxHp = state.units[0]!.maxHp;
    state = runTicks(state, 150);
    const unit = state.units[0];
    // 消滅している場合も「殴った」証拠なので、どちらでもよい
    expect(unit === undefined || unit.hp < maxHp).toBe(true);
  });
});

describe('敵の射程攻撃（反復5）', () => {
  const lane0 = laneOf(PLAINS_MAP, 0);
  const cellAt = (index: number): CellPos => {
    const cell = lane0[index];
    if (!cell) throw new Error(`レーン0 に index ${index} のセルがありません`);
    return cell;
  };

  const bruteAt = (progress: number, id = 1): ActiveEnemy => ({
    id, enemyId: 'brute', hp: 60, maxHp: 60, progress,
    spawnTick: 0, laneIndex: 0, alive: true, leaked: false, groundedUntilTick: 0,
  });

  it('経路外に置いた守り手が、隣を通る重装に削られる', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    // 重装の攻撃間隔は30。tick 30 に殴られるよう tick 29 から進める
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [{ cardId: 'arrow-tower', pos: beside, hp: 8, maxHp: 8, cooldownLeft: 0 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // 弓兵 HP8 に重装の攻撃10 → 消滅する。イベントだけでなく units が減ることまで見る
    expect(next.events).toContainEqual(
      expect.objectContaining({ kind: 'unit-lost', cardId: 'arrow-tower' })
    );
    expect(next.units).toHaveLength(0);
  });

  it('射程外の守り手は削られない', () => {
    const farAway = { x: cellAt(3).x, y: cellAt(3).y + 5 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [{ cardId: 'arrow-tower', pos: farAway, hp: 8, maxHp: 8, cooldownLeft: 0 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    expect(next.units[0]?.hp).toBe(8);
  });

  it('射程攻撃をしても敵は止まらない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      // 硬い壁を経路外に置く（消滅して条件が変わらないように）
      units: [{ cardId: 'stone-wall', pos: beside, hp: 60, maxHp: 60, cooldownLeft: 0 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // 進んだことだけを見る。0.06 という実数で比べると、そのセルが滞留セルかどうか
    // （SLOW_TERRAIN_MULT 0.6 が掛かるか）に依存してしまい、地図を触ると壊れる。
    // 主張は「射程攻撃をしても止まらない」であって速度の値ではない
    expect(next.enemies[0]?.progress).toBeGreaterThan(3);
    expect(next.units[0]?.hp).toBeLessThan(60);
  });

  it('魔力炉・罠・燠火は射程内でも攻撃されない', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [],
      reactors: [{ pos: beside, ticksToMana: 60 }],
      traps: [{ cardId: 'spike-trap', pos: beside, usesLeft: 3, hitEnemyIds: [] }],
      embers: [{ pos: beside, cooldownLeft: 300 }],
      enemies: [bruteAt(3)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // マナ源が壊れると詰みへ戻る（設計書 §4.2）。数が減っていないことを確かめる
    expect(next.reactors).toHaveLength(1);
    expect(next.traps).toHaveLength(1);
    expect(next.embers).toHaveLength(1);
  });

  it('1つの守り手を同時に殴れる敵は3体まで', () => {
    const beside = { x: cellAt(3).x, y: cellAt(3).y + 1 };
    const base = createCombatState(createDeck([], () => 0), []);
    const state: CombatState = {
      ...base,
      tick: 29,
      units: [{ cardId: 'stone-wall', pos: beside, hp: 60, maxHp: 60, cooldownLeft: 0 }],
      enemies: [bruteAt(3, 1), bruteAt(3, 2), bruteAt(3, 3), bruteAt(3, 4), bruteAt(3, 5)],
    };
    const next = stepTick(state, [], PLAINS_MAP);
    // 5体いても3体分（10 × 3 = 30）しか通らない
    expect(next.units[0]?.hp).toBe(30);
  });
});
