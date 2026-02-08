import { createEnemy } from '../../enemy';
import { createPlayer } from '../../player';
import { COMBAT_CONFIG } from '../../combat';
import { Direction, EnemyType, GameMap, TileType } from '../../types';
import { resolvePlayerDamage } from './resolvePlayerDamage';

describe('resolvePlayerDamage', () => {
  const createFloorMap = (size: number): GameMap =>
    Array.from({ length: size }, () => Array.from({ length: size }, () => TileType.FLOOR));

  it('ダメージが通る場合はHPを減らし、ノックバックを適用する', () => {
    const map = createFloorMap(7);
    const sourceEnemy = createEnemy(EnemyType.PATROL, 2, 3);
    const player = createPlayer(3, 3);

    const result = resolvePlayerDamage({
      player: { ...player, direction: Direction.RIGHT },
      damage: 2,
      currentTime: 1000,
      invincibleDuration: COMBAT_CONFIG.invincibleDuration,
      sourceEnemy,
      map,
      enemies: [],
      walls: [],
    });

    expect(result.tookDamage).toBe(true);
    expect(result.player.hp).toBe(player.hp - 2);
    expect(result.player.x).toBe(4);
    expect(result.player.y).toBe(3);
  });

  it('無敵中はダメージもノックバックも適用しない', () => {
    const map = createFloorMap(7);
    const sourceEnemy = createEnemy(EnemyType.PATROL, 2, 3);
    const player = {
      ...createPlayer(3, 3),
      isInvincible: true,
      invincibleUntil: 2000,
    };

    const result = resolvePlayerDamage({
      player,
      damage: 2,
      currentTime: 1000,
      invincibleDuration: COMBAT_CONFIG.invincibleDuration,
      sourceEnemy,
      map,
      enemies: [],
      walls: [],
    });

    expect(result.tookDamage).toBe(false);
    expect(result.player).toBe(player);
  });

  it('攻撃元がない場合はダメージのみ適用する', () => {
    const player = createPlayer(3, 3);

    const result = resolvePlayerDamage({
      player,
      damage: 1,
      currentTime: 1000,
      invincibleDuration: COMBAT_CONFIG.invincibleDuration,
    });

    expect(result.tookDamage).toBe(true);
    expect(result.player.hp).toBe(player.hp - 1);
    expect(result.player.x).toBe(3);
    expect(result.player.y).toBe(3);
  });
});
