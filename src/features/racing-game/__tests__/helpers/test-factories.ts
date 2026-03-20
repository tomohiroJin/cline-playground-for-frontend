// テスト用ファクトリ関数

import type { Player, DriftState, HeatState } from '../../domain/player/types';
import type { DeckState, Card, CardEffect } from '../../domain/card/types';
import type { Point } from '../../domain/shared/types';
import { createPlayer } from '../../domain/player/player-factory';
import { createDriftState } from '../../domain/player/drift';
import { createHeatState } from '../../domain/player/heat';

/** テスト用プレイヤーを生成 */
export const createTestPlayer = (overrides: Partial<Player> = {}): Player => ({
  ...createPlayer({
    x: 100, y: 100, angle: 0,
    color: '#f00', name: 'TestPlayer', isCpu: false,
  }),
  ...overrides,
});

/** テスト用ドリフト状態を生成 */
export const createTestDrift = (overrides: Partial<DriftState> = {}): DriftState => ({
  ...createDriftState(),
  ...overrides,
});

/** テスト用 HEAT 状態を生成 */
export const createTestHeat = (overrides: Partial<HeatState> = {}): HeatState => ({
  ...createHeatState(),
  ...overrides,
});

/** テスト用デッキ状態を生成 */
export const createTestDeck = (overrides: Partial<DeckState> = {}): DeckState => ({
  pool: [],
  hand: [],
  active: [],
  history: [],
  ...overrides,
});

/** テスト用カードを生成 */
export const createTestCard = (overrides: Partial<Card> = {}): Card => ({
  id: 'TEST_01',
  name: 'テストカード',
  category: 'speed',
  rarity: 'R',
  description: 'テスト用カード',
  effect: {},
  icon: '🃏',
  ...overrides,
});

/** テスト用カード効果を生成 */
export const createTestCardEffect = (overrides: Partial<CardEffect> = {}): CardEffect => ({
  ...overrides,
});

/** テスト用正方形トラックポイント */
export const createTestTrackPoints = (segments: number = 4): readonly Point[] => {
  if (segments === 4) {
    return [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];
  }
  // 円形トラック
  const points: Point[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: 450 + Math.cos(angle) * 300,
      y: 350 + Math.sin(angle) * 250,
    });
  }
  return points;
};
