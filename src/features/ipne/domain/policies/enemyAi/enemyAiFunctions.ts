/**
 * 敵AIロジック（barrel）
 *
 * 実装は責務別ファイルへ分割済み。本ファイルは後方互換のための re-export のみを行う。
 * 公開 API（エクスポート名・シグネチャ）は分割前と完全一致を維持する。
 * 設計: docs/superpowers/specs/2026-06-14-ipne-enemyai-refactoring-design.md
 */
// 乱数プロバイダ DI
export { setRandomProvider, resetRandomProvider } from './aiRandom';
// 幾何計算・検知判定（純粋関数）
export {
  AI_CONFIG,
  detectPlayer,
  shouldChase,
  shouldStopChase,
  calculateFleeDirection,
  getDirectPathToPlayer,
} from './aiGeometry';
// 移動エンジン
export {
  moveEnemyTowards,
  generatePatrolPath,
  getNextPatrolPoint,
} from './enemyMovement';
// 攻撃・アニメーション状態
export {
  canEnemyAttack,
  setEnemyAttackCooldown,
  ENEMY_ATTACK_ANIM_DURATION,
  markEnemyAttacking,
  resolveEnemyAttackState,
} from './attackState';
// 敵タイプ別 AI（Strategy）
export { updatePatrolEnemy } from './behaviors/patrolBehavior';
export { updateChargeEnemy } from './behaviors/chargeBehavior';
export { updateRangedEnemy } from './behaviors/rangedBehavior';
export { updateFleeEnemy } from './behaviors/fleeBehavior';
// 一括更新オーケストレーション
export { updateEnemyAI, updateEnemies, updateEnemiesWithContact } from './enemyOrchestrator';
export type { EnemyUpdateResult } from './enemyOrchestrator';
