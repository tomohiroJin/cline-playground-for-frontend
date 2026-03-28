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
import { EntityFactory } from '../core/entities';
import { CONSTANTS } from '../core/constants';
import { FIELDS, PAIR_MATCH_GOAL_SIZES } from '../core/config';
import { getCharacterByDifficulty, findCharacterById, getBattleCharacters, PLAYER_CHARACTER } from '../core/characters';
import type { Character, GameState, GamePhase, ShakeState, MatchStats, GameMode } from '../core/types';
import { loadStoryProgress, resetStoryProgress } from '../core/story';
import type { StageDefinition } from '../core/story';
import { CHAPTER_1_STAGES } from '../core/dialogue-data';
import { getStoryStageBalance, buildFreeBattleAiConfig } from '../core/story-balance';
import { FreeBattleCharacterSelect } from '../components/FreeBattleCharacterSelect';
import { getDexEntryById } from '../core/dex-data';
import { useCharacterDex } from '../hooks/useCharacterDex';
import { CharacterDexScreen } from '../components/CharacterDexScreen';
import { CharacterProfileCard } from '../components/CharacterProfileCard';
import { CharacterSelectScreen } from '../components/CharacterSelectScreen';
import type { TwoPlayerConfig } from '../application/use-cases/two-player-battle';
import { createKeyboardState, updateKeyboardStateForPlayer } from '../core/keyboard';
import { useInput } from '../hooks/useInput';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import { useMultiTouchInput } from '../hooks/useMultiTouchInput';
import { useGameLoop } from './hooks/useGameLoop';
import { useScreenNavigation } from './hooks/useScreenNavigation';
import { useGameMode } from './hooks/useGameMode';
import { useResultProcessing } from './hooks/useResultProcessing';
import { useAudioManager } from './hooks/useAudioManager';
import { TitleScreen } from '../components/TitleScreen';
import { TeamSetupScreen } from '../components/TeamSetupScreen';
import { Scoreboard } from '../components/Scoreboard';
import { Field } from '../components/Field';
import { ResultScreen } from '../components/ResultScreen';
import { AchievementList } from '../components/AchievementList';
import { Transition } from '../components/Transition';
import { Tutorial, isTutorialCompleted } from '../components/Tutorial';
import { SettingsPanel } from '../components/SettingsPanel';
import { DailyChallengeScreen } from '../components/DailyChallengeScreen';
import { StageSelectScreen } from '../components/StageSelectScreen';
import { DialogueOverlay } from '../components/DialogueOverlay';
import { VsScreen } from '../components/VsScreen';
import { ChapterTitleCard } from '../components/ChapterTitleCard';
import { VictoryCutIn } from '../components/VictoryCutIn';
import { generateDailyChallenge, getDailyChallengeResult } from '../core/daily-challenge';
import { BACKGROUND_MAP } from '../core/characters';
import { getStageAssetUrls, getVictoryCutInUrl } from '../core/get-stage-asset-urls';
import { useImagePreloader } from '../hooks/useImagePreloader';
import { saveStreakRecord } from '../core/difficulty-adjust';
import { PageContainer } from '../styles';

