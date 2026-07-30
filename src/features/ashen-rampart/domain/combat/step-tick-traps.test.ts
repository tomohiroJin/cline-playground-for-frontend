/**
 * 罠の新効果のテスト
 *
 * 落網は飛行にのみ発動し、石壁は地上にのみ発動する。
 * 既存の棘罠（地上にダメージ）と合わせて、罠の対象判定が3種類になる。
 */
import { createCombatState, COUNTDOWN_TICKS } from './combat-state';
import type { CombatState, PlacedTrap } from './combat-state';
import { stepTick } from './step-tick';
import { isEnemyFlying, isEnemyStunned } from './enemy-status';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const waveOf = (enemyId: string, spawnPathIndex: number): WaveDefinition[] => [
  { startTick: 0, entries: [{ enemyId, count: 1, spawnIntervalTicks: 0, spawnPathIndex }] },
];

const trap = (cardId: string, x: number, y: number): PlacedTrap => ({
  cardId,
  pos: { x, y },
  usesLeft: 3,
  hitEnemyIds: [],
});

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('落網（飛行を地上化）', () => {
  it('飛行敵を踏ませると地上化し、回数を消費する', () => {
    // 鴉は経路 index 5 = (4,2) から出る
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('snare-net', 4, 2)],
    };
    const after = advance(state, COUNTDOWN_TICKS + 5);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(after.traps[0]?.usesLeft).toBe(2);
    expect(raven && isEnemyFlying(raven, after.tick)).toBe(false);
  });

  it('地上化は120tick後に切れる', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('snare-net', 4, 2)],
    };
    // 鴉は経路 index 5 = (4,2) にスポーンし、罠 snare-net もその位置に置くため、
    // 出現した最初の tick（ウェーブの startTick が COUNTDOWN_TICKS ぶんずれた後の
    // tick = COUNTDOWN_TICKS + 1）で即座に罠へ接触する。よって捕獲 tick は
    // 常にその 1 tick 目であり、caught.tick と一致させるには advance をその回数に留める
    // （それ以上進めてしまうと caught.tick が捕獲 tick とずれ、式の意味が崩れる）。
    const caught = advance(state, COUNTDOWN_TICKS + 1);
    const raven = caught.enemies[0];
    expect(raven).toBeDefined();
    expect(raven?.groundedUntilTick).toBe(caught.tick + 120 - 1);
  });

  it('地上敵には発動しない（回数を消費しない）', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('snare-net', 1, 3)],
    };
    const after = advance(state, COUNTDOWN_TICKS + 30);
    expect(after.traps[0]?.usesLeft).toBe(3);
  });

  it('ダメージを与えない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('snare-net', 4, 2)],
    };
    const after = advance(state, COUNTDOWN_TICKS + 5);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(raven?.hp).toBe(raven?.maxHp);
  });
});

describe('石壁（地上を足止め）', () => {
  it('地上敵を踏ませると足止めし、回数を消費する', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('stone-wall', 1, 3)],
    };
    const after = advance(state, COUNTDOWN_TICKS + 15);
    const grunt = after.enemies[0];
    expect(grunt).toBeDefined();
    expect(after.traps[0]?.usesLeft).toBe(2);
    expect(grunt && isEnemyStunned(grunt, after.tick)).toBe(true);
  });

  it('足止め中は進行度が変わらない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('stone-wall', 1, 3)],
    };
    const caught = advance(state, COUNTDOWN_TICKS + 15);
    const progressWhenCaught = caught.enemies[0]?.progress;
    expect(progressWhenCaught).toBeDefined();
    const after = advance(caught, 20);
    expect(after.enemies[0]?.progress).toBe(progressWhenCaught);
  });

  it('飛行敵には発動しない（回数を消費しない）', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('stone-wall', 4, 2)],
    };
    const after = advance(state, COUNTDOWN_TICKS + 10);
    expect(after.traps[0]?.usesLeft).toBe(3);
  });

  it('ダメージを与えない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('stone-wall', 1, 3)],
    };
    const after = advance(state, COUNTDOWN_TICKS + 15);
    const grunt = after.enemies[0];
    expect(grunt).toBeDefined();
    expect(grunt?.hp).toBe(grunt?.maxHp);
  });
});

describe('棘罠（既存の回帰）', () => {
  it('地上敵にダメージを与え、飛行には発動しない', () => {
    const ground: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 0)),
      traps: [trap('spike-trap', 1, 3)],
    };
    const afterGround = advance(ground, COUNTDOWN_TICKS + 15);
    const grunt = afterGround.enemies[0];
    expect(grunt).toBeDefined();
    expect(grunt && grunt.hp < grunt.maxHp).toBe(true);

    const air: CombatState = {
      ...createCombatState(emptyDeck, waveOf('raven', 5)),
      traps: [trap('spike-trap', 4, 2)],
    };
    const afterAir = advance(air, COUNTDOWN_TICKS + 10);
    expect(afterAir.traps[0]?.usesLeft).toBe(3);
  });
});
