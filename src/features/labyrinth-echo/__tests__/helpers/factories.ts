/**
 * 迷宮の残響 - テスト用ファクトリ関数
 *
 * テストデータの生成を統一し、テストの可読性・保守性を向上させる。
 * 各ファクトリは型安全なデフォルト値を提供し、overrides で部分的な上書きが可能。
 */
import type { Player, FxState, DifficultyDef, MetaState, Outcome } from '../../game-logic';
import { FX_DEFAULTS } from '../../game-logic';
import type { GameEvent } from '../../events/event-utils';

/** テスト用プレイヤーを生成する */
export const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
  hp: 55,
  maxHp: 55,
  mn: 35,
  maxMn: 35,
  inf: 5,
  st: [],
  ...overrides,
});

/** テスト用メタ状態を生成する */
export const createTestMeta = (overrides: Partial<MetaState> = {}): MetaState => ({
  runs: 0,
  escapes: 0,
  kp: 0,
  unlocked: [],
  bestFl: 0,
  totalEvents: 0,
  endings: [],
  clearedDiffs: [],
  totalDeaths: 0,
  lastRun: null,
  title: null,
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
export const createTestDifficulty = (overrides: Partial<DifficultyDef> = {}): DifficultyDef => ({
  id: 'normal',
  name: '挑戦者',
  sub: '標準難度',
  color: '#818cf8',
  icon: '⚔',
  desc: '均衡の取れた難易度。',
  hpMod: 0,
  mnMod: 0,
  drainMod: -1,
  dmgMult: 1,
  kpDeath: 1,
  kpWin: 3,
  ...overrides,
});

/** テスト用アウトカムを生成する */
export const createTestOutcome = (overrides: Partial<Outcome> = {}): Outcome => ({
  c: 'default',
  r: 'テスト結果',
  hp: 0,
  mn: 0,
  inf: 0,
  ...overrides,
});
