/**
 * パズルユーティリティ — 後方互換ラッパー
 *
 * 新ドメイン層に移動済みの関数を再エクスポートする。
 * Phase 6 のクリーンアップで削除予定。
 */
import { PuzzlePiece } from '../types/puzzle';
import { GridPosition } from '../types/geometry';
import { createPuzzleBoard } from '../domain/puzzle/aggregates/puzzle-board';
import { shufflePuzzle } from '../domain/puzzle/services/shuffle-service';
import {
  isInCorrectPosition,
  movePieceTo,
} from '../domain/puzzle/entities/puzzle-piece';
import {
  getAdjacentPositions as domainGetAdjacentPositions,
} from '../domain/puzzle/value-objects/grid-position';

type Position = GridPosition;

/**
 * 画像をロードしてサイズを取得する（プレゼンテーション層固有）
 */
export const getImageSize = (url: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('画像の読み込みに失敗しました'));
    };
    img.src = url;
  });
};

/**
 * パズルのピースを生成する — ドメイン層に委譲
 */
export const generatePuzzlePieces = (
  division: number
): { pieces: PuzzlePiece[]; emptyPosition: Position } => {
  const board = createPuzzleBoard(division);
  return {
    pieces: [...board.pieces],
    emptyPosition: { ...board.emptyPosition },
  };
};

/**
 * パズルのピースをシャッフルする — ドメイン層に委譲
 */
export const shufflePuzzlePieces = (
  pieces: PuzzlePiece[],
  emptyPosition: Position,
  division: number,
  moves: number = 100
): { pieces: PuzzlePiece[]; emptyPosition: Position } => {
  const board = {
    pieces,
    emptyPosition,
    division,
    moveCount: 0,
    isCompleted: true,
  };
  const shuffled = shufflePuzzle(board, moves);
  return {
    pieces: [...shuffled.pieces],
    emptyPosition: { ...shuffled.emptyPosition },
  };
};

/**
 * 指定された位置の隣接位置を取得する — ドメイン層に委譲
 */
export const getAdjacentPositions = (row: number, col: number, division: number): Position[] =>
  domainGetAdjacentPositions({ row, col }, division);

/**
 * パズルが完成したかどうかをチェックする — ドメイン層に委譲
 */
export const isPuzzleCompleted = (pieces: PuzzlePiece[]): boolean =>
  pieces.every(piece => piece.isEmpty || isInCorrectPosition(piece));

/**
 * 正解率を計算する — ドメイン層に委譲
 */
export const calculateCorrectRate = (pieces: PuzzlePiece[]): number => {
  const nonEmptyPieces = pieces.filter(p => !p.isEmpty);
  if (nonEmptyPieces.length === 0) return 0;
  const correctCount = nonEmptyPieces.filter(isInCorrectPosition).length;
  return Math.round((correctCount / nonEmptyPieces.length) * 100);
};

// 後方互換: formatElapsedTime は shared/utils/format.ts に移動済み
export { formatElapsedTime } from '../shared/utils/format';
