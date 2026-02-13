// ============================================================================
// Deep Sea Interceptor - 定数定義
// ============================================================================

import type { EnemyType, ItemType } from './types';

/** ゲーム全体の設定 */
export const Config = Object.freeze({
  canvas: { width: 400, height: 560 },
  player: { size: 20, speed: 4, hitboxRatio: 0.4, maxLives: 5, maxPower: 5 },
  bullet: {
    size: 6,
    speed: 11,
    chargedSize: 22,
    chargedSpeed: 9,
    chargedDamage: 5,
    chargeTime: 800,
  },
  enemy: { baseSize: 28, maxCount: (stage: number) => 10 + stage * 2 },
  timing: { invincibility: 2000, shield: 8000, spread: 10000 },
  spawn: { itemChance: 0.2, bossItemChance: 1, multiSpawnChance: 0.3 },
  limits: { maxBullets: 50, maxEnemyBullets: 100, maxParticles: 80, maxItems: 20, maxBubbles: 30 },
});

/** ステージ設定 */
export const StageConfig: Record<
  number,
  { name: string; bg: string; types: string[]; rate: number; bossScore: number }
> = Object.freeze({
  1: { name: '浅層海域', bg: '#0a1a2a', types: ['basic', 'fast'], rate: 800, bossScore: 3000 },
  2: {
    name: '深海防衛ライン',
    bg: '#050f1a',
    types: ['basic', 'shooter', 'fast', 'tank'],
    rate: 650,
    bossScore: 7000,
  },
  3: {
    name: '最深部',
    bg: '#020810',
    types: ['shooter', 'fast', 'tank'],
    rate: 500,
    bossScore: 12000,
  },
});

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
  basic: { hp: 1, speed: 1.8, points: 100, sizeRatio: 1.0, canShoot: false, fireRate: 0 },
  fast: { hp: 1, speed: 3.2, points: 150, sizeRatio: 0.9, canShoot: false, fireRate: 0 },
  shooter: { hp: 2, speed: 1.2, points: 200, sizeRatio: 1.1, canShoot: true, fireRate: 2000 },
  tank: { hp: 5, speed: 0.8, points: 300, sizeRatio: 1.4, canShoot: false, fireRate: 0 },
  boss: { hp: 40, speed: 0.5, points: 2000, sizeRatio: 3.5, canShoot: true, fireRate: 800 },
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

/** カラーパレット */
export const ColorPalette: {
  enemy: Record<string, string>;
  ui: Record<string, string>;
  particle: Record<string, string>;
} = Object.freeze({
  enemy: {
    basic: '#3a8a5a',
    fast: '#5a5a8a',
    shooter: '#8a3a5a',
    tank: '#8a6a3a',
    boss: '#4a4a8a',
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
