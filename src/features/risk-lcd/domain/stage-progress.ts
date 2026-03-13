import type { RuntimeStageConfig, StageConfig, ModDef } from '../types';
import { STG } from '../constants/game-config';

/**
 * ステージクリア判定
 *
 * 事後条件: cycle >= stageConfig.cy のとき true
 */
export function isStageCleared(cycle: number, stageConfig: RuntimeStageConfig): boolean {
  return cycle >= stageConfig.cy;
}

/** createStageConfig のパラメータ */
export interface CreateStageConfigParams {
  /** ステージ番号（0-indexed） */
  stageIndex: number;
  /** ステージ定義配列（省略時はデフォルトの STG を使用） */
  stages?: readonly StageConfig[];
  /** モディファイア（あれば適用） */
  modifier?: ModDef;
}

/**
 * ステージ設定を生成する
 *
 * ステージ定義をコピーし、モディファイアがあれば適用する
 */
export function createStageConfig(params: CreateStageConfigParams): RuntimeStageConfig {
  const { stageIndex, stages = STG, modifier } = params;

  const baseIndex = Math.min(stageIndex, stages.length - 1);
  const cfg: RuntimeStageConfig = { ...stages[baseIndex] };

  if (modifier) {
    modifier.fn(cfg);
  }

  return cfg;
}
