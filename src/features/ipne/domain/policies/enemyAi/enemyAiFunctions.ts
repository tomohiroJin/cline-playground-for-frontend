/**
 * 敵AIロジック（公開 API barrel）
 *
 * 各サブモジュールから公開シンボルを re-export する。
 * 外部からはこのファイル経由でのみアクセスする。
 */
import { AI_CONFIG, detectPlayer, shouldChase, shouldStopChase, calculateFleeDirection, getDirectPathToPlayer } from './aiGeometry';
import { setRandomProvider, resetRandomProvider } from './aiRandom';
import { moveEnemyTowards, generatePatrolPath, getNextPatrolPoint } from './enemyMovement';
import {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
} from './attackState';
import { updatePatrolEnemy } from './behaviors/patrolBehavior';
import { updateChargeEnemy } from './behaviors/chargeBehavior';
import { updateRangedEnemy } from './behaviors/rangedBehavior';
import { updateFleeEnemy } from './behaviors/fleeBehavior';
import { updateEnemyAI, updateEnemies, updateEnemiesWithContact } from './enemyOrchestrator';
import type { EnemyUpdateResult } from './enemyOrchestrator';

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
export { updateEnemyAI, updateEnemies, updateEnemiesWithContact };
export type { EnemyUpdateResult };
