/**
 * 同期イベントバス実装
 *
 * ゲームループ内で使用するため、非同期は使用しない。
 */
import type { GameEvent, GameEventType, EventHandler, GameEventBus } from './game-events';

/** イベントバスを生成する */
export function createEventBus(): GameEventBus {
  const handlers = new Map<GameEventType, Set<EventHandler>>();

  return {
    emit(event: GameEvent): void {
      const typeHandlers = handlers.get(event.type);
      if (typeHandlers) {
        typeHandlers.forEach(handler => handler(event));
      }
    },

    on(type: GameEventType, handler: EventHandler): () => void {
      if (!handlers.has(type)) {
        handlers.set(type, new Set());
      }
      handlers.get(type)!.add(handler);
      return () => handlers.get(type)?.delete(handler);
    },

    off(type: GameEventType, handler: EventHandler): void {
      handlers.get(type)?.delete(handler);
    },
  };
}
