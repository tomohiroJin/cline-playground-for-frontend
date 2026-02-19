// ============================================================================
// Deep Sea Interceptor - ゲームロジック（純粋関数）
// ============================================================================

import { clamp as baseClamp, randomRange } from '../../utils/math-utils';
import { Config, StageConfig, ItemConfig, DifficultyConfig } from './constants';
import { EntityFactory, randomChoice, isBoss, isMidboss } from './entities';
import { MovementStrategies } from './movement';
import { Collision } from './collision';
import { EnemyAI } from './enemy-ai';
import type { GameState, UiState, Difficulty, Enemy, Bullet, EnemyBullet, Item, Position, AudioEvent } from './types';

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

// ================================================================
// サブ関数群（純粋関数）
// ================================================================

/** 2-1: 入力を解決（キーボード優先、タッチフォールバック） */
export function resolvePlayerInput(
  keys: Record<string, boolean>,
  touchInput: { dx: number; dy: number }
): { dx: number; dy: number } {
  let dx = touchInput.dx;
  let dy = touchInput.dy;
  if (keys['ArrowLeft'] || keys['a']) dx = -1;
  if (keys['ArrowRight'] || keys['d']) dx = 1;
  if (keys['ArrowUp'] || keys['w']) dy = -1;
  if (keys['ArrowDown'] || keys['s']) dy = 1;
  return { dx, dy };
}

/** 2-2: プレイヤー位置を更新（クランプ付き） */
export function updatePlayerPosition(
  player: Position,
  input: { dx: number; dy: number },
  speed: number
): Position {
  return {
    x: clamp(15, Config.canvas.width - 15)(player.x + input.dx * speed),
    y: clamp(15, Config.canvas.height - 50)(player.y + input.dy * speed),
  };
}

/** 2-3: 敵タイプと移動パターンから移動戦略を取得 */
export function getMovementStrategy(
  enemyType: string,
  movementPattern: number
): typeof MovementStrategies[keyof typeof MovementStrategies] {
  if (enemyType === 'boss' || enemyType.startsWith('boss') || enemyType.startsWith('midboss')) {
    return MovementStrategies.boss;
  }
  const strategies = [MovementStrategies.straight, MovementStrategies.sine, MovementStrategies.drift] as const;
  return strategies[movementPattern] ?? MovementStrategies.straight;
}

/** 2-4: 弾-敵衝突結果 */
export interface CollisionResult {
  bullets: Bullet[];
  enemies: Enemy[];
  scoreDelta: number;
  comboState: { combo: number; maxCombo: number; comboTimer: number };
  items: Item[];
  particles: import('./types').Particle[];
  audioEvents: AudioEvent[];
  bossDefeated: boolean;
  screenShake: number;
  screenFlash: number;
}

/** 2-4: 弾-敵衝突処理（純粋関数） */
export function processBulletEnemyCollisions(
  bullets: Bullet[],
  enemies: Enemy[],
  currentCombo: number,
  diffConfig: { scoreMultiplier: number },
): CollisionResult {
  const audioEvents: AudioEvent[] = [];
  const newItems: Item[] = [];
  const newParticles: import('./types').Particle[] = [];
  let combo = currentCombo;
  let maxCombo = currentCombo;
  let comboTimer = 0;
  let scoreDelta = 0;
  let bossDefeated = false;
  let screenShake = 0;
  let screenFlash = 0;

  // 敵の HP を一時コピー（ミューテーション回避）
  const enemyHps = enemies.map(e => e.hp);

  const survivingBullets = bullets.filter(b => {
    let hit = false;
    enemies.forEach((e, idx) => {
      if (enemyHps[idx] > 0 && Collision.bulletEnemy(b, e)) {
        hit = true;
        enemyHps[idx] -= b.damage;
        if (enemyHps[idx] <= 0) {
          audioEvents.push({ name: 'destroy' });
          combo++;
          comboTimer = Date.now();
          maxCombo = Math.max(maxCombo, combo);
          const multiplier = Math.min(5.0, 1.0 + combo * 0.1);
          scoreDelta += Math.floor(e.points * multiplier * diffConfig.scoreMultiplier);
          if (isBoss(e)) {
            bossDefeated = true;
            screenShake = 500;
            screenFlash = 200;
            newItems.push(EntityFactory.item(e.x, e.y, 'bomb'));
            for (let i = 0; i < 20; i++) {
              newParticles.push(EntityFactory.particle(
                e.x + randomRange(-30, 30),
                e.y + randomRange(-30, 30),
                { color: randomChoice(['#ff6', '#f80', '#fa0', '#ff4']) },
              ));
            }
          } else if (isMidboss(e)) {
            screenShake = 200;
            const dropItem = Math.random() < 0.5 ? 'life' : 'power';
            newItems.push(EntityFactory.item(e.x, e.y, dropItem as 'life' | 'power'));
            for (let i = 0; i < 10; i++) {
              newParticles.push(EntityFactory.particle(
                e.x + randomRange(-20, 20),
                e.y + randomRange(-20, 20),
                { color: randomChoice(['#88f', '#aaf', '#66f']) },
              ));
            }
          } else if (Math.random() < 0.2) {
            newItems.push(EntityFactory.item(e.x, e.y, randomChoice(Object.keys(ItemConfig) as Array<keyof typeof ItemConfig>)));
          }
        } else {
          audioEvents.push({ name: 'hit' });
        }
      }
    });
    return !hit || b.piercing;
  });

  // HP を反映した敵リスト
  const survivingEnemies = enemies
    .map((e, idx) => ({ ...e, hp: enemyHps[idx] }))
    .filter(e => e.hp > 0);

  return {
    bullets: survivingBullets,
    enemies: survivingEnemies,
    scoreDelta,
    comboState: { combo, maxCombo, comboTimer },
    items: newItems,
    particles: newParticles,
    audioEvents,
    bossDefeated,
    screenShake,
    screenFlash,
  };
}

