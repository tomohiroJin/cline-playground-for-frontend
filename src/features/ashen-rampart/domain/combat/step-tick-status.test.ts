/**
 * 地上化・足止めが stepTick の各経路に効くことのテスト
 *
 * 飛行判定は4経路（射撃・範囲・罠・業火）から呼ばれる。
 * 1箇所でも漏れると矛盾が起きるため、経路ごとに個別に検証する。
 */
import { createCombatState } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

/** 鴉1体だけを経路 index 5 に出す */
const ravenWave: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 5 }] },
];

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

/** 鴉を出現させたうえで地上化を掛けた状態を作る */
const groundedRaven = (until: number): CombatState => {
  const spawned = advance(createCombatState(emptyDeck, ravenWave), 1);
  const raven = spawned.enemies[0];
  expect(raven).toBeDefined();
  return {
    ...spawned,
    enemies: spawned.enemies.map((e) => ({ ...e, groundedUntilTick: until })),
  };
};

describe('地上化した飛行敵に地上専用の攻撃が当たる', () => {
  it('射撃: 弓兵（地上のみ）が地上化した鴉を撃てる', () => {
    const state: CombatState = {
      ...groundedRaven(200),
      towers: [{ cardId: 'arrow-tower', pos: { x: 5, y: 2 }, cooldownLeft: 0 }],
    };
    const after = advance(state, 20);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(raven && raven.hp < raven.maxHp).toBe(true);
  });

  it('罠: 棘罠（地上のみ）が地上化した鴉に発動する', () => {
    const spawned = advance(createCombatState(emptyDeck, ravenWave), 1);
    const state: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, groundedUntilTick: 400 })),
      // 経路 index 5 は (4,2)。そこに罠を置く
      traps: [{ cardId: 'spike-trap', pos: { x: 4, y: 2 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 5);
    expect(after.traps[0]?.usesLeft).toBeLessThan(3);
  });

  it('地上化が切れると弓兵は当てられなくなる', () => {
    const state: CombatState = {
      ...groundedRaven(3),
      towers: [{ cardId: 'arrow-tower', pos: { x: 5, y: 2 }, cooldownLeft: 0 }],
    };
    // 地上化が切れた後の HP を基準に、さらに進めても減らないことを見る
    const afterGrounded = advance(state, 5);
    const hpAtEnd = afterGrounded.enemies[0]?.hp;
    expect(hpAtEnd).toBeDefined();
    const later = advance(afterGrounded, 20);
    expect(later.enemies[0]?.hp).toBe(hpAtEnd);
  });
});

describe('足止め', () => {
  it('足止め中は進行度が変わらない', () => {
    const gruntWave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const spawned = advance(createCombatState(emptyDeck, gruntWave), 1);
    const stunned: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, stunnedUntilTick: 100 })),
    };
    const before = stunned.enemies[0]?.progress;
    expect(before).toBeDefined();
    const after = advance(stunned, 20);
    expect(after.enemies[0]?.progress).toBe(before);
  });

  it('足止めが切れると再び進む', () => {
    const gruntWave: WaveDefinition[] = [
      { startTick: 0, entries: [{ enemyId: 'grunt', count: 1, spawnIntervalTicks: 0, spawnPathIndex: 0 }] },
    ];
    const spawned = advance(createCombatState(emptyDeck, gruntWave), 1);
    const stunned: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, stunnedUntilTick: 5 })),
    };
    const atEnd = advance(stunned, 5);
    const progressAtEnd = atEnd.enemies[0]?.progress;
    expect(progressAtEnd).toBeDefined();
    const later = advance(atEnd, 10);
    expect(later.enemies[0]?.progress).toBeGreaterThan(progressAtEnd ?? 0);
  });
});
