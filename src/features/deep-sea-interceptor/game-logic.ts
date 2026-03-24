// ============================================================================
// Deep Sea Interceptor - ゲームロジック（純粋関数）
// ============================================================================

import { clamp as baseClamp, randomRange } from '../../utils/math-utils';
import {
  Config, StageConfig, ItemConfig, DifficultyConfig,
  COMBO_TIMEOUT_MS, BOSS_DEFEAT_DELAY_MS,
  CURRENT_CHANGE_INTERVAL_MS, CURRENT_FORCE, CURRENT_BULLET_FACTOR,
  MINE_SPAWN_INTERVAL_MS, MINE_MAX_COUNT,
  THERMAL_VENT_INTERVAL_MS, THERMAL_VENT_WIDTH, THERMAL_VENT_WARNING_MS,
  THERMAL_VENT_ACTIVE_MS, THERMAL_VENT_MAX_LIFE_MS,
  BIOLUMINESCENCE_SPAWN_CHANCE, BIOLUMINESCENCE_DURATION_MS, BIOLUMINESCENCE_DETECT_RANGE,
  PRESSURE_START_MS, PRESSURE_SHRINK_RATE, PRESSURE_MIN_WIDTH_RATIO,
  GRAZE_SCORE, MAX_COMBO_MULTIPLIER, COMBO_MULTIPLIER_INCREMENT,
  BOSS_PHASE2_HP_RATIO, BOSS_PHASE3_HP_RATIO,
  BOSS_DEFEAT_SCREEN_SHAKE, BOSS_DEFEAT_SCREEN_FLASH,
  MIDBOSS_DEFEAT_SCREEN_SHAKE, BOSS_PHASE_CHANGE_SCREEN_SHAKE,
  WARNING_DURATION_MS, BOMB_SCORE_BONUS, FRAME_MS,
  BOSS5_SHELL_OPEN_MS, BOSS5_SHELL_CLOSE_MS,
  BOSS5_SUMMON_INTERVAL_MS, BOSS5_SUMMON_COUNT,
  BOSS5_PHASE3_BASE_FIRE_RATE, BOSS5_PHASE3_MIN_FIRE_RATE,
  BOSS5_PHASE3_SCREEN_SHAKE, BOSS5_PHASE3_FLASH_HP_RATIO,
  BOSS5_PHASE3_SCREEN_FLASH, BOSS5_SUMMON_X_MIN, BOSS5_SUMMON_X_MAX,
} from './constants';
import { EntityFactory, randomChoice, isBoss, isMidboss } from './entities';
import { MovementStrategies } from './movement';
import { Collision } from './collision';
import { EnemyAI } from './enemy-ai';
import type { GameState, UiState, Difficulty, Enemy, EnemyType, Bullet, EnemyBullet, Item, Position, AudioEvent } from './types';

/** 敵エンティティの移動関数型 */
type EnemyMoveFn = (e: Enemy) => Enemy;

/** clamp のカリー化ラッパー */
const clamp = (min: number, max: number) => (value: number) => baseClamp(value, min, max);

