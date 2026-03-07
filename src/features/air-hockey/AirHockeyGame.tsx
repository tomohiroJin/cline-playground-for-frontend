import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { EntityFactory } from './core/entities';
import { CONSTANTS } from './core/constants';
import { createSoundSystem } from './core/sound';
import { FIELDS } from './core/config';
import { GameState, FieldConfig, Difficulty, SoundSystem, GamePhase, ShakeState, MatchStats } from './core/types';
import { Achievement, checkAchievements, getUnlockedAchievements, saveUnlockedAchievements } from './core/achievements';
import { AudioSettings, DEFAULT_AUDIO_SETTINGS, loadAudioSettings, saveAudioSettings } from './core/audio-settings';
import { useInput } from './hooks/useInput';
import { useGameLoop } from './hooks/useGameLoop';
import { TitleScreen } from './components/TitleScreen';
import { Scoreboard } from './components/Scoreboard';
import { Field } from './components/Field';
import { ResultScreen } from './components/ResultScreen';
import { AchievementList } from './components/AchievementList';
import { Transition } from './components/Transition';
import { Tutorial, isTutorialCompleted } from './components/Tutorial';
import { SettingsPanel } from './components/SettingsPanel';
import { PageContainer } from './styles';

const AirHockeyGame: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'game' | 'result' | 'achievements'>('menu');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScore] = useState(3);
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
  // トランジション用
  const [transitioning, setTransitioning] = useState(false);

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
    }
  }, [screen, diff, winScore, winner, field.id]);

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

  const startGame = useCallback(() => {
    gameRef.current = EntityFactory.createGameState(CONSTANTS, field);
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

  const handleInput = useInput(gameRef, canvasRef, lastInputRef, screen, showHelp, setShowHelp);

  useGameLoop(
    screen, diff, field, winScore, showHelp, getSound,
    gameRef, canvasRef, lastInputRef, scoreRef,
    setScores, setWinner, setScreen, setShowHelp,
    phaseRef, countdownStartRef, shakeRef, setShake, bgmEnabled,
    statsRef, matchStartRef
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
            onStart={startGame}
            onShowAchievements={() => setScreen('achievements')}
            onHelpClick={() => {
              setIsHelpMode(true);
              setShowTutorial(true);
            }}
            onSettingsClick={() => setShowSettings(true)}
          />
        </Transition>
      )}

      {screen === 'achievements' && (
        <AchievementList onBack={() => setScreen('menu')} />
      )}

      {screen === 'game' && (
        <>
          <Scoreboard scores={scores} onMenuClick={() => {
            getSound().bgmStop();
            setScreen('menu');
          }} onPauseClick={togglePause} />
          <Field canvasRef={canvasRef} onInput={handleInput} shake={shake} />
        </>
      )}

      {screen === 'result' && (
        <Transition isActive={true} type="fade">
          <ResultScreen
            winner={winner}
            scores={scores}
            onBackToMenu={() => setScreen('menu')}
            onReplay={startGame}
            stats={matchStats}
            newAchievements={newAchievements}
          />
        </Transition>
      )}
    </PageContainer>
  );
};

export default AirHockeyGame;