/** 2-5: アイテム収集結果 */
export interface ItemCollectionResult {
  remainingItems: Item[];
  uiChanges: Partial<UiState>;
  enemies: Enemy[];
  audioEvents: AudioEvent[];
  clearBullets: boolean;
}

/** 2-5: アイテム収集処理（純粋関数） */
export function processItemCollection(
  player: Position,
  items: Item[],
  uiState: UiState,
  enemies: Enemy[],
  now: number,
): ItemCollectionResult {
  const audioEvents: AudioEvent[] = [];
  const uiChanges: Partial<UiState> = { ...uiState };
  let clearBullets = false;
  // 敵 HP のコピー
  const updatedEnemies = enemies.map(e => ({ ...e }));

  const remainingItems = items.filter(i => {
    if (Collision.playerItem(player, i)) {
      audioEvents.push({ name: 'item' });
      if (i.itemType === 'power') (uiChanges as UiState).power = (uiChanges as UiState).power + 1;
      if (i.itemType === 'shield') (uiChanges as UiState).shieldEndTime = now + 8000;
      if (i.itemType === 'speed')
        (uiChanges as UiState).speedLevel = Math.min(3, ((uiChanges as UiState).speedLevel || 0) + 1);
      if (i.itemType === 'life')
        (uiChanges as UiState).lives = Math.min(Config.player.maxLives, (uiChanges as UiState).lives + 1);
      if (i.itemType === 'spread') (uiChanges as UiState).spreadTime = now + 10000;
      if (i.itemType === 'bomb') {
        updatedEnemies.forEach(e => {
          if (!isBoss(e)) e.hp = 0;
        });
        clearBullets = true;
        (uiChanges as UiState).score = (uiChanges as UiState).score + 500;
      }
      return false;
    }
    return true;
  });

  return { remainingItems, uiChanges, enemies: updatedEnemies, audioEvents, clearBullets };
}

/** 2-6: プレイヤーダメージ結果 */
export interface DamageResult {
  hit: boolean;
  livesLost: number;
  invincible: boolean;
  invincibleEndTime: number;
  comboReset: boolean;
  event: 'none' | 'gameover';
  audioEvents: AudioEvent[];
}

/** 2-6: プレイヤーダメージ処理（純粋関数） */
export function processPlayerDamage(
  player: Position,
  enemies: Enemy[],
  enemyBullets: EnemyBullet[],
  state: {
    invincible: boolean;
    invincibleEndTime: number;
    shieldEndTime: number;
    lives: number;
    combo: number;
  },
  now: number,
): DamageResult {
  const audioEvents: AudioEvent[] = [];

  // 無敵中またはシールド中はダメージなし
  if (state.invincible || now <= state.shieldEndTime) {
    return {
      hit: false,
      livesLost: 0,
      invincible: state.invincible,
      invincibleEndTime: state.invincibleEndTime,
      comboReset: false,
      event: 'none',
      audioEvents,
    };
  }

  let hit = false;
  if (enemies.some(e => Collision.playerEnemy(player, e))) hit = true;
  if (enemyBullets.some(b => Collision.playerEnemyBullet(player, b))) hit = true;

  if (!hit) {
    return {
      hit: false,
      livesLost: 0,
      invincible: state.invincible,
      invincibleEndTime: state.invincibleEndTime,
      comboReset: false,
      event: 'none',
      audioEvents,
    };
  }

  audioEvents.push({ name: 'destroy' });
  const newLives = state.lives - 1;
  const isGameOver = newLives <= 0;

  return {
    hit: true,
    livesLost: 1,
    invincible: !isGameOver,
    invincibleEndTime: isGameOver ? state.invincibleEndTime : now + 2000,
    comboReset: true,
    event: isGameOver ? 'gameover' : 'none',
    audioEvents,
  };
}

