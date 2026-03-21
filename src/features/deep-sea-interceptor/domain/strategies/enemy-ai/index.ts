// ============================================================================
// Deep Sea Interceptor - 敵AI戦略 re-export
// ============================================================================

export type { AttackPattern } from './attack-pattern';
// 既存の EnemyAI はそのまま利用（enemy-ai.ts から提供）
export { EnemyAI, BossPatterns, MidbossPatterns } from '../../../enemy-ai';
