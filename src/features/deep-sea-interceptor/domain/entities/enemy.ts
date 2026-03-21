// ============================================================================
// Deep Sea Interceptor - Enemy エンティティ
// ============================================================================

import type { Enemy, EnemyType } from '../../types';

/** ボス判定（boss, boss1〜boss5） */
export const isBossType = (type: EnemyType): boolean =>
  type === 'boss' || (type.startsWith('boss') && !type.startsWith('midboss'));

/** ミッドボス判定（midboss1〜midboss5） */
export const isMidbossType = (type: EnemyType): boolean =>
  type.startsWith('midboss');

/** エンティティからのボス判定 */
export const isBoss = (e: { enemyType: EnemyType }): boolean =>
  isBossType(e.enemyType);

/** エンティティからのミッドボス判定 */
export const isMidboss = (e: { enemyType: EnemyType }): boolean =>
  isMidbossType(e.enemyType);

/** ダメージ適用（新しい Enemy を返す、イミュータブル） */
export function applyDamage(enemy: Enemy, damage: number): Enemy {
  if (damage < 0) {
    throw new Error(`damage は 0 以上でなければなりません: ${damage}`);
  }
  const newHp = Math.max(0, enemy.hp - damage);
  return { ...enemy, hp: newHp };
}
