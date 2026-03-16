import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { EntityFactory } from './core/entities';
import { CONSTANTS } from './core/constants';
import { createSoundSystem } from './core/sound';
import { FIELDS } from './core/config';
import { getCharacterByDifficulty, findCharacterById, PLAYER_CHARACTER } from './core/characters';
import { GameState, FieldConfig, Difficulty, SoundSystem, GamePhase, ShakeState, MatchStats, GameMode } from './core/types';
import { Achievement, checkAchievements, getUnlockedAchievements, saveUnlockedAchievements } from './core/achievements';
import { AudioSettings, loadAudioSettings, saveAudioSettings } from './core/audio-settings';
import { getStreakRecord, saveStreakRecord, recordMatchResult, getSuggestedDifficulty } from './core/difficulty-adjust';
import { getUnlockState, saveUnlockState, checkUnlocks } from './core/unlock';
import { loadStoryProgress, saveStoryProgress, resetStoryProgress } from './core/story';
import type { StageDefinition, StoryProgress } from './core/story';
import { CHAPTER_1_STAGES } from './core/dialogue-data';
import { getDexEntryById } from './core/dex-data';
import { useCharacterDex } from './hooks/useCharacterDex';
import { CharacterDexScreen } from './components/CharacterDexScreen';
import { CharacterProfileCard } from './components/CharacterProfileCard';
import { useInput } from './hooks/useInput';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import { useGameLoop } from './hooks/useGameLoop';
import { TitleScreen } from './components/TitleScreen';
import { Scoreboard } from './components/Scoreboard';
import { Field } from './components/Field';
import { ResultScreen } from './components/ResultScreen';
import { AchievementList } from './components/AchievementList';
import { Transition } from './components/Transition';
import { Tutorial, isTutorialCompleted } from './components/Tutorial';
import { SettingsPanel } from './components/SettingsPanel';
import { DailyChallengeScreen } from './components/DailyChallengeScreen';
import { StageSelectScreen } from './components/StageSelectScreen';
import { DialogueOverlay } from './components/DialogueOverlay';
import { VsScreen } from './components/VsScreen';
import { ChapterTitleCard } from './components/ChapterTitleCard';
import { VictoryCutIn } from './components/VictoryCutIn';
import { generateDailyChallenge, getDailyChallengeResult, saveDailyChallengeResult, DailyChallenge } from './core/daily-challenge';
import { UnlockState } from './core/unlock';
import { BACKGROUND_MAP } from './core/characters';
import { getStageAssetUrls, getVictoryCutInUrl } from './core/get-stage-asset-urls';
import { useImagePreloader } from './hooks/useImagePreloader';
import { PageContainer } from './styles';

/** 画面の種類 */
type ScreenType =
  | 'menu'
  | 'game'
  | 'result'
  | 'achievements'
  | 'daily'
  | 'stageSelect'
  | 'preDialogue'
  | 'vsScreen'
  | 'postDialogue'
  | 'chapterTitle'
  | 'victoryCutIn'
  | 'characterDex';

