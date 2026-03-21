// ============================================================================
// Deep Sea Interceptor - フレーム処理のオーケストレーション
// ============================================================================

// 既存の updateFrame を re-export（将来的にイミュータブル化する際のエントリポイント）
export { updateFrame, createInitialGameState, createInitialUiState } from '../../game-logic';
export type { FrameResult } from '../../game-logic';
