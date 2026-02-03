/**
 * 戦闘処理
 */
import { Direction, Enemy, GameMap, Player, Position, Wall, WallType, WallState } from './types';
import { applyKnockbackToEnemy, damageEnemy, isEnemyAlive } from './enemy';
import { canPlayerAttack, damagePlayer, setAttackCooldown, getEffectiveAttackCooldown } from './player';
import { canMove, getEnemyAtPosition } from './collision';
import { isWall } from './collision';
import { damageWall as applyDamageToWall, getWallAt } from './wall';

const COMBAT_CONFIG = {
  playerAttackDamage: 1,
  attackCooldown: 500,
  knockbackDistance: 1,
  knockbackDuration: 200,
  invincibleDuration: 1000,
} as const;

export interface PlayerAttackResult {
  player: Player;
  enemies: Enemy[];
  walls?: Wall[];
  attackPosition?: Position;
  didAttack: boolean;
  hitWall?: boolean;
}

/**
 * 攻撃エフェクトを表示する位置を取得（実際にヒットした位置、または最大射程位置）
 */
const getAttackPosition = (player: Player, map: GameMap, enemies: Enemy[], walls: Wall[] = []): Position => {
  const range = player.stats.attackRange;
  const dx = player.direction === Direction.RIGHT ? 1 : player.direction === Direction.LEFT ? -1 : 0;
  const dy = player.direction === Direction.DOWN ? 1 : player.direction === Direction.UP ? -1 : 0;

  // 攻撃距離内で敵がいる位置、または壁の手前、または最大射程の位置を返す
  for (let i = 1; i <= range; i++) {
    const targetX = player.x + dx * i;
    const targetY = player.y + dy * i;

    // 敵がいたらその位置を返す
    const enemy = enemies.find(e => e.x === targetX && e.y === targetY && isEnemyAlive(e));
    if (enemy) {
      return { x: targetX, y: targetY };
    }

    // 破壊可能壁があったらその位置を返す
    const wall = getWallAt(walls, targetX, targetY);
    if (wall && wall.type === WallType.BREAKABLE && wall.state !== WallState.BROKEN) {
      return { x: targetX, y: targetY };
    }

    // 通常の壁に当たったら手前の位置を返す
    if (isWall(map, targetX, targetY)) {
      return { x: player.x + dx * (i - 1), y: player.y + dy * (i - 1) };
    }
  }

  // 何も当たらなかった場合は最大射程の位置を返す
  return { x: player.x + dx * range, y: player.y + dy * range };
};

/**
 * 攻撃対象の敵を取得（attackRangeマス先まで攻撃可能）
 */
export const getAttackTarget = (player: Player, enemies: Enemy[], map: GameMap): Enemy | undefined => {
  const range = player.stats.attackRange;
  const dx = player.direction === Direction.RIGHT ? 1 : player.direction === Direction.LEFT ? -1 : 0;
  const dy = player.direction === Direction.DOWN ? 1 : player.direction === Direction.UP ? -1 : 0;

  // 攻撃距離内の敵を探す（壁があったらそこで止まる）
  for (let i = 1; i <= range; i++) {
    const targetX = player.x + dx * i;
    const targetY = player.y + dy * i;

    // 壁に当たったら探索を終了
    if (isWall(map, targetX, targetY)) {
      break;
    }

    // 生きている敵がいたら返す
    const enemy = enemies.find(e => e.x === targetX && e.y === targetY && isEnemyAlive(e));
    if (enemy) {
      return enemy;
    }
  }

  return undefined;
};

/**
 * 攻撃対象の破壊可能壁を取得（敵がいない場合のみ）
 */
export const getAttackableWall = (player: Player, walls: Wall[], map: GameMap): Wall | undefined => {
  const range = player.stats.attackRange;
  const dx = player.direction === Direction.RIGHT ? 1 : player.direction === Direction.LEFT ? -1 : 0;
  const dy = player.direction === Direction.DOWN ? 1 : player.direction === Direction.UP ? -1 : 0;

  // 攻撃距離内の破壊可能壁を探す
  for (let i = 1; i <= range; i++) {
    const targetX = player.x + dx * i;
    const targetY = player.y + dy * i;

    // 通常の壁に当たったら探索を終了
    if (isWall(map, targetX, targetY)) {
      break;
    }

    // 破壊可能壁があり、まだ壊れていなければ返す
    const wall = getWallAt(walls, targetX, targetY);
    if (wall && wall.type === WallType.BREAKABLE && wall.state !== WallState.BROKEN) {
      return wall;
    }
  }

  return undefined;
};

