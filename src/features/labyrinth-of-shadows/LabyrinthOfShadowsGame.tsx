// 注: このファイルではパフォーマンス最適化のため、ref経由でゲーム状態を管理しています
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { CONFIG, CONTENT } from './constants';
import type { Difficulty, Item, Enemy, GameState, HUDData } from './types';
import { GameStateFactory } from './entity-factory';
import { AudioService } from './audio';
import { TitleScreen } from './components/TitleScreen';
import { ResultScreen } from './components/ResultScreen';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { Controls } from './components/Controls';
import { useInput } from './presentation/hooks/use-input';
import { useGameLoop } from './presentation/hooks/use-game-loop';
import type { MapData } from './presentation/hooks/use-game-loop';
import {
  PageContainer,
  Canvas,
  MessageOverlay,
  Overlay,
  ModalContent,
  ControlBtn,
} from './presentation/styles/game.styles';

export default function LabyrinthOfShadowsGame() {
  const [screen, setScreen] = useState<'title' | 'story' | 'playing'>('title');
  const [storyType, setStoryType] = useState<keyof typeof CONTENT.stories>('intro');
  const [diff, setDiff] = useState<Difficulty>('NORMAL');
  const [resultData, setResultData] = useState({ score: 0, time: 0 });
  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HUDData>({
    keys: 0,
    req: 3,
    time: 150,
    lives: 3,
    maxL: 3,
    hide: false,
    energy: 100,
    eNear: 0,
    score: 0,
    stamina: 100,
    highScore: 0,
  });
  const [_mapData, setMapData] = useState<MapData>({
    maze: [] as number[][],
    player: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },
    items: [] as Item[],
    enemies: [] as Enemy[],
    keys: 0,
    reqKeys: 0,
    explored: {} as Record<string, boolean>,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  // ハイスコアの読み込み
  useEffect(() => {
    Promise.all(Object.keys(CONFIG.difficulties).map(d => getHighScore('maze_horror', d))).then(
      scores => {
        const newScores: Record<string, number> = {};
        Object.keys(CONFIG.difficulties).forEach((k, i) => {
          newScores[k] = scores[i];
        });
        setHighScores(newScores);
      }
    );
  }, []);

  // ゲーム終了処理
  const endGame = useCallback(
    (type: keyof typeof CONTENT.stories) => {
      AudioService.stopBGM();
      const g = gameRef.current;
      if (g) {
        setResultData({
          score: g.score,
          time: Math.floor((CONFIG.difficulties[diff].time * 1000 - g.time) / 1000),
        });
        saveScore('maze_horror', g.score, diff).then(() => {
          if (g.score > (highScores[diff] || 0)) {
            setHighScores(prev => ({ ...prev, [diff]: g.score }));
          }
        });
      }
      setPaused(false);
      setStoryType(type);
      setScreen('story');
    },
    [diff, highScores]
  );

  // ポーズトグル
  const togglePause = useCallback(() => {
    setPaused(prev => {
      if (!prev) {
        AudioService.stopBGM();
      } else {
        AudioService.startBGM();
      }
      return !prev;
    });
  }, []);

  // 入力管理
  const { keysRef } = useInput(screen, togglePause);

  // ゲームループ
  const { stopLoop } = useGameLoop({
    screen,
    paused,
    diff,
    highScores,
    canvasRef,
    minimapCanvasRef,
    gameRef,
    keysRef,
    onHudUpdate: setHud,
    onMapUpdate: setMapData,
    onGameEnd: (type) => {
      stopLoop();
      endGame(type);
    },
  });

  // ゲーム開始
  const startGame = useCallback((d: Difficulty) => {
    setDiff(d);
    setStoryType('intro');
    setScreen('story');
  }, []);

  // ストーリー完了時
  const onStoryDone = useCallback(() => {
    if (storyType === 'intro') {
      gameRef.current = GameStateFactory.create(diff);
      setScreen('playing');
    } else setScreen('title');
  }, [storyType, diff]);

  if (screen === 'title') return <TitleScreen onStart={startGame} highScores={highScores} />;
  if (screen === 'story')
    return (
      <ResultScreen
        type={storyType}
        onDone={onStoryDone}
        score={resultData.score}
        time={resultData.time}
        highScore={highScores[diff]}
      />
    );

  const mazeSize = gameRef.current?.maze.length || 0;

  return (
    <PageContainer>
      <Canvas
        ref={canvasRef}
        width={CONFIG.render.width}
        height={CONFIG.render.height}
        role="img"
        aria-label="3D迷宮ホラーゲーム画面"
        tabIndex={0}
      />
      <HUD h={hud} />
      <Controls keysRef={keysRef} hiding={hud.hide} energy={hud.energy} stamina={hud.stamina} />
      {mazeSize > 0 && (
        <Minimap
          canvasRef={minimapCanvasRef}
          size={mazeSize}
        />
      )}
      <MessageOverlay $visible={!!(gameRef.current && gameRef.current.msgTimer > 0)}>
        {gameRef.current?.msg}
      </MessageOverlay>
      {paused && (
        <Overlay>
          <ModalContent>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#facc15', marginBottom: '1rem' }}>
              ⏸️ ポーズ
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>
              Escapeキーで再開
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <ControlBtn
                onClick={togglePause}
                style={{ width: 'auto', padding: '0.75rem 2rem', backgroundColor: '#15803d', borderColor: '#22c55e' }}
              >
                ▶️ 再開
              </ControlBtn>
              <ControlBtn
                onClick={() => {
                  setPaused(false);
                  endGame('gameover');
                }}
                style={{ width: 'auto', padding: '0.75rem 2rem', backgroundColor: '#991b1b', borderColor: '#ef4444' }}
              >
                🏠 タイトルへ
              </ControlBtn>
            </div>
          </ModalContent>
        </Overlay>
      )}
    </PageContainer>
  );
}
