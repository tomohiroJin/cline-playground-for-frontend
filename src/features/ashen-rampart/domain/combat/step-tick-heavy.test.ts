/**
 * 徹甲弩の重装特効と投石機のテスト
 *
 * 徹甲弩は「効率の順位が敵によって入れ替わる」ことを作るカード。
 * 雑兵（HP20）には弓兵に劣り、重装（HP60）には勝つ。
 */
import { createCombatState, COUNTDOWN_TICKS } from './combat-state';
import type { CombatState, ActiveEnemy } from './combat-state';
import { stepTick, effectiveDamage } from './step-tick';
import { PLAINS_WAVES } from './waves';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

const enemyOf = (enemyId: string, maxHp: number): ActiveEnemy => ({
  id: 1,
  enemyId,
  hp: maxHp,
  maxHp,
  progress: 1,
  spawnTick: 0,
  laneIndex: 0,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
});

const withUnit = (cardId: string, x: number, y: number): CombatState => ({
  ...createCombatState(emptyDeck, PLAINS_WAVES),
  units: [{ cardId, pos: { x, y }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
});

describe('徹甲弩の重装特効', () => {
  it('HP40未満の敵には基礎ダメージ', () => {
    const state = withUnit('piercer', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('grunt', 20))).toBe(7);
  });

  it('HP40以上の敵には2倍', () => {
    const state = withUnit('piercer', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('brute', 60))).toBe(14);
  });

  it('しきい値ちょうど（40）でも特効が乗る', () => {
    const state = withUnit('piercer', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('grunt', 40))).toBe(14);
  });

  it('現在HPではなく最大HPで判定する（削れても特効は乗り続ける）', () => {
    const state = withUnit('piercer', 1, 2);
    const damaged = { ...enemyOf('brute', 60), hp: 5 };
    expect(effectiveDamage(state, 0, PLAINS_MAP, damaged)).toBe(14);
  });

  it('特効を持たない守り手は敵のHPで変わらない', () => {
    const state = withUnit('arrow-tower', 1, 2);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('grunt', 20))).toBe(6);
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('brute', 60))).toBe(6);
  });

  it('特効と篝火オーラと高台が二重適用されない', () => {
    // (2,3) は高台。隣接 (1,3) に篝火
    const state: CombatState = {
      ...createCombatState(emptyDeck, PLAINS_WAVES),
      units: [
        { cardId: 'piercer', pos: { x: 2, y: 3 }, hp: 10, maxHp: 10, cooldownLeft: 0 },
        { cardId: 'beacon', pos: { x: 1, y: 3 }, hp: 10, maxHp: 10, cooldownLeft: 0 },
      ],
    };
    // round(7 * 1.3 * 1.25 * 2) = round(22.75) = 23
    expect(effectiveDamage(state, 0, PLAINS_MAP, enemyOf('brute', 60))).toBe(23);
  });
});

describe('投石機', () => {
  it('射程3.0で遠くの敵に届く', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    // 経路始端（北レーン入口 (0,2)）に対し (2,1) は距離 hypot(2,1)=2.24 < 3.0
    const state: CombatState = {
      ...createCombatState(emptyDeck, wave),
      units: [{ cardId: 'catapult', pos: { x: 2, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    };
    let s = state;
    for (let i = 0; i < COUNTDOWN_TICKS + 30; i++) s = stepTick(s, [], PLAINS_MAP);
    const grunt = s.enemies[0];
    expect(grunt).toBeDefined();
    expect(grunt && grunt.hp < grunt.maxHp).toBe(true);
  });

  it('範囲2で複数体を巻き込む', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'swarm', count: 4, spawnIntervalTicks: 3, laneIndex: 0 }] },
    ];
    const state: CombatState = {
      ...createCombatState(emptyDeck, wave),
      units: [{ cardId: 'catapult', pos: { x: 2, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    };
    let s = state;
    for (let i = 0; i < COUNTDOWN_TICKS + 40; i++) s = stepTick(s, [], PLAINS_MAP);
    const affected = s.enemies.filter((e) => e.hp < e.maxHp || !e.alive);
    expect(affected.length).toBeGreaterThanOrEqual(3);
  });

  it('飛行には当たらない', () => {
    const wave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
    ];
    const state: CombatState = {
      ...createCombatState(emptyDeck, wave),
      units: [{ cardId: 'catapult', pos: { x: 5, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    };
    let s = state;
    for (let i = 0; i < COUNTDOWN_TICKS + 30; i++) s = stepTick(s, [], PLAINS_MAP);
    const raven = s.enemies[0];
    expect(raven).toBeDefined();
    expect(raven?.hp).toBe(raven?.maxHp);
  });
});
