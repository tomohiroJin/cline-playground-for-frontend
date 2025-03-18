import { useAtom } from "jotai";
import { useCallback, useEffect } from "react";
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
} from "../store/atoms";
import {
  generatePuzzlePieces,
  shufflePuzzlePieces,
  isPuzzleCompleted,
  getAdjacentPositions,
} from "../utils/puzzle-utils";

/**
 * パズルの状態と操作を管理するカスタムフック
 */
export const usePuzzle = () => {
  // 状態
  const [imageUrl, setImageUrl] = useAtom(imageUrlAtom);
  const [originalImageSize, setOriginalImageSize] = useAtom(
    originalImageSizeAtom
  );
  const [division, setDivision] = useAtom(puzzleDivisionAtom);
  const [pieces, setPieces] = useAtom(puzzlePiecesAtom);
  const [emptyPosition, setEmptyPosition] = useAtom(emptyPiecePositionAtom);
  const [startTime, setStartTime] = useAtom(puzzleStartTimeAtom);
  const [elapsedTime, setElapsedTime] = useAtom(puzzleElapsedTimeAtom);
  const [completed, setCompleted] = useAtom(puzzleCompletedAtom);

  // パズルを初期化する
  const initializePuzzle = useCallback(() => {
    if (!imageUrl) return;

    // パズルのピースを生成
    const { pieces: newPieces, emptyPosition: newEmptyPosition } =
      generatePuzzlePieces(division);

    // パズルのピースをシャッフル
    const { pieces: shuffledPieces, emptyPosition: shuffledEmptyPosition } =
      shufflePuzzlePieces(newPieces, newEmptyPosition, division);

    // 状態を更新
    setPieces(shuffledPieces);
    setEmptyPosition(shuffledEmptyPosition);
    setStartTime(Date.now());
    setElapsedTime(0);
    setCompleted(false);
  }, [
    imageUrl,
    division,
    setPieces,
    setEmptyPosition,
    setStartTime,
    setElapsedTime,
    setCompleted,
  ]);

  // パズルのピースを移動する
  const movePiece = useCallback(
    (pieceId: number, newRow: number, newCol: number) => {
      if (completed || !emptyPosition) return;

      setPieces((currentPieces) => {
        // 移動するピースを見つける
        const pieceIndex = currentPieces.findIndex((p) => p.id === pieceId);
        if (pieceIndex === -1) return currentPieces;

        const piece = currentPieces[pieceIndex];

        // 空白ピースは移動できない
        if (piece.isEmpty) return currentPieces;

        // 移動先が空白ピースの位置かチェック
        if (newRow !== emptyPosition.row || newCol !== emptyPosition.col) {
          // 空白ピースの隣接位置かチェック
          const adjacentPositions = getAdjacentPositions(
            emptyPosition.row,
            emptyPosition.col,
            division
          );

          const isAdjacent = adjacentPositions.some(
            (pos) =>
              pos.row === piece.currentPosition.row &&
              pos.col === piece.currentPosition.col
          );

          if (!isAdjacent) {
            return currentPieces; // 隣接していない場合は移動できない
          }
        }

        // 新しい位置に更新
        const updatedPieces = [...currentPieces];

        // ピースを空白の位置に移動
        updatedPieces[pieceIndex] = {
          ...piece,
          currentPosition: { ...emptyPosition },
        };

        // 空白ピースの位置を更新
        setEmptyPosition({
          row: piece.currentPosition.row,
          col: piece.currentPosition.col,
        });

        // パズルが完成したかチェック
        const isCompleted = isPuzzleCompleted(updatedPieces);
        if (isCompleted) {
          setCompleted(true);
        }

        return updatedPieces;
      });
    },
    [
      completed,
      emptyPosition,
      division,
      setPieces,
      setEmptyPosition,
      setCompleted,
    ]
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
