/**
 * 敵AIロジック
 */
import { Enemy, EnemyState, EnemyType, GameMap, Position } from './types';
import { canMove } from './collision';

const AI_CONFIG = {
  updateInterval: 200,
  chaseTimeout: 3000,
  attackCooldown: 1000,
} as const;

const getManhattanDistance = (a: Position, b: Position): number => {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};

/** 敵が攻撃可能かどうか */
export const canEnemyAttack = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  if (enemy.attackRange <= 0) return false;
  if (currentTime < enemy.attackCooldownUntil) return false;
  const distance = getManhattanDistance(enemy, player);
  return distance <= enemy.attackRange;
};

/** 敵の攻撃クールダウンを設定 */
export const setEnemyAttackCooldown = (enemy: Enemy, currentTime: number): Enemy => {
  const cooldown = enemy.type === EnemyType.BOSS ? 700 : AI_CONFIG.attackCooldown;
  return { ...enemy, attackCooldownUntil: currentTime + cooldown };
};

export const detectPlayer = (enemy: Enemy, player: Position): boolean => {
  const distance = getManhattanDistance(enemy, player);
  return distance <= enemy.detectionRange;
};

export const shouldChase = (enemy: Enemy, player: Position): boolean => {
  if (!detectPlayer(enemy, player)) return false;
  if (enemy.chaseRange === undefined) return true;
  return getManhattanDistance(enemy, player) <= enemy.chaseRange;
};

export const shouldStopChase = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  if (enemy.chaseRange !== undefined && getManhattanDistance(enemy, player) > enemy.chaseRange) {
    return true;
  }
  if (enemy.lastSeenAt !== undefined && currentTime - enemy.lastSeenAt > AI_CONFIG.chaseTimeout) {
    return true;
  }
  return false;
};

const stepTowards = (enemy: Enemy, target: Position, map: GameMap): Position => {
  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  const tryHorizontal = Math.abs(dx) >= Math.abs(dy);

  const candidates: Position[] = tryHorizontal
    ? [
        { x: enemy.x + stepX, y: enemy.y },
        { x: enemy.x, y: enemy.y + stepY },
      ]
    : [
        { x: enemy.x, y: enemy.y + stepY },
        { x: enemy.x + stepX, y: enemy.y },
      ];

  for (const pos of candidates) {
    if (canMove(map, pos.x, pos.y)) {
      return pos;
    }
  }

  return { x: enemy.x, y: enemy.y };
};

const stepAway = (enemy: Enemy, player: Position, map: GameMap): Position => {
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  const candidates: Position[] = [
    { x: enemy.x + stepX, y: enemy.y },
    { x: enemy.x, y: enemy.y + stepY },
    { x: enemy.x - stepX, y: enemy.y },
    { x: enemy.x, y: enemy.y - stepY },
  ];

  for (const pos of candidates) {
    if (canMove(map, pos.x, pos.y)) {
      return pos;
    }
  }

  return { x: enemy.x, y: enemy.y };
};

const attemptLunge = (
  enemy: Enemy,
  target: Position,
  map: GameMap,
  maxDistance: number,
  chance: number
): Enemy | null => {
  const distance = getManhattanDistance(enemy, target);
  if (distance > maxDistance) return null;
  if (Math.random() > chance) return null;

  const dx = target.x - enemy.x;
  const dy = target.y - enemy.y;
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  const preferHorizontal = Math.abs(dx) >= Math.abs(dy);

  const firstStep = preferHorizontal
    ? { x: enemy.x + stepX, y: enemy.y }
    : { x: enemy.x, y: enemy.y + stepY };
  const secondStep = preferHorizontal
    ? { x: enemy.x + stepX * 2, y: enemy.y }
    : { x: enemy.x, y: enemy.y + stepY * 2 };

  if (!canMove(map, firstStep.x, firstStep.y)) return null;
  if (!canMove(map, secondStep.x, secondStep.y)) return null;

  return { ...enemy, x: secondStep.x, y: secondStep.y };
};

