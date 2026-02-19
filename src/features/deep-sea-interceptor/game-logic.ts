// ============================================================================
// Deep Sea Interceptor - ゲームロジック（純粋関数）
// ============================================================================

import { clamp as baseClamp, randomRange } from '../../utils/math-utils';
import { Config, StageConfig, ItemConfig, DifficultyConfig } from './constants';
import { EntityFactory, randomChoice } from './entities';
import { MovementStrategies } from './movement';
import { Collision } from './collision';
import { EnemyAI } from './enemy-ai';
import type { GameState, UiState, Difficulty } from './types';

/** clamp のカリー化ラッパー */
const clamp = (min: number, max: number) => (value: number) => baseClamp(value, min, max);

/** 初期ゲーム状態を生成 */
export const createInitialGameState = (): GameState => ({
  player: { x: Config.canvas.width / 2, y: Config.canvas.height - 80 },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  items: [],
  particles: [],
  bubbles: [],
  charging: false,
  chargeLevel: 0,
  chargeStartTime: 0,
  spawnTimer: 0,
  bossDefeated: false,
  bossDefeatedTime: 0,
  invincible: false,
  invincibleEndTime: 0,
  input: { dx: 0, dy: 0 },
  keys: {},
  combo: 0,
  comboTimer: 0,
  maxCombo: 0,
  grazeCount: 0,
  grazedBulletIds: new Set(),
  gameStartTime: 0,
  // 演出用
  bossWarning: false,
  bossWarningStartTime: 0,
  screenShake: 0,
  screenFlash: 0,
  stageClearTime: 0,
  grazeFlashTime: 0,
  // ミッドボス用
  midBossSpawned: false,
  // 環境ギミック用
  currentDirection: 1,
  currentChangeTime: 0,
  thermalVents: [],
  thermalVentTimer: 0,
  luminescence: false,
  luminescenceEndTime: 0,
  pressureBounds: { left: 0, right: Config.canvas.width },
});

/** 初期UI状態を生成 */
export const createInitialUiState = (highScore = 0): UiState => ({
  stage: 1,
  score: 0,
  lives: 3,
  highScore,
  power: 1,
  spreadTime: 0,
  shieldEndTime: 0,
  speedLevel: 0,
  combo: 0,
  multiplier: 1.0,
  grazeCount: 0,
  maxCombo: 0,
  difficulty: 'standard' as const,
  weaponType: 'torpedo' as const,
});

/** ゲームループ内の1フレーム更新を処理 */
export interface FrameResult {
  uiState: UiState;
  event: 'none' | 'gameover' | 'stageCleared' | 'ending';
}

// ================================================================
// 環境ギミック関数群
// ================================================================

/** Stage 1: 海流 — プレイヤーと弾に横方向の力を適用 */
function applyCurrentGimmick(gd: GameState, now: number): void {
  // 10秒ごとに方向切替
  if (now - gd.currentChangeTime > 10000) {
    gd.currentDirection *= -1;
    gd.currentChangeTime = now;
  }
  const force = gd.currentDirection * 0.5;
  gd.player.x += force;
  gd.enemyBullets.forEach(b => { b.vx += force * 0.3; });
}

/** Stage 2: 機雷原 — 機雷スポーン */
function applyMinefieldGimmick(gd: GameState, now: number, stage: number): void {
  // 3秒おきに機雷を配置
  if (now % 3000 < 16 && gd.enemies.filter(e => e.enemyType === 'mine').length < 5) {
    gd.enemies.push(
      EntityFactory.enemy('mine', randomRange(40, 360), randomRange(50, 300), stage)
    );
  }
}

