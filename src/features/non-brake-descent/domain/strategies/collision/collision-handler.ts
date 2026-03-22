import { CollisionCheckResult, Obstacle, SpeedRankValue } from '../../../types';
import { CollisionResult } from '../../events/game-events';

/** 衝突処理に必要なコンテキスト情報 */
export interface CollisionContext {
  /** 衝突判定の結果 */
  readonly collision: CollisionCheckResult;
  /** 対象の障害物 */
  readonly obstacle: Obstacle;
  /** 障害物のX座標 */
  readonly obstacleX: number;
  /** プレイヤーのX座標 */
  readonly playerX: number;
  /** 現在の速度ランク */
  readonly speedRank: SpeedRankValue;
  /** 神モード（デバッグ用）が有効かどうか */
  readonly isGodMode: boolean;
}

/** 衝突ハンドラのインターフェース */
export interface CollisionHandler {
  /** 衝突処理を実行し、結果を返す */
  handle(context: CollisionContext): CollisionResult;
}
