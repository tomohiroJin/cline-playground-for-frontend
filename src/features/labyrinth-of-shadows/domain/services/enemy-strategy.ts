/**
 * 敵 AI Strategy パターン
 * 敵タイプごとの振る舞いを分離する
 */
import type { Enemy } from '../../types';
import type { GameEvent } from '../../application/game-events';
import { createSoundEvent, createEnemyAlertEvent } from '../../application/game-events';
import { distance, normAngle } from '../../utils';
import { MazeService } from '../../maze-service';
import { bfsPath } from './pathfinding';
import { canSeePlayer, hasLineOfSight } from './vision';
import { GAME_BALANCE } from '../constants';

const {
  PATH_RECALC_INTERVAL,
  TELEPORT_COOLDOWN,
  TELEPORT_CHASE_RANGE,
  WANDERER_SPEED_MULTIPLIER,
  TELEPORTER_CHASE_SPEED_MULTIPLIER,
  TELEPORTER_PATROL_SPEED_MULTIPLIER,
  TELEPORT_MIN_DISTANCE,
  TELEPORT_MAX_DISTANCE,
  PATH_NODE_REACH_DISTANCE,
  FOV_ANGLE,
  LOSE_SIGHT_GRACE,
  LAST_SEEN_REACH_DISTANCE,
  SEARCH_PULL_DISTANCE,
} = GAME_BALANCE.enemy;

/** 半径付きの音源。radius 内の敵が捜索状態で反応する */
export interface NoiseSource {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

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
  /** 敵の発見可能距離（難易度依存） */
  readonly sightRange: number;
  /** 捜索状態の持続時間 ms（難易度依存） */
  readonly searchDuration: number;
  /** このフレームに発生した音源（石の着地・罠の作動）。未発生なら undefined */
  readonly noise?: NoiseSource;
}

/** 敵AI更新の結果 */
export interface EnemyUpdateResult {
  readonly events: readonly GameEvent[];
}

/** 敵 AI Strategy インターフェース */
export interface EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult;
}

/** dir 方向へ速度分移動する。壁なら方向転換して失敗を返す */
const tryMove = (
  e: Enemy,
  maze: number[][],
  speed: number,
  dt: number,
  randomFn: () => number
): boolean => {
  const nx = e.x + Math.cos(e.dir) * speed * dt;
  const ny = e.y + Math.sin(e.dir) * speed * dt;
  if (MazeService.isWalkable(maze, nx, ny)) {
    e.x = nx;
    e.y = ny;
    return true;
  }
  e.dir += Math.PI * 0.5 + randomFn() * 0.5;
  return false;
};

/** ランダムに向きを揺らしながら歩く（巡回・捜索の基本動作） */
const wanderMove = (
  e: Enemy,
  maze: number[][],
  speed: number,
  dt: number,
  randomFn: () => number
): void => {
  e.dir += (randomFn() - 0.5) * 0.055;
  tryMove(e, maze, speed, dt, randomFn);
};

/** 目標地点の方向へ滑らかに旋回する */
const steerToward = (e: Enemy, targetX: number, targetY: number, rate: number): void => {
  e.dir += normAngle(Math.atan2(targetY - e.y, targetX - e.x) - e.dir) * rate;
};

/** BFS パスに沿って移動する（パスが空なら直接旋回） */
const followPath = (
  e: Enemy,
  maze: number[][],
  targetX: number,
  targetY: number,
  speed: number,
  dt: number,
  randomFn: () => number
): void => {
  if (e.path.length > 0) {
    const next = e.path[0];
    if (distance(e.x, e.y, next.x, next.y) < PATH_NODE_REACH_DISTANCE) e.path.shift();
    if (e.path.length > 0) {
      const target = e.path[0];
      e.dir = Math.atan2(target.y - e.y, target.x - e.x);
    }
  } else {
    steerToward(e, targetX, targetY, 0.045);
  }
  tryMove(e, maze, speed, dt, randomFn);
};

/** 発見時の共通処理: chase へ遷移して警戒音とアラートを発行する */
const enterChase = (e: Enemy, playerX: number, playerY: number, events: GameEvent[]): void => {
  e.aiState = 'chase';
  e.lastSeenX = playerX;
  e.lastSeenY = playerY;
  e.loseSightTimer = 0;
  e.path = [];
  e.pathTime = -PATH_RECALC_INTERVAL; // 次フレームで即パス再計算させる
  events.push(createSoundEvent('alert', 0.35), createEnemyAlertEvent('spotted', e.x, e.y));
};

/** 音源が反応半径内なら捜索状態へ遷移する */
const respondToNoise = (e: Enemy, params: EnemyUpdateParams): boolean => {
  const { noise, searchDuration } = params;
  if (!noise) return false;
  if (distance(e.x, e.y, noise.x, noise.y) > noise.radius) return false;
  e.aiState = 'search';
  e.lastSeenX = noise.x;
  e.lastSeenY = noise.y;
  e.searchTimer = searchDuration;
  e.path = [];
  e.pathTime = -PATH_RECALC_INTERVAL; // 次フレームで即パス再計算させる（古い chase 経路を持ち越さない）
  return true;
};

