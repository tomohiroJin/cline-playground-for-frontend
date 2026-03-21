// テスト用ファクトリ関数 — 共通テストヘルパー

import type { BlockData, BulletData, GameState } from '../../types';
import { Grid } from '../../grid';

/** テスト用ブロックを生成する */
export const createBlock = (overrides: Partial<BlockData> = {}): BlockData => ({
  id: 'test-block',
  x: 0,
  y: 0,
  shape: [[1]],
  color: '#FF0000',
  power: null,
  ...overrides,
});

/** テスト用弾丸を生成する */
export const createBullet = (overrides: Partial<BulletData> = {}): BulletData => ({
  id: 'test-bullet',
  x: 5,
  y: 10,
  dx: 0,
  dy: -1,
  pierce: false,
  ...overrides,
});

/** テスト用グリッドを生成する */
export const createGrid = (width = 12, height = 18): (string | null)[][] =>
  Grid.create(width, height);

/** テスト用ゲーム状態を生成する */
export const createGameState = (overrides: Partial<GameState> = {}): GameState => ({
  grid: createGrid(),
  blocks: [],
  bullets: [],
  score: 0,
  stage: 1,
  lines: 0,
  linesNeeded: 1,
  playerY: 16,
  time: 0,
  ...overrides,
});
