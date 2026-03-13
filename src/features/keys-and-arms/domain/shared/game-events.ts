/**
 * ゲームイベント型定義
 *
 * Observer パターンで使用するイベントの型。
 */

/** ゲームイベントの種別 */
export type GameEventType =
  | 'score:add'
  | 'player:hurt'
  | 'player:heal'
  | 'enemy:kill'
  | 'combo:increment'
  | 'combo:reset'
  | 'sweep:execute'
  | 'key:collect'
  | 'key:place'
  | 'gem:place'
  | 'shield:gain'
  | 'shield:break'
  | 'stage:clear'
  | 'stage:transition'
  | 'boss:rage'
  | 'boss:counter'
  | 'boss:defeat'
  | 'game:over'
  | 'game:complete';

/** ゲームイベント */
export interface GameEvent {
  readonly type: GameEventType;
  readonly payload?: Record<string, unknown>;
}

/** イベントハンドラー */
export type EventHandler = (event: GameEvent) => void;

/** イベントバス インターフェース */
export interface GameEventBus {
  emit(event: GameEvent): void;
  on(type: GameEventType, handler: EventHandler): () => void;
  off(type: GameEventType, handler: EventHandler): void;
}
