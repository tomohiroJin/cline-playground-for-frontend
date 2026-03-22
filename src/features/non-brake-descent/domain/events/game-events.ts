import { DeathType, ObstacleTypeValue } from '../../types';

/** イベント内で使用する位置情報 */
type Position = { readonly x: number; readonly y: number };

/** ゲーム内で発生するドメインイベントの一覧 */
export type GameEvent =
  | { readonly type: 'PLAYER_DIED'; readonly deathType: DeathType }
  | { readonly type: 'RAMP_CLEARED'; readonly rampIndex: number; readonly score: number; readonly combo: number }
  | { readonly type: 'ITEM_COLLECTED'; readonly itemType: 'score' | 'reverse' | 'forceJ'; readonly position: Position }
  | { readonly type: 'ENEMY_KILLED'; readonly position: Position }
  | { readonly type: 'NEAR_MISS'; readonly position: Position }
  | { readonly type: 'PLAYER_BOUNCED'; readonly velocity: number }
  | { readonly type: 'GOAL_REACHED' }
  | { readonly type: 'AUDIO'; readonly sound: string }
  | { readonly type: 'PARTICLE'; readonly x: number; readonly y: number; readonly color: string; readonly count: number }
  | { readonly type: 'SCORE_POPUP'; readonly x: number; readonly y: number; readonly text: string; readonly color: string };

/** 衝突処理の結果を表す型（boolean | 'slow' の代替） */
export interface CollisionResult {
  readonly dead: boolean;
  readonly slowDown: boolean;
  readonly events: readonly GameEvent[];
  readonly obstacleUpdate?: ObstacleTypeValue;
}

/** CollisionResult のファクトリ関数 */
export const CollisionResultFactory = {
  /** 何も起こらなかった場合 */
  noop: (): CollisionResult => ({
    dead: false,
    slowDown: false,
    events: [],
  }),

  /** プレイヤーが死亡した場合 */
  death: (deathType: DeathType): CollisionResult => ({
    dead: true,
    slowDown: false,
    events: [{ type: 'PLAYER_DIED', deathType }],
  }),

  /** 減速が発生した場合（敵を倒した時など） */
  slowDown: (events: readonly GameEvent[], obstacleUpdate?: ObstacleTypeValue): CollisionResult => ({
    dead: false,
    slowDown: true,
    events,
    obstacleUpdate,
  }),

  /** アイテム取得など、死亡も減速もしない場合 */
  collect: (events: readonly GameEvent[], obstacleUpdate?: ObstacleTypeValue): CollisionResult => ({
    dead: false,
    slowDown: false,
    events,
    obstacleUpdate,
  }),
} as const;
