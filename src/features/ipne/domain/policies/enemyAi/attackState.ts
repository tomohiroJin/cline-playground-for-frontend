/**
 * 敵の攻撃可否・攻撃/ノックバックアニメーション状態の解決
 */
import { Enemy, EnemyState, EnemyType, Position } from '../../types';
import { GAME_BALANCE } from '../../config/gameBalance';
import { AI_CONFIG, getManhattanDistance } from './aiGeometry';

/** 敵攻撃アニメーションの持続時間（ms） */
export const ENEMY_ATTACK_ANIM_DURATION = GAME_BALANCE.enemyAi.attackAnimDurationMs;

/** 敵が攻撃可能かどうか */
export const canEnemyAttack = (enemy: Enemy, player: Position, currentTime: number): boolean => {
  // 死亡済み・死亡アニメーション中の敵は攻撃できない。
  // 敵は死亡演出のため最大 DEATH_ANIMATION_DURATION の間ゲーム状態に残るが、
  // その間に攻撃を成立させない（撃破直後の「最後っ屁攻撃」を防止する不変条件）。
  if (enemy.hp <= 0 || enemy.isDying) return false;
  if (enemy.attackRange <= 0) return false;
  if (currentTime < enemy.attackCooldownUntil) return false;
  return getManhattanDistance(enemy, player) <= enemy.attackRange;
};

/** 敵の攻撃クールダウンを設定 */
export const setEnemyAttackCooldown = (enemy: Enemy, currentTime: number): Enemy => {
  const cooldown =
    enemy.type === EnemyType.BOSS
      ? GAME_BALANCE.enemyAi.bossAttackCooldownMs
      : AI_CONFIG.attackCooldown;
  return { ...enemy, attackCooldownUntil: currentTime + cooldown };
};

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

/** ノックバック状態を解決する（持続時間経過後に IDLE へ） */
export const resolveKnockbackState = (enemy: Enemy, currentTime: number): Enemy => {
  if (enemy.state !== EnemyState.KNOCKBACK) return enemy;
  if (enemy.knockbackUntil === undefined) return { ...enemy, state: EnemyState.IDLE };
  if (currentTime < enemy.knockbackUntil) return enemy;
  return { ...enemy, state: EnemyState.IDLE, knockbackDirection: undefined, knockbackUntil: undefined };
};
