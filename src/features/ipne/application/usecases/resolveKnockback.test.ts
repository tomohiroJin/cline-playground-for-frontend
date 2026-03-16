import { createEnemy } from '../../domain/entities/enemy';
import { createPlayer } from '../../domain/entities/player';
import { EnemyType, GameMap, TileType } from '../../types';
import { resolveKnockback } from './resolveKnockback';
import { MockIdGenerator } from '../../__tests__/mocks/MockIdGenerator';

const idGen = new MockIdGenerator();

describe('resolveKnockback', () => {
  const createFloorMap = (size: number): GameMap =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => TileType.FLOOR));

  it('ノックバック先が移動可能ならプレイヤーを移動する', () => {
    const map = createFloorMap(7);
    const player = createPlayer(3, 3);
    const sourceEnemy = createEnemy(EnemyType.PATROL, 2, 3, idGen);

    const result = resolveKnockback(player, sourceEnemy, map, []);

    expect(result.x).toBe(4);
    expect(result.y).toBe(3);
  });

  it('ノックバック先が壁ならプレイヤーを移動しない', () => {
    const map = createFloorMap(7);
    map[3][4] = TileType.WALL;
    const player = createPlayer(3, 3);
    const sourceEnemy = createEnemy(EnemyType.PATROL, 2, 3, idGen);

    const result = resolveKnockback(player, sourceEnemy, map, []);

    expect(result.x).toBe(3);
    expect(result.y).toBe(3);
  });

  it('ノックバック先に敵がいるならプレイヤーを移動しない', () => {
    const map = createFloorMap(7);
    const player = createPlayer(3, 3);
    const sourceEnemy = createEnemy(EnemyType.PATROL, 2, 3, idGen);
    const blockingEnemy = createEnemy(EnemyType.CHARGE, 4, 3, idGen);

    const result = resolveKnockback(player, sourceEnemy, map, [blockingEnemy]);

    expect(result.x).toBe(3);
    expect(result.y).toBe(3);
  });
});
