import { CollisionResultFactory } from '../../events/game-events';
import { CollisionHandler, CollisionContext } from './collision-handler';

/** 岩の衝突ハンドラ（当たれば必ず死亡） */
export const rockHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision, isGodMode } = context;
    if (collision.hit) {
      if (isGodMode) return CollisionResultFactory.noop();
      return CollisionResultFactory.death('rock');
    }
    return CollisionResultFactory.noop();
  },
};