/** 徘徊型AI: ランダムに巡回、プレイヤーを追跡しない */
export class WandererStrategy implements EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, maze, enemySpeed, dt, randomFn } = params;

    e.dir += (randomFn() - 0.5) * 0.04;
    if (randomFn() < 0.002) {
      e.dir += Math.PI * (0.5 + randomFn() * 0.5);
    }

    tryMove(e, maze, enemySpeed * WANDERER_SPEED_MULTIPLIER, dt, randomFn);

    return { events: [] };
  }
}

/** 追跡型AI: 巡回→追跡→捜索の状態機械。視野角＋壁遮蔽で発見する */
export class ChaserStrategy implements EnemyStrategy {
  update(params: EnemyUpdateParams): EnemyUpdateResult {
    switch (params.enemy.aiState) {
      case 'chase':
        return this.updateChase(params);
      case 'search':
        return this.updateSearch(params);
      default:
        return this.updatePatrol(params);
    }
  }

  private canSee(params: EnemyUpdateParams): boolean {
    const { enemy: e, playerX, playerY, isPlayerHiding, maze, sightRange } = params;
    return canSeePlayer({
      maze,
      enemyX: e.x,
      enemyY: e.y,
      enemyDir: e.dir,
      playerX,
      playerY,
      isPlayerHiding,
      sightRange,
      fovAngle: FOV_ANGLE,
    });
  }

  private updatePatrol(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, maze, enemySpeed, dt, randomFn } = params;
    const events: GameEvent[] = [];
    if (this.canSee(params)) {
      enterChase(e, playerX, playerY, events);
      return { events };
    }
    if (respondToNoise(e, params)) return { events };
    wanderMove(e, maze, enemySpeed * 0.5, dt, randomFn);
    return { events };
  }

  private updateChase(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, maze, enemySpeed, dt, gameTime, randomFn, searchDuration } =
      params;
    const events: GameEvent[] = [];

    if (this.canSee(params)) {
      e.lastSeenX = playerX;
      e.lastSeenY = playerY;
      e.loseSightTimer = 0;
    } else {
      e.loseSightTimer += dt;
      const reached = distance(e.x, e.y, e.lastSeenX, e.lastSeenY) < LAST_SEEN_REACH_DISTANCE;
      if (reached || e.loseSightTimer > LOSE_SIGHT_GRACE) {
        e.aiState = 'search';
        e.searchTimer = searchDuration;
        e.path = [];
        e.pathTime = -PATH_RECALC_INTERVAL; // 次フレームで即パス再計算させる（古い chase 経路を持ち越さない）
        events.push(createEnemyAlertEvent('searching', e.x, e.y));
        return { events };
      }
    }

    if (gameTime - e.pathTime > PATH_RECALC_INTERVAL) {
      e.path = bfsPath(maze, e.x, e.y, e.lastSeenX, e.lastSeenY);
      e.pathTime = gameTime;
    }
    followPath(e, maze, e.lastSeenX, e.lastSeenY, enemySpeed, dt, randomFn);
    return { events };
  }

  private updateSearch(params: EnemyUpdateParams): EnemyUpdateResult {
    const { enemy: e, playerX, playerY, maze, enemySpeed, dt, gameTime, randomFn } = params;
    const events: GameEvent[] = [];

    if (this.canSee(params)) {
      enterChase(e, playerX, playerY, events);
      return { events };
    }
    respondToNoise(e, params); // 新しい音で捜索先を更新（search のまま）

    e.searchTimer -= dt;
    if (e.searchTimer <= 0) {
      e.aiState = 'patrol';
      e.lastSeenX = -1;
      e.lastSeenY = -1;
      return { events };
    }

    // 目撃地点の周辺に留まる: 離れたら引き戻し、近くではうろつく
    if (distance(e.x, e.y, e.lastSeenX, e.lastSeenY) > SEARCH_PULL_DISTANCE) {
      // 直線の旋回移動だと壁を回り込めず張り付いてしまうため、
      // chase と同じ BFS 経路追従で目撃地点へ向かう
      if (gameTime - e.pathTime > PATH_RECALC_INTERVAL) {
        e.path = bfsPath(maze, e.x, e.y, e.lastSeenX, e.lastSeenY);
        e.pathTime = gameTime;
      }
      followPath(e, maze, e.lastSeenX, e.lastSeenY, enemySpeed * 0.7, dt, randomFn);
    } else {
      wanderMove(e, maze, enemySpeed * 0.7, dt, randomFn);
    }
    return { events };
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
      // 注入された randomFn を渡し、テレポート先選定を再現可能にする（Math.random 依存を排除）
      const emptyCells = MazeService.getEmptyCells(maze, randomFn);
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

    if (!isPlayerHiding && d < TELEPORT_CHASE_RANGE && hasLineOfSight(maze, e.x, e.y, playerX, playerY)) {
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
