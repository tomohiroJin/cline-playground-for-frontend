/**
 * 迷宮の残響 - テスト用ファクトリ関数
 *
 * テストデータの生成を統一し、テストの可読性・保守性を向上させる。
 * 各ファクトリは型安全なデフォルト値を提供し、overrides で部分的な上書きが可能。
 */
import type { Player } from '../../domain/models/player';
import type { DifficultyDef, DifficultyModifiers, DifficultyRewards } from '../../domain/models/difficulty';
import type { MetaState } from '../../domain/models/meta-state';
import type { FxState } from '../../domain/models/unlock';
import { FX_DEFAULTS } from '../../domain/models/unlock';
import type { GameEvent, Outcome } from '../../events/event-utils';

/** テスト用プレイヤーを生成する */
export const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
  hp: 55,
  maxHp: 55,
  mn: 35,
  maxMn: 35,
  inf: 5,
  statuses: [],
  ...overrides,
});

/** テスト用メタ状態を生成する */
export const createTestMeta = (overrides: Partial<MetaState> = {}): MetaState => ({
  runs: 0,
  escapes: 0,
  kp: 0,
  unlocked: [],
  bestFloor: 0,
  totalEvents: 0,
  endings: [],
  clearedDifficulties: [],
  totalDeaths: 0,
  lastRun: null,
  activeTitle: null,
  ...overrides,
});

/** テスト用イベントを生成する */
export const createTestEvent = (overrides: Partial<GameEvent> = {}): GameEvent => ({
  id: 'test001',
  fl: [1],
  tp: 'exploration',
  sit: 'テスト用のイベントです。',
  ch: [
    {
      t: 'テスト選択肢A',
      o: [
        { c: 'default', r: 'テスト結果A', hp: -5, mn: 0, inf: 3 },
      ],
    },
    {
      t: 'テスト選択肢B',
      o: [
        { c: 'default', r: 'テスト結果B', hp: 5, mn: -5, inf: 0 },
      ],
    },
  ],
  ...overrides,
});

/** テスト用FX状態を生成する */
export const createTestFx = (overrides: Partial<FxState> = {}): FxState => ({
  ...FX_DEFAULTS,
  ...overrides,
});

/** テスト用難易度定義を生成する（normal難易度ベース） */
export const createTestDifficulty = (
  overrides: {
    modifiers?: Partial<DifficultyModifiers>;
    rewards?: Partial<DifficultyRewards>;
  } & Partial<Omit<DifficultyDef, 'modifiers' | 'rewards'>> = {},
): DifficultyDef => {
  const { modifiers, rewards, ...rest } = overrides;
  return {
    id: 'normal',
    name: '挑戦者',
    subtitle: '標準難度',
    color: '#818cf8',
    icon: '⚔',
    description: '均衡の取れた難易度。',
    modifiers: {
      hpMod: 0,
      mnMod: 0,
      drainMod: -1,
      dmgMult: 1,
      ...modifiers,
    },
    rewards: {
      kpOnDeath: 1,
      kpOnWin: 3,
      ...rewards,
    },
    ...rest,
  };
};

/** テスト用アウトカムを生成する */
export const createTestOutcome = (overrides: Partial<Outcome> = {}): Outcome => ({
  c: 'default',
  r: 'テスト結果',
  hp: 0,
  mn: 0,
  inf: 0,
  ...overrides,
});

// ── ドメイン型ファクトリ（後方互換エイリアス） ──────────────────

/** ドメイン型テスト用プレイヤーを生成する（createTestPlayer のエイリアス） */
export const createDomainTestPlayer = createTestPlayer;

/** ドメイン型テスト用難易度定義を生成する（createTestDifficulty のエイリアス） */
export const createDomainTestDifficulty = createTestDifficulty;
