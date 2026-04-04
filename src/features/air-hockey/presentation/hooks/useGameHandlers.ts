/**
 * ゲームイベントハンドラ集約 Hook
 *
 * AirHockeyGame.tsx の useCallback 群を集約する。
 * AirHockeyGame.tsx から抽出（S8-1-5）。
 */
import { useCallback } from 'react';
import { FIELDS } from '../../core/config';
import { findCharacterById, PLAYER_CHARACTER } from '../../core/characters';
import type { Character, GameMode, Difficulty } from '../../core/types';
import { loadStoryProgress, resetStoryProgress } from '../../core/story';
import type { StageDefinition } from '../../core/story';
import { CHAPTER_1_STAGES } from '../../core/dialogue-data';
import { generateDailyChallenge } from '../../core/daily-challenge';
import { getStageAssetUrls } from '../../core/get-stage-asset-urls';
import { saveStreakRecord } from '../../core/difficulty-adjust';
import type { TwoPlayerConfig } from '../../application/use-cases/two-player-battle';
import type { UseGameModeReturn } from './useGameMode';
import type { UseScreenNavigationReturn } from './useScreenNavigation';
import type { UseUIOverlayStateReturn } from './useUIOverlayState';
import type { UseAudioManagerReturn } from './useAudioManager';
import type { FieldConfig } from '../../core/types';

type UseGameHandlersParams = {
  mode: UseGameModeReturn;
  nav: UseScreenNavigationReturn;
  ui: UseUIOverlayStateReturn;
  audio: UseAudioManagerReturn;
  winner: string | null;
  startGame: (fieldOverride?: FieldConfig, gameModeOverride?: GameMode) => void;
  setPreloadUrls: (urls: string[]) => void;
};

export type UseGameHandlersReturn = {
  handleSelectStage: (stage: StageDefinition) => void;
  handleScreenChange: (newScreen: 'menu' | 'game' | 'result') => void;
  handleFreeStart: () => void;
  handleStoryClick: () => void;
  handleDailyChallengeClick: () => void;
  handleDailyChallengeStart: () => void;
  handleBackFromDex: () => void;
  handleBackFromStageSelect: () => void;
  handleStoryReset: () => void;
  handleBackToMenu: () => void;
  handleVsComplete: () => void;
  handleGameMenuClick: () => void;
  handlePostDialogueComplete: () => void;
  handleResultBackToMenu: () => void;
  handleExitConfirm: () => void;
  handleExitCancel: () => void;
  handleTwoPlayerClick: () => void;
  handleStartBattle: (config: TwoPlayerConfig) => void;
  handleBackToCharacterSelect: () => void;
  handlePairMatchClick: () => void;
  handlePairMatchStart: () => void;
  handlePairMatchVsComplete: () => void;
  handleBackToTeamSetup: () => void;
  handleFreeBattleCharacterConfirm: (character: Character) => void;
  handleAcceptDifficulty: (d: Difficulty) => void;
  handleBackToStageSelect: () => void;
  handleNextStage: () => void;
};

