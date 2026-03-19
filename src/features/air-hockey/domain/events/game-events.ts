/**
 * ドメインイベント定義
 * - ゲーム内で発生する重要な出来事を表現
 * - Observer パターンで購読可能
 */
import type { ItemType, GamePhase } from '../../core/types';

export type GameEvent =
  | { type: 'GOAL_SCORED'; scorer: 'player' | 'cpu'; speed: number }
  | { type: 'COLLISION'; objectA: string; objectB: string; speed: number; x: number; y: number }
  | { type: 'WALL_BOUNCE'; x: number; y: number }
  | { type: 'ITEM_COLLECTED'; itemType: ItemType; collector: 'player' | 'cpu' }
  | { type: 'ITEM_SPAWNED'; itemType: ItemType; x: number; y: number }
  | { type: 'PHASE_CHANGED'; from: GamePhase; to: GamePhase }
  | { type: 'COMBO_INCREASED'; count: number }
  | { type: 'FEVER_ACTIVATED' }
  | { type: 'OBSTACLE_DESTROYED'; x: number; y: number }
  | { type: 'ACHIEVEMENT_UNLOCKED'; achievementId: string };

/** イベントディスパッチャーインターフェース */
export interface GameEventDispatcher {
  subscribe(handler: (event: GameEvent) => void): () => void;
  dispatch(event: GameEvent): void;
}

/** イベントディスパッチャーを生成する */
export function createEventDispatcher(): GameEventDispatcher {
  const handlers = new Set<(event: GameEvent) => void>();

  return {
    subscribe(handler: (event: GameEvent) => void): () => void {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },

    dispatch(event: GameEvent): void {
      for (const handler of handlers) {
        try {
          handler(event);
        } catch (error) {
          // ハンドラの例外が後続ハンドラの実行を妨げないようにする
          console.error('イベントハンドラでエラーが発生しました:', error);
        }
      }
    },
  };
}
