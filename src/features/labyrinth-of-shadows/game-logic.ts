import { CONFIG, CONTENT } from './constants';
import type { GameState, Enemy } from './types';
import { clamp, distance, normAngle } from './utils';
import { MazeService } from './maze-service';
import { AudioService } from './audio';
import { GAME_BALANCE } from './domain/constants';
import { isPlayerNearItem, isPlayerNearExit, isPlayerCollidingEnemy } from './domain/services/collision';
import { calculateKeyScore, calculateVictoryScore, calculateCombo } from './domain/services/scoring';
import { bfsPath } from './domain/services/pathfinding';

const { PATH_RECALC_INTERVAL, TELEPORT_COOLDOWN, TELEPORT_CHASE_RANGE } = GAME_BALANCE.enemy;

// ==================== GAME LOGIC ====================
export const GameLogic = {
  updateHiding(g: GameState, wantHide: boolean, dt: number) {
    if (wantHide && g.energy > CONFIG.hiding.minEnergy) {
      g.hiding = true;
      g.energy = Math.max(0, g.energy - dt * CONFIG.hiding.drainRate);
    } else {
      g.hiding = false;
      g.energy = Math.min(100, g.energy + dt * CONFIG.hiding.rechargeRate);
    }
  },

  updateSprinting(g: GameState, wantSprint: boolean, dt: number) {
    g.sprinting = wantSprint && !g.hiding && g.player.stamina > 5;
    const rate = g.sprinting ? -CONFIG.stamina.drainRate : CONFIG.stamina.rechargeRate;
    g.player.stamina = clamp(g.player.stamina + dt * rate, 0, 100);
  },

  updatePlayer(
    g: GameState,
    input: { left: boolean; right: boolean; forward: boolean; backward: boolean },
    dt: number
  ) {
    if (g.hiding) return false;

    const { rotSpeed, moveSpeed, radius, sprintMult } = CONFIG.player;
    const speedMult = g.sprinting ? sprintMult : 1;
    const boostMult = g.speedBoost > 0 ? CONFIG.items.speedBoostMult : 1;
    const speed = moveSpeed * speedMult * boostMult;

    if (input.left) g.player.angle -= rotSpeed * dt;
    if (input.right) g.player.angle += rotSpeed * dt;

    let dx = 0,
      dy = 0,
      moved = false;
    if (input.forward) {
      dx = Math.cos(g.player.angle) * speed * dt;
      dy = Math.sin(g.player.angle) * speed * dt;
      moved = true;
    }
    if (input.backward) {
      dx = -Math.cos(g.player.angle) * speed * dt * 0.5;
      dy = -Math.sin(g.player.angle) * speed * dt * 0.5;
      moved = true;
    }

    if (MazeService.isWalkable(g.maze, g.player.x + dx + (dx > 0 ? radius : -radius), g.player.y))
      g.player.x += dx;
    if (MazeService.isWalkable(g.maze, g.player.x, g.player.y + dy + (dy > 0 ? radius : -radius)))
      g.player.y += dy;

    this.updateExplored(g);
    return moved;
  },

  updateExplored(g: GameState) {
    const px = Math.floor(g.player.x),
      py = Math.floor(g.player.y);
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) g.explored[`${px + ox},${py + oy}`] = true;
  },

  // 地図アイテム使用時、広範囲を探索済みにする
  revealMap(g: GameState, cx: number, cy: number) {
    const r = CONFIG.items.mapRevealRadius;
    for (let ox = -r; ox <= r; ox++)
      for (let oy = -r; oy <= r; oy++) g.explored[`${cx + ox},${cy + oy}`] = true;
  },

  updateItems(g: GameState) {
    for (const item of g.items) {
      if (item.got || !isPlayerNearItem(g.player.x, g.player.y, item.x, item.y))
        continue;

      item.got = true;
      switch (item.type) {
        case 'key': {
          g.combo = calculateCombo(g.combo, g.gTime, g.lastKeyTime);
          g.lastKeyTime = g.gTime;
          const bonus = calculateKeyScore(g.combo);
          g.keys++;
          g.score += bonus;
          g.msg = `🔑 鍵を入手！ +${bonus}pt (${g.keys}/${g.reqKeys})`;
          AudioService.play('key', 0.45);
          break;
        }
        case 'trap':
          g.time -= CONFIG.timing.trapPenalty;
          g.combo = 0;
          g.msg = '📦 罠だ！時間 -12秒！';
          AudioService.play('trap', 0.45);
          break;
        case 'heal':
          if (g.lives < g.maxLives) {
            g.lives++;
            g.msg = '💊 回復薬！ ライフ+1';
          } else {
            g.score += GAME_BALANCE.scoring.HEAL_FULL_BONUS;
            g.msg = `💊 体力満タン！ +${GAME_BALANCE.scoring.HEAL_FULL_BONUS}pt`;
          }
          AudioService.play('heal', 0.4);
          break;
        case 'speed':
          g.speedBoost = CONFIG.items.speedBoostDuration;
          g.msg = '⚡ 加速！ 10秒間スピードアップ！';
          AudioService.play('speed', 0.4);
          break;
        case 'map':
          this.revealMap(g, item.x, item.y);
          g.msg = '🗺️ 地図を発見！ 周囲のマップが公開された！';
          AudioService.play('mapReveal', 0.4);
          break;
      }
      g.msgTimer = CONFIG.timing.msgDuration;
    }
  },

  checkExit(g: GameState): keyof typeof CONTENT.stories | null {
    if (!isPlayerNearExit(g.player.x, g.player.y, g.exit.x, g.exit.y)) return null;

    if (g.keys >= g.reqKeys) {
      g.score += calculateVictoryScore(g.time);
      AudioService.play('door', 0.5);
      return 'victory';
    }
    if (g.msgTimer <= 0) {
      g.msg = `🔒 鍵が足りない！ (${g.keys}/${g.reqKeys})`;
      g.msgTimer = GAME_BALANCE.timing.LOCKED_MESSAGE_DURATION;
    }
    return null;
  },

  // 徘徊型AI: ランダムに巡回、プレイヤーを追跡しない
  updateWanderer(g: GameState, e: Enemy, dt: number) {
    e.dir += (Math.random() - 0.5) * 0.04;
    // たまに方向転換
    if (Math.random() < 0.002) {
      e.dir += Math.PI * (0.5 + Math.random() * 0.5);
    }

    const nx = e.x + Math.cos(e.dir) * g.eSpeed * GAME_BALANCE.enemy.WANDERER_SPEED_MULTIPLIER * dt;
    const ny = e.y + Math.sin(e.dir) * g.eSpeed * GAME_BALANCE.enemy.WANDERER_SPEED_MULTIPLIER * dt;
    if (MazeService.isWalkable(g.maze, nx, ny)) {
      e.x = nx;
      e.y = ny;
    } else {
      e.dir += Math.PI * 0.5 + Math.random() * 0.5;
    }
  },

  // 追跡型AI: BFSパスファインディングで追跡
  updateChaser(g: GameState, e: Enemy, dt: number) {
    const d = distance(g.player.x, g.player.y, e.x, e.y);

    if (!g.hiding && d < CONFIG.enemy.chaseRange) {
      e.lastSeenX = g.player.x;
      e.lastSeenY = g.player.y;

      // BFS パスを定期的に再計算
      if (g.gTime - e.pathTime > PATH_RECALC_INTERVAL) {
        e.path = bfsPath(g.maze, e.x, e.y, g.player.x, g.player.y);
        e.pathTime = g.gTime;
      }

      // パスの次のノードへ移動
      if (e.path.length > 0) {
        const next = e.path[0];
        const distToNext = distance(e.x, e.y, next.x, next.y);
        if (distToNext < GAME_BALANCE.enemy.PATH_NODE_REACH_DISTANCE) {
          e.path.shift();
        }
        if (e.path.length > 0) {
          const target = e.path[0];
          e.dir = Math.atan2(target.y - e.y, target.x - e.x);
        }
      } else {
        // パスが空の場合は直接追跡（フォールバック）
        e.dir += normAngle(Math.atan2(g.player.y - e.y, g.player.x - e.x) - e.dir) * 0.045;
      }

      // 視野内で加速
      const speedMult = d < GAME_BALANCE.enemy.CLOSE_RANGE_THRESHOLD ? GAME_BALANCE.enemy.CLOSE_RANGE_SPEED_MULTIPLIER : 1;
      const nx = e.x + Math.cos(e.dir) * g.eSpeed * speedMult * dt;
      const ny = e.y + Math.sin(e.dir) * g.eSpeed * speedMult * dt;
      if (MazeService.isWalkable(g.maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + Math.random() * 0.5;
      }
    } else if (e.lastSeenX > 0 && distance(e.x, e.y, e.lastSeenX, e.lastSeenY) > 1) {
      e.dir += normAngle(Math.atan2(e.lastSeenY - e.y, e.lastSeenX - e.x) - e.dir) * 0.025;
      const nx = e.x + Math.cos(e.dir) * g.eSpeed * dt;
      const ny = e.y + Math.sin(e.dir) * g.eSpeed * dt;
      if (MazeService.isWalkable(g.maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + Math.random() * 0.5;
      }
    } else {
      e.dir += (Math.random() - 0.5) * 0.055;
      e.lastSeenX = -1;
      const nx = e.x + Math.cos(e.dir) * g.eSpeed * 0.5 * dt;
      const ny = e.y + Math.sin(e.dir) * g.eSpeed * 0.5 * dt;
      if (MazeService.isWalkable(g.maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + Math.random() * 0.5;
      }
    }
  },

  // テレポート型AI: 一定間隔でテレポート、短距離追跡
  updateTeleporter(g: GameState, e: Enemy, dt: number) {
    e.teleportCooldown -= dt;

    const d = distance(g.player.x, g.player.y, e.x, e.y);

    // テレポート
    if (e.teleportCooldown <= 0 && !g.hiding) {
      const emptyCells = MazeService.getEmptyCells(g.maze);
      // プレイヤーから適度な距離のセルを選ぶ
      const candidate = emptyCells.find(c =>
        distance(c.x + 0.5, c.y + 0.5, g.player.x, g.player.y) > GAME_BALANCE.enemy.TELEPORT_MIN_DISTANCE &&
        distance(c.x + 0.5, c.y + 0.5, g.player.x, g.player.y) < GAME_BALANCE.enemy.TELEPORT_MAX_DISTANCE
      );
      if (candidate) {
        e.x = candidate.x + 0.5;
        e.y = candidate.y + 0.5;
        e.teleportCooldown = TELEPORT_COOLDOWN;
        AudioService.play('teleport', 0.3);
      }
    }

    // 短距離追跡
    if (!g.hiding && d < TELEPORT_CHASE_RANGE) {
      e.dir = Math.atan2(g.player.y - e.y, g.player.x - e.x);
      const nx = e.x + Math.cos(e.dir) * g.eSpeed * GAME_BALANCE.enemy.TELEPORTER_CHASE_SPEED_MULTIPLIER * dt;
      const ny = e.y + Math.sin(e.dir) * g.eSpeed * GAME_BALANCE.enemy.TELEPORTER_CHASE_SPEED_MULTIPLIER * dt;
      if (MazeService.isWalkable(g.maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      }
    } else {
      // ゆっくり巡回
      e.dir += (Math.random() - 0.5) * 0.04;
      const nx = e.x + Math.cos(e.dir) * g.eSpeed * GAME_BALANCE.enemy.TELEPORTER_PATROL_SPEED_MULTIPLIER * dt;
      const ny = e.y + Math.sin(e.dir) * g.eSpeed * GAME_BALANCE.enemy.TELEPORTER_PATROL_SPEED_MULTIPLIER * dt;
      if (MazeService.isWalkable(g.maze, nx, ny)) {
        e.x = nx;
        e.y = ny;
      } else {
        e.dir += Math.PI * 0.5 + Math.random() * 0.5;
      }
    }
  },

  updateEnemy(g: GameState, e: Enemy, dt: number) {
    if (!e.active) {
      if (g.gTime >= e.actTime) e.active = true;
      return Infinity;
    }

    const d = distance(g.player.x, g.player.y, e.x, e.y);

    // 衝突判定
    if (isPlayerCollidingEnemy(g.player.x, g.player.y, e.x, e.y) && !g.hiding && g.invince <= 0) {
      g.lives--;
      g.invince = CONFIG.timing.invinceDuration;
      g.score = Math.max(0, g.score - CONFIG.score.damagePenalty);
      g.combo = 0;
      g.msg = '💔 ダメージ！';
      g.msgTimer = GAME_BALANCE.timing.DAMAGE_MESSAGE_DURATION;
      AudioService.play('hurt', 0.5);

      const edx = g.player.x - e.x,
        edy = g.player.y - e.y;
      e.x -= (edx / d) * GAME_BALANCE.collision.ENEMY_KNOCKBACK_DISTANCE;
      e.y -= (edy / d) * GAME_BALANCE.collision.ENEMY_KNOCKBACK_DISTANCE;
      e.dir += Math.PI;
    }

    // タイプ別AI
    switch (e.type) {
      case 'wanderer':
        this.updateWanderer(g, e, dt);
        break;
      case 'chaser':
        this.updateChaser(g, e, dt);
        break;
      case 'teleporter':
        this.updateTeleporter(g, e, dt);
        break;
    }

    return d;
  },

  updateEnemies(g: GameState, dt: number) {
    let closest = GAME_BALANCE.enemy.INITIAL_CLOSEST_DISTANCE;
    for (const e of g.enemies) {
      const d = this.updateEnemy(g, e, dt);
      if (d < closest) closest = d;
    }
    return closest;
  },

  updateSounds(g: GameState, closestEnemy: number, dt: number) {
    g.timers.enemySound -= dt;
    g.timers.heartbeat -= dt;

    if (closestEnemy < 10 && g.timers.enemySound <= 0) {
      AudioService.play('enemy', Math.max(0.05, 0.45 * (1 - closestEnemy / 10)));
      g.timers.enemySound = 400;
    }
    if (closestEnemy < 6 && g.timers.heartbeat <= 0) {
      AudioService.play('heartbeat', Math.max(0.08, 0.35 * (1 - closestEnemy / 6)));
      g.timers.heartbeat = Math.max(280, 750 * (closestEnemy / 6));
    }
  },

  updateFootstep(g: GameState, moved: boolean, dt: number) {
    g.timers.footstep -= dt;
    if (moved && g.timers.footstep <= 0) {
      AudioService.play(g.sprinting ? 'sprint' : 'footstep', g.sprinting ? 0.18 : 0.1);
      g.timers.footstep = g.sprinting ? 200 : 300;
    }
  },
};
