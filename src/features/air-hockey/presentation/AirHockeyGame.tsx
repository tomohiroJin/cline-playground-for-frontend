/**
 * Air Hockey メインコンポーネント（プレゼンテーション層）
 *
 * 責務:
 * - 画面遷移（useScreenNavigation）
 * - ゲームモード管理（useGameMode）
 * - ゲームループ管理（useGameLoop）
 * - リザルト処理（useResultProcessing）
 * - 音声管理（useAudioManager）
 * - 各画面コンポーネントの描画
 *
 * ロジックはフックに委譲し、このコンポーネントは薄いラッパーに保つ。
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { EntityFactory } from '../core/entities';
import { getExitConfirmMessage } from '../core/exit-confirm';
import { CONSTANTS } from '../core/constants';
import { FIELDS, PAIR_MATCH_GOAL_SIZES } from '../core/config';
import { findCharacterById, PLAYER_CHARACTER } from '../core/characters';
import type { GameState, GamePhase, ShakeState, MatchStats, GameMode } from '../core/types';
import { CHAPTER_1_STAGES } from '../core/dialogue-data';
import { FreeBattleCharacterSelect } from '../components/FreeBattleCharacterSelect';
import { getDexEntryById } from '../core/dex-data';
import { useCharacterDex } from '../hooks/useCharacterDex';
import { CharacterDexScreen } from '../components/CharacterDexScreen';
import { CharacterProfileCard } from '../components/CharacterProfileCard';
import { CharacterSelectScreen } from '../components/CharacterSelectScreen';
import { createKeyboardState, updateKeyboardStateForPlayer } from '../core/keyboard';
import { useInput } from '../hooks/useInput';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { useMultiTouchInput } from '../hooks/useMultiTouchInput';
import { useGameLoop } from './hooks/useGameLoop';
import { useScreenNavigation } from './hooks/useScreenNavigation';
import { useGameMode } from './hooks/useGameMode';
import { useGamepadInput } from '../hooks/useGamepadInput';
import { useResultProcessing } from './hooks/useResultProcessing';
import { useAudioManager } from './hooks/useAudioManager';
import { useUIOverlayState } from './hooks/useUIOverlayState';
import { useStoryScreen } from './hooks/useStoryScreen';
import { useFreeBattleScreen } from './hooks/useFreeBattleScreen';
import { usePairMatchSetup } from './hooks/usePairMatchSetup';
import { useGameHandlers } from './hooks/useGameHandlers';
import { TitleScreen } from '../components/TitleScreen';
import { TeamSetupScreen } from '../components/TeamSetupScreen';
import { Scoreboard } from '../components/Scoreboard';
import { Field } from '../components/Field';
import { ResultScreen } from '../components/ResultScreen';
import { AchievementList } from '../components/AchievementList';
import { Transition } from '../components/Transition';
import { Tutorial } from '../components/Tutorial';
import { SettingsPanel } from '../components/SettingsPanel';
import { DailyChallengeScreen } from '../components/DailyChallengeScreen';
import { StageSelectScreen } from '../components/StageSelectScreen';
import { DialogueOverlay } from '../components/DialogueOverlay';
import { VsScreen } from '../components/VsScreen';
import { ChapterTitleCard } from '../components/ChapterTitleCard';
import { VictoryCutIn } from '../components/VictoryCutIn';
import { getDailyChallengeResult } from '../core/daily-challenge';
import { getVictoryCutInUrl } from '../core/get-stage-asset-urls';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { PageContainer } from '../styles';

const AirHockeyGame: React.FC = () => {
  // ── カスタムフック ──
  const nav = useScreenNavigation();
  const { screen, transitioning, navigateTo, navigateWithTransition } = nav;
  const mode = useGameMode();
  const audio = useAudioManager();
  const { toast: gamepadToast, connectedCount: gamepadConnectedCount } = useGamepadInput();
  const dex = useCharacterDex();

  // ── ゲームセッション状態 ──
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [shake, setShake] = useState<ShakeState | null>(null);
  const [preloadUrls, setPreloadUrls] = useState<string[]>([]);
  useImagePreloader(preloadUrls);

  // ── Ref ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const lastInputRef = useRef(0);
  const scoreRef = useRef({ p: 0, c: 0 });
  const phaseRef = useRef<GamePhase>('countdown');
  const countdownStartRef = useRef(0);
  const shakeRef = useRef<ShakeState | null>(null);
  const statsRef = useRef<MatchStats>(EntityFactory.createMatchStats());
  const matchStartRef = useRef(0);
  const player2KeysRef = useRef(createKeyboardState());
  const playerTargetRef = useRef<import('../hooks/useInput').PlayerTargetPosition>(null);
  const gamepadToastRef = useRef(gamepadToast);
  gamepadToastRef.current = gamepadToast;

  // ── UI オーバーレイ状態（phaseRef 依存のため Ref 宣言後に配置）──
  const ui = useUIOverlayState(screen, phaseRef);

  // ── リザルト処理 ──
  const result = useResultProcessing({ screen, winner, scoreRef, statsRef, mode, dex });

  // ── 副作用 ──
  // ゲーム画面のみ touchmove を抑制（メニュー/リザルトではスクロール可能にする）
  useEffect(() => {
    if (screen !== 'game') return;
    const handler = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, [screen]);

  // ── ゲーム制御 ──
  const startGame = useCallback((fieldOverride?: typeof mode.field, gameModeOverride?: GameMode) => {
    const baseField = fieldOverride ?? mode.field;
    const effectiveGameMode = gameModeOverride ?? mode.gameMode;
    const is2v2 = effectiveGameMode === '2v2-local';
    // 2v2 時はゴールサイズを固定値で拡大
    const pairGoalSize = PAIR_MATCH_GOAL_SIZES[baseField.id];
    const activeField = is2v2 && pairGoalSize
      ? { ...baseField, goalSize: pairGoalSize }
      : baseField;
    // 2v2 時はフィールドを mode に反映して useGameLoop に伝播
    if (is2v2 && pairGoalSize) {
      mode.setField(activeField);
    }
    gameRef.current = EntityFactory.createGameState(CONSTANTS, activeField, is2v2);
    scoreRef.current = { p: 0, c: 0 };
    setScores({ p: 0, c: 0 });
    setWinner(null);
    ui.setShowHelp(false);
    navigateWithTransition('game');
    lastInputRef.current = Date.now();
    phaseRef.current = 'countdown';
    countdownStartRef.current = Date.now();
    statsRef.current = EntityFactory.createMatchStats();
    matchStartRef.current = Date.now();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mode全体を依存に入れるとゲーム開始時に不要な再レンダリングが発生するため、必要な値のみ指定。ui.setShowHelp は useState の setter で安定参照のため省略可
  }, [mode.field, mode.gameMode, mode.setField, navigateWithTransition]);

  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') phaseRef.current = 'paused';
    else if (phaseRef.current === 'paused') phaseRef.current = 'playing';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game') return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') togglePause();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, togglePause]);

  // ── イベントハンドラ ──
  const handlers = useGameHandlers({
    mode, nav, ui, audio, winner, startGame, setPreloadUrls,
  });

  // ── 導出値 ──
  const { cpuCharacter, storyCharacters, stageBackgroundUrl, hasNextStage, storyAiConfig } = useStoryScreen({ currentStage: mode.currentStage });
  const { freeBattleAiConfig, freeBattleCpuCharacter, allBattleCharacters, freeBattleSelectableCharacters } = useFreeBattleScreen({
    difficulty: mode.difficulty,
    selectedCpuCharacter: mode.selectedCpuCharacter,
    unlockedIds: dex.unlockedIds,
  });
  const selectedDexEntry = React.useMemo(() => ui.selectedCharacterId ? getDexEntryById(ui.selectedCharacterId) : undefined, [ui.selectedCharacterId]);
  const selectedCharacter = React.useMemo(() => ui.selectedCharacterId ? findCharacterById(ui.selectedCharacterId) : undefined, [ui.selectedCharacterId]);
  const dexCharacterMap = React.useMemo(() => {
    const map: Record<string, typeof PLAYER_CHARACTER> = {};
    for (const entry of dex.dexEntries) {
      const char = findCharacterById(entry.profile.characterId);
      if (char) map[entry.profile.characterId] = char;
    }
    return map;
  }, [dex.dexEntries]);

  // ── 2P / 2v2 モード判定（入力フックより前に宣言） ──
  const is2PMode = mode.gameMode === '2p-local';
  const is2v2Mode = mode.gameMode === '2v2-local';
  const isMultiPlayer = is2PMode || is2v2Mode;

  // ── 入力・ゲームループ ──
  const handleInput = useInput(canvasRef, lastInputRef, playerTargetRef, screen, ui.showHelp, ui.setShowHelp);
  const keysRef = useKeyboardInput(gameRef, lastInputRef, screen, ui.showHelp, ui.setShowHelp, isMultiPlayer);
  const is2PGame = isMultiPlayer && screen === 'game';
  const { pairAlly, pairEnemy1, pairEnemy2, resultPlayerCharacter, resultOpponentCharacter, currentCpuName } = usePairMatchSetup({
    gameMode: mode.gameMode,
    allyCharacter: mode.allyCharacter,
    enemyCharacter1: mode.enemyCharacter1,
    enemyCharacter2: mode.enemyCharacter2,
    player1Character: mode.player1Character,
    player2Character: mode.player2Character,
    selectedCpuCharacter: mode.selectedCpuCharacter,
    cpuCharacter,
    freeBattleCpuCharacter,
    freeBattleSelectableCharacters,
  });
  // マルチプレイヤー時のスコアボード・リザルト表示名
  const multiPlayerName = is2v2Mode ? 'チーム1' : (mode.player1Character?.name ?? '1P');
  const multiOpponentName = is2v2Mode ? 'チーム2' : (mode.player2Character?.name ?? '2P');

  // 2P 用マルチタッチ入力（画面上下分割）
  const { stateRef: multiTouchRef } = useMultiTouchInput(canvasRef, is2PGame, is2v2Mode);

  // 2P 用キーボード入力リスナー（WASD → player2KeysRef）
  useEffect(() => {
    if (!is2PGame) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const updated = updateKeyboardStateForPlayer(player2KeysRef.current, e.key, true, 'player2');
      if (updated !== player2KeysRef.current) {
        player2KeysRef.current = updated;
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const updated = updateKeyboardStateForPlayer(player2KeysRef.current, e.key, false, 'player2');
      if (updated !== player2KeysRef.current) {
        player2KeysRef.current = updated;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      player2KeysRef.current = createKeyboardState();
    };
  }, [is2PGame]);

  useGameLoop({
    screen, showHelp: ui.showHelp,
    config: {
      difficulty: mode.difficulty, field: mode.field, winScore: mode.winScore,
      getSound: audio.getSound, bgmEnabled: audio.bgmEnabled, gameMode: mode.gameMode,
      aiConfig: mode.gameMode === 'story' ? storyAiConfig : freeBattleAiConfig,
      playerMalletColor: is2PMode ? mode.player1Character?.color : undefined,
      cpuMalletColor: is2PMode ? mode.player2Character?.color : undefined,
      allyControlType: is2v2Mode ? mode.allyControlType : undefined,
      allyCharacterId: is2v2Mode ? pairAlly.id : undefined,
      enemyCharacter1Id: is2v2Mode ? pairEnemy1.id : undefined,
      enemyCharacter2Id: is2v2Mode ? pairEnemy2.id : undefined,
      enemy1ControlType: is2v2Mode ? mode.enemy1ControlType : undefined,
      enemy2ControlType: is2v2Mode ? mode.enemy2ControlType : undefined,
    },
    refs: {
      gameRef, canvasRef, lastInputRef, scoreRef, phaseRef, countdownStartRef, shakeRef, statsRef, matchStartRef, keysRef,
      playerTargetRef,
      player2KeysRef: (is2PMode || is2v2Mode) ? player2KeysRef : undefined,
      multiTouchRef: (is2PMode || is2v2Mode) ? multiTouchRef : undefined,
      gamepadToastRef,
    },
    callbacks: { setScores, setWinner, setScreen: handlers.handleScreenChange, setShowHelp: ui.setShowHelp, setShake },
  });

  // ── 描画 ──
  return (
    <PageContainer>
      {ui.showSettings && (
        <SettingsPanel bgmEnabled={audio.bgmEnabled} onToggleBgm={audio.toggleBgm} audioSettings={audio.audioSettings} onAudioSettingsChange={audio.setAudioSettings} onClose={() => ui.setShowSettings(false)} />
      )}
      {ui.showTutorial && <Tutorial isHelp={ui.isHelpMode} onComplete={ui.handleTutorialComplete} />}

      {screen === 'menu' && (
        <Transition isActive={!transitioning} type="fade">
          <TitleScreen
            diff={mode.difficulty} setDiff={mode.setDifficulty} field={mode.field} setField={mode.setField}
            winScore={mode.winScore} setWinScore={mode.setWinScore} highScore={result.highScore}
            onStart={handlers.handleFreeStart} onStoryClick={handlers.handleStoryClick}
            onShowAchievements={() => navigateTo('achievements')}
            onHelpClick={() => { ui.setIsHelpMode(true); ui.setShowTutorial(true); }}
            onSettingsClick={() => ui.setShowSettings(true)}
            onDailyChallengeClick={handlers.handleDailyChallengeClick}
            unlockState={result.unlockState}
            onCharacterDexClick={() => navigateTo('characterDex')}
            newUnlockCount={dex.getNewUnlockCount()}
            onTwoPlayerClick={handlers.handleTwoPlayerClick}
            onPairMatchClick={handlers.handlePairMatchClick}
          />
        </Transition>
      )}

      {screen === 'freeBattleCharacterSelect' && (
        <FreeBattleCharacterSelect
          characters={freeBattleSelectableCharacters}
          unlockedIds={dex.unlockedIds}
          difficulty={mode.difficulty}
          onConfirm={handlers.handleFreeBattleCharacterConfirm}
          onBack={handlers.handleBackToMenu}
        />
      )}

      {screen === 'characterSelect' && (
        <CharacterSelectScreen
          characters={allBattleCharacters}
          onStartBattle={handlers.handleStartBattle}
          onBack={handlers.handleBackToMenu}
        />
      )}

      {screen === 'teamSetup' && (
        <TeamSetupScreen
          allCharacters={freeBattleSelectableCharacters}
          unlockedIds={dex.unlockedIds}
          playerCharacter={PLAYER_CHARACTER}
          allyCharacter={pairAlly}
          enemyCharacter1={pairEnemy1}
          enemyCharacter2={pairEnemy2}
          onAllyChange={mode.setAllyCharacter}
          onEnemy1Change={mode.setEnemyCharacter1}
          onEnemy2Change={mode.setEnemyCharacter2}
          allyControlType={mode.allyControlType}
          onAllyControlTypeChange={mode.setAllyControlType}
          enemy1ControlType={mode.enemy1ControlType}
          onEnemy1ControlTypeChange={mode.setEnemy1ControlType}
          enemy2ControlType={mode.enemy2ControlType}
          onEnemy2ControlTypeChange={mode.setEnemy2ControlType}
          gamepadConnected={gamepadConnectedCount}
          onStart={handlers.handlePairMatchStart}
          onBack={handlers.handleBackToMenu}
        />
      )}

      {screen === 'achievements' && <AchievementList onBack={handlers.handleBackToMenu} />}

      {screen === 'characterDex' && (
        <>
          <CharacterDexScreen
            dexEntries={dex.dexEntries} unlockedIds={dex.unlockedIds} newlyUnlockedIds={dex.newlyUnlockedIds}
            characters={dexCharacterMap} completionRate={dex.completionRate}
            onSelectCharacter={ui.setSelectedCharacterId} onBack={handlers.handleBackFromDex} onMarkViewed={dex.markViewed}
          />
          {selectedDexEntry && selectedCharacter && <CharacterProfileCard entry={selectedDexEntry} character={selectedCharacter} onClose={() => ui.setSelectedCharacterId(undefined)} />}
        </>
      )}

      {screen === 'daily' && mode.dailyChallenge && (
        <DailyChallengeScreen challenge={mode.dailyChallenge} result={getDailyChallengeResult(mode.dailyChallenge.date)} onStart={handlers.handleDailyChallengeStart} onBack={handlers.handleBackToMenu} />
      )}

      {screen === 'stageSelect' && (
        <Transition isActive={true} type="fade">
          <StageSelectScreen stages={CHAPTER_1_STAGES} progress={mode.storyProgress} onSelectStage={handlers.handleSelectStage} onBack={handlers.handleBackFromStageSelect} onReset={handlers.handleStoryReset} />
        </Transition>
      )}

      {screen === 'chapterTitle' && mode.currentStage?.chapterTitle && (
        <ChapterTitleCard chapter={mode.currentStage.chapter} title={mode.currentStage.chapterTitle} subtitle={mode.currentStage.chapterSubtitle} backgroundUrl={stageBackgroundUrl} onComplete={() => navigateTo('preDialogue')} />
      )}
      {screen === 'preDialogue' && mode.currentStage && (
        <DialogueOverlay dialogues={mode.currentStage.preDialogue} characters={storyCharacters} backgroundUrl={stageBackgroundUrl} onComplete={() => navigateTo('vsScreen')} />
      )}
      {screen === 'vsScreen' && mode.gameMode === 'story' && mode.currentStage && cpuCharacter && (
        <VsScreen playerCharacter={PLAYER_CHARACTER} cpuCharacter={cpuCharacter} stageName={mode.currentStage.name} fieldName={(FIELDS.find(f => f.id === mode.currentStage!.fieldId) ?? FIELDS[0]).name} onComplete={handlers.handleVsComplete} />
      )}
      {screen === 'vsScreen' && mode.gameMode === 'free' && mode.selectedCpuCharacter && (
        <VsScreen playerCharacter={PLAYER_CHARACTER} cpuCharacter={mode.selectedCpuCharacter} stageName="フリー対戦" fieldName={mode.field.name} onComplete={handlers.handleVsComplete} />
      )}
      {screen === 'vsScreen' && mode.gameMode === '2v2-local' && (
        <VsScreen
          playerCharacter={PLAYER_CHARACTER}
          cpuCharacter={pairEnemy1}
          stageName="ペアマッチ"
          fieldName={mode.field.name}
          onComplete={handlers.handlePairMatchVsComplete}
          is2v2
          allyCharacter={pairAlly}
          enemyCharacter2={pairEnemy2}
          allyControlType={mode.allyControlType}
          enemy1ControlType={mode.enemy1ControlType}
          enemy2ControlType={mode.enemy2ControlType}
        />
      )}

      {screen === 'game' && (
        <>
          <Scoreboard
            scores={scores} onMenuClick={handlers.handleGameMenuClick} onPauseClick={togglePause}
            cpuName={isMultiPlayer ? multiOpponentName : currentCpuName}
            playerName={isMultiPlayer ? multiPlayerName : undefined}
            playerColor={is2PMode ? mode.player1Character?.color : undefined}
            cpuColor={is2PMode ? mode.player2Character?.color : undefined}
          />
          <Field canvasRef={canvasRef} onInput={handleInput} shake={shake} />
        </>
      )}

      {screen === 'postDialogue' && mode.currentStage && (
        <DialogueOverlay dialogues={winner === 'player' ? mode.currentStage.postWinDialogue : mode.currentStage.postLoseDialogue} characters={storyCharacters} backgroundUrl={stageBackgroundUrl} onComplete={handlers.handlePostDialogueComplete} />
      )}
      {screen === 'victoryCutIn' && mode.currentStage && (
        <VictoryCutIn imageUrl={getVictoryCutInUrl(mode.currentStage.chapter)} onComplete={() => navigateTo('result')} />
      )}

      {screen === 'result' && (
        <Transition isActive={true} type="fade">
          <ResultScreen
            winner={winner} scores={scores} onBackToMenu={handlers.handleResultBackToMenu}
            onReplay={mode.gameMode === 'story' ? () => mode.currentStage && handlers.handleSelectStage(mode.currentStage) : startGame}
            stats={result.matchStats} newAchievements={result.newAchievements}
            suggestedDifficulty={mode.gameMode === 'free' ? result.suggestedDifficulty : undefined}
            onAcceptDifficulty={handlers.handleAcceptDifficulty}
            onBackToStageSelect={mode.gameMode === 'story' ? handlers.handleBackToStageSelect : undefined}
            onNextStage={mode.gameMode === 'story' && hasNextStage ? handlers.handleNextStage : undefined}
            cpuCharacter={resultOpponentCharacter}
            playerCharacter={resultPlayerCharacter}
            newlyUnlockedCharacterName={result.newlyUnlockedCharacterName}
            is2PMode={isMultiPlayer}
            is2v2Mode={is2v2Mode}
            allyCharacter={is2v2Mode ? pairAlly : undefined}
            enemyCharacter2={is2v2Mode ? pairEnemy2 : undefined}
            player1CharacterName={isMultiPlayer ? multiPlayerName : undefined}
            player2CharacterName={isMultiPlayer ? multiOpponentName : undefined}
            onBackToCharacterSelect={is2PMode ? handlers.handleBackToCharacterSelect : undefined}
            onBackToTeamSetup={is2v2Mode ? handlers.handleBackToTeamSetup : undefined}
          />
        </Transition>
      )}
      <ConfirmDialog
        isOpen={ui.showExitConfirm}
        title="ゲームを終了しますか？"
        message={getExitConfirmMessage(mode.gameMode)}
        confirmLabel="メニューに戻る"
        cancelLabel="続ける"
        onConfirm={handlers.handleExitConfirm}
        onCancel={handlers.handleExitCancel}
      />
    </PageContainer>
  );
};

export default AirHockeyGame;
