/**
 * stepTick の戦闘部分のテスト
 *
 * 設計原則「最高効率のカードには必ず効かない相手を作る」が
 * 実装として成立していることを、飛行敵への当たり判定で検証する。
 */
import { createCombatState } from './combat-state';
import type { CombatState, ActiveEnemy } from './combat-state';
import { stepTick, effectiveDamage } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

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

const waveOf = (enemyId: string, count = 1): WaveDefinition[] => [
  { startTick: 0, entries: [{ enemyId, count, spawnIntervalTicks: 2, spawnPathIndex: 0 }] },
];

/** 塔を1基置いた状態を作る */
const withTower = (state: CombatState, cardId: string, x: number, y: number): CombatState => ({
  ...state,
  towers: [...state.towers, { cardId, pos: { x, y }, cooldownLeft: 0 }],
});

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

describe('塔の射撃', () => {
  it('射程内の敵にダメージを与える', () => {
    // 経路(1,3) の隣 (1,2) に弓兵。射程1.6で届く
    const state = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'arrow-tower', 1, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy && enemy.hp < enemy.maxHp).toBe(true);
  });

  it('攻撃間隔を守る（8tickに1発）', () => {
    // 累計ダメージ量では 8tick周期でも 9tick周期でも通過してしまい
    // オフバイワン回帰を検出できない（過去に実際再発した）ため、
    // 発射イベントが起きた tick そのものを集めて間隔を直接検証する。
    let state = withTower(createCombatState(emptyDeck, waveOf('brute')), 'arrow-tower', 1, 2);
    const shotTicks: number[] = [];
    for (let tick = 1; tick <= 40; tick++) {
      state = stepTick(state, [], PLAINS_MAP);
      if (state.events.some((e) => e.kind === 'shot')) shotTicks.push(tick);
    }
    expect(shotTicks.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < shotTicks.length; i++) {
      expect(shotTicks[i] - shotTicks[i - 1]).toBe(8);
    }
  });

  it('発射周期はちょうど cooldownTicks tick になる（弩砲でも検証）', () => {
    // 弩砲（cooldownTicks:12）は重装より射程内滞在が長く、複数回の発射間隔を観測できる
    let state = withTower(createCombatState(emptyDeck, waveOf('brute')), 'ballista', 1, 2);
    const shotTicks: number[] = [];
    for (let tick = 1; tick <= 60; tick++) {
      state = stepTick(state, [], PLAINS_MAP);
      if (state.events.some((e) => e.kind === 'shot')) shotTicks.push(tick);
    }
    expect(shotTicks.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < shotTicks.length; i++) {
      expect(shotTicks[i] - shotTicks[i - 1]).toBe(12);
    }
  });

  it('HPが0になると撃破され defeat イベントが出る', () => {
    const state = withTower(createCombatState(emptyDeck, waveOf('swarm')), 'arrow-tower', 1, 2);
    const after = advance(state, 30);
    expect(after.enemies[0]?.alive).toBe(false);
    expect(after.enemies[0]?.leaked).toBe(false);
  });
});

describe('飛行への当たり判定（カウンター要求の中核）', () => {
  it('弓兵は鴉に当たらない', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
    ];
    // 経路 index 5 は (4,2)。その隣 (5,2) に弓兵を置く
    const state = withTower(createCombatState(emptyDeck, ravens), 'arrow-tower', 5, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    // 前提: 鴉自身が盤面に実在すること（未 spawn だと無検証になる）
    expect(enemy).toBeDefined();
    expect(enemy?.hp).toBe(enemy?.maxHp);
  });

  it('弩砲は鴉に当たる', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
    ];
    const state = withTower(createCombatState(emptyDeck, ravens), 'ballista', 5, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    expect(enemy).toBeDefined();
    expect(enemy && enemy.hp < enemy.maxHp).toBe(true);
  });
});

describe('範囲攻撃', () => {
  it('火砲台は着弾点の周囲にも当たる', () => {
    const state = withTower(
      createCombatState(emptyDeck, waveOf('swarm', 3)),
      'cannon-tower',
      1,
      2
    );
    const after = advance(state, 25);
    const damaged = after.enemies.filter((e) => e.hp < e.maxHp || !e.alive);
    expect(damaged.length).toBeGreaterThanOrEqual(2);
  });

  it('火砲台の範囲攻撃は飛行を巻き込まない', () => {
    // 地上の雑兵と鴉を同じ経路 index 5 から同時に出現させ、
    // 火砲台の splash 範囲に両方が入りうる状況を作る
    const mixed: WaveDefinition[] = [
      {
        startTick: 0,
        entries: [
          { enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 },
          { enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 },
        ],
      },
    ];
    const state = withTower(createCombatState(emptyDeck, mixed), 'cannon-tower', 5, 2);
    const after = advance(state, 20);
    const grunt = after.enemies.find((e) => e.enemyId === 'grunt');
    const raven = after.enemies.find((e) => e.enemyId === 'raven');
    // 前提: 実際に地上敵へ攻撃が発生していること（撃っていないから鴉も無傷、という偽の緑を防ぐ）
    expect(grunt).toBeDefined();
    expect(grunt && grunt.hp < grunt.maxHp).toBe(true);
    // 前提: 鴉自身が盤面に実在すること（未 spawn だと無検証になる）
    expect(raven).toBeDefined();
    // 検証: 同じ範囲にいた鴉は splash に巻き込まれず無傷のまま
    expect(raven?.hp).toBe(raven?.maxHp);
  });
});

describe('篝火のオーラ', () => {
  it('隣接する塔の攻撃力を +25% する', () => {
    const base = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'arrow-tower', 1, 2);
    expect(effectiveDamage(base, 0, PLAINS_MAP, dummyTarget)).toBe(6);
    const withBeacon = withTower(base, 'beacon', 2, 2);
    expect(effectiveDamage(withBeacon, 0, PLAINS_MAP, dummyTarget)).toBe(8); // round(6 * 1.25)
  });

  it('高台の塔は火力が +30% される', () => {
    // (3,4) は高台
    const high = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'arrow-tower', 3, 4);
    expect(effectiveDamage(high, 0, PLAINS_MAP, dummyTarget)).toBe(8); // round(6 * 1.3)
  });

  it('篝火自身は攻撃しない', () => {
    const state = withTower(createCombatState(emptyDeck, waveOf('grunt')), 'beacon', 1, 2);
    const after = advance(state, 20);
    const enemy = after.enemies[0];
    // 前提: 雑兵が実際に盤面に存在すること（未 spawn だと無検証になる）
    expect(enemy).toBeDefined();
    expect(enemy?.hp).toBe(enemy?.maxHp);
  });
});

describe('罠', () => {
  it('経路を踏んだ地上敵にダメージを与え、回数を消費する', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('grunt', 2)),
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 25);
    expect(after.traps[0]?.usesLeft).toBeLessThan(3);
    expect(after.enemies.some((e) => e.hp < e.maxHp || !e.alive)).toBe(true);
  });

  it('同じ敵は同じ罠で二度傷つかない', () => {
    const state: CombatState = {
      ...createCombatState(emptyDeck, waveOf('brute')),
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 60);
    expect(60 - (after.enemies[0]?.hp ?? 0)).toBe(5);
  });

  it('罠は飛行に当たらない', () => {
    const ravens: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const state: CombatState = {
      ...createCombatState(emptyDeck, ravens),
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 3 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 30);
    expect(after.traps[0]?.usesLeft).toBe(3);
  });
});
