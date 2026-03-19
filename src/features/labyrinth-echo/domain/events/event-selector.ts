/**
 * 迷宮の残響 - イベント選択（乱数注入対応）
 *
 * event-utils.ts から pickEvent, findChainEvent を移動・リファクタリング。
 * RandomSource を注入可能にし、決定論的テストを実現。
 */
import { shuffleWith, DefaultRandomSource } from './random';
import type { RandomSource } from './random';
import type { GameEvent } from './game-event';
import type { MetaState } from '../models/meta-state';
import type { FxState } from '../models/unlock';

/**
 * イベントを選択する（乱数ソース注入対応）
 * chainOnlyイベントと使用済みIDを除外し、重み付けプールからランダム選出。
 * @param rng 乱数ソース（デフォルト: Math.random ラッパー）
 */
export const pickEvent = (
  events: readonly GameEvent[],
  floor: number,
  usedIds: readonly string[],
  meta: MetaState,
  fx: FxState,
  rng: RandomSource = new DefaultRandomSource(),
): GameEvent | null => {
  const pool = events.filter(e =>
    e.fl.includes(floor) && !usedIds.includes(e.id) && !e.chainOnly
    && (!e.metaCond || e.metaCond(meta))
  );
  if (pool.length === 0) return null;

  // 重み付けプールを構築
  const weighted: GameEvent[] = [];
  for (const e of pool) {
    weighted.push(e);
    // chainBoost: チェイン開始イベントの重みを倍にする
    if (fx.chainBoost) {
      const hasChain = e.ch.some(c => c.o.some(o => o.fl?.startsWith('chain:')));
      if (hasChain) weighted.push(e);
    }
    // 安息イベントの出現確率を上げる
    if (e.tp === 'rest') weighted.push(e);
  }
  return shuffleWith(weighted, rng)[0];
};

/** IDでチェインイベントを検索する */
export const findChainEvent = (events: readonly GameEvent[], id: string): GameEvent | null =>
  events.find(e => e.id === id) ?? null;
