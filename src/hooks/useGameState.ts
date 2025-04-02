import { useState, useCallback } from 'react';
import { usePuzzle } from './usePuzzle';
import { useHintMode } from './useHintMode';

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
    initializePuzzle,
    movePiece,
    resetPuzzle,
  } = usePuzzle();

  const { hintModeEnabled, toggleHintMode } = useHintMode();

  const [gameStarted, setGameStarted] = useState(false);
  const [imageSourceMode, setImageSourceMode] = useState<'upload' | 'default'>('upload');
  const [emptyPanelClicks, setEmptyPanelClicks] = useState(0);

  const handleEmptyPanelClick = useCallback(() => {
    if (!completed) {
      setEmptyPanelClicks(prev => prev + 1);
    }
  }, [completed]);

  const handleImageUpload = (url: string, width: number, height: number) => {
    setImageUrl(url);
    setOriginalImageSize({ width, height });
  };

  const handleDifficultyChange = (newDivision: number) => {
    setDivision(newDivision);
  };

  const handleStartGame = () => {
    initializePuzzle();
    setGameStarted(true);
  };

  const handlePieceMove = (pieceId: number) => {
    movePiece(pieceId);
  };

  const handleResetGame = () => {
    resetPuzzle();
  };

  const handleEndGame = () => {
    setGameStarted(false);
  };

  return {
    toggleHintMode,
    gameStarted,
    imageSourceMode,
    setImageSourceMode,
    handleImageUpload,
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
      setPieces,
      setCompleted,
    },
  };
};
