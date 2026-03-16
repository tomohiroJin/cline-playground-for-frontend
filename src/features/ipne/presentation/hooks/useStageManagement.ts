/**
 * ステージ管理フック
 * 5ステージ進行・報酬選択・引き継ぎロジックを管理
 */
import { useCallback } from 'react';
import { ScreenState, ScreenStateValue, Player, PlayerClassValue } from '../../index';
import { StageNumber, StageRewardType, StageRewardHistory } from '../../types';
import { getNextStage, isFinalStage } from '../../domain/config/stageConfig';
import { applyStageReward, canChooseReward } from '../../domain/services/progressionService';
import { GameTimer } from '../../application/services/timerService';

interface StageManagementParams {
  currentStage: StageNumber;
  setCurrentStage: React.Dispatch<React.SetStateAction<StageNumber>>;
  setStageRewards: React.Dispatch<React.SetStateAction<StageRewardHistory[]>>;
  setScreen: React.Dispatch<React.SetStateAction<ScreenStateValue>>;
  playerRef: React.MutableRefObject<Player>;
  setPlayer: (player: Player | ((prev: Player) => Player)) => void;
  selectedClass: PlayerClassValue;
  timer: GameTimer;
  initStage: (
    stage: StageNumber,
    playerClass: PlayerClassValue,
    existingPlayer?: Player,
    existingTimer?: GameTimer,
  ) => void;
}

/**
 * ステージ管理フック
 */
export function useStageManagement(params: StageManagementParams) {
  const {
    currentStage, setCurrentStage, setStageRewards,
    setScreen, playerRef, setPlayer,
    selectedClass, timer, initStage,
  } = params;

  // ステージクリア → 次へボタン → STAGE_STORY へ
  const handleStageClearNext = useCallback(() => {
    setScreen(ScreenState.STAGE_STORY);
  }, [setScreen]);

  // ストーリー → 次へボタン
  const handleStageStoryNext = useCallback(() => {
    if (isFinalStage(currentStage)) {
      setScreen(ScreenState.FINAL_CLEAR);
    } else {
      setScreen(ScreenState.STAGE_REWARD);
    }
  }, [currentStage, setScreen]);

  // ステージ報酬選択
  const handleRewardSelect = useCallback((rewardType: StageRewardType) => {
    const currentPlayer = playerRef.current;
    const updatedPlayer = applyStageReward(currentPlayer, rewardType);
    setPlayer(updatedPlayer);

    setStageRewards(prev => [...prev, { stage: currentStage, reward: rewardType }]);

    const nextStage = getNextStage(currentStage);
    if (nextStage) {
      setCurrentStage(nextStage);
      initStage(nextStage, selectedClass, updatedPlayer, timer);
      setScreen(ScreenState.GAME);
    }
  }, [currentStage, playerRef, setPlayer, initStage, selectedClass, timer, setCurrentStage, setStageRewards, setScreen]);

  // ステージ報酬が選択可能か判定
  const canChooseStageReward = useCallback((rewardType: StageRewardType): boolean => {
    return canChooseReward(playerRef.current, rewardType);
  }, [playerRef]);

  return {
    handleStageClearNext,
    handleStageStoryNext,
    handleRewardSelect,
    canChooseStageReward,
  };
}
