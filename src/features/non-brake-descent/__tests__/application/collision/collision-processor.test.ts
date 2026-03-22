/**
 * CollisionProcessor のテスト
 */
import { Config } from '../../../config';
import { ObstacleType, SpeedRank } from '../../../constants';
import { processCollisions } from '../../../application/collision/collision-processor';
import type { CollisionProcessorContext } from '../../../application/collision/collision-processor';
import { createInitialGameWorld } from '../../../application/game-loop/game-state';
import type { GameWorld } from '../../../application/game-loop/game-state';
import {
  buildPlayer,
  buildRamp,
  buildObstacle,
} from '../../helpers/test-factories';

/** テスト用コンテキストを生成する */
const buildContext = (
  overrides?: Partial<CollisionProcessorContext>
): CollisionProcessorContext => ({
  screenWidth: Config.screen.width,
  rampHeight: Config.ramp.height,
  speedRank: SpeedRank.LOW,
  isGodMode: false,
  passedObstacles: new Set(),
  ...overrides,
});

/** テスト用ワールドを生成する */
const buildWorld = (overrides?: Partial<GameWorld>): GameWorld => {
  const player = buildPlayer();
  const ramps = [buildRamp()];
  return {
    ...createInitialGameWorld(player, ramps),
    speed: Config.speed.min,
    ...overrides,
  };
};

describe('processCollisions', () => {
  it('障害物がないランプでは何も起こらない', () => {
    // Arrange
    const world = buildWorld({
      ramps: [buildRamp({ obs: [] })],
    });
    const ctx = buildContext();

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.dead).toBe(false);
    expect(result.events).toHaveLength(0);
  });

  it('プレイヤーが存在しないランプでは何も起こらない', () => {
    // Arrange
    const world = buildWorld({
      player: buildPlayer({ ramp: 99 }),
      ramps: [buildRamp()],
    });
    const ctx = buildContext();

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.dead).toBe(false);
    expect(result.events).toHaveLength(0);
  });

  it('岩に地上衝突した場合に dead を返す', () => {
    // Arrange: プレイヤーと岩を同じ位置に配置
    const obstaclePos = 0.5;
    const ox =
      40 + obstaclePos * (Config.screen.width - 80);
    const player = buildPlayer({ x: ox, jumping: false, y: 0 });
    const world = buildWorld({
      player,
      ramps: [buildRamp({ obs: [buildObstacle({ t: ObstacleType.ROCK, pos: obstaclePos })] })],
    });
    const ctx = buildContext();

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.dead).toBe(true);
    expect(result.events.some(e => e.type === 'PLAYER_DIED')).toBe(true);
  });

  it('スコアアイテムに衝突した場合にアイテムが TAKEN になる', () => {
    // Arrange
    const obstaclePos = 0.5;
    const ox = 40 + obstaclePos * (Config.screen.width - 80);
    const player = buildPlayer({ x: ox, jumping: false, y: 0 });
    const world = buildWorld({
      player,
      ramps: [
        buildRamp({
          obs: [buildObstacle({ t: ObstacleType.SCORE, pos: obstaclePos })],
        }),
      ],
    });
    const ctx = buildContext();

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.dead).toBe(false);
    expect(result.events.some(e => e.type === 'ITEM_COLLECTED')).toBe(true);
  });

  it('神モードで岩に衝突しても死亡しない', () => {
    // Arrange
    const obstaclePos = 0.5;
    const ox = 40 + obstaclePos * (Config.screen.width - 80);
    const player = buildPlayer({ x: ox, jumping: false, y: 0 });
    const world = buildWorld({
      player,
      ramps: [buildRamp({ obs: [buildObstacle({ t: ObstacleType.ROCK, pos: obstaclePos })] })],
    });
    const ctx = buildContext({ isGodMode: true });

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.dead).toBe(false);
  });

  it('ニアミス判定でスコアが加算される', () => {
    // Arrange: ニアミス距離にプレイヤーを配置（近いが衝突しない）
    const obstaclePos = 0.5;
    const ox = 40 + obstaclePos * (Config.screen.width - 80);
    const nearMissDistance = Config.collision.groundThreshold + 5;
    const player = buildPlayer({
      x: ox + nearMissDistance,
      jumping: false,
      y: 0,
    });
    const world = buildWorld({
      player,
      ramps: [
        buildRamp({
          obs: [buildObstacle({ t: ObstacleType.ROCK, pos: obstaclePos })],
        }),
      ],
    });
    const ctx = buildContext();

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.dead).toBe(false);
    expect(result.newPassedObstacles.length).toBeGreaterThan(0);
    expect(result.world.score).toBe(world.score + Config.score.nearMiss);
    expect(result.world.nearMissCount).toBe(world.nearMissCount + 1);
  });

  it('既にニアミス済みの障害物では再カウントされない', () => {
    // Arrange
    const obstaclePos = 0.5;
    const ox = 40 + obstaclePos * (Config.screen.width - 80);
    const nearMissDistance = Config.collision.groundThreshold + 5;
    const player = buildPlayer({
      x: ox + nearMissDistance,
      jumping: false,
      y: 0,
    });
    const world = buildWorld({
      player,
      ramps: [
        buildRamp({
          obs: [buildObstacle({ t: ObstacleType.ROCK, pos: obstaclePos })],
        }),
      ],
    });
    const obsId = `0-${obstaclePos}`;
    const ctx = buildContext({
      passedObstacles: new Set([obsId]),
    });

    // Act
    const result = processCollisions(world, ctx);

    // Assert
    expect(result.newPassedObstacles).toHaveLength(0);
    expect(result.world.score).toBe(world.score);
  });
});
