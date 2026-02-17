/**
 * 5ステージ分の設定データ
 */
import { StageConfig, StageNumber } from './types';

/** ステージ1: 第一層 */
const STAGE_1: StageConfig = {
  stage: 1,
  name: '第一層',
  maze: {
    width: 80,
    height: 80,
    minRoomSize: 6,
    maxRoomSize: 10,
    corridorWidth: 3,
    maxDepth: 6,
    loopCount: 2,
  },
  enemies: {
    patrol: 10,
    charge: 6,
    ranged: 5,
    specimen: 4,
    miniBoss: 0,
  },
  scaling: {
    hp: 1.0,
    damage: 1.0,
    speed: 1.0,
  },
  gimmicks: {
    trapCount: 10,
    trapRatio: { damage: 0.4, slow: 0.3, teleport: 0.3 },
    wallCount: 6,
    wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
  },
  maxLevel: 11,
  bossType: 'boss',
};

/** ステージ2: 第二層 */
const STAGE_2: StageConfig = {
  stage: 2,
  name: '第二層',
  maze: {
    width: 85,
    height: 85,
    minRoomSize: 6,
    maxRoomSize: 10,
    corridorWidth: 3,
    maxDepth: 6,
    loopCount: 2,
  },
  enemies: {
    patrol: 12,
    charge: 8,
    ranged: 6,
    specimen: 5,
    miniBoss: 0,
  },
  scaling: {
    hp: 1.3,
    damage: 1.2,
    speed: 1.1,
  },
  gimmicks: {
    trapCount: 12,
    trapRatio: { damage: 0.4, slow: 0.3, teleport: 0.3 },
    wallCount: 8,
    wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
  },
  maxLevel: 12,
  bossType: 'boss',
};

/** ステージ3: 第三層 */
const STAGE_3: StageConfig = {
  stage: 3,
  name: '第三層',
  maze: {
    width: 90,
    height: 90,
    minRoomSize: 6,
    maxRoomSize: 10,
    corridorWidth: 3,
    maxDepth: 7,
    loopCount: 3,
  },
  enemies: {
    patrol: 14,
    charge: 10,
    ranged: 8,
    specimen: 6,
    miniBoss: 2,
  },
  scaling: {
    hp: 1.6,
    damage: 1.4,
    speed: 1.15,
  },
  gimmicks: {
    trapCount: 15,
    trapRatio: { damage: 0.4, slow: 0.3, teleport: 0.3 },
    wallCount: 10,
    wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
  },
  maxLevel: 13,
  bossType: 'boss',
};

/** ステージ4: 第四層（壁の迷宮） */
const STAGE_4: StageConfig = {
  stage: 4,
  name: '第四層',
  maze: {
    width: 95,
    height: 95,
    minRoomSize: 6,
    maxRoomSize: 10,
    corridorWidth: 3,
    maxDepth: 7,
    loopCount: 3,
  },
  enemies: {
    patrol: 16,
    charge: 12,
    ranged: 10,
    specimen: 7,
    miniBoss: 2,
  },
  scaling: {
    hp: 2.0,
    damage: 1.7,
    speed: 1.2,
  },
  gimmicks: {
    trapCount: 18,
    trapRatio: { damage: 0.4, slow: 0.3, teleport: 0.3 },
    wallCount: 16,
    wallRatio: { breakable: 0.6, passable: 0.3, invisible: 0.1 },
  },
  maxLevel: 14,
  bossType: 'boss',
};

/** ステージ5: 最深部 */
const STAGE_5: StageConfig = {
  stage: 5,
  name: '最深部',
  maze: {
    width: 100,
    height: 100,
    minRoomSize: 6,
    maxRoomSize: 10,
    corridorWidth: 3,
    maxDepth: 7,
    loopCount: 4,
  },
  enemies: {
    patrol: 18,
    charge: 14,
    ranged: 12,
    specimen: 8,
    miniBoss: 3,
  },
  scaling: {
    hp: 2.5,
    damage: 2.0,
    speed: 1.25,
  },
  gimmicks: {
    trapCount: 22,
    trapRatio: { damage: 0.4, slow: 0.3, teleport: 0.3 },
    wallCount: 12,
    wallRatio: { breakable: 0.5, passable: 0.3, invisible: 0.2 },
  },
  maxLevel: 15,
  bossType: 'mega_boss',
};

/** 全ステージ設定 */
export const STAGE_CONFIGS: Record<StageNumber, StageConfig> = {
  1: STAGE_1,
  2: STAGE_2,
  3: STAGE_3,
  4: STAGE_4,
  5: STAGE_5,
};

/** ステージ数 */
export const TOTAL_STAGES = 5;

/**
 * ステージ設定を取得する
 * @param stage ステージ番号
 * @returns ステージ設定
 */
export const getStageConfig = (stage: StageNumber): StageConfig => {
  return STAGE_CONFIGS[stage];
};

/**
 * 次のステージ番号を取得する
 * @param current 現在のステージ番号
 * @returns 次のステージ番号（最終ステージの場合は undefined）
 */
export const getNextStage = (current: StageNumber): StageNumber | undefined => {
  if (current >= TOTAL_STAGES) return undefined;
  return (current + 1) as StageNumber;
};

/**
 * 最終ステージかどうかを判定する
 * @param stage ステージ番号
 * @returns 最終ステージの場合 true
 */
export const isFinalStage = (stage: StageNumber): boolean => {
  return stage === TOTAL_STAGES;
};