const AirHockeyGame: React.FC = () => {
  // ── カスタムフック ──
  const { screen, transitioning, navigateTo, navigateWithTransition } = useScreenNavigation();
  const mode = useGameMode();
  const audio = useAudioManager();
  const dex = useCharacterDex();

  // ── ゲームセッション状態 ──
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [shake, setShake] = useState<ShakeState | null>(null);
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted());
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(undefined);
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
    setShowHelp(false);
    navigateWithTransition('game');
    lastInputRef.current = Date.now();
    phaseRef.current = 'countdown';
    countdownStartRef.current = Date.now();
    statsRef.current = EntityFactory.createMatchStats();
    matchStartRef.current = Date.now();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- mode全体を依存に入れるとゲーム開始時に不要な再レンダリングが発生するため、必要な値のみ指定
  }, [mode.field, mode.gameMode, navigateWithTransition]);

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
  }, [mode, navigateTo]);

  const handleScreenChange = useCallback((newScreen: 'menu' | 'game' | 'result') => {
    if (newScreen === 'result' && mode.gameMode === 'story') {
      navigateTo('postDialogue');
    } else {
      navigateTo(newScreen);
    }
  }, [mode.gameMode, navigateTo]);

  // ── 導出値 ──
  const cpuCharacter = React.useMemo(() => mode.currentStage ? findCharacterById(mode.currentStage.characterId) : undefined, [mode.currentStage]);
  const storyCharacters = React.useMemo(() => {
    if (!mode.currentStage) return {};
    const chars: Record<string, typeof PLAYER_CHARACTER> = {};
    if (cpuCharacter) chars[mode.currentStage.characterId] = cpuCharacter;
    chars['player'] = PLAYER_CHARACTER;
    return chars;
  }, [mode.currentStage, cpuCharacter]);
  const stageBackgroundUrl = React.useMemo(() => mode.currentStage?.backgroundId ? BACKGROUND_MAP[mode.currentStage.backgroundId] : undefined, [mode.currentStage]);
  const hasNextStage = React.useMemo(() => {
    if (!mode.currentStage) return false;
    const idx = CHAPTER_1_STAGES.findIndex(s => s.id === mode.currentStage!.id);
    return idx < CHAPTER_1_STAGES.length - 1;
  }, [mode.currentStage]);
  // ストーリーモード時はステージ固有の AI 設定（キャラ個性付き）を使用
  const storyAiConfig = React.useMemo(
    () => mode.currentStage ? getStoryStageBalance(mode.currentStage.id).ai : undefined,
    [mode.currentStage]
  );
  // フリー対戦用 AI 設定（メモ化して useEffect の不要な再実行を防止）
  const freeBattleAiConfig = React.useMemo(
    () => mode.selectedCpuCharacter
      ? buildFreeBattleAiConfig(mode.difficulty, mode.selectedCpuCharacter.id)
      : undefined,
    [mode.difficulty, mode.selectedCpuCharacter]
  );
  const freeBattleCpuCharacter = React.useMemo(
    () => getCharacterByDifficulty(mode.difficulty),
    [mode.difficulty]
  );
  const currentCpuName = React.useMemo(
    () => mode.gameMode === 'story' && cpuCharacter
      ? cpuCharacter.name
      : (mode.selectedCpuCharacter ?? freeBattleCpuCharacter).name,
    [mode.gameMode, cpuCharacter, mode.selectedCpuCharacter, freeBattleCpuCharacter]
  );
  const selectedDexEntry = React.useMemo(() => selectedCharacterId ? getDexEntryById(selectedCharacterId) : undefined, [selectedCharacterId]);
  const selectedCharacter = React.useMemo(() => selectedCharacterId ? findCharacterById(selectedCharacterId) : undefined, [selectedCharacterId]);
  // 基本キャラ + 図鑑解放済みストーリーキャラ（2P 対戦 / フリー対戦共通）
  const allBattleCharacters = React.useMemo(() => {
    const base = getBattleCharacters();
    const baseIds = new Set(base.map(c => c.id));
    const unlocked = dex.unlockedIds
      .filter(id => !baseIds.has(id))
      .map(id => findCharacterById(id))
      .filter((c): c is NonNullable<typeof c> => c !== undefined);
    return [...base, ...unlocked];
  }, [dex.unlockedIds]);
  const dexCharacterMap = React.useMemo(() => {
    const map: Record<string, typeof PLAYER_CHARACTER> = {};
    for (const entry of dex.dexEntries) {
      const char = findCharacterById(entry.profile.characterId);
      if (char) map[entry.profile.characterId] = char;
    }
    return map;
  }, [dex.dexEntries]);

  // ── イベントハンドラ ──
  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    if (isHelpMode && screen === 'game' && phaseRef.current === 'paused') phaseRef.current = 'playing';
    setIsHelpMode(false);
  }, [isHelpMode, screen]);

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
  const handleBackFromDex = useCallback(() => { setSelectedCharacterId(undefined); navigateTo('menu'); }, [navigateTo]);
  const handleBackFromStageSelect = useCallback(() => { mode.resetToFree(); navigateTo('menu'); }, [mode, navigateTo]);
  const handleStoryReset = useCallback(() => { resetStoryProgress(); mode.setStoryProgress({ clearedStages: [] }); }, [mode]);
  const handleVsComplete = useCallback(() => {
    const sf = mode.currentStage ? (FIELDS.find(f => f.id === mode.currentStage!.fieldId) ?? FIELDS[0]) : mode.field;
    startGame(sf);
  }, [mode.currentStage, mode.field, startGame]);
  const handleGameMenuClick = useCallback(() => { audio.getSound().bgmStop(); mode.resetToFree(); navigateTo('menu'); }, [audio, mode, navigateTo]);
  const handlePostDialogueComplete = useCallback(() => {
    if (mode.currentStage?.isChapterFinale && winner === 'player') {
      navigateTo('victoryCutIn');
    } else {
      navigateTo('result');
    }
  }, [mode.currentStage, winner, navigateTo]);
  const handleResultBackToMenu = useCallback(() => { mode.resetToFree(); navigateTo('menu'); }, [mode, navigateTo]);
  // ── 画面遷移（共通） ──
  const handleBackToMenu = useCallback(() => { navigateTo('menu'); }, [navigateTo]);
  // ── 2P 対戦 ──
  const handleTwoPlayerClick = useCallback(() => { navigateTo('characterSelect'); }, [navigateTo]);
  // ── ペアマッチ（2v2）──
  const handlePairMatchClick = useCallback(() => {
    navigateTo('teamSetup');
  }, [navigateTo]);
  const handlePairMatchStart = useCallback(() => {
    mode.setGameMode('2v2-local');
    navigateTo('vsScreen');
  }, [mode, navigateTo]);
  const handlePairMatchVsComplete = useCallback(() => {
    startGame(mode.field, '2v2-local');
  }, [mode.field, startGame]);
  const handleBackToTeamSetup = useCallback(() => {
    navigateTo('teamSetup');
  }, [navigateTo]);
  const handleStartBattle = useCallback((config: TwoPlayerConfig) => {
    mode.setGameMode('2p-local');
    mode.setPlayer1Character(config.player1Character);
    mode.setPlayer2Character(config.player2Character);
    startGame(mode.field, '2p-local');
  }, [mode, startGame]);
  // ── フリー対戦キャラ選択（自キャラ除外） ──
  const freeBattleSelectableCharacters = React.useMemo(
    () => allBattleCharacters.filter(c => c.id !== 'player'),
    [allBattleCharacters]
  );
  const handleFreeBattleCharacterConfirm = useCallback((character: Character) => {
    mode.setSelectedCpuCharacter(character);
    navigateTo('vsScreen');
  }, [mode, navigateTo]);
  const handleBackToCharacterSelect = useCallback(() => { navigateTo('characterSelect'); }, [navigateTo]);
  const handleAcceptDifficulty = useCallback((d: typeof mode.difficulty) => { mode.setDifficulty(d); saveStreakRecord({ winStreak: 0, loseStreak: 0 }); }, [mode]);
  const handleBackToStageSelect = useCallback(() => { mode.setStoryProgress(loadStoryProgress()); navigateTo('stageSelect'); }, [mode, navigateTo]);
  const handleNextStage = useCallback(() => {
    const idx = CHAPTER_1_STAGES.findIndex(s => s.id === mode.currentStage?.id);
    if (CHAPTER_1_STAGES[idx + 1]) handleSelectStage(CHAPTER_1_STAGES[idx + 1]);
  }, [mode.currentStage, handleSelectStage]);

  // ── 2P / 2v2 モード判定（入力フックより前に宣言） ──
  const is2PMode = mode.gameMode === '2p-local';
  const is2v2Mode = mode.gameMode === '2v2-local';
  const isMultiPlayer = is2PMode || is2v2Mode;

  // ── 入力・ゲームループ ──
  const handleInput = useInput(canvasRef, lastInputRef, playerTargetRef, screen, showHelp, setShowHelp);
  const keysRef = useKeyboardInput(gameRef, lastInputRef, screen, showHelp, setShowHelp, isMultiPlayer);
  const is2PGame = isMultiPlayer && screen === 'game';
  // ペアマッチ用キャラクターのデフォルト値（フォールバックを一元管理）
  const pairAlly = React.useMemo(
    () => mode.allyCharacter ?? freeBattleSelectableCharacters[0],
    [mode.allyCharacter, freeBattleSelectableCharacters]
  );
  const pairEnemy1 = React.useMemo(
    () => mode.enemyCharacter1 ?? freeBattleSelectableCharacters[1] ?? freeBattleSelectableCharacters[0],
    [mode.enemyCharacter1, freeBattleSelectableCharacters]
  );
  const pairEnemy2 = React.useMemo(
    () => mode.enemyCharacter2 ?? freeBattleSelectableCharacters[2] ?? freeBattleSelectableCharacters[0],
    [mode.enemyCharacter2, freeBattleSelectableCharacters]
  );
  // マルチプレイヤー時のスコアボード・リザルト表示名・キャラクター
  const multiPlayerName = is2v2Mode ? 'チーム1' : (mode.player1Character?.name ?? '1P');
  const multiOpponentName = is2v2Mode ? 'チーム2' : (mode.player2Character?.name ?? '2P');
  const resultPlayerCharacter = mode.gameMode === 'story' ? PLAYER_CHARACTER
    : is2PMode ? mode.player1Character
    : PLAYER_CHARACTER;
  const resultOpponentCharacter = mode.gameMode === 'story' ? cpuCharacter
    : is2PMode ? mode.player2Character
    : is2v2Mode ? freeBattleCpuCharacter
    : mode.selectedCpuCharacter ?? freeBattleCpuCharacter;

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
    screen, showHelp,
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
    },
    refs: {
      gameRef, canvasRef, lastInputRef, scoreRef, phaseRef, countdownStartRef, shakeRef, statsRef, matchStartRef, keysRef,
      playerTargetRef,
      player2KeysRef: (is2PMode || is2v2Mode) ? player2KeysRef : undefined,
      multiTouchRef: (is2PMode || is2v2Mode) ? multiTouchRef : undefined,
    },
    callbacks: { setScores, setWinner, setScreen: handleScreenChange, setShowHelp, setShake },
  });

  // ── 描画 ──
  return (
    <PageContainer>
      {showSettings && (
        <SettingsPanel bgmEnabled={audio.bgmEnabled} onToggleBgm={audio.toggleBgm} audioSettings={audio.audioSettings} onAudioSettingsChange={audio.setAudioSettings} onClose={() => setShowSettings(false)} />
      )}
      {showTutorial && <Tutorial isHelp={isHelpMode} onComplete={handleTutorialComplete} />}

      {screen === 'menu' && (
        <Transition isActive={!transitioning} type="fade">
          <TitleScreen
            diff={mode.difficulty} setDiff={mode.setDifficulty} field={mode.field} setField={mode.setField}
            winScore={mode.winScore} setWinScore={mode.setWinScore} highScore={result.highScore}
            onStart={handleFreeStart} onStoryClick={handleStoryClick}
            onShowAchievements={() => navigateTo('achievements')}
            onHelpClick={() => { setIsHelpMode(true); setShowTutorial(true); }}
            onSettingsClick={() => setShowSettings(true)}
            onDailyChallengeClick={handleDailyChallengeClick}
            unlockState={result.unlockState}
            onCharacterDexClick={() => navigateTo('characterDex')}
            newUnlockCount={dex.getNewUnlockCount()}
            onTwoPlayerClick={handleTwoPlayerClick}
            onPairMatchClick={handlePairMatchClick}
          />
        </Transition>
      )}

      {screen === 'freeBattleCharacterSelect' && (
        <FreeBattleCharacterSelect
          characters={freeBattleSelectableCharacters}
          unlockedIds={dex.unlockedIds}
          difficulty={mode.difficulty}
          onConfirm={handleFreeBattleCharacterConfirm}
          onBack={handleBackToMenu}
        />
      )}

      {screen === 'characterSelect' && (
        <CharacterSelectScreen
          characters={allBattleCharacters}
          onStartBattle={handleStartBattle}
          onBack={handleBackToMenu}
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
          onStart={handlePairMatchStart}
          onBack={handleBackToMenu}
        />
      )}

      {screen === 'achievements' && <AchievementList onBack={handleBackToMenu} />}

      {screen === 'characterDex' && (
        <>
          <CharacterDexScreen
            dexEntries={dex.dexEntries} unlockedIds={dex.unlockedIds} newlyUnlockedIds={dex.newlyUnlockedIds}
            characters={dexCharacterMap} completionRate={dex.completionRate}
            onSelectCharacter={setSelectedCharacterId} onBack={handleBackFromDex} onMarkViewed={dex.markViewed}
          />
          {selectedDexEntry && selectedCharacter && <CharacterProfileCard entry={selectedDexEntry} character={selectedCharacter} onClose={() => setSelectedCharacterId(undefined)} />}
        </>
      )}

      {screen === 'daily' && mode.dailyChallenge && (
        <DailyChallengeScreen challenge={mode.dailyChallenge} result={getDailyChallengeResult(mode.dailyChallenge.date)} onStart={handleDailyChallengeStart} onBack={handleBackToMenu} />
      )}

      {screen === 'stageSelect' && (
        <Transition isActive={true} type="fade">
          <StageSelectScreen stages={CHAPTER_1_STAGES} progress={mode.storyProgress} onSelectStage={handleSelectStage} onBack={handleBackFromStageSelect} onReset={handleStoryReset} />
        </Transition>
      )}

      {screen === 'chapterTitle' && mode.currentStage?.chapterTitle && (
        <ChapterTitleCard chapter={mode.currentStage.chapter} title={mode.currentStage.chapterTitle} subtitle={mode.currentStage.chapterSubtitle} backgroundUrl={stageBackgroundUrl} onComplete={() => navigateTo('preDialogue')} />
      )}
      {screen === 'preDialogue' && mode.currentStage && (
        <DialogueOverlay dialogues={mode.currentStage.preDialogue} characters={storyCharacters} backgroundUrl={stageBackgroundUrl} onComplete={() => navigateTo('vsScreen')} />
      )}
      {screen === 'vsScreen' && mode.gameMode === 'story' && mode.currentStage && cpuCharacter && (
        <VsScreen playerCharacter={PLAYER_CHARACTER} cpuCharacter={cpuCharacter} stageName={mode.currentStage.name} fieldName={(FIELDS.find(f => f.id === mode.currentStage!.fieldId) ?? FIELDS[0]).name} onComplete={handleVsComplete} />
      )}
      {screen === 'vsScreen' && mode.gameMode === 'free' && mode.selectedCpuCharacter && (
        <VsScreen playerCharacter={PLAYER_CHARACTER} cpuCharacter={mode.selectedCpuCharacter} stageName="フリー対戦" fieldName={mode.field.name} onComplete={handleVsComplete} />
      )}
      {screen === 'vsScreen' && mode.gameMode === '2v2-local' && (
        <VsScreen
          playerCharacter={PLAYER_CHARACTER}
          cpuCharacter={pairEnemy1}
          stageName="ペアマッチ"
          fieldName={mode.field.name}
          onComplete={handlePairMatchVsComplete}
          is2v2
          allyCharacter={pairAlly}
          enemyCharacter2={pairEnemy2}
          allyControlType={mode.allyControlType}
        />
      )}

      {screen === 'game' && (
        <>
          <Scoreboard
            scores={scores} onMenuClick={handleGameMenuClick} onPauseClick={togglePause}
            cpuName={isMultiPlayer ? multiOpponentName : currentCpuName}
            playerName={isMultiPlayer ? multiPlayerName : undefined}
            playerColor={is2PMode ? mode.player1Character?.color : undefined}
            cpuColor={is2PMode ? mode.player2Character?.color : undefined}
          />
          <Field canvasRef={canvasRef} onInput={handleInput} shake={shake} />
        </>
      )}

      {screen === 'postDialogue' && mode.currentStage && (
        <DialogueOverlay dialogues={winner === 'player' ? mode.currentStage.postWinDialogue : mode.currentStage.postLoseDialogue} characters={storyCharacters} backgroundUrl={stageBackgroundUrl} onComplete={handlePostDialogueComplete} />
      )}
      {screen === 'victoryCutIn' && mode.currentStage && (
        <VictoryCutIn imageUrl={getVictoryCutInUrl(mode.currentStage.chapter)} onComplete={() => navigateTo('result')} />
      )}

      {screen === 'result' && (
        <Transition isActive={true} type="fade">
          <ResultScreen
            winner={winner} scores={scores} onBackToMenu={handleResultBackToMenu}
            onReplay={mode.gameMode === 'story' ? () => mode.currentStage && handleSelectStage(mode.currentStage) : startGame}
            stats={result.matchStats} newAchievements={result.newAchievements}
            suggestedDifficulty={mode.gameMode === 'free' ? result.suggestedDifficulty : undefined}
            onAcceptDifficulty={handleAcceptDifficulty}
            onBackToStageSelect={mode.gameMode === 'story' ? handleBackToStageSelect : undefined}
            onNextStage={mode.gameMode === 'story' && hasNextStage ? handleNextStage : undefined}
            cpuCharacter={resultOpponentCharacter}
            playerCharacter={resultPlayerCharacter}
            newlyUnlockedCharacterName={result.newlyUnlockedCharacterName}
            is2PMode={isMultiPlayer}
            is2v2Mode={is2v2Mode}
            allyCharacter={is2v2Mode ? pairAlly : undefined}
            enemyCharacter2={is2v2Mode ? pairEnemy2 : undefined}
            player1CharacterName={isMultiPlayer ? multiPlayerName : undefined}
            player2CharacterName={isMultiPlayer ? multiOpponentName : undefined}
            onBackToCharacterSelect={is2PMode ? handleBackToCharacterSelect : undefined}
            onBackToTeamSetup={is2v2Mode ? handleBackToTeamSetup : undefined}
          />
        </Transition>
      )}
    </PageContainer>
  );
};

export default AirHockeyGame;
