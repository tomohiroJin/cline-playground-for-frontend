import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { EntityFactory } from './core/entities';
import { getConstants } from './core/constants';
import { createSoundSystem } from './core/sound';
import { FIELDS } from './core/config';
import { GameState, FieldConfig, Difficulty, SoundSystem, CanvasSize } from './core/types';
import { useInput } from './hooks/useInput';
import { useGameLoop } from './hooks/useGameLoop';
import { TitleScreen } from './components/TitleScreen';
import { Scoreboard } from './components/Scoreboard';
import { Field } from './components/Field';
import { ResultScreen } from './components/ResultScreen';
import { PageContainer } from './styles';

const AirHockeyGame: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'game' | 'result'>('menu');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScore] = useState(3);
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>('standard');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const lastInputRef = useRef(0);
  const scoreRef = useRef({ p: 0, c: 0 });
  const soundRef = useRef<SoundSystem | null>(null);

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

  // リザルト時のスコア保存
  useEffect(() => {
    if (screen === 'result') {
      const margin = scoreRef.current.p - scoreRef.current.c;
      const key = `${diff}_${winScore}`;
      saveScore('air_hockey', margin, key).then(() => {
        getHighScore('air_hockey', key).then(setHighScore);
      });
    }
  }, [screen, diff, winScore]);

  const getSound = useCallback(() => {
    if (!soundRef.current) soundRef.current = createSoundSystem();
    return soundRef.current;
  }, []);

  const startGame = useCallback(() => {
    const consts = getConstants(canvasSize);
    gameRef.current = EntityFactory.createGameState(consts, field);
    scoreRef.current = { p: 0, c: 0 };
    setScores({ p: 0, c: 0 });
    setWinner(null);
    setShowHelp(false);
    setScreen('game');
    lastInputRef.current = Date.now();
    getSound().start();
  }, [getSound, canvasSize, field]);

  const handleInput = useInput(gameRef, canvasRef, lastInputRef, screen, showHelp, setShowHelp, canvasSize);

  useGameLoop(
    screen, diff, field, winScore, showHelp, getSound,
    gameRef, canvasRef, lastInputRef, scoreRef,
    setScores, setWinner, setScreen, setShowHelp, canvasSize
  );

  return (
    <PageContainer>
      {screen === 'menu' && (
        <TitleScreen
          diff={diff}
          setDiff={setDiff}
          field={field}
          setField={setField}
          winScore={winScore}
          setWinScore={setWinScore}
          highScore={highScore}
          onStart={startGame}
          canvasSize={canvasSize}
          setCanvasSize={setCanvasSize}
        />
      )}

      {screen === 'game' && (
        <>
          <Scoreboard scores={scores} onMenuClick={() => setScreen('menu')} />
          <Field canvasRef={canvasRef} onInput={handleInput} canvasSize={canvasSize} />
        </>
      )}

      {screen === 'result' && (
        <ResultScreen
          winner={winner}
          scores={scores}
          onBackToMenu={() => setScreen('menu')}
        />
      )}
    </PageContainer>
  );
};

export default AirHockeyGame;
