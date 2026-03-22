import { Config } from '../../../config';
import { ObstacleType, SpeedRank } from '../../../constants';
import { CollisionResultFactory } from '../../events/game-events';
import { CollisionHandler, CollisionContext } from './collision-handler';

/** 敵の衝突ハンドラ（速度ランク別に処理が変わる） */
export const enemyHandler: CollisionHandler = {
  handle(context: CollisionContext) {
    const { collision, speedRank, obstacleX, playerX, isGodMode } = context;
    if (!collision.hit) return CollisionResultFactory.noop();

    // HIGH ランク: 死亡
    if (speedRank === SpeedRank.HIGH) {
      if (isGodMode) return CollisionResultFactory.noop();
      return CollisionResultFactory.death('enemy');
    }

    // MID ランク: 敵を倒して減速
    if (speedRank === SpeedRank.MID) {
      return CollisionResultFactory.slowDown(
        [{ type: 'ENEMY_KILLED', position: { x: obstacleX, y: 0 } }],
        ObstacleType.DEAD
      );
    }

    // LOW ランク: バウンド（弾かれる）
    if (isGodMode) return CollisionResultFactory.noop();
    const bounceVelocity = playerX < obstacleX
      ? -Config.combat.bounceSpeed
      : Config.combat.bounceSpeed;
    return CollisionResultFactory.collect([
      { type: 'PLAYER_BOUNCED', velocity: bounceVelocity },
    ]);
  },
};
