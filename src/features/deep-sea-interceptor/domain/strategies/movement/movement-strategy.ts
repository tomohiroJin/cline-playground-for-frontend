// ============================================================================
// Deep Sea Interceptor - 移動戦略インターフェース
// ============================================================================

import type { Position } from '../../../types';

/** 移動戦略インターフェース */
export interface MovementStrategy<T extends Position> {
  /** エンティティを移動させ、新しいエンティティを返す */
  move(entity: T): T;
}
