// キャンペーンランタイム（非永続。セッション中のみ保持）

import type { Stage } from '../domain/race/stage';
import { INITIAL_LIVES } from '../domain/race/lives';

export type CampaignRuntime = {
  readonly stage: Stage;
  /** 残り時間（秒、float 可） */
  readonly timeRemainingSec: number;
  /** ステージ開始からの経過時間 */
  readonly elapsedSec: number;
  /** 通過済みチェックポイントの累計 */
  readonly checkpointsHit: number;
  /** 残機（セッション内のみ保持） */
  readonly livesRemaining: number;
};

/**
 * 新規ステージ突入時のランタイムを生成する。
 *
 * @param stage 突入するステージ
 * @param livesRemaining 引継ぐ残機（指定なし or undefined なら INITIAL_LIVES = 3）
 */
export const createCampaignRuntime = (
  stage: Stage,
  livesRemaining: number = INITIAL_LIVES,
): CampaignRuntime => ({
  stage,
  timeRemainingSec: stage.initialTimeSec,
  elapsedSec: 0,
  checkpointsHit: 0,
  livesRemaining,
});
