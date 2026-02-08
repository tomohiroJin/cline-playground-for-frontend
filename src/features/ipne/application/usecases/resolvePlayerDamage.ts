import { damagePlayer } from '../../player';
import { Enemy, GameMap, Player, Wall } from '../../types';
import { resolveKnockback } from './resolveKnockback';

interface ResolvePlayerDamageParams {
  player: Player;
  damage: number;
  currentTime: number;
  invincibleDuration: number;
  sourceEnemy?: Enemy;
  map?: GameMap;
  enemies?: Enemy[];
  walls?: Wall[];
}

interface ResolvePlayerDamageResult {
  player: Player;
  tookDamage: boolean;
}

/**
 * 被ダメージ適用とノックバックの統合ユースケース
 */
export function resolvePlayerDamage({
  player,
  damage,
  currentTime,
  invincibleDuration,
  sourceEnemy,
  map,
  enemies,
  walls = [],
}: ResolvePlayerDamageParams): ResolvePlayerDamageResult {
  const damagedPlayer = damagePlayer(player, damage, currentTime, invincibleDuration);
  if (damagedPlayer === player) {
    return { player, tookDamage: false };
  }

  if (sourceEnemy && map && enemies) {
    return {
      player: resolveKnockback(damagedPlayer, sourceEnemy, map, enemies, walls),
      tookDamage: true,
    };
  }

  return { player: damagedPlayer, tookDamage: true };
}