const AirHockeyGame: React.FC = () => {
  const [screen, setScreen] = useState<ScreenType>('menu');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScore] = useState(3);
  // NOTE(CR-05): scores state と scoreRef は二重管理状態。
  // scoreRef はゲームループ内の即時参照用、scores は UI 再レンダリング用。
  // 同期ミスによるスコア表示不整合のリスクがあるため、
  // 将来的にカスタムフック（useGameScores 等）への分離を検討する。
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [bgmEnabled, setBgmEnabled] = useState(false);
  const [shake, setShake] = useState<ShakeState | null>(null);
  const [matchStats, setMatchStats] = useState<MatchStats | undefined>(undefined);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(loadAudioSettings);
  const [showTutorial, setShowTutorial] = useState(!isTutorialCompleted());
  const [isHelpMode, setIsHelpMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<Difficulty | undefined>(undefined);
  const [unlockState, setUnlockState] = useState<UnlockState>(() => getUnlockState());
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | undefined>(undefined);
  const [isDailyMode, setIsDailyMode] = useState(false);
  // トランジション用
  const [transitioning, setTransitioning] = useState(false);
  // リザルト画面用: 新規アンロックキャラ名
  const [newlyUnlockedCharacterName, setNewlyUnlockedCharacterName] = useState<string | undefined>(undefined);
  // 図鑑: プロフィールカード表示用
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>(undefined);

  // キャラクター図鑑フック
  const {
    dexEntries,
    unlockedIds,
    newlyUnlockedIds,
    completionRate,
    checkAndUnlock,
    markViewed,
    getNewUnlockCount,
  } = useCharacterDex();

  // ストーリーモード用
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [currentStage, setCurrentStage] = useState<StageDefinition | undefined>(undefined);
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(() => loadStoryProgress());
  // 画像プリロード用URL（即座遷移方式: バックグラウンドでプリロードを実行）
  const [preloadUrls, setPreloadUrls] = useState<string[]>([]);
  useImagePreloader(preloadUrls);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const lastInputRef = useRef(0);
  const scoreRef = useRef({ p: 0, c: 0 });
  const soundRef = useRef<SoundSystem | null>(null);
  const phaseRef = useRef<GamePhase>('countdown');
  const countdownStartRef = useRef(0);
  const shakeRef = useRef<ShakeState | null>(null);
  const statsRef = useRef<MatchStats>(EntityFactory.createMatchStats());
  const matchStartRef = useRef(0);
  // 実績追跡用
  const winStreakRef = useRef(0);
  const maxScoreDiffRef = useRef(0);
  const fieldsWonRef = useRef<string[]>([]);
  const itemTypesUsedRef = useRef<string[]>([]);

  // タッチスクロール防止
  useEffect(() => {
    const handler = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, []);

  // ハイスコア読み込み
  useEffect(() => {
    getHighScore('air_hockey', `${diff}_${winScore}`).then(setHighScore);
  }, [diff, winScore]);

  // リザルト時のスコア保存・統計の確定・実績チェック
  useEffect(() => {
    if (screen === 'result') {
      const margin = scoreRef.current.p - scoreRef.current.c;
      const key = `${diff}_${winScore}`;
      saveScore('air_hockey', margin, key).then(() => {
        getHighScore('air_hockey', key).then(setHighScore);
      });
      const finalStats = { ...statsRef.current };
      setMatchStats(finalStats);

      // 連勝トラッキング
      if (winner === 'player') {
        winStreakRef.current += 1;
        // フィールド勝利記録
        if (!fieldsWonRef.current.includes(field.id)) {
          fieldsWonRef.current = [...fieldsWonRef.current, field.id];
        }
      } else {
        winStreakRef.current = 0;
      }

      // 実績チェック
      const alreadyUnlocked = getUnlockedAchievements();
      const newlyUnlocked = checkAchievements({
        winner: winner ?? 'cpu',
        scores: scoreRef.current,
        difficulty: diff,
        fieldId: field.id,
        stats: finalStats,
        winStreak: winStreakRef.current,
        maxScoreDiff: maxScoreDiffRef.current,
        fieldsWon: fieldsWonRef.current,
        itemTypesUsed: itemTypesUsedRef.current,
      }, alreadyUnlocked);

      if (newlyUnlocked.length > 0) {
        setNewAchievements(newlyUnlocked);
        saveUnlockedAchievements([...alreadyUnlocked, ...newlyUnlocked.map(a => a.id)]);
      } else {
        setNewAchievements([]);
      }

      // 難易度オートアジャスト: 連勝/連敗を記録し提案を生成
      const isWin = winner === 'player';
      const prevStreak = getStreakRecord();
      const newStreak = recordMatchResult(prevStreak, isWin);
      saveStreakRecord(newStreak);
      const suggestion = getSuggestedDifficulty(newStreak, diff);
      setSuggestedDifficulty(suggestion);

      // アンロック更新
      const prevUnlock = getUnlockState();
      const newUnlock = checkUnlocks(prevUnlock, { isWin, difficulty: diff, fieldId: field.id });
      saveUnlockState(newUnlock);
      setUnlockState(newUnlock);

      // デイリーチャレンジの結果保存
      if (isDailyMode && dailyChallenge) {
        saveDailyChallengeResult({
          date: dailyChallenge.date,
          isCleared: isWin,
          playerScore: scoreRef.current.p,
          cpuScore: scoreRef.current.c,
        });
        setIsDailyMode(false);
      }

      // ストーリーモード: 勝利時にクリアフラグ保存 + 図鑑アンロック判定
      if (gameMode === 'story' && currentStage && isWin) {
        const current = loadStoryProgress();
        if (!current.clearedStages.includes(currentStage.id)) {
          const updated: StoryProgress = {
            clearedStages: [...current.clearedStages, currentStage.id],
          };
          saveStoryProgress(updated);
          setStoryProgress(updated);

          // 図鑑アンロック判定（useCharacterDex フック経由）
          const newUnlocks = checkAndUnlock(updated);
          if (newUnlocks.length > 0) {
            const entry = getDexEntryById(newUnlocks[0]);
            setNewlyUnlockedCharacterName(entry?.profile.fullName);
          } else {
            setNewlyUnlockedCharacterName(undefined);
          }
        } else {
          setNewlyUnlockedCharacterName(undefined);
        }
      } else {
        setNewlyUnlockedCharacterName(undefined);
      }
    }
  }, [screen, diff, winScore, winner, field.id, isDailyMode, dailyChallenge, gameMode, currentStage, checkAndUnlock]);

  // 音量設定をサウンドシステムに適用する共通関数
  const applyAudioSettings = useCallback((sound: SoundSystem, settings: AudioSettings) => {
    sound.setBgmVolume(settings.bgmVolume);
    sound.setSeVolume(settings.seVolume);
    sound.setMuted(settings.muted);
  }, []);

  const getSound = useCallback(() => {
    if (!soundRef.current) {
      soundRef.current = createSoundSystem();
      // 初期化時に保存済みの音量設定を即時反映
      applyAudioSettings(soundRef.current, audioSettings);
    }
    return soundRef.current;
  }, [applyAudioSettings, audioSettings]);

  // 音量設定変更時の反映
  useEffect(() => {
    if (soundRef.current) {
      applyAudioSettings(soundRef.current, audioSettings);
    }
    saveAudioSettings(audioSettings);
  }, [audioSettings, applyAudioSettings]);

  const startGame = useCallback((fieldOverride?: FieldConfig) => {
    const activeField = fieldOverride ?? field;
    gameRef.current = EntityFactory.createGameState(CONSTANTS, activeField);
    scoreRef.current = { p: 0, c: 0 };
    setScores({ p: 0, c: 0 });
    setWinner(null);
    setShowHelp(false);
    setTransitioning(true);
    setTimeout(() => {
      setScreen('game');
      setTransitioning(false);
    }, 300);
    lastInputRef.current = Date.now();

    // カウントダウン開始
    phaseRef.current = 'countdown';
    countdownStartRef.current = Date.now();
    // 統計初期化
    statsRef.current = EntityFactory.createMatchStats();
    matchStartRef.current = Date.now();
    setMatchStats(undefined);
    // スコア差追跡リセット
    maxScoreDiffRef.current = 0;
    itemTypesUsedRef.current = [];
    setNewAchievements([]);
  }, [field]);

  // ポーズトグル
  const togglePause = useCallback(() => {
    if (phaseRef.current === 'playing') {
      phaseRef.current = 'paused';
    } else if (phaseRef.current === 'paused') {
      phaseRef.current = 'playing';
    }
  }, []);

  // キーボードショートカット（Escape / P でポーズ）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (screen !== 'game') return;
      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        togglePause();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, togglePause]);

  // ── 図鑑遷移ハンドラ ────────────────────────────

  /** 図鑑画面への遷移 */
  const handleCharacterDexClick = useCallback(() => {
    setScreen('characterDex');
  }, []);

  /** 図鑑画面から戻る */
  const handleBackFromDex = useCallback(() => {
    setSelectedCharacterId(undefined);
    setScreen('menu');
  }, []);

  /** 図鑑: キャラクター選択（プロフィールカード表示） */
  const handleSelectCharacter = useCallback((characterId: string) => {
    setSelectedCharacterId(characterId);
  }, []);

  /** 図鑑: プロフィールカードを閉じる */
  const handleCloseProfile = useCallback(() => {
    setSelectedCharacterId(undefined);
  }, []);

  // ── ストーリーモード遷移ハンドラ ──────────────────

  /** ストーリーモード開始: ステージ選択画面へ */
  const handleStoryClick = useCallback(() => {
    setGameMode('story');
    setStoryProgress(loadStoryProgress());
    setScreen('stageSelect');
  }, []);

  /** ステージ選択: chapterTitle がある場合はタイトルカードへ、なければ試合前ダイアログへ */
  const handleSelectStage = useCallback((stage: StageDefinition) => {
    setCurrentStage(stage);
    // ステージの設定を適用
    const stageField = FIELDS.find(f => f.id === stage.fieldId) ?? FIELDS[0];
    setDiff(stage.difficulty);
    setField(stageField);
    setWinScore(stage.winScore);

    // 画像プリロード開始
    const chars: Record<string, typeof PLAYER_CHARACTER> = {};
    const cpuChar = findCharacterById(stage.characterId);
    if (cpuChar) chars[stage.characterId] = cpuChar;
    chars['player'] = PLAYER_CHARACTER;
    setPreloadUrls(getStageAssetUrls(stage, chars));

    // chapterTitle の有無で遷移先を分岐
    setScreen(stage.chapterTitle ? 'chapterTitle' : 'preDialogue');
  }, []);

  /** チャプタータイトル完了: 試合前ダイアログへ */
  const handleChapterTitleComplete = useCallback(() => {
    setScreen('preDialogue');
  }, []);

  /** 試合前ダイアログ完了: VS 画面へ */
  const handlePreDialogueComplete = useCallback(() => {
    setScreen('vsScreen');
  }, []);

  /** VS 画面完了: ゲーム開始 */
  const handleVsComplete = useCallback(() => {
    const stageField = currentStage
      ? (FIELDS.find(f => f.id === currentStage.fieldId) ?? FIELDS[0])
      : field;
    startGame(stageField);
  }, [currentStage, field, startGame]);

  /** 試合終了時の遷移（useGameLoop の setScreen を上書き） */
  const handleScreenChange = useCallback((newScreen: 'menu' | 'game' | 'result') => {
    if (newScreen === 'result' && gameMode === 'story') {
      // ストーリーモード: 試合後ダイアログを挟む
      setScreen('postDialogue');
    } else {
      setScreen(newScreen);
    }
  }, [gameMode]);

  /** 試合後ダイアログ完了: 章フィナーレ+勝利時は勝利カットイン、それ以外はリザルトへ */
  const handlePostDialogueComplete = useCallback(() => {
    if (currentStage?.isChapterFinale && winner === 'player') {
      setScreen('victoryCutIn');
    } else {
      setScreen('result');
    }
  }, [currentStage, winner]);

  /** 勝利カットイン完了: リザルト画面へ */
  const handleVictoryCutInComplete = useCallback(() => {
    setScreen('result');
  }, []);

  /** ストーリーリセット */
  const handleStoryReset = useCallback(() => {
    resetStoryProgress();
    setStoryProgress({ clearedStages: [] });
  }, []);

  /** 次のステージへ */
  const handleNextStage = useCallback(() => {
    if (!currentStage) return;
    const currentIdx = CHAPTER_1_STAGES.findIndex(s => s.id === currentStage.id);
    const nextStage = CHAPTER_1_STAGES[currentIdx + 1];
    if (nextStage) {
      handleSelectStage(nextStage);
    }
  }, [currentStage, handleSelectStage]);

  /** ストーリーモードのリプレイ */
  const handleStoryReplay = useCallback(() => {
    if (currentStage) {
      handleSelectStage(currentStage);
    }
  }, [currentStage, handleSelectStage]);

  // ── 現在のステージのキャラクター情報 ──────────────
  const cpuCharacter = React.useMemo(
    () => currentStage ? findCharacterById(currentStage.characterId) : undefined,
    [currentStage],
  );

  const storyCharacters = React.useMemo(() => {
    if (!currentStage) return {};
    const chars: Record<string, typeof PLAYER_CHARACTER> = {};
    if (cpuCharacter) chars[currentStage.characterId] = cpuCharacter;
    chars['player'] = PLAYER_CHARACTER;
    return chars;
  }, [currentStage, cpuCharacter]);

  // ── 図鑑: プロフィールカード用のデータ ──────────────
  const selectedDexEntry = React.useMemo(
    () => selectedCharacterId ? getDexEntryById(selectedCharacterId) : undefined,
    [selectedCharacterId],
  );
  const selectedCharacter = React.useMemo(
    () => selectedCharacterId ? findCharacterById(selectedCharacterId) : undefined,
    [selectedCharacterId],
  );

  // ── 図鑑用のキャラクターマップ ──────────────────
  const dexCharacterMap = React.useMemo(() => {
    const map: Record<string, typeof PLAYER_CHARACTER> = {};
    for (const entry of dexEntries) {
      const char = findCharacterById(entry.profile.characterId);
      if (char) map[entry.profile.characterId] = char;
    }
    return map;
  }, [dexEntries]);

  /** 次のステージが存在するか */
  const hasNextStage = React.useMemo(() => {
    if (!currentStage) return false;
    const currentIdx = CHAPTER_1_STAGES.findIndex(s => s.id === currentStage.id);
    return currentIdx < CHAPTER_1_STAGES.length - 1;
  }, [currentStage]);

  // ── 現在のステージの背景URL ─────────────────────
  const stageBackgroundUrl = React.useMemo(
    () => currentStage?.backgroundId ? BACKGROUND_MAP[currentStage.backgroundId] : undefined,
    [currentStage],
  );

  // ── ゲームの CPU 名（ストーリー or フリー） ───────
  const currentCpuName = gameMode === 'story' && cpuCharacter
    ? cpuCharacter.name
    : getCharacterByDifficulty(diff).name;

  const handleInput = useInput(gameRef, canvasRef, lastInputRef, screen, showHelp, setShowHelp);
  const keysRef = useKeyboardInput(gameRef, lastInputRef, screen, showHelp, setShowHelp);

  useGameLoop(
    screen, diff, field, winScore, showHelp, getSound,
    gameRef, canvasRef, lastInputRef, scoreRef,
    setScores, setWinner, handleScreenChange, setShowHelp,
    phaseRef, countdownStartRef, shakeRef, setShake, bgmEnabled,
    statsRef, matchStartRef, keysRef
  );

  return (
    <PageContainer>
      {showSettings && (
        <SettingsPanel
          bgmEnabled={bgmEnabled}
          onToggleBgm={() => setBgmEnabled(prev => !prev)}
          audioSettings={audioSettings}
          onAudioSettingsChange={setAudioSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showTutorial && (
        <Tutorial isHelp={isHelpMode} onComplete={() => {
          setShowTutorial(false);
          // ゲーム中にヘルプを閉じた場合、ポーズを解除
          if (isHelpMode && screen === 'game' && phaseRef.current === 'paused') {
            phaseRef.current = 'playing';
          }
          setIsHelpMode(false);
        }} />
      )}

      {screen === 'menu' && (
        <Transition isActive={!transitioning} type="fade">
          <TitleScreen
            diff={diff}
            setDiff={setDiff}
            field={field}
            setField={setField}
            winScore={winScore}
            setWinScore={setWinScore}
            highScore={highScore}
            onStart={() => {
              setGameMode('free');
              startGame();
            }}
            onStoryClick={handleStoryClick}
            onShowAchievements={() => setScreen('achievements')}
            onHelpClick={() => {
              setIsHelpMode(true);
              setShowTutorial(true);
            }}
            onSettingsClick={() => setShowSettings(true)}
            onDailyChallengeClick={() => {
              const challenge = generateDailyChallenge(new Date());
              setDailyChallenge(challenge);
              setScreen('daily');
            }}
            unlockState={unlockState}
            onCharacterDexClick={handleCharacterDexClick}
            newUnlockCount={getNewUnlockCount()}
          />
        </Transition>
      )}

      {screen === 'achievements' && (
        <AchievementList onBack={() => setScreen('menu')} />
      )}

      {/* キャラクター図鑑画面（P2-07） */}
      {screen === 'characterDex' && (
        <>
          <CharacterDexScreen
            dexEntries={dexEntries}
            unlockedIds={unlockedIds}
            newlyUnlockedIds={newlyUnlockedIds}
            characters={dexCharacterMap}
            completionRate={completionRate}
            onSelectCharacter={handleSelectCharacter}
            onBack={handleBackFromDex}
            onMarkViewed={markViewed}
          />
          {selectedDexEntry && selectedCharacter && (
            <CharacterProfileCard
              entry={selectedDexEntry}
              character={selectedCharacter}
              onClose={handleCloseProfile}
            />
          )}
        </>
      )}

      {screen === 'daily' && dailyChallenge && (
        <DailyChallengeScreen
          challenge={dailyChallenge}
          result={getDailyChallengeResult(dailyChallenge.date)}
          onStart={() => {
            // デイリーチャレンジの設定でゲーム開始
            const challengeField = FIELDS.find(f => f.id === dailyChallenge.fieldId) ?? FIELDS[0];
            setDiff(dailyChallenge.difficulty);
            setField(challengeField);
            setWinScore(dailyChallenge.winScore);
            setIsDailyMode(true);
            setGameMode('free');
            startGame(challengeField);
          }}
          onBack={() => setScreen('menu')}
        />
      )}

      {/* ストーリーモード: ステージ選択画面 */}
      {screen === 'stageSelect' && (
        <Transition isActive={true} type="fade">
          <StageSelectScreen
            stages={CHAPTER_1_STAGES}
            progress={storyProgress}
            onSelectStage={handleSelectStage}
            onBack={() => {
              setGameMode('free');
              setScreen('menu');
            }}
            onReset={handleStoryReset}
          />
        </Transition>
      )}

      {/* ストーリーモード: チャプタータイトルカード */}
      {screen === 'chapterTitle' && currentStage && currentStage.chapterTitle && (
        <ChapterTitleCard
          chapter={currentStage.chapter}
          title={currentStage.chapterTitle}
          subtitle={currentStage.chapterSubtitle}
          backgroundUrl={stageBackgroundUrl}
          onComplete={handleChapterTitleComplete}
        />
      )}

      {/* ストーリーモード: 試合前ダイアログ */}
      {screen === 'preDialogue' && currentStage && (
        <DialogueOverlay
          dialogues={currentStage.preDialogue}
          characters={storyCharacters}
          backgroundUrl={stageBackgroundUrl}
          onComplete={handlePreDialogueComplete}
        />
      )}

      {/* ストーリーモード: VS 画面 */}
      {screen === 'vsScreen' && currentStage && cpuCharacter && (
        <VsScreen
          playerCharacter={PLAYER_CHARACTER}
          cpuCharacter={cpuCharacter}
          stageName={currentStage.name}
          fieldName={
            (FIELDS.find(f => f.id === currentStage.fieldId) ?? FIELDS[0]).name
          }
          onComplete={handleVsComplete}
        />
      )}

      {screen === 'game' && (
        <>
          <Scoreboard scores={scores} onMenuClick={() => {
            getSound().bgmStop();
            setGameMode('free');
            setScreen('menu');
          }} onPauseClick={togglePause} cpuName={currentCpuName} />
          <Field canvasRef={canvasRef} onInput={handleInput} shake={shake} />
        </>
      )}

      {/* ストーリーモード: 試合後ダイアログ */}
      {screen === 'postDialogue' && currentStage && (
        <DialogueOverlay
          dialogues={
            winner === 'player'
              ? currentStage.postWinDialogue
              : currentStage.postLoseDialogue
          }
          characters={storyCharacters}
          backgroundUrl={stageBackgroundUrl}
          onComplete={handlePostDialogueComplete}
        />
      )}

      {/* ストーリーモード: 勝利カットイン */}
      {screen === 'victoryCutIn' && currentStage && (
        <VictoryCutIn
          imageUrl={getVictoryCutInUrl(currentStage.chapter)}
          onComplete={handleVictoryCutInComplete}
        />
      )}

      {screen === 'result' && (
        <Transition isActive={true} type="fade">
          <ResultScreen
            winner={winner}
            scores={scores}
            onBackToMenu={() => {
              setGameMode('free');
              setScreen('menu');
            }}
            onReplay={gameMode === 'story' ? handleStoryReplay : startGame}
            stats={matchStats}
            newAchievements={newAchievements}
            suggestedDifficulty={gameMode === 'free' ? suggestedDifficulty : undefined}
            onAcceptDifficulty={(d) => {
              setDiff(d);
              setSuggestedDifficulty(undefined);
              // 連勝/連敗をリセット
              saveStreakRecord({ winStreak: 0, loseStreak: 0 });
            }}
            onBackToStageSelect={
              gameMode === 'story'
                ? () => {
                    setStoryProgress(loadStoryProgress());
                    setScreen('stageSelect');
                  }
                : undefined
            }
            onNextStage={
              gameMode === 'story' && hasNextStage ? handleNextStage : undefined
            }
            cpuCharacter={gameMode === 'story' ? cpuCharacter : undefined}
            playerCharacter={gameMode === 'story' ? PLAYER_CHARACTER : undefined}
            newlyUnlockedCharacterName={newlyUnlockedCharacterName}
          />
        </Transition>
      )}
    </PageContainer>
  );
};

export default AirHockeyGame;
