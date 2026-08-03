/**
 * 灰燼の城壁 - エフェクトの寿命管理
 *
 * state.events は毎 tick 置き換わり、撃破された敵は次の tick に enemies から
 * 消える。受け取った tick のうちに座標へ解決してスナップショットしないと
 * 二度と描けない。この関数はその変換と寿命管理だけを担う。
 */
import { PLAINS_MAP, laneOf } from '../domain/board/stage-map';
import { createDeck } from '../domain/cards/deck';
import { createCombatState, type CombatState } from '../domain/combat/combat-state';
import type { WaveDefinition } from '../domain/combat/waves';
import {
  advanceEffects,
  EFFECT_LIFETIME,
  MAX_CONCURRENT_EFFECTS,
  REDUCED_MOTION_LIFETIME,
  type Effect,
} from './combat-effects';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const stateWith = (tick: number, events: CombatState['events'], extra: Partial<CombatState> = {}): CombatState => ({
  ...createCombatState(createDeck(['reactor'], () => 0), noWave),
  tick,
  events,
  ...extra,
});

const enemyAt = (id: number, progress: number, laneIndex = 0) => ({
  id,
  enemyId: 'grunt',
  hp: 10,
  maxHp: 20,
  progress,
  spawnTick: 0,
  laneIndex,
  alive: true,
  leaked: false,
  groundedUntilTick: 0,
  stunnedUntilTick: 0,
});

describe('advanceEffects', () => {
  it('shot イベントを守り手から敵への線に変換する', () => {
    const state = stateWith(
      10,
      [{ kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false }],
      {
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 1)],
      }
    );
    const effects = advanceEffects([], state, PLAINS_MAP);
    expect(effects).toHaveLength(1);
    expect(effects[0]).toMatchObject({
      kind: 'shot',
      from: { x: 1, y: 2 },
      to: { x: 1, y: 2 },
      untilTick: 10 + EFFECT_LIFETIME.shot,
    });
  });

  it('南レーンの敵への shot は南レーンの座標に変換する（レビュー指摘: 北レーン固定で解決していた回帰）', () => {
    const southCell = laneOf(PLAINS_MAP, 1)[1];
    expect(southCell).toBeDefined();
    const state = stateWith(
      10,
      [{ kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false }],
      {
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 1, 1)],
      }
    );
    const effects = advanceEffects([], state, PLAINS_MAP);
    expect(effects[0]).toMatchObject({ kind: 'shot', to: southCell });
  });

  it('寿命が切れた tick でエフェクトが消える', () => {
    const born = stateWith(
      10,
      [{ kind: 'shot', unitIndex: 0, targetId: 1, auraDamageBonus: 0, beyondBaseRange: false }],
      {
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 1)],
      }
    );
    const effects = advanceEffects([], born, PLAINS_MAP);

    // 寿命の最後の tick では残る
    const alive = advanceEffects(effects, stateWith(10 + EFFECT_LIFETIME.shot - 1, []), PLAINS_MAP);
    expect(alive).toHaveLength(1);

    // 寿命の tick に達したら消える
    const gone = advanceEffects(effects, stateWith(10 + EFFECT_LIFETIME.shot, []), PLAINS_MAP);
    expect(gone).toHaveLength(0);
  });

  it('defeat を撃破源から撃破位置への線に変換する', () => {
    const state = stateWith(
      5,
      [{ kind: 'defeat', enemyId: 1, source: { kind: 'unit', index: 0 } }],
      {
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
        enemies: [enemyAt(1, 2)],
      }
    );
    const effects = advanceEffects([], state, PLAINS_MAP);
    expect(effects[0]).toMatchObject({
      kind: 'defeat',
      from: { x: 1, y: 2 },
      to: { x: 2, y: 2 },
    });
  });

  it('上限を超えたら優先度の低いものから落とす（leak は残る）', () => {
    const shots: Effect[] = Array.from({ length: MAX_CONCURRENT_EFFECTS }, (_, i) => ({
      kind: 'shot',
      from: { x: 1, y: 2 },
      to: { x: 1, y: 3 },
      untilTick: 100,
      id: `shot-${i}`,
      wide: false,
      dashed: false,
    }));
    const state = stateWith(1, [{ kind: 'leak', enemyId: 9 }], {
      enemies: [enemyAt(9, 10)],
    });
    const effects = advanceEffects(shots, state, PLAINS_MAP);
    expect(effects).toHaveLength(MAX_CONCURRENT_EFFECTS);
    expect(effects.some((e) => e.kind === 'leak')).toBe(true);
  });
});

describe('advanceEffects（reduced-motion）', () => {
  const shotEvent = {
    kind: 'shot' as const,
    unitIndex: 0,
    targetId: 1,
    auraDamageBonus: 0,
    beyondBaseRange: false,
  };

  const stateWithUnit = (tick: number, events: CombatState['events']) =>
    stateWith(tick, events, {
      units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
      enemies: [enemyAt(1, 1)],
    });

  it('寿命が一律になる', () => {
    const state = stateWithUnit(10, [shotEvent]);
    const normal = advanceEffects([], state, PLAINS_MAP);
    const reduced = advanceEffects([], state, PLAINS_MAP, { reducedMotion: true });

    expect(normal[0]?.untilTick).toBe(10 + EFFECT_LIFETIME.shot);
    expect(reduced[0]?.untilTick).toBe(10 + REDUCED_MOTION_LIFETIME);
  });

  it('同時表示の上限が半分になる', () => {
    const existing: Effect[] = Array.from({ length: MAX_CONCURRENT_EFFECTS }, (_, i) => ({
      kind: 'shot',
      id: `s${i}`,
      from: { x: 1, y: 2 },
      to: { x: 1, y: 3 },
      untilTick: 999,
      wide: false,
      dashed: false,
    }));
    const reduced = advanceEffects(existing, stateWith(1, []), PLAINS_MAP, {
      reducedMotion: true,
    });
    expect(reduced).toHaveLength(Math.floor(MAX_CONCURRENT_EFFECTS / 2));
  });

  it('reduced-motion でもエフェクトは消えない（0件にならない）', () => {
    const reduced = advanceEffects([], stateWithUnit(10, [shotEvent]), PLAINS_MAP, {
      reducedMotion: true,
    });
    // 消すと reduced-motion のユーザーだけ判定項目1 が達成不能になる
    expect(reduced.length).toBeGreaterThan(0);
  });
});
