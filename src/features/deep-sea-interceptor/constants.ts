// ============================================================================
// Deep Sea Interceptor - 定数定義
// ============================================================================

import type { ItemType, Difficulty, EnemyType } from './types';

/** 画面スケール係数（旧 400x560 → 新 800x1000） */
export const SCALE = 2.0;

/** ゲーム全体の設定 */
export const Config = Object.freeze({
  canvas: { width: 800, height: 1000 },
  player: { size: 40, speed: 5, hitboxRatio: 0.4, maxLives: 5, maxPower: 5, maxSpeedLevel: 3 },
  bullet: {
    size: 12,
    speed: 14,
    chargedSize: 44,
    chargedSpeed: 12,
    chargedDamage: 5,
    chargeTime: 800,
  },
  enemy: { baseSize: 56, maxCount: (stage: number) => 10 + stage * 2 },
  timing: { invincibility: 2000, shield: 8000, spread: 10000 },
  spawn: { itemChance: 0.25, bossItemChance: 1, multiSpawnChance: 0.3 },
  limits: { maxBullets: 50, maxEnemyBullets: 100, maxParticles: 80, maxItems: 20, maxBubbles: 30 },
  /** アイテム吸引設定 */
  itemAttract: { range: 120, speed: 3.0, lingerTime: 3000 },
});

/** ステージ設定 */
export const StageConfig: Record<
  number,
  { name: string; bg: string; types: EnemyType[]; rate: number; bossScore: number; gimmick: string }
> = {
  1: { name: '浅層海域', bg: '#0a1a2a', types: ['basic', 'fast'], rate: 1000, bossScore: 8000, gimmick: 'current' },
  2: {
    name: '深海防衛ライン',
    bg: '#050f1a',
    types: ['basic', 'shooter', 'fast', 'tank'],
    rate: 800,
    bossScore: 20000,
    gimmick: 'minefield',
  },
  3: {
    name: '熱水噴出域',
    bg: '#1a0a05',
    types: ['shooter', 'fast', 'tank'],
    rate: 700,
    bossScore: 35000,
    gimmick: 'thermalVent',
  },
  4: {
    name: '生物発光帯',
    bg: '#050a1a',
    types: ['fast', 'shooter', 'tank'],
    rate: 600,
    bossScore: 50000,
    gimmick: 'bioluminescence',
  },
  5: {
    name: '最深部・海溝',
    bg: '#020810',
    types: ['shooter', 'fast', 'tank'],
    rate: 500,
    bossScore: 70000,
    gimmick: 'pressure',
  },
};

/** 敵タイプ別設定 */
export const EnemyConfig: Record<
  EnemyType,
  {
    hp: number;
    speed: number;
    points: number;
    sizeRatio: number;
    canShoot: boolean;
    fireRate: number;
  }
