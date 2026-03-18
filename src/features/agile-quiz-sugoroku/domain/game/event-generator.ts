/**
 * スプリントイベント生成（純粋関数）
 *
 * 旧 game-logic.ts の makeEvents を純粋化。
 * Math.random の代わりに randomFn を引数で受け取る。
 */
import { GameEvent } from '../types';
import { CONFIG, EVENTS, EMERGENCY_EVENT } from '../../constants';

/** スプリントイベントを生成（緊急対応の発生判定含む） */
export function createEvents(
  sprintNumber: number,
  debt: number,
  randomFn: () => number = Math.random,
): GameEvent[] {
  const events = [...EVENTS];

  // 2スプリント目以降で緊急対応が発生する可能性
  if (sprintNumber > 0) {
    const probability = Math.min(
      CONFIG.emergency.maxProbability,
      CONFIG.emergency.base + debt * CONFIG.emergency.debtMultiplier,
    );

    if (randomFn() < probability) {
      // ランダムな位置（1〜4）に緊急対応を挿入
      const position =
        CONFIG.emergency.minPosition +
        Math.floor(
          randomFn() *
            (CONFIG.emergency.maxPosition - CONFIG.emergency.minPosition),
        );
      events[position] = { ...EMERGENCY_EVENT };
    }
  }

  return events;
}
