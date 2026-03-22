import { SpeedRank } from '../../../constants';
import { CollisionResultFactory } from '../../events/game-events';
import { CollisionHandler, CollisionContext } from './collision-handler';

/** 小さい穴の衝突ハンドラ（LOW ランクのみ落下） */
export const holeSmallHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision, speedRank, isGodMode } = context;
    if (collision.ground && speedRank === SpeedRank.LOW) {
      if (isGodMode) return CollisionResultFactory.noop();
      return CollisionResultFactory.death('fall');
    }
    return CollisionResultFactory.noop();
  },
};

/** 大きい穴の衝突ハンドラ（地上にいれば必ず落下） */
export const holeLargeHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision, isGodMode } = context;
    if (collision.ground) {
      if (isGodMode) return CollisionResultFactory.noop();
      return CollisionResultFactory.death('fall');
    }
    return CollisionResultFactory.noop();
  },
};
