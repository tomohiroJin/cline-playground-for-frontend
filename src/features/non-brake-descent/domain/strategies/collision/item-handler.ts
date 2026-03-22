import { ObstacleType } from '../../../constants';
import { CollisionResultFactory } from '../../events/game-events';
import { CollisionHandler, CollisionContext } from './collision-handler';

/** スコアアイテムの衝突ハンドラ */
export const scoreItemHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision, obstacleX } = context;
    if (collision.hit) {
      return CollisionResultFactory.collect(
        [{ type: 'ITEM_COLLECTED', itemType: 'score', position: { x: obstacleX, y: 0 } }],
        ObstacleType.TAKEN
      );
    }
    return CollisionResultFactory.noop();
  },
};

/** リバースアイテムの衝突ハンドラ */
export const reverseItemHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision } = context;
    if (collision.hit) {
      return CollisionResultFactory.collect(
        [{ type: 'ITEM_COLLECTED', itemType: 'reverse', position: { x: context.obstacleX, y: 0 } }],
        ObstacleType.TAKEN
      );
    }
    return CollisionResultFactory.noop();
  },
};

/** 強制ジャンプアイテムの衝突ハンドラ */
export const forceJumpItemHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision } = context;
    if (collision.hit) {
      return CollisionResultFactory.collect(
        [{ type: 'ITEM_COLLECTED', itemType: 'forceJ', position: { x: context.obstacleX, y: 0 } }],
        ObstacleType.TAKEN
      );
    }
    return CollisionResultFactory.noop();
  },
};