export const useGameHandlers = ({
  mode, nav, ui, audio, winner, startGame, setPreloadUrls,
}: UseGameHandlersParams): UseGameHandlersReturn => {
  const { navigateTo } = nav;

  // ── ストーリーモード ──
  const handleSelectStage = useCallback((stage: StageDefinition) => {
    mode.setCurrentStage(stage);
    const stageField = FIELDS.find(f => f.id === stage.fieldId) ?? FIELDS[0];
    mode.setDifficulty(stage.difficulty);
    mode.setField(stageField);
    mode.setWinScore(stage.winScore);
    const chars: Record<string, typeof PLAYER_CHARACTER> = {};
    const cpuChar = findCharacterById(stage.characterId);
    if (cpuChar) chars[stage.characterId] = cpuChar;
    chars['player'] = PLAYER_CHARACTER;
    setPreloadUrls(getStageAssetUrls(stage, chars));
    navigateTo(stage.chapterTitle ? 'chapterTitle' : 'preDialogue');
  }, [mode, navigateTo, setPreloadUrls]);

  const handleScreenChange = useCallback((newScreen: 'menu' | 'game' | 'result') => {
    if (newScreen === 'result' && mode.gameMode === 'story') {
      navigateTo('postDialogue');
    } else {
      navigateTo(newScreen);
    }
  }, [mode.gameMode, navigateTo]);

  // ── メニュー系 ──
  const handleFreeStart = useCallback(() => { mode.setGameMode('free'); navigateTo('freeBattleCharacterSelect'); }, [mode, navigateTo]);
  const handleStoryClick = useCallback(() => { mode.setGameMode('story'); mode.setStoryProgress(loadStoryProgress()); navigateTo('stageSelect'); }, [mode, navigateTo]);
  const handleDailyChallengeClick = useCallback(() => { mode.setDailyChallenge(generateDailyChallenge(new Date())); navigateTo('daily'); }, [mode, navigateTo]);
  const handleDailyChallengeStart = useCallback(() => {
    if (!mode.dailyChallenge) return;
    const cf = FIELDS.find(f => f.id === mode.dailyChallenge!.fieldId) ?? FIELDS[0];
    mode.setDifficulty(mode.dailyChallenge.difficulty);
    mode.setField(cf);
    mode.setWinScore(mode.dailyChallenge.winScore);
    mode.setIsDailyMode(true);
    mode.setGameMode('free');
    startGame(cf);
  }, [mode, startGame]);
  const handleBackFromDex = useCallback(() => { ui.setSelectedCharacterId(undefined); navigateTo('menu'); }, [ui, navigateTo]);
  const handleBackFromStageSelect = useCallback(() => { mode.resetToFree(); navigateTo('menu'); }, [mode, navigateTo]);
  const handleStoryReset = useCallback(() => { resetStoryProgress(); mode.setStoryProgress({ clearedStages: [] }); }, [mode]);
  const handleBackToMenu = useCallback(() => { navigateTo('menu'); }, [navigateTo]);

  // ── VS 画面 ──
  const handleVsComplete = useCallback(() => {
    const sf = mode.currentStage ? (FIELDS.find(f => f.id === mode.currentStage!.fieldId) ?? FIELDS[0]) : mode.field;
    startGame(sf);
  }, [mode.currentStage, mode.field, startGame]);

  // ── ゲーム中 ──
  const handleGameMenuClick = useCallback(() => { ui.setShowExitConfirm(true); }, [ui]);
  const handlePostDialogueComplete = useCallback(() => {
    if (mode.currentStage?.isChapterFinale && winner === 'player') {
      navigateTo('victoryCutIn');
    } else {
      navigateTo('result');
    }
  }, [mode.currentStage, winner, navigateTo]);
  const handleResultBackToMenu = useCallback(() => { mode.resetToFree(); navigateTo('menu'); }, [mode, navigateTo]);
  const handleExitConfirm = useCallback(() => {
    ui.setShowExitConfirm(false);
    audio.getSound().bgmStop(); mode.resetToFree(); navigateTo('menu');
  }, [ui, audio, mode, navigateTo]);
  const handleExitCancel = useCallback(() => { ui.setShowExitConfirm(false); }, [ui]);

  // ── 2P 対戦 ──
  const handleTwoPlayerClick = useCallback(() => { navigateTo('characterSelect'); }, [navigateTo]);
  const handleStartBattle = useCallback((config: TwoPlayerConfig) => {
    mode.setGameMode('2p-local');
    mode.setPlayer1Character(config.player1Character);
    mode.setPlayer2Character(config.player2Character);
    startGame(mode.field, '2p-local');
  }, [mode, startGame]);
  const handleBackToCharacterSelect = useCallback(() => { navigateTo('characterSelect'); }, [navigateTo]);

  // ── ペアマッチ（2v2）──
  const handlePairMatchClick = useCallback(() => { navigateTo('teamSetup'); }, [navigateTo]);
  const handlePairMatchStart = useCallback(() => { mode.setGameMode('2v2-local'); navigateTo('vsScreen'); }, [mode, navigateTo]);
  const handlePairMatchVsComplete = useCallback(() => { startGame(mode.field, '2v2-local'); }, [mode.field, startGame]);
  const handleBackToTeamSetup = useCallback(() => { navigateTo('teamSetup'); }, [navigateTo]);

  // ── キャラ選択 ──
  const handleFreeBattleCharacterConfirm = useCallback((character: Character) => {
    mode.setSelectedCpuCharacter(character);
    navigateTo('vsScreen');
  }, [mode, navigateTo]);

  // ── リザルト ──
  const handleAcceptDifficulty = useCallback((d: Difficulty) => { mode.setDifficulty(d); saveStreakRecord({ winStreak: 0, loseStreak: 0 }); }, [mode]);
  const handleBackToStageSelect = useCallback(() => { mode.setStoryProgress(loadStoryProgress()); navigateTo('stageSelect'); }, [mode, navigateTo]);
  const handleNextStage = useCallback(() => {
    const idx = CHAPTER_1_STAGES.findIndex(s => s.id === mode.currentStage?.id);
    if (CHAPTER_1_STAGES[idx + 1]) handleSelectStage(CHAPTER_1_STAGES[idx + 1]);
  }, [mode.currentStage, handleSelectStage]);

  return {
    handleSelectStage, handleScreenChange,
    handleFreeStart, handleStoryClick, handleDailyChallengeClick, handleDailyChallengeStart,
    handleBackFromDex, handleBackFromStageSelect, handleStoryReset, handleBackToMenu,
    handleVsComplete, handleGameMenuClick, handlePostDialogueComplete,
    handleResultBackToMenu, handleExitConfirm, handleExitCancel,
    handleTwoPlayerClick, handleStartBattle, handleBackToCharacterSelect,
    handlePairMatchClick, handlePairMatchStart, handlePairMatchVsComplete, handleBackToTeamSetup,
    handleFreeBattleCharacterConfirm, handleAcceptDifficulty, handleBackToStageSelect, handleNextStage,
  };
};
