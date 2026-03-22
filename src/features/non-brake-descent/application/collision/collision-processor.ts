/**
 * 衝突処理プロセッサ
 *
 * NonBrakeDescentGame.tsx の衝突ループ（行442〜498）を
 * 純粋関数として抽出する。
 * Phase 2 で作成した CollisionRegistry を使用してハンドラを呼び出す。
 */
import { Config } from '../../config';
import { createNearMissEffect } from '../../domain/entities';
import { GameEvent } from '../../domain/events/game-events';
import { CollisionDomain } from '../../domain/services/collision-service';
import { GeometryDomain } from '../../domain/services/geometry-service';
import { CollisionRegistry } from '../../domain/strategies/collision/collision-registry';
import type { Obstacle, Ramp, SpeedRankValue } from '../../types';
import type { GameWorld } from '../game-loop/game-state';

/** 衝突処理に必要なコンテキスト */
export interface CollisionProcessorContext {
  readonly screenWidth: number;
  readonly rampHeight: number;
  readonly speedRank: SpeedRankValue;
  readonly isGodMode: boolean;
  readonly passedObstacles: ReadonlySet<string>;
}

/** 衝突処理の結果 */
export interface CollisionProcessorResult {
  readonly world: GameWorld;
  readonly events: readonly GameEvent[];
  readonly dead: boolean;
  /** 新しくニアミスとして記録された障害物 ID の一覧 */
  readonly newPassedObstacles: readonly string[];
}

/**
 * 現在のランプ上の全障害物に対して衝突処理を実行する
 *
 * CollisionRegistry からハンドラを取得し、各障害物に対して衝突判定を行う。
 * 副作用は events 配列で返却する。
 */
export const processCollisions = (
  world: GameWorld,
  ctx: CollisionProcessorContext
): CollisionProcessorResult => {
  const events: GameEvent[] = [];
  const newPassedObstacles: string[] = [];
  const ramp = world.ramps[world.player.ramp] as Ramp | undefined;

  if (!ramp) {
    return { world, events, dead: false, newPassedObstacles };
  }

  let player = world.player;
  let speed = world.speed;
  let score = world.score;
  let nearMissCount = world.nearMissCount;
  // 障害物の変更を追跡するためにコピーする
  const updatedObs: Obstacle[] = ramp.obs.map(obs => ({ ...obs }));
  let isDead = false;

  for (let i = 0; i < updatedObs.length; i++) {
    const obstacle = updatedObs[i];
    if (!CollisionDomain.isActive(obstacle)) continue;

    const ox = GeometryDomain.getObstacleX(obstacle, ramp, ctx.screenWidth);
    const col = CollisionDomain.check(player.x, ox, player.jumping, player.y);
    const obsId = `${player.ramp}-${obstacle.pos}`;

    // ニアミス判定
    if (
      CollisionDomain.isDangerous(obstacle.t) &&
      col.nearMiss &&
      !ctx.passedObstacles.has(obsId)
    ) {
      newPassedObstacles.push(obsId);
      nearMissCount += 1;
      score += Config.score.nearMiss;
      events.push({ type: 'AUDIO', sound: 'nearMiss' });
      events.push({
        type: 'NEAR_MISS',
        position: {
          x: ox,
          y: player.ramp * ctx.rampHeight - world.camY + 25,
        },
      });
      events.push({
        type: 'SCORE_POPUP',
        x: ox,
        y: player.ramp * ctx.rampHeight - world.camY - 20,
        text: `NEAR MISS +${Config.score.nearMiss}`,
        color: '#44ffaa',
      });
    }

    // 衝突ハンドラの実行
    const handler = CollisionRegistry.getHandler(obstacle.t);
    if (handler) {
      const result = handler.handle({
        collision: col,
        obstacle,
        obstacleX: ox,
        playerX: player.x,
        speedRank: ctx.speedRank,
        isGodMode: ctx.isGodMode,
      });

      events.push(...result.events);

      if (result.obstacleUpdate) {
        updatedObs[i] = { ...updatedObs[i], t: result.obstacleUpdate };
      }

      if (result.dead) {
        isDead = true;
        break;
      }

      if (result.slowDown) {
        // 敵を倒した場合の減速処理
        player = {
          ...player,
          vx: -player.vx * Config.combat.bounceMultiplier,
        };
        speed = Math.max(Config.speed.min, speed - Config.combat.enemyKillSlowdown);
        score += Config.score.enemy;
        events.push({
          type: 'PARTICLE',
          x: ox,
          y: player.ramp * ctx.rampHeight - world.camY + 25,
          color: '#ff8800',
          count: 10,
        });
        events.push({
          type: 'SCORE_POPUP',
          x: ox,
          y: player.ramp * ctx.rampHeight - world.camY,
          text: `+${Config.score.enemy}`,
          color: '#ff8800',
        });
      }
    }
  }

  // ランプの障害物を更新した新しいランプ配列を構築する
  const updatedRamps = world.ramps.map((r, idx) =>
    idx === player.ramp ? { ...r, obs: updatedObs } : r
  );

  return {
    world: {
      ...world,
      player,
      speed,
      score,
      nearMissCount,
      ramps: updatedRamps,
    },
    events,
    dead: isDead,
    newPassedObstacles,
  };
};