/** 2-7: グレイズ結果 */
export interface GrazeResult {
  grazeCount: number;
  scoreDelta: number;
  newGrazedIds: Set<number>;
  comboTimer: number;
  grazeFlashTime: number;
  audioEvents: AudioEvent[];
}

/** 2-7: グレイズ判定処理（純粋関数） */
export function processGraze(
  player: Position,
  enemyBullets: EnemyBullet[],
  grazedBulletIds: Set<number>,
  currentCombo: number,
  uiState: UiState,
  now: number,
): GrazeResult {
  const audioEvents: AudioEvent[] = [];
  const newGrazedIds = new Set(grazedBulletIds);
  let grazeCount = 0;
  let scoreDelta = 0;
  let comboTimer = 0;
  let grazeFlashTime = 0;

  enemyBullets.forEach(b => {
    if (!newGrazedIds.has(b.id) && Collision.graze(player, b)) {
      newGrazedIds.add(b.id);
      grazeCount++;
      comboTimer = now;
      grazeFlashTime = now;
      const multiplier = Math.min(5.0, 1.0 + currentCombo * 0.1);
      scoreDelta += Math.floor(50 * multiplier);
      audioEvents.push({ name: 'graze' });
    }
  });

  return { grazeCount, scoreDelta, newGrazedIds, comboTimer, grazeFlashTime, audioEvents };
}

/** 2-8: ステージ進行結果 */
export interface StageProgressionResult {
  event: 'none' | 'stageCleared' | 'ending';
  nextStage: number;
  bonus: number;
}

