// ============================================================================
// Deep Sea Interceptor - ドメインイベント型定義
// ============================================================================

import type { EnemyType, ItemType } from '../../types';

/** ゲーム内で発生するドメインイベント（型安全なユニオン型） */
export type GameEvent =
  | { type: 'ENEMY_DESTROYED'; enemyType: EnemyType; score: number }
  | { type: 'BOSS_DEFEATED'; bossType: EnemyType }
  | { type: 'PLAYER_HIT'; livesRemaining: number }
  | { type: 'ITEM_COLLECTED'; itemType: ItemType }
  | { type: 'GRAZE'; count: number }
  | { type: 'STAGE_CLEARED'; stage: number; bonus: number }
  | { type: 'GAME_OVER'; finalScore: number }
  | { type: 'AUDIO'; soundName: string };

/** AudioEvent から GameEvent への変換ヘルパー */
export function audioEvent(soundName: string): GameEvent {
  return { type: 'AUDIO', soundName };
}
