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
  const [emptyPanelClicks, setEmptyPanelClicks] = useState(0);

  /**
   * 空のパネルがクリックされた際の処理を行います。
   * ゲームが完了していない場合、クリック回数を1増やします。
   */
  const handleEmptyPanelClick = useCallback(() => {
    if (!completed) {
      setEmptyPanelClicks(prev => prev + 1);
    }
  }, [completed]);

  /**
   * 画像を選択する処理を行います。
   *
   * @param url - 選択された画像のURL
   * @param width - 画像の幅
   * @param height - 画像の高さ
   */
  const handleImageSelect = (url: string, width: number, height: number) => {
    setImageUrl(url);
    setOriginalImageSize({ width, height });
  };

  /**
   * パズルの難易度を変更します。
   *
   * @param newDivision - 新しい分割数
   */
  const handleDifficultyChange = (newDivision: number) => {
    setDivision(newDivision);
  };

  /**
   * ゲームを開始します。
   * パズルを初期化し、ゲーム開始状態に設定します。
   */
  const handleStartGame = () => {
    initializePuzzle();
    setGameStarted(true);
  };

  /**
   * パズルのピースを移動します。
   *
   * @param pieceId - 移動するピースのID
   */
  const handlePieceMove = (pieceId: number) => {
    movePiece(pieceId);
  };

  /**
   * ゲームをリセットします。
   * パズルの状態をリセットします。
   */
  const handleResetGame = () => {
    resetPuzzle();
  };

  /**
   * ゲームを終了します。
   * ゲーム開始状態を解除します。
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
      setPieces,
      setCompleted,
    },
  };
};
