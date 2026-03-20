/**
 * テストデータファクトリー
 * - 各ドメインオブジェクトのデフォルト値を持つ生成関数
 * - overrides で部分的にプロパティを上書き可能
 */
import type { PuckState } from '../../domain/models/puck';
import type { MalletState } from '../../domain/models/mallet';
import type { FieldConfig, Item, GameState, MatchStats } from '../../core/types';
import type { StoryProgress } from '../../core/story';
import type { AiBehaviorConfig } from '../../core/story-balance';
import { PHYSICS_CONSTANTS } from '../../domain/constants/physics';
import { DOMAIN_ITEMS } from '../../domain/constants/items';
import { DOMAIN_FIELDS } from '../../domain/constants/fields';

export const TestFactory = {
  /** テスト用パックを生成する */
  createTestPuck(overrides?: Partial<PuckState>): PuckState {
    return {
      x: PHYSICS_CONSTANTS.CANVAS_WIDTH / 2,
      y: PHYSICS_CONSTANTS.CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONSTANTS.PUCK_RADIUS,
      visible: true,
      hitCount: 0,
      ...overrides,
    };
  },

  /** テスト用マレットを生成する */
  createTestMallet(overrides?: Partial<MalletState>): MalletState {
    return {
      x: PHYSICS_CONSTANTS.CANVAS_WIDTH / 2,
      y: PHYSICS_CONSTANTS.CANVAS_HEIGHT - 70,
      vx: 0,
      vy: 0,
      radius: PHYSICS_CONSTANTS.MALLET_RADIUS,
      side: 'player' as const,
      ...overrides,
    };
  },

  /** テスト用アイテムを生成する（id 指定時はテンプレートを連動） */
  createTestItem(overrides?: Partial<Item>): Item {
    // overrides に id が指定されている場合、対応するテンプレートを検索
    const itemId = overrides?.id ?? 'split';
    const template = DOMAIN_ITEMS.find((item) => item.id === itemId) ?? DOMAIN_ITEMS[0];
    return {
      id: template.id,
      name: template.name,
      color: template.color,
      icon: template.icon,
      x: PHYSICS_CONSTANTS.CANVAS_WIDTH / 2,
      y: PHYSICS_CONSTANTS.CANVAS_HEIGHT / 2,
      vx: 0,
      vy: 0,
      r: PHYSICS_CONSTANTS.ITEM_RADIUS,
      ...overrides,
    };
  },

  /** テスト用フィールド設定を生成する */
  createTestFieldConfig(overrides?: Partial<FieldConfig>): FieldConfig {
    const classic = DOMAIN_FIELDS[0]; // classic
    return {
      ...classic,
      ...overrides,
    } as FieldConfig;
  },

  /** テスト用 AI 設定を生成する */
  createTestAiConfig(overrides?: Partial<AiBehaviorConfig>): AiBehaviorConfig {
    return {
      maxSpeed: 1.5,
      predictionFactor: 1,
      wobble: 30,
      skipRate: 0.05,
      centerWeight: 0.7,
      wallBounce: false,
      ...overrides,
    };
  },

  /** テスト用ストーリー進行を生成する */
  createTestStoryProgress(overrides?: Partial<StoryProgress>): StoryProgress {
    return {
      clearedStages: [],
      ...overrides,
    };
  },

  /** テスト用試合統計を生成する */
  createTestMatchStats(overrides?: Partial<MatchStats>): MatchStats {
    return {
      playerHits: 0,
      cpuHits: 0,
      maxPuckSpeed: 0,
      playerItemsCollected: 0,
      cpuItemsCollected: 0,
      playerSaves: 0,
      cpuSaves: 0,
      matchDuration: 0,
      ...overrides,
    };
  },

  /** テスト用ゲーム状態を生成する */
  createTestGameState(overrides?: Partial<GameState>): GameState {
    return {
      player: { x: 225, y: 830, vx: 0, vy: 0 },
      cpu: { x: 225, y: 70, vx: 0, vy: 0 },
      pucks: [{ x: 225, y: 450, vx: 0, vy: 1.5, visible: true, invisibleCount: 0 }],
      items: [],
      effects: {
        player: { speed: null, invisible: 0, shield: false, magnet: null, big: null },
        cpu: { speed: null, invisible: 0, shield: false, magnet: null, big: null },
      },
      lastItemSpawn: 0,
      flash: null,
      goalEffect: null,
      cpuTarget: null,
      cpuTargetTime: 0,
      cpuStuckTimer: 0,
      fever: { active: false, lastGoalTime: 0, extraPucks: 0 },
      particles: [],
      obstacleStates: [],
      combo: { count: 0, lastScorer: undefined },
      ...overrides,
    };
  },
} as const;