> = Object.freeze({
  basic: { hp: 1, speed: 2.4, points: 100, sizeRatio: 1.0, canShoot: false, fireRate: 0 },
  fast: { hp: 1, speed: 4.0, points: 150, sizeRatio: 0.9, canShoot: false, fireRate: 0 },
  shooter: { hp: 2, speed: 1.6, points: 200, sizeRatio: 1.1, canShoot: true, fireRate: 2000 },
  tank: { hp: 5, speed: 1.0, points: 300, sizeRatio: 1.4, canShoot: false, fireRate: 0 },
  boss: { hp: 60, speed: 0.7, points: 2000, sizeRatio: 3.5, canShoot: true, fireRate: 800 },
  boss1: { hp: 60, speed: 0.7, points: 2000, sizeRatio: 3.5, canShoot: true, fireRate: 800 },
  boss2: { hp: 70, speed: 0.5, points: 3000, sizeRatio: 3.8, canShoot: true, fireRate: 1000 },
  boss3: { hp: 80, speed: 0.8, points: 4000, sizeRatio: 4.0, canShoot: true, fireRate: 700 },
  boss4: { hp: 100, speed: 0.4, points: 5000, sizeRatio: 4.5, canShoot: true, fireRate: 600 },
  boss5: { hp: 150, speed: 0.5, points: 6000, sizeRatio: 5.0, canShoot: true, fireRate: 500 },
  // 機雷（Stage 2 ギミック）
  mine: { hp: 2, speed: 0, points: 50, sizeRatio: 0.8, canShoot: false, fireRate: 0 },
  // ミッドボス（各ステージ）
  midboss1: { hp: 16, speed: 1.0, points: 1000, sizeRatio: 2.0, canShoot: true, fireRate: 1200 },
  midboss2: { hp: 16, speed: 0.8, points: 1500, sizeRatio: 2.2, canShoot: true, fireRate: 1400 },
  midboss3: { hp: 16, speed: 0.9, points: 2000, sizeRatio: 2.4, canShoot: true, fireRate: 1000 },
  midboss4: { hp: 16, speed: 0.7, points: 2500, sizeRatio: 2.6, canShoot: true, fireRate: 900 },
  midboss5: { hp: 16, speed: 0.8, points: 3000, sizeRatio: 2.8, canShoot: true, fireRate: 800 },
});

/** アイテムタイプ別設定 */
export const ItemConfig: Record<ItemType, { color: string; label: string; description: string }> =
  Object.freeze({
    power: { color: '#ff6644', label: 'P', description: 'パワーアップ' },
    speed: { color: '#44ff66', label: 'S', description: 'スピードアップ' },
    shield: { color: '#4466ff', label: 'B', description: 'バリア' },
    spread: { color: '#ffff44', label: 'W', description: '3WAY' },
    bomb: { color: '#ff44ff', label: '★', description: '全滅' },
    life: { color: '#ff4444', label: '♥', description: 'ライフ+1' },
  });

/** 難易度設定 */
export const DifficultyConfig: Record<
  Difficulty,
  {
    label: string;
    spawnRateMultiplier: number;
    bulletSpeedMultiplier: number;
    initialLives: number;
    scoreMultiplier: number;
  }
> = Object.freeze({
  cadet: {
    label: 'CADET（初心者）',
    spawnRateMultiplier: 0.7,
    bulletSpeedMultiplier: 0.8,
    initialLives: 5,
    scoreMultiplier: 0.5,
  },
  standard: {
    label: 'STANDARD（通常）',
    spawnRateMultiplier: 1.0,
    bulletSpeedMultiplier: 1.0,
    initialLives: 3,
    scoreMultiplier: 1.0,
  },
  abyss: {
    label: 'ABYSS（上級）',
    spawnRateMultiplier: 1.3,
    bulletSpeedMultiplier: 1.2,
    initialLives: 2,
    scoreMultiplier: 2.0,
  },
});

// ================================================================
// ゲームロジック用定数（マジックナンバーの定数化）
// ================================================================

/** コンボタイマーのタイムアウト（ms） */
export const COMBO_TIMEOUT_MS = 3000;

/** ボス撃破後の待機時間（ms） */
export const BOSS_DEFEAT_DELAY_MS = 2000;

/** 海流方向の切替間隔（ms） */
export const CURRENT_CHANGE_INTERVAL_MS = 10000;

/** 海流の力の強さ */
export const CURRENT_FORCE = 0.7;

/** 海流の敵弾への影響係数 */
export const CURRENT_BULLET_FACTOR = 0.3;

/** 機雷スポーン判定間隔（ms） */
export const MINE_SPAWN_INTERVAL_MS = 3000;

/** 機雷の最大数 */
export const MINE_MAX_COUNT = 5;

/** 熱水柱の生成間隔（ms） */
export const THERMAL_VENT_INTERVAL_MS = 5000;

/** 熱水柱の幅 */
export const THERMAL_VENT_WIDTH = 80;

/** 熱水柱の予告時間（ms） */
export const THERMAL_VENT_WARNING_MS = 1000;