/** 2-8: ステージ進行判定（純粋関数） */
export function checkStageProgression(
  bossDefeated: boolean,
  bossDefeatedTime: number,
  stage: number,
  score: number,
  maxCombo: number,
  grazeCount: number,
  now: number,
): StageProgressionResult {
  if (!bossDefeated || now - bossDefeatedTime <= 2000) {
    return { event: 'none', nextStage: stage, bonus: 0 };
  }

  if (stage < 5) {
    const bonus = 1000 * stage + maxCombo * 10 + grazeCount * 5;
    return { event: 'stageCleared', nextStage: stage + 1, bonus };
  }

  return { event: 'ending', nextStage: stage, bonus: 0 };
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
  const audioEvents: AudioEvent[] = [];

  // 演出タイマー減衰
  if (gd.screenShake > 0) gd.screenShake = Math.max(0, gd.screenShake - 16);
  if (gd.screenFlash > 0) gd.screenFlash = Math.max(0, gd.screenFlash - 16);

  // WARNING演出チェック
  if (gd.bossWarning) {
    if (now - gd.bossWarningStartTime > 2000) {
      gd.bossWarning = false;
      const bossType = `boss${currentUi.stage}`;
      gd.enemies.push(EntityFactory.enemy(bossType, 200, -60, currentUi.stage));
      audioEvents.push({ name: 'bossAppear' });
    }
  }

  // 泡の更新
  if (Math.random() < 0.07 && gd.bubbles.length < 35) gd.bubbles.push(EntityFactory.bubble());
  gd.bubbles = gd.bubbles
    .map(MovementStrategies.bubble)
    .filter(b => b.y > -10 && b.opacity > 0);

  // プレイヤー移動（サブ関数利用）
  const input = resolvePlayerInput(gd.keys, gd.input);
  const speed = Config.player.speed + (currentUi.speedLevel || 0);
  const newPos = updatePlayerPosition(gd.player, input, speed);
  gd.player.x = newPos.x;
  gd.player.y = newPos.y;

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
      !gd.enemies.some(e => isMidboss(e))
    ) {
      const midbossType = `midboss${currentUi.stage}`;
      gd.enemies.push(EntityFactory.enemy(midbossType, 200, -50, currentUi.stage));
      gd.midBossSpawned = true;
    }
    // ボスWARNING開始
    if (
      currentUi.score >= stg.bossScore &&
      !gd.bossWarning &&
      !gd.enemies.some(e => isBoss(e))
    ) {
      gd.bossWarning = true;
      gd.bossWarningStartTime = now;
      audioEvents.push({ name: 'warning' });
    }
  }

  // エンティティ更新
  gd.bullets = gd.bullets
    .map(b => {
      if (b.lifespan !== undefined) b = { ...b, lifespan: b.lifespan - 1 };
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
      if (isBoss(e) && e.bossPhase === 1 && e.hp <= e.maxHp * 0.5) {
        e.bossPhase = 2;
        audioEvents.push({ name: 'bossPhaseChange' });
        gd.enemyBullets = [];
        gd.screenShake = 300;
      }

      // 移動戦略取得（サブ関数利用）
      const moveFn = getMovementStrategy(e.enemyType, e.movementPattern);
      const next = moveFn(e);
      if (e.canShoot && now - e.lastShotAt > e.fireRate && e.y > 0) {
        next.lastShotAt = now;
        gd.enemyBullets.push(...EnemyAI.createBullets(next, gd.player));
      }
      return next;
    })
    .filter(e => e.y < 600);

  // 衝突判定: 弾 → 敵（サブ関数利用）
  const collisionResult = processBulletEnemyCollisions(gd.bullets, gd.enemies, gd.combo, diffConfig);
  gd.bullets = collisionResult.bullets;
  gd.enemies = collisionResult.enemies;
  gd.combo = collisionResult.comboState.combo;
  gd.comboTimer = collisionResult.comboState.comboTimer || gd.comboTimer;
  gd.maxCombo = collisionResult.comboState.maxCombo;
  gd.items.push(...collisionResult.items);
  gd.particles.push(...collisionResult.particles);
  audioEvents.push(...collisionResult.audioEvents);
  if (collisionResult.bossDefeated) {
    gd.bossDefeated = true;
    gd.bossDefeatedTime = now;
  }
  if (collisionResult.screenShake > gd.screenShake) gd.screenShake = collisionResult.screenShake;
  if (collisionResult.screenFlash > gd.screenFlash) gd.screenFlash = collisionResult.screenFlash;
  currentUi = {
    ...currentUi,
    score: currentUi.score + collisionResult.scoreDelta,
    combo: gd.combo,
    multiplier: Math.min(5.0, 1.0 + gd.combo * 0.1),
    maxCombo: gd.maxCombo,
  };

  // 衝突判定: プレイヤー → アイテム（サブ関数利用）
  const itemResult = processItemCollection(gd.player, gd.items, currentUi, gd.enemies, now);
  gd.items = itemResult.remainingItems;
  gd.enemies = itemResult.enemies;
  currentUi = { ...currentUi, ...itemResult.uiChanges };
  audioEvents.push(...itemResult.audioEvents);
  if (itemResult.clearBullets) gd.enemyBullets = [];

  // グレイズ判定（被弾判定前に実施、サブ関数利用）
  if (!gd.invincible && now > (currentUi.shieldEndTime || 0)) {
    const grazeResult = processGraze(gd.player, gd.enemyBullets, gd.grazedBulletIds, gd.combo, currentUi, now);
    gd.grazeCount += grazeResult.grazeCount;
    gd.grazedBulletIds = grazeResult.newGrazedIds;
    if (grazeResult.comboTimer) gd.comboTimer = grazeResult.comboTimer;
    if (grazeResult.grazeFlashTime) gd.grazeFlashTime = grazeResult.grazeFlashTime;
    currentUi = {
      ...currentUi,
      score: currentUi.score + grazeResult.scoreDelta,
      grazeCount: gd.grazeCount,
    };
    audioEvents.push(...grazeResult.audioEvents);
  }

  // 衝突判定: プレイヤー → 敵/敵弾（サブ関数利用）
  const damageResult = processPlayerDamage(gd.player, gd.enemies, gd.enemyBullets, {
    invincible: gd.invincible,
    invincibleEndTime: gd.invincibleEndTime,
    shieldEndTime: currentUi.shieldEndTime || 0,
    lives: currentUi.lives,
    combo: gd.combo,
  }, now);
  audioEvents.push(...damageResult.audioEvents);
  if (damageResult.hit) {
    gd.combo = 0;
    currentUi = { ...currentUi, combo: 0, multiplier: 1.0 };
    currentUi.lives -= damageResult.livesLost;
    if (damageResult.event === 'gameover') {
      event = 'gameover';
      if (currentUi.score > currentUi.highScore) {
        currentUi.highScore = currentUi.score;
      }
    } else {
      gd.invincible = damageResult.invincible;
      gd.invincibleEndTime = damageResult.invincibleEndTime;
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

  // ステージクリア判定（サブ関数利用）
  const stageResult = checkStageProgression(
    gd.bossDefeated, gd.bossDefeatedTime, currentUi.stage,
    currentUi.score, gd.maxCombo, gd.grazeCount, now
  );
  if (stageResult.event === 'stageCleared') {
    currentUi.score += stageResult.bonus;
    currentUi.stage = stageResult.nextStage;
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
  } else if (stageResult.event === 'ending') {
    event = 'ending';
    if (currentUi.score > currentUi.highScore) {
      currentUi.highScore = currentUi.score;
    }
  }

  // 集約した AudioEvent を一括再生（副作用を関数末尾に集約）
  audioEvents.forEach(e => audioPlay(e.name));

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