/** ランダムな方向に移動 */
const stepRandom = (enemy: Enemy, map: GameMap): Position => {
  const directions = [
    { x: enemy.x + 1, y: enemy.y },
    { x: enemy.x - 1, y: enemy.y },
    { x: enemy.x, y: enemy.y + 1 },
    { x: enemy.x, y: enemy.y - 1 },
  ];

  // ランダムにシャッフル
  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [directions[i], directions[j]] = [directions[j], directions[i]];
  }

  for (const pos of directions) {
    if (canMove(map, pos.x, pos.y)) {
      return pos;
    }
  }

  return { x: enemy.x, y: enemy.y };
};

export const moveEnemyTowards = (enemy: Enemy, target: Position, map: GameMap): Enemy => {
  const next = stepTowards(enemy, target, map);
  return { ...enemy, x: next.x, y: next.y };
};

const moveEnemyAway = (enemy: Enemy, player: Position, map: GameMap): Enemy => {
  const next = stepAway(enemy, player, map);
  return { ...enemy, x: next.x, y: next.y };
};

const moveEnemyRandom = (enemy: Enemy, map: GameMap): Enemy => {
  const next = stepRandom(enemy, map);
  return { ...enemy, x: next.x, y: next.y };
};

export const generatePatrolPath = (origin: Position): Position[] => {
  const length = 4 + Math.floor(Math.random() * 5); // 4-8
  const horizontal = Math.random() > 0.5;
  const path: Position[] = [];

  for (let i = 0; i < length; i++) {
    path.push({
      x: origin.x + (horizontal ? i : 0),
      y: origin.y + (horizontal ? 0 : i),
    });
  }

  const back = [...path].reverse().slice(1);
  return [...path, ...back];
};

export const getNextPatrolPoint = (enemy: Enemy): Position | undefined => {
  if (!enemy.patrolPath || enemy.patrolPath.length === 0) return undefined;
  const index = enemy.patrolIndex ?? 0;
  return enemy.patrolPath[index];
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

export const getDirectPathToPlayer = (enemy: Enemy, player: Position): Position[] => {
  const path: Position[] = [];
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;

  let currentX = enemy.x;
  let currentY = enemy.y;

  while (currentX !== player.x) {
    currentX += stepX;
    path.push({ x: currentX, y: currentY });
  }

  while (currentY !== player.y) {
    currentY += stepY;
    path.push({ x: currentX, y: currentY });
  }

  return path;
};

export const calculateFleeDirection = (enemy: Enemy, player: Position): Position => {
  const dx = enemy.x - player.x;
  const dy = enemy.y - player.y;
  return {
    x: enemy.x + (dx === 0 ? 0 : dx > 0 ? 1 : -1),
    y: enemy.y + (dy === 0 ? 0 : dy > 0 ? 1 : -1),
  };
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

  switch (resolved.type) {
    case EnemyType.PATROL:
      return updatePatrolEnemy(resolved, player, map, currentTime);
    case EnemyType.CHARGE:
    case EnemyType.BOSS:
      return updateChargeEnemy(resolved, player, map, currentTime);
    case EnemyType.SPECIMEN:
      return updateFleeEnemy(resolved, player, map, currentTime);
    default:
      return resolved;
  }
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

    // 敵の攻撃判定（射程内でクールダウンが終わっている場合）
    if (canEnemyAttack(candidate, player, currentTime)) {
      if (candidate.damage > attackDamage) {
        attackDamage = candidate.damage;
        attackingEnemy = candidate;
      }
      candidate = setEnemyAttackCooldown(candidate, currentTime);
    }

    // 接触判定
    if (candidateKey === playerKey) {
      if (enemy.damage >= contactDamage) {
        contactDamage = enemy.damage;
        contactEnemy = enemy;
      }
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

export { AI_CONFIG };
