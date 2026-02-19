// ============================================================================
// Deep Sea Interceptor - ゲームロジック（純粋関数）
// ============================================================================

import { clamp as baseClamp, randomRange } from '../../utils/math-utils';
import { Config, StageConfig, ItemConfig } from './constants';
import { EntityFactory, randomChoice } from './entities';
import { MovementStrategies } from './movement';
import { Collision } from './collision';
import { EnemyAI } from './enemy-ai';
import type { GameState, UiState } from './types';

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
});

/** ゲームループ内の1フレーム更新を処理 */
export interface FrameResult {
  uiState: UiState;
  event: 'none' | 'gameover' | 'stageCleared' | 'ending';
}

/** 1フレームのゲーム状態を更新 */
export function updateFrame(
  gd: GameState,
  uiState: UiState,
  now: number,
  audioPlay: (name: string) => void
): FrameResult {
  const stg = StageConfig[uiState.stage];
  let currentUi = { ...uiState };
  let event: FrameResult['event'] = 'none';

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

  // 敵スポーン
  if (!gd.bossDefeated) {
    gd.spawnTimer += 16;
    if (gd.spawnTimer > stg.rate && gd.enemies.length < Config.enemy.maxCount(currentUi.stage)) {
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
    if (
      currentUi.score >= stg.bossScore &&
      !gd.enemies.some(e => e.enemyType === 'boss' || e.enemyType.startsWith('boss'))
    ) {
      const bossType = `boss${currentUi.stage}`;
      gd.enemies.push(EntityFactory.enemy(bossType, 200, -60, currentUi.stage));
    }
  }

  // エンティティ更新
  gd.bullets = gd.bullets.map(MovementStrategies.bullet).filter(b => b.y > -20 && b.y < 580);
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
      }

      const isBoss = e.enemyType === 'boss' || e.enemyType.startsWith('boss');
      const moveFn = isBoss
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
            score: currentUi.score + Math.floor(e.points * multiplier),
            combo: gd.combo,
            multiplier,
            maxCombo: gd.maxCombo,
          };
          if (e.enemyType === 'boss' || e.enemyType.startsWith('boss')) {
            gd.bossDefeated = true;
            gd.bossDefeatedTime = now;
            gd.items.push(EntityFactory.item(e.x, e.y, 'bomb'));
          } else if (Math.random() < 0.2)
            gd.items.push(EntityFactory.item(e.x, e.y, randomChoice(Object.keys(ItemConfig) as Array<keyof typeof ItemConfig>)));
        } else {
          audioPlay('hit');
        }
      }
    });
    return !hit || b.charged;
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
          if (e.enemyType !== 'boss') e.hp = 0;
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
      currentUi.stage++;
      gd.bossDefeated = false;
      gd.enemies = [];
      gd.enemyBullets = [];
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
