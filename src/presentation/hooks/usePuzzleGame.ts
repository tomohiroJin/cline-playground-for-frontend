/**
 * パズルゲームフック
 *
 * ドメイン集約とユースケースを呼び出し、atom を更新する。
 * 既存の usePuzzle.ts の責務を引き継ぐ。
 */
import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { puzzleBoardStateAtom } from '../store/puzzle-atoms';
import { hintUsedAtom } from '../store/ui-atoms';
import { initializePuzzle } from '../../application/use-cases/initialize-puzzle';
import { movePieceUseCase } from '../../application/use-cases/move-piece';
import { PuzzleBoardState } from '../../domain/puzzle/aggregates/puzzle-board';

/**
 * パズルゲームの状態と操作を管理するフック
 */
export const usePuzzleGame = () => {
  const [boardState, setBoardState] = useAtom(puzzleBoardStateAtom);
  const [, setHintUsed] = useAtom(hintUsedAtom);

  /** パズルを初期化する */
  const initialize = useCallback(
    (division: number) => {
      const board = initializePuzzle(division);
      setBoardState(board);
      setHintUsed(false);
    },
    [setBoardState, setHintUsed]
  );

  /** ピースを移動する */
  const move = useCallback(
    (pieceId: number) => {
      if (!boardState || boardState.isCompleted) return;

      try {
        const result = movePieceUseCase(boardState, pieceId);
        setBoardState(result.board);
      } catch {
        // 非隣接ピースの移動は無視する
      }
    },
    [boardState, setBoardState]
  );

  /** パズルをリセットする */
  const reset = useCallback(
    (division: number) => {
      initialize(division);
    },
    [initialize]
  );

  /** デバッグ用: パズルを即座に完成させる */
  const completeForDebug = useCallback(() => {
    if (!boardState) return;

    const correctPieces = boardState.pieces.map(piece => ({
      ...piece,
      currentPosition: { ...piece.correctPosition },
    }));

    setBoardState({
      ...boardState,
      pieces: correctPieces,
      isCompleted: true,
    });
  }, [boardState, setBoardState]);

  return {
    boardState,
    initialize,
    move,
    reset,
    completeForDebug,
  };
};
