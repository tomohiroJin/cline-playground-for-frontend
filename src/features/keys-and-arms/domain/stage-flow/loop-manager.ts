/**
 * ループ進行管理（純粋関数）
 *
 * ゲームループの進行とトゥルーエンド判定を管理する。
 */
import { Difficulty } from '../../difficulty';

/** ループを 1 つ進める */
export function advanceLoop(currentLoop: number): number {
  return currentLoop + 1;
}

/** トゥルーエンド条件の判定 */
export function isTrueEnding(loop: number): boolean {
  return Difficulty.isTrueEnding(loop);
}

/** 最大ループ数（実質無限だが上限を設定） */
export function getMaxLoop(): number {
  return 99;
}
