/**
 * パズルコア状態の atom 定義
 *
 * パズルのコア状態を統合した atom と派生 atom を定義する。
 */
import { atom } from 'jotai';
import { PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';
import { calculateCorrectRate } from '../../domain/puzzle/aggregates/puzzle-board';

/** パズルボード状態の統合 atom */
export const puzzleBoardStateAtom = atom<PuzzleBoardState | null>(null);

/** 正解率の派生 atom（読み取り専用） */
export const derivedCorrectRateAtom = atom(get => {
  const state = get(puzzleBoardStateAtom);
  if (!state) return 0;
  return calculateCorrectRate(state);
});
