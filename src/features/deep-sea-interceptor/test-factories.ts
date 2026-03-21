// ============================================================================
// Deep Sea Interceptor - テストファクトリ
// 全エンティティ用のビルダー関数を提供
// ============================================================================

import { createInitialGameState, createInitialUiState } from './game-logic';
import type {
  GameState,
  UiState,
  Bullet,
  Enemy,
  EnemyBullet,
  Item,
  Particle,
  Bubble,
  EnemyType,
  ItemType,
  WeaponType,
} from './types';

// ================================================================
// 状態ビルダー
// ================================================================

/** テスト用 GameState ファクトリ */
export function buildGameState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialGameState(), ...overrides };
}

/** テスト用 UiState ファクトリ */
export function buildUiState(overrides: Partial<UiState> = {}): UiState {
  return { ...createInitialUiState(), ...overrides };
}

// ================================================================
// エンティティビルダー
// ================================================================

/** テスト用の連番IDカウンタ */
let testIdCounter = 10000;

/** テスト用ユニークID生成（決定的） */
function testId(): number {
  return ++testIdCounter;
}

/** テスト用IDカウンタをリセット */
export function resetTestIdCounter(): void {
  testIdCounter = 10000;
}

/** テスト用 Bullet ファクトリ */
export function buildBullet(overrides: Partial<Bullet> = {}): Bullet {
  return {
    id: testId(),
    x: 200,
    y: 300,
    createdAt: Date.now(),
    type: 'bullet',
    weaponType: 'torpedo' as WeaponType,
    charged: false,
    angle: -Math.PI / 2,
    speed: 11,
    damage: 1,
    size: 6,
    piercing: false,
    homing: false,
    ...overrides,
  };
}

/** テスト用 Enemy ファクトリ */
export function buildEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: testId(),
    x: 200,
    y: 100,
    createdAt: Date.now(),
    type: 'enemy',
    enemyType: 'basic' as EnemyType,
    hp: 1,
    maxHp: 1,
    speed: 1.8,
    points: 100,
    size: 28,
    canShoot: false,
    fireRate: 0,
    lastShotAt: 0,
    movementPattern: 0,
    angle: 0,
    bossPhase: 0,
    ...overrides,
  };
}

/** テスト用 EnemyBullet ファクトリ */
export function buildEnemyBullet(overrides: Partial<EnemyBullet> = {}): EnemyBullet {
  return {
    id: testId(),
    x: 200,
    y: 100,
    createdAt: Date.now(),
    type: 'enemyBullet',
    vx: 0,
    vy: 3,
    size: 8,
    ...overrides,
  };
}

/** テスト用 Item ファクトリ */
export function buildItem(overrides: Partial<Item> = {}): Item {
  return {
    id: testId(),
    x: 200,
    y: 200,
    createdAt: Date.now(),
    type: 'item',
    itemType: 'power' as ItemType,
    size: 24,
    speed: 1.5,
    ...overrides,
  };
}

/** テスト用 Particle ファクトリ */
export function buildParticle(overrides: Partial<Particle> = {}): Particle {
  return {
    id: testId(),
    x: 100,
    y: 100,
    createdAt: Date.now(),
    type: 'particle',
    color: '#ffffff',
    vx: 0,
    vy: 0,
    life: 15,
    maxLife: 15,
    size: 3,
    ...overrides,
  };
}

/** テスト用 Bubble ファクトリ */
export function buildBubble(overrides: Partial<Bubble> = {}): Bubble {
  return {
    id: testId(),
    x: 200,
    y: 565,
    createdAt: Date.now(),
    size: 4,
    speed: 0.5,
    opacity: 0.2,
    ...overrides,
  };
}
