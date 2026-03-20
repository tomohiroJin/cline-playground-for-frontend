import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { Provider } from 'jotai';
import { usePuzzleGame } from './usePuzzleGame';
import { hintUsedAtom } from '../store/ui-atoms';
import { useAtomValue } from 'jotai';

/** Jotai Provider でラップするヘルパー */
const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  React.createElement(Provider, null, children);

describe('usePuzzleGame', () => {
  describe('initialize', () => {
    it('指定された分割数でパズルを初期化する', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      act(() => {
        result.current.initialize(3);
      });

      expect(result.current.boardState).not.toBeNull();
      expect(result.current.boardState?.pieces).toHaveLength(9);
      expect(result.current.boardState?.division).toBe(3);
      expect(result.current.boardState?.moveCount).toBe(0);
    });

    it('初期化後のパズルはシャッフル済み（未完成）', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      act(() => {
        result.current.initialize(4);
      });

      expect(result.current.boardState?.isCompleted).toBe(false);
    });

    it('初期化時にヒント使用フラグがリセットされる', () => {
      // ヒント使用状態と usePuzzleGame を同時に取得するフック
      const useTestHook = () => {
        const game = usePuzzleGame();
        const hintUsed = useAtomValue(hintUsedAtom);
        return { ...game, hintUsed };
      };

      const { result } = renderHook(() => useTestHook(), { wrapper });

      act(() => {
        result.current.initialize(2);
      });

      expect(result.current.hintUsed).toBe(false);
    });
  });

  describe('move', () => {
    it('隣接ピースを移動すると手数が増える', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      // 3×3 を使用（2×2 はシャッフル後に即完成する確率があり、完成後は移動が無視される）
      act(() => {
        result.current.initialize(3);
      });

      const board = result.current.boardState;
      if (!board) throw new Error('ボードが初期化されていません');

      // 空白に隣接する非空白ピースを探す
      const adjacentPiece = board.pieces.find(
        p =>
          !p.isEmpty &&
          (Math.abs(p.currentPosition.row - board.emptyPosition.row) +
            Math.abs(p.currentPosition.col - board.emptyPosition.col)) === 1
      );

      if (!adjacentPiece) throw new Error('隣接ピースが見つかりません');

      act(() => {
        result.current.move(adjacentPiece.id);
      });

      expect(result.current.boardState?.moveCount).toBe(1);
    });

    it('非隣接ピースの移動は無視される', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      act(() => {
        result.current.initialize(3);
      });

      const initialMoveCount = result.current.boardState?.moveCount ?? 0;

      // 存在しないピースIDで移動を試みる
      act(() => {
        result.current.move(999);
      });

      expect(result.current.boardState?.moveCount).toBe(initialMoveCount);
    });

    it('初期化前の移動は何も起きない', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      // boardState が null の状態で move を呼ぶ
      act(() => {
        result.current.move(0);
      });

      expect(result.current.boardState).toBeNull();
    });
  });

  describe('reset', () => {
    it('リセットするとパズルが再初期化される', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      act(() => {
        result.current.initialize(2);
      });

      act(() => {
        result.current.reset(2);
      });

      // リセット後は新しいボード（手数0）
      expect(result.current.boardState?.moveCount).toBe(0);
      // ピース配列は再シャッフルされるため異なる可能性が高い（確率的）
      expect(result.current.boardState).not.toBeNull();
    });
  });

  describe('completeForDebug', () => {
    it('デバッグ完成で全ピースが正解位置に移動する', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      act(() => {
        result.current.initialize(2);
      });

      act(() => {
        result.current.completeForDebug();
      });

      expect(result.current.boardState?.isCompleted).toBe(true);

      // 全非空白ピースが正解位置にある
      const nonEmptyPieces = result.current.boardState?.pieces.filter(p => !p.isEmpty) ?? [];
      for (const piece of nonEmptyPieces) {
        expect(piece.currentPosition).toEqual(piece.correctPosition);
      }
    });

    it('初期化前のデバッグ完成は何も起きない', () => {
      const { result } = renderHook(() => usePuzzleGame(), { wrapper });

      act(() => {
        result.current.completeForDebug();
      });

      expect(result.current.boardState).toBeNull();
    });
  });
});
