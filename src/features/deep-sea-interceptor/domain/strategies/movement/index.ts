// ============================================================================
// Deep Sea Interceptor - 移動戦略 re-export
// ============================================================================

export type { MovementStrategy } from './movement-strategy';
// 既存の MovementStrategies はそのまま利用（movement.ts から提供）
export { MovementStrategies } from '../../../movement';
