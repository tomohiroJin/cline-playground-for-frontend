/**
 * 敵の一括更新オーケストレーション
 *
 * Policy registry を通じてタイプ別 AI を適用し、移動間隔・衝突・接触/攻撃ダメージを解決する。
 */
import { Enemy, GameMap, Position } from '../../types';
import { buildDefaultEnemyAiPolicyRegistry } from './policies';
import {
  canEnemyAttack,
  setEnemyAttackCooldown,
  markEnemyAttacking,
  resolveEnemyAttackState,
  resolveKnockbackState,
} from './attackState';
import { updatePatrolEnemy } from './behaviors/patrolBehavior';
import { updateChargeEnemy } from './behaviors/chargeBehavior';
import { updateRangedEnemy } from './behaviors/rangedBehavior';
import { updateFleeEnemy } from './behaviors/fleeBehavior';

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

    // 接触判定（死亡済み・死亡アニメーション中の敵は接触ダメージを与えない）
    if (candidateKey === playerKey) {
      if (candidate.hp > 0 && !candidate.isDying && enemy.damage >= contactDamage) {
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