/** Stage 3: 熱水柱 — 定期的に噴出 */
function applyThermalVentGimmick(gd: GameState, now: number): void {
  gd.thermalVentTimer += 16;
  // 5秒ごとに熱水柱を生成
  if (gd.thermalVentTimer > 5000) {
    gd.thermalVentTimer = 0;
    const x = randomRange(40, 360);
    gd.thermalVents.push({
      x,
      width: 40,
      active: false,
      startTime: now + 1000,
      warningTime: now,
    });
  }
  // 熱水柱の更新
  gd.thermalVents = gd.thermalVents.filter(v => {
    if (!v.active && now >= v.startTime) {
      v.active = true;
    }
    // アクティブ期間: 2秒
    if (v.active && now - v.startTime > 2000) return false;
    // 予告期間含めて最大3秒で消滅
    if (now - v.warningTime > 3000) return false;
    // ダメージ判定: アクティブ中にプレイヤーが範囲内
    if (v.active) {
      const px = gd.player.x;
      if (px > v.x - v.width / 2 && px < v.x + v.width / 2) {
        // ダメージゾーン内（衝突判定は外部で処理）
        // 視覚的な警告のみ
      }
    }
    return true;
  });
}

/** Stage 4: 発光プランクトン — 光る粒子を生成 */
function applyBioluminescenceGimmick(gd: GameState, now: number): void {
  // 発光粒子を生成
  if (Math.random() < 0.05 && gd.particles.length < 60) {
    gd.particles.push(EntityFactory.particle(
      randomRange(10, 390),
      randomRange(10, 550),
      { color: '#44ffaa', velocity: { x: (Math.random() - 0.5) * 0.5, y: -0.3 }, life: 120 }
    ));
  }
  // プレイヤーが発光粒子に近づくと明るくなる
  if (!gd.luminescence) {
    const nearParticle = gd.particles.some(p =>
      p.color === '#44ffaa' &&
      Math.abs(p.x - gd.player.x) < 30 &&
      Math.abs(p.y - gd.player.y) < 30
    );
    if (nearParticle) {
      gd.luminescence = true;
      gd.luminescenceEndTime = now + 3000;
    }
  }
  if (gd.luminescence && now > gd.luminescenceEndTime) {
    gd.luminescence = false;
  }
}

/** Stage 5: 水圧 — 30秒後から壁が収縮 */
function applyPressureGimmick(gd: GameState, now: number): void {
  const elapsed = now - gd.gameStartTime;
  if (elapsed > 30000 && !gd.bossDefeated) {
    const shrinkRate = 0.02;
    const minWidth = Config.canvas.width * 0.6;
    const targetHalfWidth = Math.max(minWidth / 2, Config.canvas.width / 2 - (elapsed - 30000) * shrinkRate / 16);
    const cx = Config.canvas.width / 2;
    gd.pressureBounds.left = cx - targetHalfWidth;
    gd.pressureBounds.right = cx + targetHalfWidth;
    // プレイヤーを壁内に制限
    gd.player.x = clamp(gd.pressureBounds.left + 15, gd.pressureBounds.right - 15)(gd.player.x);
  }
  // ボス撃破で解除
  if (gd.bossDefeated) {
    gd.pressureBounds.left = 0;
    gd.pressureBounds.right = Config.canvas.width;
  }
}

