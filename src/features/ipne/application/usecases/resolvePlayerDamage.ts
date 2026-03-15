import { damagePlayer } from '../../domain/entities/player';
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

export interface ResolvePlayerDamageResult {
  player: Player;
  tookDamage: boolean;
  actualDamage: number;
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
  const damageResult = damagePlayer(player, damage, currentTime, invincibleDuration);
  if (!damageResult.tookDamage) {
    return { player, tookDamage: false, actualDamage: 0 };
  }

  if (sourceEnemy && map && enemies) {
    return {
      player: resolveKnockback(damageResult.player, sourceEnemy, map, enemies, walls),
      tookDamage: true,
      actualDamage: damageResult.actualDamage,
    };
  }

  return { player: damageResult.player, tookDamage: true, actualDamage: damageResult.actualDamage };
}