const applyKnockback = (
  enemy: Enemy,
  direction: Player['direction'],
  map: GameMap,
  currentTime: number
): Enemy => {
  let nextX = enemy.x;
  let nextY = enemy.y;

  switch (direction) {
    case Direction.UP:
      nextY -= COMBAT_CONFIG.knockbackDistance;
      break;
    case Direction.DOWN:
      nextY += COMBAT_CONFIG.knockbackDistance;
      break;
    case Direction.LEFT:
      nextX -= COMBAT_CONFIG.knockbackDistance;
      break;
    case Direction.RIGHT:
      nextX += COMBAT_CONFIG.knockbackDistance;
      break;
  }

  const canKnockback = canMove(map, nextX, nextY);
  const moved = canKnockback ? { ...enemy, x: nextX, y: nextY } : enemy;

  return applyKnockbackToEnemy(moved, direction, currentTime + COMBAT_CONFIG.knockbackDuration);
};

export const playerAttack = (
  player: Player,
  enemies: Enemy[],
  map: GameMap,
  currentTime: number,
  walls: Wall[] = []
): PlayerAttackResult => {
  if (!canPlayerAttack(player, currentTime)) {
    return { player, enemies, walls, didAttack: false };
  }

  // 攻撃速度を考慮したクールダウンを計算
  const effectiveCooldown = getEffectiveAttackCooldown(player, COMBAT_CONFIG.attackCooldown);

  // 1. まず敵を探す
  const target = getAttackTarget(player, enemies, map);
  if (target) {
    const updatedEnemies = enemies.map(enemy => {
      if (enemy.id !== target.id) return enemy;
      // プレイヤーの攻撃力ステータスを使用
      const damaged = damageEnemy(enemy, player.stats.attackPower);
      if (!isEnemyAlive(damaged)) {
        return damaged;
      }
      return applyKnockback(damaged, player.direction, map, currentTime);
    });

    return {
      player: setAttackCooldown(player, currentTime, effectiveCooldown),
      enemies: updatedEnemies,
      walls,
      didAttack: true,
      attackPosition: getAttackPosition(player, map, enemies, walls),
    };
  }

  // 2. 敵がいなければ破壊可能壁をチェック
  const wallTarget = getAttackableWall(player, walls, map);
  if (wallTarget) {
    const updatedWalls = walls.map(wall => {
      if (wall.x !== wallTarget.x || wall.y !== wallTarget.y) return wall;
      return applyDamageToWall(wall, player.stats.attackPower);
    });

    return {
      player: setAttackCooldown(player, currentTime, effectiveCooldown),
      enemies,
      walls: updatedWalls,
      didAttack: true,
      hitWall: true,
      attackPosition: getAttackPosition(player, map, enemies, walls),
    };
  }

  // 3. どちらもなければ空振り
  return {
    player: setAttackCooldown(player, currentTime, effectiveCooldown),
    enemies,
    walls,
    didAttack: true,
    attackPosition: getAttackPosition(player, map, enemies, walls),
  };
};

export const processEnemyContact = (
  player: Player,
  enemies: Enemy[],
  currentTime: number
): { player: Player; didDamage: boolean } => {
  const enemy = getEnemyAtPosition(enemies, player.x, player.y);
  if (!enemy) return { player, didDamage: false };

  const updatedPlayer = damagePlayer(
    player,
    enemy.damage,
    currentTime,
    COMBAT_CONFIG.invincibleDuration
  );

  return { player: updatedPlayer, didDamage: updatedPlayer !== player };
};

export const isKnockbackComplete = (enemy: Enemy, currentTime: number): boolean => {
  if (enemy.knockbackUntil === undefined) return true;
  return currentTime >= enemy.knockbackUntil;
};

export { COMBAT_CONFIG };