/** 熱水柱のアクティブ期間（ms） */
export const THERMAL_VENT_ACTIVE_MS = 2000;

/** 熱水柱の最大存在期間（ms） */
export const THERMAL_VENT_MAX_LIFE_MS = 3000;

/** 発光プランクトンの生成確率 */
export const BIOLUMINESCENCE_SPAWN_CHANCE = 0.05;

/** 発光持続時間（ms） */
export const BIOLUMINESCENCE_DURATION_MS = 3000;

/** 発光プランクトンの検知範囲 */
export const BIOLUMINESCENCE_DETECT_RANGE = 60;

/** 水圧ギミックの開始タイミング（ms） */
export const PRESSURE_START_MS = 30000;

/** 水圧の壁の収縮速度 */
export const PRESSURE_SHRINK_RATE = 0.02;

/** 水圧の壁の最小幅係数 */
export const PRESSURE_MIN_WIDTH_RATIO = 0.6;

/** グレイズスコア基本値 */
export const GRAZE_SCORE = 50;

/** コンボ倍率の最大値 */
export const MAX_COMBO_MULTIPLIER = 5.0;

/** コンボ倍率の増加係数 */
export const COMBO_MULTIPLIER_INCREMENT = 0.1;

/** ボスのフェーズ2移行HP比率 */
export const BOSS_PHASE2_HP_RATIO = 0.67;

/** ボスのフェーズ3移行HP比率 */
export const BOSS_PHASE3_HP_RATIO = 0.33;

/** ボス名一覧 */
export const BOSS_NAMES: Record<number, string> = {
  1: 'ANGLER GUARDIAN',
  2: 'MINE LAYER',
  3: 'THERMAL DRAGON',
  4: 'LUMINOUS LEVIATHAN',
  5: 'ABYSSAL CORE',
};

/** ボス撃破時の画面シェイク量 */
export const BOSS_DEFEAT_SCREEN_SHAKE = 500;

/** ボス撃破時の画面フラッシュ量 */
export const BOSS_DEFEAT_SCREEN_FLASH = 200;

/** ミッドボス撃破時の画面シェイク量 */
export const MIDBOSS_DEFEAT_SCREEN_SHAKE = 200;

/** ボスフェーズ変更時の画面シェイク量 */
export const BOSS_PHASE_CHANGE_SCREEN_SHAKE = 300;

/** WARNING演出の持続時間（ms） */
export const WARNING_DURATION_MS = 3000;

/** ボムアイテムのスコアボーナス */
export const BOMB_SCORE_BONUS = 500;

/** 武器別射撃クールダウン（ms） */
export const WEAPON_COOLDOWN: Record<import('./types').WeaponType, number> = {
  torpedo: 120,
  sonarWave: 150,
  bioMissile: 200,
};

/** フレーム時間（ms） - 60fps基準 */
export const FRAME_MS = 16;

/** カラーパレット */
export const ColorPalette: {
  enemy: Record<EnemyType, string>;
  ui: Record<string, string>;
  particle: Record<string, string>;
} = Object.freeze({
  enemy: {
    basic: '#3a8a5a',
    fast: '#5a5a8a',
    shooter: '#8a3a5a',
    tank: '#8a6a3a',
    boss: '#4a4a8a',
    boss1: '#3a6a3a',
    boss2: '#6a3a6a',
    boss3: '#8a3a1a',
    boss4: '#3a5a8a',
    boss5: '#5a2a5a',
    mine: '#8a8a3a',
    midboss1: '#6a8a3a',
    midboss2: '#3a6a8a',
    midboss3: '#8a5a1a',
    midboss4: '#5a3a8a',
    midboss5: '#8a3a3a',
  },
  ui: { primary: '#6ac', danger: '#f66', success: '#6f8', warning: '#fa0' },
  particle: {
    hit: '#88ffaa',
    charged: '#64c8ff',
    death: '#aaffcc',
    damage: '#ff6666',
    bomb: '#ffff88',
  },
});
