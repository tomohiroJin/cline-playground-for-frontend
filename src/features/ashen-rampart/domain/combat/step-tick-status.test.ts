/**
 * 地上化・足止めが stepTick の各経路に効くことのテスト
 *
 * 飛行判定は4経路（射撃・範囲・罠・業火）から呼ばれる。
 * 1箇所でも漏れると矛盾が起きるため、経路ごとに個別に検証する。
 */
import { createCombatState, COUNTDOWN_TICKS } from './combat-state';
import type { CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';
import { PLAINS_MAP } from '../board/stage-map';

const emptyDeck = { drawPile: [], hand: [], graveyard: [] };

/** 鴉1体だけを入口（レーン0）に出す */
const ravenWave: WaveDefinition[] = [
  { startTick: 0, entries: [{ enemyId: 'raven', count: 1, spawnIntervalTicks: 0, laneIndex: 0 }] },
];

const advance = (state: CombatState, n: number): CombatState => {
  let s = state;
  for (let i = 0; i < n; i++) s = stepTick(s, [], PLAINS_MAP);
  return s;
};

/** 鴉を出現させたうえで地上化を掛けた状態を作る */
const groundedRaven = (until: number): CombatState => {
  // ウェーブの startTick は COUNTDOWN_TICKS ぶんずれているため、出現まで進める tick 数もずらす
  const spawned = advance(createCombatState(emptyDeck, ravenWave), COUNTDOWN_TICKS + 1);
  const raven = spawned.enemies[0];
  expect(raven).toBeDefined();
  return {
    ...spawned,
    enemies: spawned.enemies.map((e) => ({ ...e, groundedUntilTick: until })),
  };
};

describe('地上化した飛行敵に地上専用の攻撃が当たる', () => {
  it('射撃: 弓兵（地上のみ）が地上化した鴉を撃てる', () => {
    // 鴉は入口 (0,2) から出る。守り手 (1,1) なら出現直後から射程1.6内
    const state: CombatState = {
      ...groundedRaven(200),
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    };
    const after = advance(state, 20);
    const raven = after.enemies[0];
    expect(raven).toBeDefined();
    expect(raven && raven.hp < raven.maxHp).toBe(true);
  });

  it('罠: 棘罠（地上のみ）が地上化した鴉に発動する', () => {
    const spawned = advance(createCombatState(emptyDeck, ravenWave), COUNTDOWN_TICKS + 1);
    const state: CombatState = {
      ...spawned,
      enemies: spawned.enemies.map((e) => ({ ...e, groundedUntilTick: 400 })),
      // 鴉は入口 (0,2) から出る。隣の経路セル (1,2) に罠を置く
      traps: [{ cardId: 'spike-trap', pos: { x: 1, y: 2 }, usesLeft: 3, hitEnemyIds: [] }],
    };
    const after = advance(state, 5);
    expect(after.traps[0]?.usesLeft).toBeLessThan(3);
  });

  it('地上化が切れると弓兵は当てられなくなる', () => {
    // 出現 tick が COUNTDOWN_TICKS ぶんずれたため、猶予も同じぶん後ろにずらす
    const state: CombatState = {
      ...groundedRaven(COUNTDOWN_TICKS + 3),
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 1 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
    };
    // 地上化が切れた後の HP を基準に、さらに進めても減らないことを見る
    const afterGrounded = advance(state, 5);
    const hpAtEnd = afterGrounded.enemies[0]?.hp;
    expect(hpAtEnd).toBeDefined();
    const later = advance(afterGrounded, 20);
    expect(later.enemies[0]?.hp).toBe(hpAtEnd);
  });
});
