/**
 * 灰燼の城壁 - 支援塔の貢献計測
 *
 * 篝火は与ダメージ増加分、鍛冶場は射程延長で成立した射撃回数で測る。
 * 効果の種類が違うため、同じテストで両方を通そうとすると
 * 片方がゼロのまま緑になる。必ず別のテストにする。
 */
import { PLAINS_MAP } from '../board/stage-map';
import { createDeck } from '../cards/deck';
import { createCombatState, type CombatState } from './combat-state';
import { stepTick } from './step-tick';
import type { WaveDefinition } from './waves';

const noWave: WaveDefinition[] = [{ startTick: 9999, entries: [] }];

const baseState = (): CombatState =>
  createCombatState(createDeck(['reactor'], () => 0), noWave);

const withEnemyAt = (state: CombatState, progress: number): CombatState => ({
  ...state,
  enemies: [
    {
      id: 1,
      enemyId: 'brute',
      hp: 60,
      maxHp: 60,
      progress,
      spawnTick: 0,
      spawnPathIndex: 0,
      alive: true,
      leaked: false,
      groundedUntilTick: 0,
      stunnedUntilTick: 0,
    },
  ],
});

describe('支援塔の貢献計測', () => {
  it('篝火が隣接していないとき auraDamageBonus は 0 になる', () => {
    const state = withEnemyAt(
      { ...baseState(), towers: [{ cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 }] },
      1
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ auraDamageBonus: 0 });
  });

  it('篝火が隣接するとき auraDamageBonus に増加分が入る', () => {
    // 弓兵 damage 6 / 篝火 +25% → 実効 round(6 * 1.25) = 8。増加分は 2
    const state = withEnemyAt(
      {
        ...baseState(),
        towers: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 },
          { cardId: 'beacon', pos: { x: 2, y: 2 }, cooldownLeft: 0 },
        ],
      },
      1
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ auraDamageBonus: 2 });
  });

  it('鍛冶場が無ければ届かない距離の射撃は beyondBaseRange が true になる', () => {
    // 弓兵の素の射程は 1.6。鍛冶場 +0.6 で 2.2 になる。
    // 塔 (1,2) から経路 (3,3) までの距離は hypot(2,1)=2.236 > 2.2 なので、
    // 距離 2.0 になる (3,3) 手前の位置を狙わせる（progress 2.6 → x=2.6, y=3）。
    const state = withEnemyAt(
      {
        ...baseState(),
        towers: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 },
          { cardId: 'forge', pos: { x: 2, y: 2 }, cooldownLeft: 0 },
        ],
      },
      2.6
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ beyondBaseRange: true });
  });

  it('素の射程で届く射撃は beyondBaseRange が false になる', () => {
    const state = withEnemyAt(
      {
        ...baseState(),
        towers: [
          { cardId: 'arrow-tower', pos: { x: 1, y: 2 }, cooldownLeft: 0 },
          { cardId: 'forge', pos: { x: 2, y: 2 }, cooldownLeft: 0 },
        ],
      },
      1
    );
    const shot = stepTick(state, [], PLAINS_MAP).events.find((e) => e.kind === 'shot');
    expect(shot).toMatchObject({ beyondBaseRange: false });
  });
});
