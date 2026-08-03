/**
 * 灰燼の城壁 - 撃破源の帰属
 *
 * 守り手・罠・燠火の3経路それぞれが単独で撃破を成立させることを検証する。
 * 1経路だけ緑で通る形を避けるため、経路ごとに独立したテストにする。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';

/** 敵が出現しないウェーブ（盤面を手で組むため） */
const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const baseState = (): CombatState =>
  createCombatState(createDeck(['reactor'], () => 0), noWave);

/** 瀕死の敵を1体だけ盤面に置く */
const withDyingEnemy = (state: CombatState, progress: number): CombatState => ({
  ...state,
  enemies: [
    {
      id: 1,
      enemyId: 'grunt',
      hp: 1,
      maxHp: 20,
      progress,
      spawnTick: 0,
      laneIndex: 0,
      alive: true,
      leaked: false,
      groundedUntilTick: 0,
      stunnedUntilTick: 0,
    },
  ],
});

describe('撃破源の帰属', () => {
  it('守り手が倒したとき source は unit とその index になる', () => {
    const state = withDyingEnemy(
      {
        ...baseState(),
        units: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, hp: 10, maxHp: 10, cooldownLeft: 0 }],
      },
      1
    );
    const next = stepTick(state, [], PLAINS_MAP);
    const defeat = next.events.find((e) => e.kind === 'defeat');
    expect(defeat).toEqual({ kind: 'defeat', enemyId: 1, source: { kind: 'unit', index: 0 } });
  });

  it('罠が倒したとき source は trap とその index になる', () => {
    const state = withDyingEnemy(
      {
        ...baseState(),
        traps: [{ cardId: 'spike-trap', pos: { x: 2, y: 2 }, usesLeft: 1, hitEnemyIds: [] }],
      },
      1.9
    );
    const next = stepTick(state, [], PLAINS_MAP);
    const defeat = next.events.find((e) => e.kind === 'defeat');
    expect(defeat).toEqual({ kind: 'defeat', enemyId: 1, source: { kind: 'trap', index: 0 } });
  });

  it('燠火の再点火が倒したとき source は ember とその index になる', () => {
    const state = withDyingEnemy(
      {
        ...baseState(),
        embers: [{ pos: { x: 1, y: 2 }, cooldownLeft: 0 }],
      },
      1
    );
    const next = stepTick(state, [{ kind: 'reactivate', emberIndex: 0 }], PLAINS_MAP);
    const defeat = next.events.find((e) => e.kind === 'defeat');
    expect(defeat).toEqual({ kind: 'defeat', enemyId: 1, source: { kind: 'ember', index: 0 } });
  });
});
