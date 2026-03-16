/**
 * 敵攻撃アニメーション持続時間テスト（Phase 3-2b）
 *
 * - 敵が攻撃/接触した際に ATTACK 状態に遷移する
 * - 攻撃アニメーションの持続時間を確保する
 * - 持続時間経過後に元の状態に戻る
 */

import { EnemyState, EnemyType } from '../types';
import { createTestEnemy } from './testUtils';
import {
  markEnemyAttacking,
  resolveEnemyAttackState,
  ENEMY_ATTACK_ANIM_DURATION,
} from '../domain/policies/enemyAi/enemyAiFunctions';

describe('敵攻撃アニメーション持続時間（Phase 3-2b）', () => {
  describe('markEnemyAttacking', () => {
    it('敵を ATTACK 状態にマークし、attackAnimUntil を設定する', () => {
      // Arrange
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 3);
      const now = 1000;

      // Act
      const result = markEnemyAttacking(enemy, now);

      // Assert
      expect(result.state).toBe(EnemyState.ATTACK);
      expect(result.attackAnimUntil).toBe(now + ENEMY_ATTACK_ANIM_DURATION);
    });

    it('knockback 状態の敵には適用しない', () => {
      // Arrange
      const enemy = { ...createTestEnemy(EnemyType.CHARGE, 3, 3), state: EnemyState.KNOCKBACK };
      const now = 1000;

      // Act
      const result = markEnemyAttacking(enemy, now);

      // Assert
      expect(result.state).toBe(EnemyState.KNOCKBACK);
    });
  });

  describe('resolveEnemyAttackState', () => {
    it('attackAnimUntil が経過前なら ATTACK 状態を維持する', () => {
      // Arrange
      const enemy = {
        ...createTestEnemy(EnemyType.PATROL, 3, 3),
        state: EnemyState.ATTACK,
        attackAnimUntil: 1500,
      };

      // Act
      const result = resolveEnemyAttackState(enemy, 1200);

      // Assert
      expect(result.state).toBe(EnemyState.ATTACK);
    });

    it('attackAnimUntil が経過後なら IDLE 状態に戻る', () => {
      // Arrange
      const enemy = {
        ...createTestEnemy(EnemyType.PATROL, 3, 3),
        state: EnemyState.ATTACK,
        attackAnimUntil: 1500,
      };

      // Act
      const result = resolveEnemyAttackState(enemy, 1600);

      // Assert
      expect(result.state).toBe(EnemyState.IDLE);
      expect(result.attackAnimUntil).toBeUndefined();
    });

    it('ATTACK 状態でない敵はそのまま返す', () => {
      // Arrange
      const enemy = createTestEnemy(EnemyType.PATROL, 3, 3);

      // Act
      const result = resolveEnemyAttackState(enemy, 1000);

      // Assert
      expect(result).toEqual(enemy);
    });
  });

  describe('ENEMY_ATTACK_ANIM_DURATION', () => {
    it('300ms である', () => {
      expect(ENEMY_ATTACK_ANIM_DURATION).toBe(300);
    });
  });
});
