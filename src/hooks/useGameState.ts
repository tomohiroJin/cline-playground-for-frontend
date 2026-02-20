import { useState, useCallback, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';
import { usePuzzle } from './usePuzzle';
import { useHintMode } from './useHintMode';
import { hintUsedAtom } from '../store/atoms';
import { calculateScore } from '../utils/score-utils';
import { PuzzleScore } from '../types/puzzle';

export const useGameState = () => {
  const {
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
  } = usePuzzle();

  const { hintModeEnabled, toggleHintMode } = useHintMode();
  const [hintUsed] = useAtom(hintUsedAtom);

  const [gameStarted, setGameStarted] = useState(false);
  const [emptyPanelClicks, setEmptyPanelClicks] = useState(0);
  const [score, setScore] = useState<PuzzleScore | null>(null);

  // completedの変化を追跡するref
  const prevCompletedRef = useRef(false);

  // パズル完成時にスコアを計算
  useEffect(() => {
    if (completed && !prevCompletedRef.current) {
      const puzzleScore = calculateScore(
        moveCount,
        shuffleMoves,
        elapsedTime,
        hintUsed,
        division
      );
      setScore(puzzleScore);
    }
    prevCompletedRef.current = completed;
  }, [completed, moveCount, shuffleMoves, elapsedTime, hintUsed, division]);

  /**
   * 空のパネルがクリックされた際の処理を行います。
   */
  const handleEmptyPanelClick = useCallback(() => {
    if (!completed) {
      setEmptyPanelClicks(prev => prev + 1);
    }
  }, [completed]);

  /**
   * 画像を選択する処理を行います。
   */
  const handleImageSelect = (url: string, width: number, height: number) => {
    setImageUrl(url);
    setOriginalImageSize({ width, height });
  };

  /**
   * パズルの難易度を変更します。
   */
  const handleDifficultyChange = (newDivision: number) => {
    setDivision(newDivision);
  };

  /**
   * ゲームを開始します。
   */
  const handleStartGame = () => {
    setScore(null);
    initializePuzzle();
    setGameStarted(true);
  };

  /**
   * パズルのピースを移動します。
   */
  const handlePieceMove = (pieceId: number) => {
    movePiece(pieceId);
  };

  /**
   * ゲームをリセットします。
   */
  const handleResetGame = () => {
    setScore(null);
    resetPuzzle();
  };

  /**
   * ゲームを終了します。
   */
  const handleEndGame = () => {
    setGameStarted(false);
  };

  return {
    toggleHintMode,
    gameStarted,
    handleImageSelect,
    handleDifficultyChange,
    handleStartGame,
    handlePieceMove,
    handleResetGame,
    handleEndGame,
    handleEmptyPanelClick,
    gameState: {
      imageUrl,
      originalImageSize,
      pieces,
      division,
      elapsedTime,
      completed,
      hintModeEnabled,
      emptyPosition,
      emptyPanelClicks,
      moveCount,
      shuffleMoves,
      correctRate,
      score,
      setPieces,
      setCompleted,
    },
  };
};