/** 1フレームのゲーム状態を更新 */
export function updateFrame(
  gd: GameState,
  uiState: UiState,
  now: number,
  audioPlay: (name: string) => void
): FrameResult {
  const stg = StageConfig[uiState.stage];
  const diffConfig = DifficultyConfig[uiState.difficulty];
  let currentUi = { ...uiState };
  let event: FrameResult['event'] = 'none';

  // 演出タイマー減衰
  if (gd.screenShake > 0) gd.screenShake = Math.max(0, gd.screenShake - 16);
  if (gd.screenFlash > 0) gd.screenFlash = Math.max(0, gd.screenFlash - 16);

  // WARNING演出チェック
  if (gd.bossWarning) {
    if (now - gd.bossWarningStartTime > 2000) {
      gd.bossWarning = false;
      // ボスをスポーン
      const bossType = `boss${currentUi.stage}`;
      gd.enemies.push(EntityFactory.enemy(bossType, 200, -60, currentUi.stage));
      audioPlay('bossAppear');
    }
  }

  // 泡の更新
  if (Math.random() < 0.07 && gd.bubbles.length < 35) gd.bubbles.push(EntityFactory.bubble());
  gd.bubbles = gd.bubbles
    .map(MovementStrategies.bubble)
    .filter(b => b.y > -10 && b.opacity > 0);

  // プレイヤー移動
  const k = gd.keys;
  let dx = gd.input.dx,
    dy = gd.input.dy;
  if (k['ArrowLeft'] || k['a']) dx = -1;
  if (k['ArrowRight'] || k['d']) dx = 1;
  if (k['ArrowUp'] || k['w']) dy = -1;
  if (k['ArrowDown'] || k['s']) dy = 1;
  const speed = Config.player.speed + (currentUi.speedLevel || 0);
  gd.player.x = clamp(15, Config.canvas.width - 15)(gd.player.x + dx * speed);
  gd.player.y = clamp(15, Config.canvas.height - 50)(gd.player.y + dy * speed);

  // チャージ
  if (gd.charging) gd.chargeLevel = Math.min(1, (now - gd.chargeStartTime) / 800);

  // 環境ギミック適用
  switch (stg.gimmick) {
    case 'current': applyCurrentGimmick(gd, now); break;
    case 'minefield': applyMinefieldGimmick(gd, now, currentUi.stage); break;
    case 'thermalVent': applyThermalVentGimmick(gd, now); break;
    case 'bioluminescence': applyBioluminescenceGimmick(gd, now); break;
    case 'pressure': applyPressureGimmick(gd, now); break;
  }
  // ギミック適用後もプレイヤーが画面内に収まるよう再clamp
  gd.player.x = clamp(15, Config.canvas.width - 15)(gd.player.x);
  gd.player.y = clamp(15, Config.canvas.height - 50)(gd.player.y);

  // 敵スポーン
  if (!gd.bossDefeated && !gd.bossWarning) {
    gd.spawnTimer += 16;
    if (gd.spawnTimer > stg.rate / diffConfig.spawnRateMultiplier && gd.enemies.length < Config.enemy.maxCount(currentUi.stage)) {
      gd.enemies.push(
        EntityFactory.enemy(
          randomChoice(stg.types),
          randomRange(30, 370),
          -40,
          currentUi.stage
        )
      );
      gd.spawnTimer = 0;
    }
    // ミッドボススポーン
    if (
      !gd.midBossSpawned &&
      currentUi.score >= stg.bossScore * 0.5 &&
      !gd.enemies.some(e => e.enemyType.startsWith('midboss'))
    ) {
      const midbossType = `midboss${currentUi.stage}`;
      gd.enemies.push(EntityFactory.enemy(midbossType, 200, -50, currentUi.stage));
      gd.midBossSpawned = true;
    }
    // ボスWARNING開始
    if (
      currentUi.score >= stg.bossScore &&
      !gd.bossWarning &&
      !gd.enemies.some(e => e.enemyType === 'boss' || e.enemyType.startsWith('boss'))
    ) {
      gd.bossWarning = true;
      gd.bossWarningStartTime = now;
      audioPlay('warning');
    }
  }

  // エンティティ更新
  gd.bullets = gd.bullets
    .map(b => {
      // 寿命更新
      if (b.lifespan !== undefined) b = { ...b, lifespan: b.lifespan - 1 };
      // ホーミング弾は追尾移動
      if (b.homing) return MovementStrategies.homing(b, gd.enemies);
      return MovementStrategies.bullet(b);
    })
    .filter(b => b.y > -20 && b.y < 580 && (b.lifespan === undefined || b.lifespan > 0));
  gd.enemyBullets = gd.enemyBullets
    .map(MovementStrategies.enemyBullet)
    .filter(b => b.y < 575 && b.x > -15 && b.x < 415);
  gd.particles = gd.particles.map(MovementStrategies.particle).filter(p => p.life > 0);
  gd.items = gd.items.map(MovementStrategies.item).filter(i => i.y < 590);

  gd.enemies = gd.enemies
    .map(e => {
      // ボスのフェーズ遷移チェック
      if (e.enemyType.startsWith('boss') && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5) {
        e.bossPhase = 2;
        audioPlay('bossPhaseChange');
        gd.enemyBullets = [];
        gd.screenShake = 300;
      }

      const isBoss = e.enemyType === 'boss' || e.enemyType.startsWith('boss');
      const isMidboss = e.enemyType.startsWith('midboss');
      const moveFn = isBoss || isMidboss
        ? MovementStrategies.boss
        : (['straight', 'sine', 'drift'] as const)[e.movementPattern] === 'straight'
          ? MovementStrategies.straight
          : (['straight', 'sine', 'drift'] as const)[e.movementPattern] === 'sine'
            ? MovementStrategies.sine
            : MovementStrategies.drift;
      const next = moveFn(e);
      if (e.canShoot && now - e.lastShotAt > e.fireRate && e.y > 0) {
        next.lastShotAt = now;
        gd.enemyBullets.push(...EnemyAI.createBullets(next, gd.player));
      }
      return next;
    })
    .filter(e => e.y < 600);

  // 衝突判定: 弾 → 敵
  gd.bullets = gd.bullets.filter(b => {
    let hit = false;
    gd.enemies.forEach(e => {
      if (e.hp > 0 && Collision.bulletEnemy(b, e)) {
        hit = true;
        e.hp -= b.damage;
        if (e.hp <= 0) {
          audioPlay('destroy');
          // コンボ加算
          gd.combo++;
          gd.comboTimer = now;
          gd.maxCombo = Math.max(gd.maxCombo, gd.combo);
          // 倍率適用スコア計算
          const multiplier = Math.min(5.0, 1.0 + gd.combo * 0.1);
          currentUi = {
            ...currentUi,
            score: currentUi.score + Math.floor(e.points * multiplier * diffConfig.scoreMultiplier),
            combo: gd.combo,
            multiplier,
            maxCombo: gd.maxCombo,
          };
          if (e.enemyType === 'boss' || e.enemyType.startsWith('boss')) {
            // ボス撃破演出
            gd.bossDefeated = true;
            gd.bossDefeatedTime = now;
            gd.screenShake = 500;
            gd.screenFlash = 200;
            gd.items.push(EntityFactory.item(e.x, e.y, 'bomb'));
            // 大量パーティクル
            for (let i = 0; i < 20; i++) {
              gd.particles.push(EntityFactory.particle(
                e.x + randomRange(-30, 30),
                e.y + randomRange(-30, 30),
                { color: randomChoice(['#ff6', '#f80', '#fa0', '#ff4']) },
              ));
            }
          } else if (e.enemyType.startsWith('midboss')) {
            // ミッドボス撃破演出
            gd.screenShake = 200;
            // 確定アイテムドロップ
            const dropItem = Math.random() < 0.5 ? 'life' : 'power';
            gd.items.push(EntityFactory.item(e.x, e.y, dropItem as 'life' | 'power'));
            // パーティクル
            for (let i = 0; i < 10; i++) {
              gd.particles.push(EntityFactory.particle(
                e.x + randomRange(-20, 20),
                e.y + randomRange(-20, 20),
                { color: randomChoice(['#88f', '#aaf', '#66f']) },
              ));
            }
          } else if (Math.random() < 0.2) {
            gd.items.push(EntityFactory.item(e.x, e.y, randomChoice(Object.keys(ItemConfig) as Array<keyof typeof ItemConfig>)));
          }
        } else {
          audioPlay('hit');
        }
      }
    });
    return !hit || b.piercing;
  });
  gd.enemies = gd.enemies.filter(e => e.hp > 0);

  // 衝突判定: プレイヤー → アイテム
  gd.items = gd.items.filter(i => {
    if (Collision.playerItem(gd.player, i)) {
      audioPlay('item');
      if (i.itemType === 'power') currentUi.power++;
      if (i.itemType === 'shield') currentUi.shieldEndTime = now + 8000;
      if (i.itemType === 'speed')
        currentUi.speedLevel = Math.min(3, (currentUi.speedLevel || 0) + 1);
      if (i.itemType === 'life')
        currentUi.lives = Math.min(Config.player.maxLives, currentUi.lives + 1);
      if (i.itemType === 'spread') currentUi.spreadTime = now + 10000;
      if (i.itemType === 'bomb') {
        gd.enemies.forEach(e => {
          if (!e.enemyType.startsWith('boss')) e.hp = 0;
        });
        gd.enemyBullets = [];
        currentUi.score += 500;
      }
      return false;
    }
    return true;
  });

  // グレイズ判定（被弾判定前に実施）
  if (!gd.invincible && now > (currentUi.shieldEndTime || 0)) {
    gd.enemyBullets.forEach(b => {
      if (!gd.grazedBulletIds.has(b.id) && Collision.graze(gd.player, b)) {
        gd.grazedBulletIds.add(b.id);
        gd.grazeCount++;
        gd.comboTimer = now;
        gd.grazeFlashTime = now;
        const multiplier = Math.min(5.0, 1.0 + gd.combo * 0.1);
        currentUi = {
          ...currentUi,
          score: currentUi.score + Math.floor(50 * multiplier),
          grazeCount: gd.grazeCount,
        };
        audioPlay('graze');
      }
    });
  }

  // 衝突判定: プレイヤー → 敵/敵弾
  if (!gd.invincible && now > (currentUi.shieldEndTime || 0)) {
    let hit = false;
    if (gd.enemies.some(e => Collision.playerEnemy(gd.player, e))) hit = true;
    if (gd.enemyBullets.some(b => Collision.playerEnemyBullet(gd.player, b))) hit = true;

    if (hit) {
      audioPlay('destroy');
      // 被弾時コンボリセット
      gd.combo = 0;
      currentUi = { ...currentUi, combo: 0, multiplier: 1.0 };
      currentUi.lives--;
      if (currentUi.lives <= 0) {
        event = 'gameover';
        if (currentUi.score > currentUi.highScore) {
          currentUi.highScore = currentUi.score;
        }
      } else {
        gd.invincible = true;
        gd.invincibleEndTime = now + 2000;
      }
    }
  }
  if (gd.invincible && now > gd.invincibleEndTime) gd.invincible = false;

  // コンボタイマー切れ判定
  if (gd.combo > 0 && now - gd.comboTimer > 3000) {
    gd.combo = 0;
    currentUi = { ...currentUi, combo: 0, multiplier: 1.0 };
  }

  // 画面外に出た敵弾のグレイズIDをクリーンアップ
  const activeEnemyBulletIds = new Set(gd.enemyBullets.map(b => b.id));
  gd.grazedBulletIds.forEach(id => {
    if (!activeEnemyBulletIds.has(id)) gd.grazedBulletIds.delete(id);
  });

  // ステージクリア判定
  if (gd.bossDefeated && now - gd.bossDefeatedTime > 2000) {
    if (currentUi.stage < 5) {
      // ステージクリアボーナス
      const bonus = 1000 * currentUi.stage + gd.maxCombo * 10 + gd.grazeCount * 5;
      currentUi.score += bonus;
      currentUi.stage++;
      gd.bossDefeated = false;
      gd.enemies = [];
      gd.enemyBullets = [];
      gd.midBossSpawned = false;
      gd.stageClearTime = now;
      // ギミック状態リセット
      gd.thermalVents = [];
      gd.thermalVentTimer = 0;
      gd.luminescence = false;
      gd.pressureBounds = { left: 0, right: Config.canvas.width };
      event = 'stageCleared';
    } else {
      event = 'ending';
      if (currentUi.score > currentUi.highScore) {
        currentUi.highScore = currentUi.score;
      }
    }
  }

  return { uiState: currentUi, event };
}

/** ランク判定（純粋関数） */
export function calculateRank(score: number, lives: number, difficulty: Difficulty): string {
  const diffMultiplier = difficulty === 'cadet' ? 2.0 : difficulty === 'abyss' ? 0.5 : 1.0;
  const adjustedScore = score / diffMultiplier;

  if (adjustedScore >= 40000 && lives > 0) return 'S';
  if (adjustedScore >= 25000) return 'A';
  if (adjustedScore >= 15000) return 'B';
  if (adjustedScore >= 5000) return 'C';
  return 'D';
}
