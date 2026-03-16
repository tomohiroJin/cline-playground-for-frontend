/**
 * 画面遷移フロー統合テスト
 * useScreenTransition と useStageManagement フックの画面遷移を検証する
 */
import { renderHook, act } from '@testing-library/react';
import { useState, useCallback, useRef } from 'react';
import { useScreenTransition } from '../../presentation/hooks/useScreenTransition';
import { useStageManagement } from '../../presentation/hooks/useStageManagement';
import { ScreenState, PlayerClass, ScreenStateValue, PlayerClassValue } from '../../index';
import { StageNumber, StageRewardHistory, StageRewardType, Player } from '../../types';
import { createPlayer } from '../../domain/entities/player';
import { createTimer } from '../../application/services/timerService';

/**
 * テスト用に画面遷移とステージ管理を統合したフック
 */
function useTestScreenFlow() {
  const [screen, setScreen] = useState<ScreenStateValue>(ScreenState.TITLE);
  const [selectedClass, setSelectedClass] = useState<PlayerClassValue>(PlayerClass.WARRIOR);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageNumber>(1);
  const [stageRewards, setStageRewards] = useState<StageRewardHistory[]>([]);
  const [player, setPlayer] = useState<Player>(createPlayer(0, 0));
  const [timer] = useState(() => createTimer());
  const playerRef = useRef(player);
  playerRef.current = player;

  const initGame = useCallback((_playerClass: PlayerClassValue) => {
    // テスト用の簡易初期化
    setPlayer(createPlayer(1, 1));
  }, []);

  const initStage = useCallback((
    _stage: StageNumber,
    _playerClass: PlayerClassValue,
    existingPlayer?: Player,
  ) => {
    if (existingPlayer) {
      setPlayer({ ...existingPlayer, x: 1, y: 1 });
    }
  }, []);

  const screenTransition = useScreenTransition({
    setScreen, setSelectedClass, setIsGameOver,
    setCurrentStage, setStageRewards, selectedClass, initGame,
  });

  const stageManagement = useStageManagement({
    currentStage, setCurrentStage, setStageRewards,
    setScreen, playerRef, setPlayer,
    selectedClass, timer, initStage,
  });

  return {
    screen,
    setScreen,
    selectedClass,
    isGameOver,
    currentStage,
    stageRewards,
    player,
    setPlayer,
    ...screenTransition,
    ...stageManagement,
  };
}

