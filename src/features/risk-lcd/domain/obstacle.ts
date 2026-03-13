import type { RuntimeStageConfig } from '../types';
import { wPick } from './scoring';

/** RNG インターフェース（obstacle 用の最小定義） */
interface RngLike {
  random(): number;
  chance(p: number): boolean;
}

/** 障害物配置のパラメータ */
export interface PlaceObstaclesParams {
  /** 乱数生成器 */
  rng: RngLike;
  /** ステージ設定 */
  stageConfig: RuntimeStageConfig;
  /** 現在のステージ番号 */
  stage: number;
}

/** 各レーンの重み（L:28%, C:36%, R:36%） */
const LANE_WEIGHTS = [0.28, 0.36, 0.36];

/**
 * 障害物を配置する純粋関数
 *
 * 事前条件: stageConfig の si >= 1
 * 事後条件: 戻り値の各要素は 0-2 の範囲
 */
export function placeObstacles(params: PlaceObstaclesParams): number[] {
  const { rng, stageConfig: cfg, stage } = params;

  // 重み付き選択で第1障害を決定
  const first = wPick(LANE_WEIGHTS, [], rng.random.bind(rng));
  const obs = [first];

  // si >= 2 のとき確率で第2障害を追加
  if (
    cfg.si >= 2 &&
    rng.chance(0.2 + stage * 0.06 + (cfg._dblChance || 0))
  ) {
    const second = wPick(LANE_WEIGHTS, obs, rng.random.bind(rng));
    if (second >= 0) obs.push(second);
  }

  return obs;
}
