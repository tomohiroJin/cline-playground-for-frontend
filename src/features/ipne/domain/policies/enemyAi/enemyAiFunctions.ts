/**
 * 敵AIロジック
 *
 * 各敵タイプ別のAI更新関数と、敵の一括更新を行うオーケストレーション関数を提供する。
 * Policy パターンによりタイプ別のAI更新が統一的に管理される。
 */
import { Enemy, EnemyState, EnemyType, GameMap, Position } from '../../types';
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
  moveEnemyRandom,
  attemptLunge,
  generatePatrolPath,
  getNextPatrolPoint,
} from './enemyMovement';

// 公開 API（barrel）として再公開
export { AI_CONFIG, detectPlayer, shouldChase, shouldStopChase, calculateFleeDirection, getDirectPathToPlayer };
export { setRandomProvider, resetRandomProvider };
export { moveEnemyTowards, generatePatrolPath, getNextPatrolPoint };

/** 敵が攻撃可能かどうか */
export const canEnemyAttack = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  if (enemy.attackRange <= 0) return false;
  if (currentTime < enemy.attackCooldownUntil) return false;
  const distance = getManhattanDistance(enemy, player);
  return distance <= enemy.attackRange;
};

/** 敵の攻撃クールダウンを設定 */
export const setEnemyAttackCooldown = (enemy: Enemy, currentTime: number): Enemy => {
  const cooldown = enemy.type === EnemyType.BOSS ? GAME_BALANCE.enemyAi.bossAttackCooldownMs : AI_CONFIG.attackCooldown;
  return { ...enemy, attackCooldownUntil: currentTime + cooldown };
};

export const updatePatrolEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  const playerDetected = detectPlayer(enemy, player);

  // プレイヤー発見時：追跡開始
  if (playerDetected) {
    const updated = {
      ...enemy,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
    // 追跡中にまれに突進
    const lunge = attemptLunge(updated, player, map, 2, 0.1);
    return lunge ?? moveEnemyTowards(updated, player, map);
  }

  // 追跡中断判定
  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.RETURN };
  }

  // 追跡中：プレイヤーに向かって移動
  if (enemy.state === EnemyState.CHASE) {
    const lunge = attemptLunge(enemy, player, map, 2, 0.1);
    const updated = lunge ?? moveEnemyTowards(enemy, player, map);
    return { ...updated, lastKnownPlayerPos: player, lastSeenAt: currentTime };
  }

  // 帰還中：ホームポジションに向かって移動
  if (enemy.state === EnemyState.RETURN) {
    if (enemy.x === enemy.homePosition.x && enemy.y === enemy.homePosition.y) {
      return { ...enemy, state: EnemyState.PATROL };
    }
    return moveEnemyTowards(enemy, enemy.homePosition, map);
  }

  // 巡回中：パスがあればその経路、なければランダム移動
  if (enemy.patrolPath && enemy.patrolPath.length > 0) {
    const target = getNextPatrolPoint(enemy);
    if (target) {
      const moved = moveEnemyTowards(enemy, target, map);
      if (moved.x === target.x && moved.y === target.y) {
        const nextIndex = (enemy.patrolIndex ?? 0) + 1;
        return { ...moved, patrolIndex: nextIndex % enemy.patrolPath.length };
      }
      return moved;
    }
  }

  return moveEnemyRandom(enemy, map);
};

export const updateChargeEnemy = (
  enemy: Enemy,
  player: Position,
  map: GameMap,
  currentTime: number
): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;

  if (shouldChase(enemy, player)) {
    const moved = moveEnemyTowards(enemy, player, map);
    return {
      ...moved,
      state: EnemyState.CHASE,
      lastKnownPlayerPos: player,
      lastSeenAt: currentTime,
    };
  }

  if (enemy.state === EnemyState.CHASE && shouldStopChase(enemy, player, currentTime)) {
    return { ...enemy, state: EnemyState.IDLE };
  }

  if (enemy.state === EnemyState.CHASE) {
    if (enemy.type === EnemyType.BOSS) {
      const distance = getManhattanDistance(enemy, player);
      const lungeChance = distance <= 2 ? 0.55 : distance <= 4 ? 0.4 : 0.25;
      const lungeRange = distance <= 2 ? 3 : 4;
      const lunge = attemptLunge(enemy, player, map, lungeRange, lungeChance);
      return lunge ?? moveEnemyTowards(enemy, player, map);
    }
    const lunge = attemptLunge(enemy, player, map, 2, 0.2);
    return lunge ?? moveEnemyTowards(enemy, player, map);
  }

  return { ...enemy, state: EnemyState.IDLE };
};

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

const resolveKnockbackState = (enemy: Enemy, currentTime: number): Enemy => {
  if (enemy.state !== EnemyState.KNOCKBACK) return enemy;
  if (enemy.knockbackUntil === undefined) return { ...enemy, state: EnemyState.IDLE };
  if (currentTime < enemy.knockbackUntil) return enemy;
  return { ...enemy, state: EnemyState.IDLE, knockbackDirection: undefined, knockbackUntil: undefined };
};

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

/** 敵攻撃アニメーションの持続時間（ms） */
export const ENEMY_ATTACK_ANIM_DURATION = GAME_BALANCE.enemyAi.attackAnimDurationMs;

/**
 * 敵を攻撃状態にマークする
 * knockback 状態の敵には適用しない
 */
export const markEnemyAttacking = (enemy: Enemy, now: number): Enemy => {
  if (enemy.state === EnemyState.KNOCKBACK) return enemy;
  return {
    ...enemy,
    state: EnemyState.ATTACK,
    attackAnimUntil: now + ENEMY_ATTACK_ANIM_DURATION,
  };
};

/**
 * 敵の攻撃アニメーション状態を解決する
 * 持続時間経過後に IDLE 状態に戻す
 */
export const resolveEnemyAttackState = (enemy: Enemy, now: number): Enemy => {
  if (enemy.state !== EnemyState.ATTACK) return enemy;
  if (enemy.attackAnimUntil === undefined) return { ...enemy, state: EnemyState.IDLE };
  if (now < enemy.attackAnimUntil) return enemy;
  return { ...enemy, state: EnemyState.IDLE, attackAnimUntil: undefined };
};

