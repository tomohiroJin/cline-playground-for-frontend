/**
 * 敵AIロジック
 *
 * 各敵タイプ別のAI更新関数と、敵の一括更新を行うオーケストレーション関数を提供する。
 * Policy パターンによりタイプ別のAI更新が統一的に管理される。
 */
import { Enemy, GameMap, Position } from '../../types';
import { buildDefaultEnemyAiPolicyRegistry } from './policies';
import {
  AI_CONFIG,
  detectPlayer,
  shouldChase,
  shouldStopChase,
  calculateFleeDirection,
  getDirectPathToPlayer,
} from './aiGeometry';
import { setRandomProvider, resetRandomProvider } from './aiRandom';
import {
  moveEnemyTowards,
  generatePatrolPath,
  getNextPatrolPoint,
} from './enemyMovement';
import {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
  resolveKnockbackState,
} from './attackState';
import { updatePatrolEnemy } from './behaviors/patrolBehavior';
import { updateChargeEnemy } from './behaviors/chargeBehavior';
import { updateRangedEnemy } from './behaviors/rangedBehavior';
import { updateFleeEnemy } from './behaviors/fleeBehavior';

// 公開 API（barrel）として再公開
export { AI_CONFIG, detectPlayer, shouldChase, shouldStopChase, calculateFleeDirection, getDirectPathToPlayer };
export { setRandomProvider, resetRandomProvider };
export { moveEnemyTowards, generatePatrolPath, getNextPatrolPoint };
export {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
};
export { updatePatrolEnemy, updateChargeEnemy, updateRangedEnemy, updateFleeEnemy };

const enemyAiPolicyRegistry = buildDefaultEnemyAiPolicyRegistry({
  updatePatrolEnemy,
  updateChargeEnemy,
  updateRangedEnemy,
  updateFleeEnemy,
});

export const updateEnemyAI = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  const resolved = resolveKnockbackState(enemy, currentTime);
  return enemyAiPolicyRegistry.update({
    enemy: resolved,
    player,
    map,
    currentTime,
  });
};

export interface EnemyUpdateResult {
  enemies: Enemy[];
  contactDamage: number;
  contactEnemy?: Enemy;
  attackDamage: number;
  attackingEnemy?: Enemy;
}

const toPositionKey = (pos: Position): string => `${pos.x},${pos.y}`;

export const updateEnemies = (
  enemies: Enemy[],
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy[] => {
  return updateEnemiesWithContact(enemies, player, map, currentTime).enemies;
};

export const updateEnemiesWithContact = (
  enemies: Enemy[],
  player: Position,
  map: GameMap,
  currentTime: number
): EnemyUpdateResult => {
  const occupied = new Set<string>();
  occupied.add(toPositionKey(player));
  for (const enemy of enemies) {
    occupied.add(toPositionKey(enemy));
  }

  const updatedEnemies: Enemy[] = [];
  let contactDamage = 0;
  let contactEnemy: Enemy | undefined;
  let attackDamage = 0;
  let attackingEnemy: Enemy | undefined;

  for (const enemy of enemies) {
    occupied.delete(toPositionKey(enemy));
    let candidate = updateEnemyAI(enemy, player, map, currentTime);
    const moveInterval = 1000 / Math.max(1, enemy.speed);
    const canStep = currentTime - (enemy.lastMoveAt ?? 0) >= moveInterval;
    if (!canStep) {
      candidate = { ...candidate, x: enemy.x, y: enemy.y, lastMoveAt: enemy.lastMoveAt ?? 0 };
    } else {
      candidate = { ...candidate, lastMoveAt: currentTime };
    }
    const candidateKey = toPositionKey(candidate);
    const playerKey = toPositionKey(player);

    // 攻撃アニメーション状態解決
    candidate = resolveEnemyAttackState(candidate, currentTime);

    // 敵の攻撃判定（射程内でクールダウンが終わっている場合）
    if (canEnemyAttack(candidate, player, currentTime)) {
      if (candidate.damage > attackDamage) {
        attackDamage = candidate.damage;
        attackingEnemy = candidate;
      }
      candidate = setEnemyAttackCooldown(candidate, currentTime);
      candidate = markEnemyAttacking(candidate, currentTime);
    }

    // 接触判定
    if (candidateKey === playerKey) {
      if (enemy.damage >= contactDamage) {
        contactDamage = enemy.damage;
        contactEnemy = enemy;
      }
      candidate = markEnemyAttacking(candidate, currentTime);
      updatedEnemies.push({ ...candidate, x: enemy.x, y: enemy.y });
      occupied.add(toPositionKey(enemy));
      continue;
    }

    // 他の敵との衝突判定
    if (occupied.has(candidateKey)) {
      updatedEnemies.push({ ...candidate, x: enemy.x, y: enemy.y });
      occupied.add(toPositionKey(enemy));
      continue;
    }

    updatedEnemies.push(candidate);
    occupied.add(candidateKey);
  }

  return { enemies: updatedEnemies, contactDamage, contactEnemy, attackDamage, attackingEnemy };
};
