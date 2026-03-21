// ============================================================================
// Deep Sea Interceptor - ギミック戦略インターフェース
// ============================================================================

import type { GameState } from '../../../types';

/** ギミック戦略インターフェース */
export interface GimmickStrategy {
  /** ギミックをゲーム状態に適用 */
  apply(state: GameState, now: number, stage: number): void;
}
