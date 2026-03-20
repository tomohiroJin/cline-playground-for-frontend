// ゲームイベントバス（Observer パターン）

import type { DomainEvent } from '../domain/events';

type EventListener = (event: DomainEvent) => void;

export interface GameEventBus {
  /** イベントの購読（解除関数を返す） */
  subscribe(eventType: DomainEvent['type'], listener: EventListener): () => void;
  /** イベントの発行 */
  publish(event: DomainEvent): void;
}

/** イベントバスの生成 */
export const createEventBus = (): GameEventBus => {
  const listeners = new Map<DomainEvent['type'], Set<EventListener>>();

  return {
    subscribe(eventType, listener) {
      if (!listeners.has(eventType)) {
        listeners.set(eventType, new Set());
      }
      listeners.get(eventType)!.add(listener);

      // 解除関数
      return () => {
        listeners.get(eventType)?.delete(listener);
      };
    },

    publish(event) {
      const set = listeners.get(event.type);
      if (set) {
        set.forEach(listener => listener(event));
      }
    },
  };
};
