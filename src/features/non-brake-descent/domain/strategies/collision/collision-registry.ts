import { ObstacleType } from '../../../constants';
import { ObstacleTypeValue } from '../../../types';
import { CollisionHandler } from './collision-handler';
import { holeSmallHandler, holeLargeHandler } from './hole-handler';
import { rockHandler } from './rock-handler';
import { enemyHandler } from './enemy-handler';
import { scoreItemHandler, reverseItemHandler, forceJumpItemHandler } from './item-handler';

/** 障害物タイプからハンドラへのマッピング */
const handlerMap: Partial<Record<ObstacleTypeValue, CollisionHandler>> = {
  [ObstacleType.HOLE_S]: holeSmallHandler,
  [ObstacleType.HOLE_L]: holeLargeHandler,
  [ObstacleType.ROCK]: rockHandler,
  [ObstacleType.ENEMY]: enemyHandler,
  [ObstacleType.ENEMY_V]: enemyHandler,
  [ObstacleType.SCORE]: scoreItemHandler,
  [ObstacleType.REVERSE]: reverseItemHandler,
  [ObstacleType.FORCE_JUMP]: forceJumpItemHandler,
};

/** 衝突ハンドラのレジストリ */
export const CollisionRegistry = {
  /** 障害物タイプに対応するハンドラを取得する */
  getHandler: (obstacleType: ObstacleTypeValue): CollisionHandler | undefined =>
    handlerMap[obstacleType],

  /** 登録されている全ハンドラのタイプ一覧を取得する */
  getRegisteredTypes: (): ObstacleTypeValue[] =>
    Object.keys(handlerMap) as ObstacleTypeValue[],
} as const;