/** 初期ゲーム状態を生成 */
export const createInitialGameState = (): GameState => ({
  player: { x: Config.canvas.width / 2, y: Config.canvas.height - 160 },
  bullets: [],
  enemies: [],
  enemyBullets: [],
  items: [],
  particles: [],
  bubbles: [],
  charging: false,
  chargeLevel: 0,
  chargeStartTime: 0,
  lastShotTime: 0,
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
  testMode: false,
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
  if (now - gd.currentChangeTime > CURRENT_CHANGE_INTERVAL_MS) {
    gd.currentDirection *= -1;
    gd.currentChangeTime = now;
  }
  const force = gd.currentDirection * CURRENT_FORCE;
  gd.player.x += force;
  gd.enemyBullets.forEach(b => { b.vx += force * CURRENT_BULLET_FACTOR; });
}

/** Stage 2: 機雷原 — 機雷スポーン */
function applyMinefieldGimmick(gd: GameState, now: number, stage: number): void {
  if (now % MINE_SPAWN_INTERVAL_MS < FRAME_MS && gd.enemies.filter(e => e.enemyType === 'mine').length < MINE_MAX_COUNT) {
    gd.enemies.push(
      EntityFactory.enemy('mine' as EnemyType, randomRange(80, 720), randomRange(100, 600), stage)
    );
  }
}

/** Stage 3: 熱水柱 — 定期的に噴出 */
function applyThermalVentGimmick(gd: GameState, now: number): void {
  gd.thermalVentTimer += FRAME_MS;
  if (gd.thermalVentTimer > THERMAL_VENT_INTERVAL_MS) {
    gd.thermalVentTimer = 0;
    const x = randomRange(80, 720);
    gd.thermalVents.push({
      x,
      width: THERMAL_VENT_WIDTH,
      active: false,
      startTime: now + THERMAL_VENT_WARNING_MS,
      warningTime: now,
    });
  }
  // 熱水柱の更新
  gd.thermalVents = gd.thermalVents.filter(v => {
    if (!v.active && now >= v.startTime) {
      v.active = true;
    }
    if (v.active && now - v.startTime > THERMAL_VENT_ACTIVE_MS) return false;
    if (now - v.warningTime > THERMAL_VENT_MAX_LIFE_MS) return false;
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
  if (Math.random() < BIOLUMINESCENCE_SPAWN_CHANCE && gd.particles.length < 60) {
    gd.particles.push(EntityFactory.particle(
      randomRange(20, 780),
      randomRange(20, 980),
      { color: '#44ffaa', velocity: { x: (Math.random() - 0.5) * 0.5, y: -0.3 }, life: 120 }
    ));
  }
  // プレイヤーが発光粒子に近づくと明るくなる
  if (!gd.luminescence) {
    const nearParticle = gd.particles.some(p =>
      p.color === '#44ffaa' &&
      Math.abs(p.x - gd.player.x) < BIOLUMINESCENCE_DETECT_RANGE &&
      Math.abs(p.y - gd.player.y) < BIOLUMINESCENCE_DETECT_RANGE
    );
    if (nearParticle) {
      gd.luminescence = true;
      gd.luminescenceEndTime = now + BIOLUMINESCENCE_DURATION_MS;
    }
  }
  if (gd.luminescence && now > gd.luminescenceEndTime) {
    gd.luminescence = false;
  }
}

/** Stage 5: 水圧 — 一定時間後から壁が収縮 */
function applyPressureGimmick(gd: GameState, now: number): void {
  const elapsed = now - gd.gameStartTime;
  if (elapsed > PRESSURE_START_MS && !gd.bossDefeated) {
    const minWidth = Config.canvas.width * PRESSURE_MIN_WIDTH_RATIO;
    const targetHalfWidth = Math.max(minWidth / 2, Config.canvas.width / 2 - (elapsed - PRESSURE_START_MS) * PRESSURE_SHRINK_RATE / FRAME_MS);
    const cx = Config.canvas.width / 2;
    gd.pressureBounds.left = cx - targetHalfWidth;
    gd.pressureBounds.right = cx + targetHalfWidth;
    // プレイヤーを壁内に制限
    gd.player.x = clamp(gd.pressureBounds.left + 30, gd.pressureBounds.right - 30)(gd.player.x);
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
    x: clamp(30, Config.canvas.width - 30)(player.x + input.dx * speed),
    y: clamp(30, Config.canvas.height - 100)(player.y + input.dy * speed),
  };
}

/** 2-3: 敵タイプと移動パターンから移動戦略を取得 */
export function getMovementStrategy(
  enemyType: EnemyType | string,
  movementPattern: number
): EnemyMoveFn {
  if (enemyType === 'boss' || enemyType.startsWith('boss') || enemyType.startsWith('midboss')) {
    return MovementStrategies.boss;
  }
  const strategies: readonly EnemyMoveFn[] = [
    MovementStrategies.straight,
    MovementStrategies.sine,
    MovementStrategies.drift,
  ];
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
        // Boss5 第1形態: 外殻が閉じている間はダメージ無効（貫通弾は貫通する）
        if (e.enemyType === 'boss5' && e.bossPhase === 1 && !e.shellOpen) {
          if (!b.piercing) hit = true;
          audioEvents.push({ name: 'hit' });
          return;
        }
        hit = true;
        enemyHps[idx] -= b.damage;
        if (enemyHps[idx] <= 0) {
          audioEvents.push({ name: 'destroy' });
          combo++;
          comboTimer = Date.now();
          maxCombo = Math.max(maxCombo, combo);
          const multiplier = Math.min(MAX_COMBO_MULTIPLIER, 1.0 + combo * COMBO_MULTIPLIER_INCREMENT);
          scoreDelta += Math.floor(e.points * multiplier * diffConfig.scoreMultiplier);
          if (isBoss(e)) {
            bossDefeated = true;
            screenShake = BOSS_DEFEAT_SCREEN_SHAKE;
            screenFlash = BOSS_DEFEAT_SCREEN_FLASH;
            newItems.push(EntityFactory.item(e.x, e.y, 'bomb'));
            newItems.push(EntityFactory.item(e.x + 30, e.y, 'power'));
            for (let i = 0; i < 20; i++) {
              newParticles.push(EntityFactory.particle(
                e.x + randomRange(-60, 60),
                e.y + randomRange(-60, 60),
                { color: randomChoice(['#ff6', '#f80', '#fa0', '#ff4']) },
              ));
            }
          } else if (isMidboss(e)) {
            screenShake = MIDBOSS_DEFEAT_SCREEN_SHAKE;
            const dropItem = Math.random() < 0.5 ? 'life' : 'power';
            newItems.push(EntityFactory.item(e.x, e.y, dropItem as 'life' | 'power'));
            // 確定追加ドロップ
            newItems.push(EntityFactory.item(e.x + 20, e.y, randomChoice(['power', 'speed', 'shield'] as Array<'power' | 'speed' | 'shield'>)));
            for (let i = 0; i < 10; i++) {
              newParticles.push(EntityFactory.particle(
                e.x + randomRange(-40, 40),
                e.y + randomRange(-40, 40),
                { color: randomChoice(['#88f', '#aaf', '#66f']) },
              ));
            }
          } else if (Math.random() < Config.spawn.itemChance) {
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
  // 完全な UiState のコピーで as キャストを排除
  const updatedUi: UiState = { ...uiState };
  let clearBullets = false;
  // 敵 HP のコピー
  const updatedEnemies = enemies.map(e => ({ ...e }));

  const remainingItems = items.filter(i => {
    if (Collision.playerItem(player, i)) {
      audioEvents.push({ name: 'item' });
      if (i.itemType === 'power') updatedUi.power = updatedUi.power + 1;
      if (i.itemType === 'shield') updatedUi.shieldEndTime = now + 8000;
      if (i.itemType === 'speed')
        updatedUi.speedLevel = Math.min(3, (updatedUi.speedLevel || 0) + 1);
      if (i.itemType === 'life')
        updatedUi.lives = updatedUi.testMode
          ? updatedUi.lives + 1
          : Math.min(Config.player.maxLives, updatedUi.lives + 1);
      if (i.itemType === 'spread') updatedUi.spreadTime = now + 10000;
      if (i.itemType === 'bomb') {
        updatedEnemies.forEach(e => {
          if (!isBoss(e)) e.hp = 0;
        });
        clearBullets = true;
        updatedUi.score = updatedUi.score + BOMB_SCORE_BONUS;
      }
      return false;
    }
    return true;
  });

  return { remainingItems, uiChanges: updatedUi, enemies: updatedEnemies, audioEvents, clearBullets };
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
    invincibleEndTime: isGameOver ? state.invincibleEndTime : now + Config.timing.invincibility,
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
      const multiplier = Math.min(MAX_COMBO_MULTIPLIER, 1.0 + currentCombo * COMBO_MULTIPLIER_INCREMENT);
      scoreDelta += Math.floor(GRAZE_SCORE * multiplier);
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
  if (!bossDefeated || now - bossDefeatedTime <= BOSS_DEFEAT_DELAY_MS) {
    return { event: 'none', nextStage: stage, bonus: 0 };
  }

  if (stage < 5) {
    const bonus = 1000 * stage + maxCombo * 10 + grazeCount * 5;
    return { event: 'stageCleared', nextStage: stage + 1, bonus };
  }

  return { event: 'ending', nextStage: stage, bonus: 0 };
}

// ================================================================
// updateFrame サブ関数群（ファイル内プライベート）
// ================================================================

/** Boss5 の各フェーズに応じた特殊処理を適用 */
export function updateBoss5State(
  e: Enemy,
  gd: GameState,
  now: number,
  currentUi: UiState,
  summonedEnemies: Enemy[]
): void {
  // 第1形態: 外殻の開閉
  if (e.bossPhase === 1) {
    const shellTimer = now - (e.shellToggleTime ?? 0);
    const isOpen = e.shellOpen ?? false;
    if (isOpen && shellTimer > BOSS5_SHELL_OPEN_MS) {
      e.shellOpen = false;
      e.shellToggleTime = now;
    } else if (!isOpen && shellTimer > BOSS5_SHELL_CLOSE_MS) {
      e.shellOpen = true;
      e.shellToggleTime = now;
    }
  }
  // 第2形態: 雑魚召喚
  if (e.bossPhase === 2) {
    const lastSummon = e.lastSummonTime ?? 0;
    if (now - lastSummon > BOSS5_SUMMON_INTERVAL_MS) {
      e.lastSummonTime = now;
      for (let i = 0; i < BOSS5_SUMMON_COUNT; i++) {
        summonedEnemies.push(
          EntityFactory.enemy('basic', randomRange(BOSS5_SUMMON_X_MIN, BOSS5_SUMMON_X_MAX), -60, currentUi.stage)
        );
      }
    }
  }
  // 第3形態: HP依存の攻撃間隔短縮 + 常時画面微振動
  if (e.bossPhase === 3) {
    const hpRatio = e.hp / e.maxHp;
    e.fireRate = Math.max(
      BOSS5_PHASE3_MIN_FIRE_RATE,
      Math.floor(BOSS5_PHASE3_BASE_FIRE_RATE * (0.5 + hpRatio * 0.5))
    );
    gd.screenShake = Math.max(gd.screenShake, BOSS5_PHASE3_SCREEN_SHAKE);
    if (hpRatio < BOSS5_PHASE3_FLASH_HP_RATIO) {
      gd.screenFlash = Math.max(gd.screenFlash, BOSS5_PHASE3_SCREEN_FLASH);
    }
  }
}

/** 単一の敵エンティティを更新（フェーズ遷移・Boss5特殊処理・移動・射撃） */
function updateSingleEnemy(
  e: Enemy,
  gd: GameState,
  now: number,
  currentUi: UiState,
  audioEvents: AudioEvent[],
  summonedEnemies: Enemy[]
): Enemy {
  // Boss5 特殊処理（フェーズ遷移前に実行し、外殻開閉等がスキップされないようにする）
  if (e.enemyType === 'boss5') {
    updateBoss5State(e, gd, now, currentUi, summonedEnemies);
  }

  // ボスのフェーズ遷移チェック（3フェーズ対応）
  if (isBoss(e) && e.bossPhase === 1 && e.hp <= e.maxHp * BOSS_PHASE2_HP_RATIO) {
    e.bossPhase = 2;
    audioEvents.push({ name: 'bossPhaseChange' });
    gd.enemyBullets = [];
    gd.screenShake = BOSS_PHASE_CHANGE_SCREEN_SHAKE;
  }
  if (isBoss(e) && e.bossPhase === 2 && e.hp <= e.maxHp * BOSS_PHASE3_HP_RATIO) {
    e.bossPhase = 3;
    audioEvents.push({ name: 'bossPhaseChange' });
    gd.enemyBullets = [];
    gd.screenShake = BOSS_PHASE_CHANGE_SCREEN_SHAKE;
  }

  // 移動戦略取得（サブ関数利用）
  const moveFn = getMovementStrategy(e.enemyType, e.movementPattern);
  const next = moveFn(e);
  if (e.canShoot && now - e.lastShotAt > e.fireRate && e.y > 0) {
    next.lastShotAt = now;
    gd.enemyBullets.push(...EnemyAI.createBullets(next, gd.player));
  }
  return next;
}

/** 敵のスポーン処理（通常敵・ミッドボス・ボスWARNING） */
function spawnEnemies(
  gd: GameState,
  stg: typeof StageConfig[number],
  diffConfig: typeof DifficultyConfig[Difficulty],
  currentUi: UiState,
  now: number,
  audioEvents: AudioEvent[]
): void {
  if (gd.bossDefeated || gd.bossWarning) return;

  gd.spawnTimer += FRAME_MS;
  if (gd.spawnTimer > stg.rate / diffConfig.spawnRateMultiplier && gd.enemies.length < Config.enemy.maxCount(currentUi.stage)) {
    gd.enemies.push(
      EntityFactory.enemy(
        randomChoice(stg.types),
        randomRange(60, 740),
        -80,
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
    const midbossType = `midboss${currentUi.stage}` as EnemyType;
    gd.enemies.push(EntityFactory.enemy(midbossType, 400, -100, currentUi.stage));
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

/** エンティティ（弾・敵弾・パーティクル・アイテム）の移動更新 */
function updateEntities(gd: GameState, _now: number): void {
  gd.bullets = gd.bullets
    .map(b => {
      if (b.lifespan !== undefined) b = { ...b, lifespan: b.lifespan - 1 };
      if (b.homing) return MovementStrategies.homing(b, gd.enemies);
      return MovementStrategies.bullet(b);
    })
    .filter(b => b.y > -40 && b.y < Config.canvas.height + 40 && (b.lifespan === undefined || b.lifespan > 0));
  gd.enemyBullets = gd.enemyBullets
    .map(MovementStrategies.enemyBullet)
    .filter(b => b.y < Config.canvas.height + 30 && b.x > -30 && b.x < Config.canvas.width + 30);
  gd.particles = gd.particles.map(MovementStrategies.particle).filter(p => p.life > 0);
  // アイテム: 吸引 + 画面下部滞留
  gd.items = gd.items.map(i => {
    const dx = gd.player.x - i.x;
    const dy = gd.player.y - i.y;
    const dist = Math.hypot(dx, dy);
    // 吸引範囲内なら引き寄せる
    if (dist < Config.itemAttract.range && dist > 0) {
      const factor = Config.itemAttract.speed / dist;
      return { ...i, x: i.x + dx * factor, y: i.y + dy * factor };
    }
    return MovementStrategies.item(i);
  }).filter(i => i.y < Config.canvas.height + 60);
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
  if (gd.screenShake > 0) gd.screenShake = Math.max(0, gd.screenShake - FRAME_MS);
  if (gd.screenFlash > 0) gd.screenFlash = Math.max(0, gd.screenFlash - FRAME_MS);

  // WARNING演出チェック
  if (gd.bossWarning) {
    if (now - gd.bossWarningStartTime > WARNING_DURATION_MS) {
      gd.bossWarning = false;
      const bossType = `boss${currentUi.stage}` as EnemyType;
      gd.enemies.push(EntityFactory.enemy(bossType, 400, -120, currentUi.stage));
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
  gd.player.x = clamp(30, Config.canvas.width - 30)(gd.player.x);
  gd.player.y = clamp(30, Config.canvas.height - 100)(gd.player.y);

  // 敵スポーン
  spawnEnemies(gd, stg, diffConfig, currentUi, now, audioEvents);

  // エンティティ更新
  updateEntities(gd, now);

  // Boss5 第2形態の雑魚召喚用（イテレーション中の push を回避）
  const summonedEnemies: Enemy[] = [];

  // 敵の個別更新（フェーズ遷移・Boss5特殊処理・移動・射撃）
  gd.enemies = gd.enemies
    .map(e => updateSingleEnemy(e, gd, now, currentUi, audioEvents, summonedEnemies))
    .filter(e => e.y < Config.canvas.height + 60);

  // 召喚された雑魚敵を追加（map完了後に安全に追加）
  if (summonedEnemies.length > 0) {
    gd.enemies.push(...summonedEnemies);
  }

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
    multiplier: Math.min(MAX_COMBO_MULTIPLIER, 1.0 + gd.combo * COMBO_MULTIPLIER_INCREMENT),
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
  if (gd.combo > 0 && now - gd.comboTimer > COMBO_TIMEOUT_MS) {
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
