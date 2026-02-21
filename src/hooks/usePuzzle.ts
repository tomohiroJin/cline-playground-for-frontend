import { useAtom } from 'jotai';
import { useCallback } from 'react';
import {
  imageUrlAtom,
  originalImageSizeAtom,
  puzzleDivisionAtom,
  puzzlePiecesAtom,
  emptyPiecePositionAtom,
  puzzleStartTimeAtom,
  puzzleElapsedTimeAtom,
  puzzleCompletedAtom,
  moveCountAtom,
  shuffleMovesAtom,
  correctRateAtom,
  hintUsedAtom,
} from '../store/atoms';
import { PuzzlePiece } from '../types/puzzle';
import {
  generatePuzzlePieces,
  shufflePuzzlePieces,
  isPuzzleCompleted,
  getAdjacentPositions,
  calculateCorrectRate,
} from '../utils/puzzle-utils';

/**
 * パズルの状態と操作を管理するカスタムフック
 */
export const usePuzzle = () => {
  // 状態
  const [imageUrl, setImageUrl] = useAtom(imageUrlAtom);
  const [originalImageSize, setOriginalImageSize] = useAtom(originalImageSizeAtom);
  const [division, setDivision] = useAtom(puzzleDivisionAtom);
  const [pieces, setPieces] = useAtom(puzzlePiecesAtom);
  const [emptyPosition, setEmptyPosition] = useAtom(emptyPiecePositionAtom);
  const [startTime, setStartTime] = useAtom(puzzleStartTimeAtom);
  const [elapsedTime, setElapsedTime] = useAtom(puzzleElapsedTimeAtom);
  const [completed, setCompleted] = useAtom(puzzleCompletedAtom);
  const [moveCount, setMoveCount] = useAtom(moveCountAtom);
  const [shuffleMoves, setShuffleMoves] = useAtom(shuffleMovesAtom);
  const [correctRate, setCorrectRate] = useAtom(correctRateAtom);
  const [, setHintUsed] = useAtom(hintUsedAtom);

  /**
   * 分割数に基づいてシャッフル回数を計算する
   *
   * @param division 分割数
   * @returns シャッフル回数
   */
  const calculateShuffleMoves = (division: number): number => {
    const totalPieces = division * division; // 総ピース数
    const shuffleFactor = division * 2; // 分割された数全てが 2 回移動する
    return totalPieces * shuffleFactor;
  };

  /**
   * パズルを初期化する
   */
  const initializePuzzle = useCallback(() => {
    if (!imageUrl) return;

    const moves = calculateShuffleMoves(division);

    // パズルのピースを生成
    const { pieces: newPieces, emptyPosition: newEmptyPosition } = generatePuzzlePieces(division);

    // パズルのピースをシャッフル
    const { pieces: shuffledPieces, emptyPosition: shuffledEmptyPosition } = shufflePuzzlePieces(
      newPieces,
      newEmptyPosition,
      division,
      moves
    );

    // 状態を更新
    setPieces(shuffledPieces);
    setEmptyPosition(shuffledEmptyPosition);
    setStartTime(Date.now());
    setElapsedTime(0);
    setCompleted(false);
    setMoveCount(0);
    setShuffleMoves(moves);
    setCorrectRate(calculateCorrectRate(shuffledPieces));
    setHintUsed(false);
  }, [
    imageUrl,
    division,
    setPieces,
    setEmptyPosition,
    setStartTime,
    setElapsedTime,
    setCompleted,
    setMoveCount,
    setShuffleMoves,
    setCorrectRate,
    setHintUsed,
  ]);

  /**
   * 指定されたピースが空白ピースと隣接しているかを確認する
   */
  const isPieceAdjacentToEmpty = (
    piece: PuzzlePiece,
    emptyPosition: { row: number; col: number },
    division: number
  ): boolean => {
    const adjacentPositions = getAdjacentPositions(
      piece.currentPosition.row,
      piece.currentPosition.col,
      division
    );
    return adjacentPositions.some(
      pos => pos.row === emptyPosition.row && pos.col === emptyPosition.col
    );
  };

  /**
   * ピースを移動し、更新されたピース配列を返す
   */
  const updatePiecesWithMove = (
    currentPieces: PuzzlePiece[],
    pieceIndex: number,
    emptyPosition: { row: number; col: number }
  ): PuzzlePiece[] => {
    const piece = currentPieces[pieceIndex];
    const updatedPieces = [...currentPieces];

    // ピースを空白の位置に移動
    updatedPieces[pieceIndex] = {
      ...piece,
      currentPosition: { ...emptyPosition },
    };

    // 空白ピースの位置を更新
    const emptyPieceIndex = currentPieces.findIndex(p => p.isEmpty);
    if (emptyPieceIndex !== -1) {
      updatedPieces[emptyPieceIndex] = {
        ...updatedPieces[emptyPieceIndex],
        currentPosition: {
          row: piece.currentPosition.row,
          col: piece.currentPosition.col,
        },
      };
    }

    return updatedPieces;
  };

  /**
   * ピースを移動する
   *
   * @param pieceId 移動するピースのID
   */
  const movePiece = useCallback(
    (pieceId: number) => {
      if (completed || !emptyPosition) return;

      const pieceIndex = pieces.findIndex(p => p.id === pieceId);
      if (pieceIndex === -1) return;

      const piece = pieces[pieceIndex];
      if (piece.isEmpty) return;

      if (!isPieceAdjacentToEmpty(piece, emptyPosition, division)) return;

      const updatedPieces = updatePiecesWithMove(pieces, pieceIndex, emptyPosition);

      setPieces(updatedPieces);
      setEmptyPosition({
        row: piece.currentPosition.row,
        col: piece.currentPosition.col,
      });
      setMoveCount(prev => prev + 1);
      setCorrectRate(calculateCorrectRate(updatedPieces));

      if (isPuzzleCompleted(updatedPieces)) {
        setCompleted(true);
      }
    },
    [
      completed,
      emptyPosition,
      pieces,
      division,
      setPieces,
      setEmptyPosition,
      setCompleted,
      setMoveCount,
      setCorrectRate,
    ]
  );

  /**
   * パズルをリセットする
   */
  const resetPuzzle = useCallback(() => {
    initializePuzzle();
  }, [initializePuzzle]);

  return {
    imageUrl,
    setImageUrl,
    originalImageSize,
    setOriginalImageSize,
    division,
    setDivision,
    pieces,
    setPieces,
    emptyPosition,
    elapsedTime,
    completed,
    setCompleted,
    moveCount,
    shuffleMoves,
    correctRate,
    initializePuzzle,
    movePiece,
    resetPuzzle,
  };
};
