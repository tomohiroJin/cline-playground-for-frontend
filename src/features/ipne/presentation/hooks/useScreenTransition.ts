/**
 * 画面遷移フック
 * ゲーム画面間の遷移ハンドラーを管理
 */
import { useCallback } from 'react';
import { ScreenState, ScreenStateValue, PlayerClassValue } from '../../index';
import { StageNumber, StageRewardHistory } from '../../types';

interface ScreenTransitionParams {
  setScreen: React.Dispatch<React.SetStateAction<ScreenStateValue>>;
  setSelectedClass: React.Dispatch<React.SetStateAction<PlayerClassValue>>;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentStage: React.Dispatch<React.SetStateAction<StageNumber>>;
  setStageRewards: React.Dispatch<React.SetStateAction<StageRewardHistory[]>>;
  selectedClass: PlayerClassValue;
  initGame: (playerClass: PlayerClassValue) => void;
}

/**
 * 画面遷移ハンドラーフック
 */
export function useScreenTransition(params: ScreenTransitionParams) {
  const {
    setScreen, setSelectedClass, setIsGameOver,
    setCurrentStage, setStageRewards,
    selectedClass, initGame,
  } = params;

  const handleStartGame = useCallback(() => {
    setScreen(ScreenState.CLASS_SELECT);
  }, [setScreen]);

  const handleClassSelect = useCallback((playerClass: PlayerClassValue) => {
    setSelectedClass(playerClass);
    setScreen(ScreenState.PROLOGUE);
  }, [setSelectedClass, setScreen]);

  const handleSkipPrologue = useCallback(() => {
    initGame(selectedClass);
    setScreen(ScreenState.GAME);
  }, [initGame, selectedClass, setScreen]);

  // リトライ共通処理（完全リスタート：ステージ1から）
  const restartGame = useCallback(() => {
    initGame(selectedClass);
    setScreen(ScreenState.GAME);
  }, [initGame, selectedClass, setScreen]);

  // クリア画面からのリトライ
  const handleRetry = restartGame;
  // ゲームオーバー画面からのリトライ
  const handleGameOverRetry = restartGame;

  const handleBackToTitle = useCallback(() => {
    setScreen(ScreenState.TITLE);
    setIsGameOver(false);
    setCurrentStage(1);
    setStageRewards([]);
  }, [setScreen, setIsGameOver, setCurrentStage, setStageRewards]);

  return {
    handleStartGame,
    handleClassSelect,
    handleSkipPrologue,
    handleRetry,
    handleGameOverRetry,
    handleBackToTitle,
  };
}
