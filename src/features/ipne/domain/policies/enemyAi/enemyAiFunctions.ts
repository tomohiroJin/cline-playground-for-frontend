/**
 * 敵AIロジック
 *
 * 各敵タイプ別のAI更新関数と、敵の一括更新を行うオーケストレーション関数を提供する。
 * Policy パターンによりタイプ別のAI更新が統一的に管理される。
 */
import { Enemy, EnemyState, GameMap, Position } from '../../types';
import { buildDefaultEnemyAiPolicyRegistry } from './policies';
import { GAME_BALANCE } from '../../config/gameBalance';
import {
  AI_CONFIG,
  getManhattanDistance,
  detectPlayer,
  shouldChase,
  shouldStopChase,
  calculateFleeDirection,
  getDirectPathToPlayer,
} from './aiGeometry';
import { setRandomProvider, resetRandomProvider } from './aiRandom';
import {
  moveEnemyTowards,
  moveEnemyAway,
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
export { updatePatrolEnemy, updateChargeEnemy };

export const updateFleeEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  if (detectPlayer(enemy, player)) {
    const moved = moveEnemyAway(enemy, player, map);
    return {
      ...moved,
      state: EnemyState.FLEE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  if (enemy.state === EnemyState.FLEE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.IDLE };
  }

  return { ...enemy, state: EnemyState.IDLE };
};

/** RANGED敵が維持したい距離 */
const RANGED_PREFERRED_DISTANCE = GAME_BALANCE.enemyAi.rangedPreferredDistance;

/**
 * RANGED敵のAI更新
 * - プレイヤーを検知したら追跡状態になる
 * - 攻撃射程内で適切な距離を保つ
 * - 近すぎたら後退、遠すぎたら接近
 */
export const updateRangedEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  const playerDetected = detectPlayer(enemy, player);

  // プレイヤー発見時：追跡開始
  if (playerDetected) {
    const distance = getManhattanDistance(enemy, player);

    // 距離が近すぎる場合は後退
    if (distance < RANGED_PREFERRED_DISTANCE) {
      const moved = moveEnemyAway(enemy, player, map);
      return {
        ...moved,
        state: EnemyState.CHASE,
        lastKnownPlayerPos: player,
        lastSeenAt: currentTime,
      };
    }

    // 攻撃射程外の場合は接近
    if (distance > enemy.attackRange) {
      const moved = moveEnemyTowards(enemy, player, map);
      return {
        ...moved,
        state: EnemyState.CHASE,
        lastKnownPlayerPos: player,
        lastSeenAt: currentTime,
      };
    }

    // 適切な距離内：その場で待機（攻撃待ち）
    return {
      ...enemy,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  // 追跡中断判定
  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.RETURN };
  }

  // 追跡中：最後に見た位置へ
  if (enemy.state === EnemyState.CHASE && enemy.lastKnownPlayerPos) {
    return moveEnemyTowards(enemy, enemy.lastKnownPlayerPos, map);
  }

  // 帰還中：ホームポジションへ
  if (enemy.state === EnemyState.RETURN) {
    if (enemy.x === enemy.homePosition.x && enemy.y === enemy.homePosition.y) {
      return { ...enemy, state: EnemyState.IDLE };
    }
    return moveEnemyTowards(enemy, enemy.homePosition, map);
  }

  return { ...enemy, state: EnemyState.IDLE };
};

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