describe('画面遷移フロー', () => {
  it('TITLE → CLASS_SELECT → PROLOGUE → GAME の正常フロー', () => {
    // Arrange
    const { result } = renderHook(() => useTestScreenFlow());

    // Assert: 初期状態はタイトル
    expect(result.current.screen).toBe(ScreenState.TITLE);

    // Act: ゲーム開始 → CLASS_SELECT
    act(() => result.current.handleStartGame());
    expect(result.current.screen).toBe(ScreenState.CLASS_SELECT);

    // Act: 職業選択 → PROLOGUE
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    expect(result.current.screen).toBe(ScreenState.PROLOGUE);

    // Act: プロローグスキップ → GAME
    act(() => result.current.handleSkipPrologue());
    expect(result.current.screen).toBe(ScreenState.GAME);
  });

  it('盗賊を選択してもGAMEまで正しく遷移する', () => {
    // Arrange
    const { result } = renderHook(() => useTestScreenFlow());

    // Act: タイトルから盗賊でゲーム開始
    act(() => result.current.handleStartGame());
    act(() => result.current.handleClassSelect(PlayerClass.THIEF));
    expect(result.current.screen).toBe(ScreenState.PROLOGUE);
    expect(result.current.selectedClass).toBe(PlayerClass.THIEF);

    act(() => result.current.handleSkipPrologue());
    expect(result.current.screen).toBe(ScreenState.GAME);
  });

  it('GAME → GAME_OVER → タイトルに戻れる（死亡フロー）', () => {
    // Arrange: GAMEまで進める
    const { result } = renderHook(() => useTestScreenFlow());
    act(() => result.current.handleStartGame());
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    act(() => result.current.handleSkipPrologue());
    expect(result.current.screen).toBe(ScreenState.GAME);

    // Act: ゲームオーバー（外部からscreen変更を想定）
    act(() => result.current.setScreen(ScreenState.GAME_OVER));
    expect(result.current.screen).toBe(ScreenState.GAME_OVER);

    // Act: タイトルに戻る
    act(() => result.current.handleBackToTitle());
    expect(result.current.screen).toBe(ScreenState.TITLE);
    expect(result.current.isGameOver).toBe(false);
    expect(result.current.currentStage).toBe(1);
    expect(result.current.stageRewards).toEqual([]);
  });

  it('ゲームオーバーからリトライできる', () => {
    // Arrange: GAMEまで進めてゲームオーバー
    const { result } = renderHook(() => useTestScreenFlow());
    act(() => result.current.handleStartGame());
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    act(() => result.current.handleSkipPrologue());
    act(() => result.current.setScreen(ScreenState.GAME_OVER));

    // Act: リトライ → GAME に戻る
    act(() => result.current.handleGameOverRetry());
    expect(result.current.screen).toBe(ScreenState.GAME);
  });

  it('STAGE_CLEAR → STAGE_STORY → STAGE_REWARD → GAME のステージ進行', () => {
    // Arrange: GAMEまで進める
    const { result } = renderHook(() => useTestScreenFlow());
    act(() => result.current.handleStartGame());
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    act(() => result.current.handleSkipPrologue());
    expect(result.current.screen).toBe(ScreenState.GAME);
    expect(result.current.currentStage).toBe(1);

    // Act: ステージクリア
    act(() => result.current.setScreen(ScreenState.STAGE_CLEAR));
    expect(result.current.screen).toBe(ScreenState.STAGE_CLEAR);

    // Act: 次へ → STAGE_STORY
    act(() => result.current.handleStageClearNext());
    expect(result.current.screen).toBe(ScreenState.STAGE_STORY);

    // Act: ストーリー次へ → STAGE_REWARD（ステージ1なので最終ではない）
    act(() => result.current.handleStageStoryNext());
    expect(result.current.screen).toBe(ScreenState.STAGE_REWARD);

    // Act: 報酬選択 → 次ステージのGAME
    act(() => result.current.handleRewardSelect('hp_up' as StageRewardType));
    expect(result.current.screen).toBe(ScreenState.GAME);
    expect(result.current.currentStage).toBe(2);
    expect(result.current.stageRewards).toHaveLength(1);
  });

  it('最終ステージクリア後にFINAL_CLEARになりタイトルに戻れる', () => {
    // Arrange: ステージ5（最終ステージ）まで進める
    const { result } = renderHook(() => useTestScreenFlow());
    act(() => result.current.handleStartGame());
    act(() => result.current.handleClassSelect(PlayerClass.WARRIOR));
    act(() => result.current.handleSkipPrologue());

    // ステージ1〜4をスキップして5に
    for (let stage = 1; stage < 5; stage++) {
      act(() => result.current.setScreen(ScreenState.STAGE_CLEAR));
      act(() => result.current.handleStageClearNext());
      act(() => result.current.handleStageStoryNext());
      act(() => result.current.handleRewardSelect('hp_up' as StageRewardType));
    }
    expect(result.current.currentStage).toBe(5);

    // Act: ステージ5クリア → STAGE_STORY → FINAL_CLEAR
    act(() => result.current.setScreen(ScreenState.STAGE_CLEAR));
    act(() => result.current.handleStageClearNext());
    expect(result.current.screen).toBe(ScreenState.STAGE_STORY);

    act(() => result.current.handleStageStoryNext());
    expect(result.current.screen).toBe(ScreenState.FINAL_CLEAR);

    // Act: タイトルに戻る
    act(() => result.current.handleBackToTitle());
    expect(result.current.screen).toBe(ScreenState.TITLE);
    expect(result.current.currentStage).toBe(1);
  });
});
