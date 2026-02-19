// ============================================================================
// Deep Sea Interceptor - テストヘルパー
// ============================================================================

import { createInitialGameState, createInitialUiState } from './game-logic';
import type { GameState, UiState } from './types';

/** テスト用 GameState ファクトリ */
export function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialGameState(), ...overrides };
}

/** テスト用 UiState ファクトリ */
export function buildUiState(overrides: Partial<UiState> = {}): UiState {
  return { ...createInitialUiState(), ...overrides };
}
