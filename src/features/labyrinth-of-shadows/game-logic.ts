import { CONFIG, CONTENT } from './constants';
import type { GameState, Enemy } from './types';
import { clamp, distance, normAngle } from './utils';
import { MazeService } from './maze-service';
import { AudioService } from './audio';
import { GAME_BALANCE } from './domain/constants';
import { isPlayerNearItem, isPlayerNearExit, isPlayerCollidingEnemy } from './domain/services/collision';
import { calculateKeyScore, calculateVictoryScore, calculateCombo } from './domain/services/scoring';
import { getEnemyStrategy } from './domain/services/enemy-strategy';
import { chooseDropCell } from './domain/services/key-drop';
import { resolveKnockback } from './domain/services/knockback';
import type { NoiseSource } from './domain/services/enemy-strategy';
import type { GameEvent } from './application/game-events';
import type { EnemyAlert } from './game-tick';

/** 敵速度をプレイヤー速度の MAX_SPEED_RATIO 倍でキャップする（逃走成立の保証） */
export const capEnemySpeed = (eSpeed: number): number =>
  Math.min(eSpeed, GAME_BALANCE.player.MOVE_SPEED * GAME_BALANCE.enemy.MAX_SPEED_RATIO);

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
    input: {
      left: boolean;
      right: boolean;
      forward: boolean;
      backward: boolean;
      strafeLeft?: boolean;
      strafeRight?: boolean;
    },
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
    // ストレイフ（進行方向に対する横移動）: 右 = angle+90° 方向。左右同時押しは相殺
    const side = (input.strafeRight ? 1 : 0) - (input.strafeLeft ? 1 : 0);
    if (side !== 0) {
      const strafeSpeed = speed * GAME_BALANCE.player.STRAFE_SPEED_MULTIPLIER * side;
      dx += Math.cos(g.player.angle + Math.PI / 2) * strafeSpeed * dt;
      dy += Math.sin(g.player.angle + Math.PI / 2) * strafeSpeed * dt;
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

  revealMap(g: GameState, cx: number, cy: number) {
    const r = CONFIG.items.mapRevealRadius;
    for (let ox = -r; ox <= r; ox++)
      for (let oy = -r; oy <= r; oy++) g.explored[`${cx + ox},${cy + oy}`] = true;
  },

  updateItems(g: GameState): NoiseSource | undefined {
    let trapNoise: NoiseSource | undefined;
    for (const item of g.items) {
      // 罠だけ狭い発動半径にして、壁に寄れば（横移動で）踏まずに通過できるようにする
      const radius =
        item.type === 'trap'
          ? GAME_BALANCE.collision.TRAP_PICKUP_DISTANCE
          : GAME_BALANCE.collision.ITEM_PICKUP_DISTANCE;
      if (item.got || !isPlayerNearItem(g.player.x, g.player.y, item.x, item.y, radius)) continue;
      // 小石は満杯なら拾わずフィールドに残す
      if (item.type === 'stone' && g.stones >= GAME_BALANCE.stone.MAX_COUNT) continue;
      // 加速チャージは満杯なら拾わずフィールドに残す
      if (item.type === 'speed' && g.speedCharges >= GAME_BALANCE.speedCharge.MAX_COUNT) continue;

      item.got = true;
      switch (item.type) {
        case 'key': {
          if (item.dropped) {
            // 落とした鍵の拾い直し: 進行だけ戻し、スコア/コンボは与えない
            // （被弾→再回収での純増・コンボ稼ぎを防ぐ）
            g.keys++;
            g.msg = `🔑 落とした鍵を拾い直した (${g.keys}/${g.reqKeys})`;
            AudioService.play('key', 0.45);
            break;
          }
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
          g.combo = 0;
          // アイテム座標はセル整数なので中心 (+0.5) を音源にする
          trapNoise = {
            x: item.x + 0.5,
            y: item.y + 0.5,
            radius: GAME_BALANCE.trap.NOISE_RADIUS,
          };
          g.msg = '📦 罠だ！大きな音が鳴り響く…！';
          AudioService.play('trap', 0.6);
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
          g.speedCharges++;
          g.msg = `⚡ 加速チャージを拾った (${g.speedCharges}/${GAME_BALANCE.speedCharge.MAX_COUNT})`;
          AudioService.play('speed', 0.3);
          break;
        case 'map':
          this.revealMap(g, item.x, item.y);
          g.enemyRevealTimer = GAME_BALANCE.items.ENEMY_REVEAL_DURATION;
          g.msg = '🗺️ 地図を発見！ 周囲の地形と敵の位置が見える！';
          AudioService.play('mapReveal', 0.4);
          break;
        case 'stone':
          g.stones++;
          g.msg = `🪨 小石を拾った (${g.stones}/${GAME_BALANCE.stone.MAX_COUNT})`;
          AudioService.play('stoneLand', 0.2);
          break;
      }
      g.msgTimer = CONFIG.timing.msgDuration;
    }
    return trapNoise;
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

  /** Strategy パターンで敵 AI を更新する */
  updateEnemyWithStrategy(
    g: GameState,
    e: Enemy,
    dt: number,
    noise?: NoiseSource
  ): { distance: number; events: readonly GameEvent[] } {
    if (!e.active) {
      if (g.gTime >= e.actTime) e.active = true;
      return { distance: Infinity, events: [] };
    }

    const d = distance(g.player.x, g.player.y, e.x, e.y);

    // 衝突判定
    if (isPlayerCollidingEnemy(g.player.x, g.player.y, e.x, e.y) && !g.hiding && g.invince <= 0) {
      g.lives--;
      g.invince = CONFIG.timing.invinceDuration;
      g.score = Math.max(0, g.score - CONFIG.score.damagePenalty);
      g.combo = 0;

      // 鍵を持っていれば1個ドロップし、捕縛を「事件」にする。
      // 着地は敵と反対方向の歩けるセル（chooseDropCell がデススパイラルを抑制）。
      // 新規 push はしない：ItemMeshes は1アイテム=1点光源で有効ライト数を一定に保つ設計
      // （数が変わると three.js が全被照明マテリアルのシェーダを同期再コンパイルしカクつく）。
      // 取得済みの鍵スロット（got=true・ライトは intensity=0 で常駐）を1つ復活させ、
      // 落下セルへ移す＝配列長＝ライト数は不変のままドロップを表現する。
      const droppedSlot = g.keys > 0 ? g.items.find((it) => it.type === 'key' && it.got) : undefined;
      if (droppedSlot) {
        const cell = chooseDropCell(g.maze, g.player.x, g.player.y, e.x, e.y, g.items);
        droppedSlot.x = cell.x;
        droppedSlot.y = cell.y;
        droppedSlot.got = false;
        droppedSlot.dropped = true;
        g.keys--;
        g.msg = '🔑 鍵を落とした！';
      } else {
        g.msg = '💔 ダメージ！';
      }
      g.msgTimer = GAME_BALANCE.timing.DAMAGE_MESSAGE_DURATION;
      AudioService.play('hurt', 0.5);

      // プレイヤーから離れる向きへ押し戻す。壁にめり込むと敵が動けなくなるため、
      // resolveKnockback で歩けるセルの範囲に留める（通常移動と同じ不変条件）。
      const knockback = resolveKnockback(
        g.maze,
        e.x,
        e.y,
        g.player.x,
        g.player.y,
        GAME_BALANCE.collision.ENEMY_KNOCKBACK_DISTANCE
      );
      e.x = knockback.x;
      e.y = knockback.y;
      e.dir += Math.PI;
    }

    // Strategy パターンによるタイプ別 AI 更新
    const strategy = getEnemyStrategy(e.type);
    const result = strategy.update({
      enemy: e,
      playerX: g.player.x,
      playerY: g.player.y,
      isPlayerHiding: g.hiding,
      maze: g.maze,
      enemySpeed: capEnemySpeed(g.eSpeed),
      dt,
      gameTime: g.gTime,
      randomFn: Math.random,
      sightRange: g.sightRange,
      searchDuration: g.searchDuration,
      noise,
    });

    // Strategy から発生したイベントを処理
    for (const event of result.events) {
      if (event.type === 'SOUND_PLAY') {
        AudioService.play(event.sound, event.volume);
      }
    }

    return { distance: d, events: result.events };
  },

  updateEnemies(
    g: GameState,
    dt: number,
    noise?: NoiseSource
  ): { closest: number; nearest: Enemy | undefined; alerts: EnemyAlert[] } {
    let closest: number = GAME_BALANCE.enemy.INITIAL_CLOSEST_DISTANCE;
    let nearest: Enemy | undefined;
    const alerts: EnemyAlert[] = [];
    for (const e of g.enemies) {
      const r = this.updateEnemyWithStrategy(g, e, dt, noise);
      if (r.distance < closest) {
        closest = r.distance;
        nearest = e;
      }
      for (const ev of r.events) {
        if (ev.type === 'ENEMY_ALERT') alerts.push({ kind: ev.alert, x: ev.x, y: ev.y });
      }
    }
    return { closest, nearest, alerts };
  },

  updateSounds(g: GameState, closestEnemy: number, dt: number, nearest?: Enemy) {
    g.timers.enemySound -= dt;
    g.timers.heartbeat -= dt;

    if (closestEnemy < 10 && g.timers.enemySound <= 0) {
      // 最寄り敵の相対方位を -1(左)〜1(右) のパンに変換して定位させる
      const pan = nearest
        ? Math.sin(normAngle(Math.atan2(nearest.y - g.player.y, nearest.x - g.player.x) - g.player.angle))
        : 0;
      AudioService.playSpatial('enemy', Math.max(0.05, 0.45 * (1 - closestEnemy / 10)), pan);
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
