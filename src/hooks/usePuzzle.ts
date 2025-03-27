import { useAtom } from 'jotai';
import { useCallback, useEffect } from 'react';
import {
  imageUrlAtom,
  originalImageSizeAtom,
  puzzleDivisionAtom,
  puzzlePiecesAtom,
  emptyPiecePositionAtom,
  puzzleStartTimeAtom,
  puzzleElapsedTimeAtom,
  puzzleCompletedAtom,
  PuzzlePiece,
} from '../store/atoms';
import {
  generatePuzzlePieces,
  shufflePuzzlePieces,
  isPuzzleCompleted,
  getAdjacentPositions,
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

  /**
   * 分割数に基づいてシャッフル回数を計算する
   * @param division 分割数
   * @returns シャッフル回数
   */
  const calculateShuffleMoves = (division: number): number => {
    const totalPieces = division * division; // 総ピース数
    const shuffleFactor = division * 2; // 分割された数全てが 2 回移動する
    return totalPieces * shuffleFactor;
  };

  // パズルを初期化する
  const initializePuzzle = useCallback(() => {
    if (!imageUrl) return;

    // パズルのピースを生成
    const { pieces: newPieces, emptyPosition: newEmptyPosition } = generatePuzzlePieces(division);

    // パズルのピースをシャッフル
    const { pieces: shuffledPieces, emptyPosition: shuffledEmptyPosition } = shufflePuzzlePieces(
      newPieces,
      newEmptyPosition,
      division,
      calculateShuffleMoves(division)
    );

    // 状態を更新
    setPieces(shuffledPieces);
    setEmptyPosition(shuffledEmptyPosition);
    setStartTime(Date.now());
    setElapsedTime(0);
    setCompleted(false);
  }, [imageUrl, division, setPieces, setEmptyPosition, setStartTime, setElapsedTime, setCompleted]);

  // パズルのピースを移動する
  const movePiece = useCallback(
    (pieceId: number) => {
      if (completed || !emptyPosition) return;

      setPieces(currentPieces => {
        // 移動するピースを見つける
        const pieceIndex = currentPieces.findIndex(p => p.id === pieceId);
        if (pieceIndex === -1) return currentPieces;

        const piece = currentPieces[pieceIndex];

        // 空白ピースは移動できない
        if (piece.isEmpty) return currentPieces;

        // 対象ピースの現在位置から隣接位置を取得して空白位置と比較
        const adjacentPositions = getAdjacentPositions(
          piece.currentPosition.row,
          piece.currentPosition.col,
          division
        );
        const isAdjacent = adjacentPositions.some(
          pos => pos.row === emptyPosition.row && pos.col === emptyPosition.col
        );
        if (!isAdjacent) return currentPieces;

        // 新しい位置に更新
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

        setEmptyPosition({
          row: piece.currentPosition.row,
          col: piece.currentPosition.col,
        });

        // パズルが完成したかチェック
        if (isPuzzleCompleted(updatedPieces)) {
          setCompleted(true);
        }

        return updatedPieces;
      });
    },
    [completed, emptyPosition, division, setPieces, setEmptyPosition, setCompleted]
  );

  // 経過時間を更新する
  useEffect(() => {
    if (!startTime || completed) return;

    const intervalId = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [startTime, completed, setElapsedTime]);

  // パズルをリセットする
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
    emptyPosition,
    elapsedTime,
    completed,
    initializePuzzle,
    movePiece,
    resetPuzzle,
  };
};
