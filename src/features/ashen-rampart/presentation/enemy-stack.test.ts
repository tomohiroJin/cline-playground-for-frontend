/**
 * 敵スタック集約のテスト
 *
 * ウェーブ3は群れ20体が経路7.2セル分を埋めるため、個別描画では
 * マーカーが重なって読めない（設計書 §9.3）。同種で近接する敵を
 * 1マーカーに束ねる。
 */
import { stackEnemies } from './enemy-stack';
import type { ActiveEnemy } from '../domain/combat/combat-state';
import { PLAINS_MAP } from '../domain/board/stage-map';

const enemy = (id: number, enemyId: string, progress: number, hp = 8): ActiveEnemy => ({
  id,
  enemyId,
  hp,
  maxHp: hp,
  progress,
  spawnTick: 0,
  spawnPathIndex: 0,
  alive: true,
  leaked: false,
});

describe('stackEnemies', () => {
  it('生きている敵だけを対象にする', () => {
    const dead = { ...enemy(1, 'grunt', 1), alive: false };
    expect(stackEnemies([dead], PLAINS_MAP.path)).toEqual([]);
  });

  it('同種で0.5セル以内の敵を1つに束ねる', () => {
    const stacks = stackEnemies(
      [enemy(1, 'swarm', 1.0), enemy(2, 'swarm', 1.2), enemy(3, 'swarm', 1.4)],
      PLAINS_MAP.path
    );
    expect(stacks).toHaveLength(1);
    expect(stacks[0]?.count).toBe(3);
  });

  it('種別が違えば束ねない', () => {
    const stacks = stackEnemies([enemy(1, 'swarm', 1.0), enemy(2, 'grunt', 1.0)], PLAINS_MAP.path);
    expect(stacks).toHaveLength(2);
  });

  it('離れていれば束ねない', () => {
    const stacks = stackEnemies([enemy(1, 'swarm', 1.0), enemy(2, 'swarm', 5.0)], PLAINS_MAP.path);
    expect(stacks).toHaveLength(2);
  });

  it('HPはスタック内の合計になる', () => {
    const stacks = stackEnemies([enemy(1, 'swarm', 1.0, 8), enemy(2, 'swarm', 1.1, 8)], PLAINS_MAP.path);
    expect(stacks[0]?.hp).toBe(16);
    expect(stacks[0]?.maxHp).toBe(16);
  });
});
