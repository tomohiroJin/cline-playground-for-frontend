/**
 * 敵 AI Strategy パターン
 * 敵タイプごとの振る舞いを分離する
 */
import type { Enemy } from '../../types';
import type { GameEvent } from '../../application/game-events';
import { createSoundEvent } from '../../application/game-events';
import { distance, normAngle } from '../../utils';
import { MazeService } from '../../maze-service';
import { bfsPath } from './pathfinding';
import { GAME_BALANCE } from '../constants';

const {
  PATH_RECALC_INTERVAL,
  TELEPORT_COOLDOWN,
  TELEPORT_CHASE_RANGE,
  CHASE_RANGE,
  CLOSE_RANGE_THRESHOLD,
  CLOSE_RANGE_SPEED_MULTIPLIER,
  WANDERER_SPEED_MULTIPLIER,
  TELEPORTER_CHASE_SPEED_MULTIPLIER,
  TELEPORTER_PATROL_SPEED_MULTIPLIER,
  TELEPORT_MIN_DISTANCE,
  TELEPORT_MAX_DISTANCE,
  PATH_NODE_REACH_DISTANCE,
} = GAME_BALANCE.enemy;

/** 敵AI更新のパラメータ */
export interface EnemyUpdateParams {
  readonly enemy: Enemy;
  readonly playerX: number;
  readonly playerY: number;
  readonly isPlayerHiding: boolean;
  readonly maze: number[][];
  readonly enemySpeed: number;
  readonly dt: number;
  readonly gameTime: number;
  readonly randomFn: () => number;
}

/** 敵AI更新の結果 */
export interface EnemyUpdateResult {
  readonly events: readonly GameEvent[];
}

/** 敵 AI Strategy インターフェース */
export interface EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult;
}

/** 徘徊型AI: ランダムに巡回、プレイヤーを追跡しない */
export class WandererStrategy implements EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, maze, enemySpeed, dt, randomFn } = params;

    e.dir += (randomFn() - 0.5) * 0.04;
    if (randomFn() < 0.002) {
      e.dir += Math.PI * (0.5 + randomFn() * 0.5);
    }

    const nx = e.x + Math.cos(e.dir) * enemySpeed * WANDERER_SPEED_MULTIPLIER * dt;
    const ny = e.y + Math.sin(e.dir) * enemySpeed * WANDERER_SPEED_MULTIPLIER * dt;
    if (MazeService.isWalkable(maze, nx, ny)) {
      e.x = nx;
      e.y = ny;
    } else {
      e.dir += Math.PI * 0.5 + randomFn() * 0.5;
    }

    return { events: [] };
  }
}

/** 追跡型AI: BFS パスファインディングで追跡 */
export class ChaserStrategy implements EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, isPlayerHiding, maze, enemySpeed, dt, gameTime, randomFn } = params;
    const d = distance(playerX, playerY, e.x, e.y);

    if (!isPlayerHiding && d < CHASE_RANGE) {
      e.lastSeenX = playerX;
      e.lastSeenY = playerY;

      if (gameTime - e.pathTime > PATH_RECALC_INTERVAL) {
        e.path = bfsPath(maze, e.x, e.y, playerX, playerY);
        e.pathTime = gameTime;
      }

      if (e.path.length > 0) {
        const next = e.path[0];
        const distToNext = distance(e.x, e.y, next.x, next.y);
        if (distToNext < PATH_NODE_REACH_DISTANCE) {
          e.path.shift();
        }
        if (e.path.length > 0) {
          const target = e.path[0];
          e.dir = Math.atan2(target.y - e.y, target.x - e.x);
        }
      } else {
        e.dir += normAngle(Math.atan2(playerY - e.y, playerX - e.x) - e.dir) * 0.045;
      }

      const speedMult = d < CLOSE_RANGE_THRESHOLD ? CLOSE_RANGE_SPEED_MULTIPLIER : 1;
      const nx = e.x + Math.cos(e.dir) * enemySpeed * speedMult * dt;
      const ny = e.y + Math.sin(e.dir) * enemySpeed * speedMult * dt;
      if (MazeService.isWalkable(maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + randomFn() * 0.5;
      }
    } else if (e.lastSeenX > 0 && distance(e.x, e.y, e.lastSeenX, e.lastSeenY) > 1) {
      e.dir += normAngle(Math.atan2(e.lastSeenY - e.y, e.lastSeenX - e.x) - e.dir) * 0.025;
      const nx = e.x + Math.cos(e.dir) * enemySpeed * dt;
      const ny = e.y + Math.sin(e.dir) * enemySpeed * dt;
      if (MazeService.isWalkable(maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + randomFn() * 0.5;
      }
    } else {
      e.dir += (randomFn() - 0.5) * 0.055;
      e.lastSeenX = -1;
      const nx = e.x + Math.cos(e.dir) * enemySpeed * 0.5 * dt;
      const ny = e.y + Math.sin(e.dir) * enemySpeed * 0.5 * dt;
      if (MazeService.isWalkable(maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + randomFn() * 0.5;
      }
    }

    return { events: [] };
  }
}

/** テレポート型AI: 一定間隔でテレポート、短距離追跡 */
export class TeleporterStrategy implements EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, isPlayerHiding, maze, enemySpeed, dt, randomFn } = params;
    const events: GameEvent[] = [];

    e.teleportCooldown -= dt;
    const d = distance(playerX, playerY, e.x, e.y);

    if (e.teleportCooldown <= 0 && !isPlayerHiding) {
      const emptyCells = MazeService.getEmptyCells(maze);
      const candidate = emptyCells.find(
        (c) =>
          distance(c.x + 0.5, c.y + 0.5, playerX, playerY) > TELEPORT_MIN_DISTANCE &&
          distance(c.x + 0.5, c.y + 0.5, playerX, playerY) < TELEPORT_MAX_DISTANCE
      );
      if (candidate) {
        e.x = candidate.x + 0.5;
        e.y = candidate.y + 0.5;
        e.teleportCooldown = TELEPORT_COOLDOWN;
        events.push(createSoundEvent('teleport', 0.3));
      }
    }

    if (!isPlayerHiding && d < TELEPORT_CHASE_RANGE) {
      e.dir = Math.atan2(playerY - e.y, playerX - e.x);
      const nx = e.x + Math.cos(e.dir) * enemySpeed * TELEPORTER_CHASE_SPEED_MULTIPLIER * dt;
      const ny = e.y + Math.sin(e.dir) * enemySpeed * TELEPORTER_CHASE_SPEED_MULTIPLIER * dt;
      if (MazeService.isWalkable(maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      }
    } else {
      e.dir += (randomFn() - 0.5) * 0.04;
      const nx = e.x + Math.cos(e.dir) * enemySpeed * TELEPORTER_PATROL_SPEED_MULTIPLIER * dt;
      const ny = e.y + Math.sin(e.dir) * enemySpeed * TELEPORTER_PATROL_SPEED_MULTIPLIER * dt;
      if (MazeService.isWalkable(maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + randomFn() * 0.5;
      }
    }

    return { events };
  }
}

/** 敵タイプに応じた Strategy を返すファクトリ */
const strategies: Record<string, EnemyStrategy> = {
  wanderer: new WandererStrategy(),
  chaser: new ChaserStrategy(),
  teleporter: new TeleporterStrategy(),
};

export const getEnemyStrategy = (type: string): EnemyStrategy => {
  return strategies[type] ?? strategies.wanderer;
};
