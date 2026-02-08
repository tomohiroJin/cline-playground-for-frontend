import { getEnemyAtPosition, canMove } from '../../collision';
import { Enemy, GameMap, Player, Wall } from '../../types';

/**
 * プレイヤー被弾時のノックバック解決
 */
export function resolveKnockback(
  player: Player,
  sourceEnemy: Enemy,
  map: GameMap,
  enemies: Enemy[],
  walls: Wall[] = []
): Player {
  const dx = player.x - sourceEnemy.x;
  const dy = player.y - sourceEnemy.y;
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  const knockbackTarget = { x: player.x + stepX, y: player.y + stepY };

  if (!canMove(map, knockbackTarget.x, knockbackTarget.y, walls)) {
    return player;
  }

  if (getEnemyAtPosition(enemies, knockbackTarget.x, knockbackTarget.y)) {
    return player;
  }

  return { ...player, x: knockbackTarget.x, y: knockbackTarget.y };
}
