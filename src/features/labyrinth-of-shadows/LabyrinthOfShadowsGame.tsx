// 注: このファイルではパフォーマンス最適化のため、ref経由でゲーム状態を管理しています
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { CONFIG, CONTENT } from './constants';
import type { Difficulty, Item, Enemy, GameState } from './types';
import { GameStateFactory } from './entity-factory';
import { GameLogic } from './game-logic';
import { Renderer } from './renderer';
import { TitleScreen } from './components/TitleScreen';
import { ResultScreen } from './components/ResultScreen';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { Controls } from './components/Controls';
import {
  PageContainer,
  Canvas,
  MessageOverlay,
} from '../../pages/MazeHorrorPage.styles';

export default function LabyrinthOfShadowsGame() {
  const [screen, setScreen] = useState<'title' | 'story' | 'playing'>('title');
  const [storyType, setStoryType] = useState<keyof typeof CONTENT.stories>('intro');
  const [diff, setDiff] = useState<Difficulty>('NORMAL');
  const [resultData, setResultData] = useState({ score: 0, time: 0 });
  const [hud, setHud] = useState({
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
  const [mapData, setMapData] = useState({
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
  const gameRef = useRef<GameState | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

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

  const endGame = useCallback(
    (type: keyof typeof CONTENT.stories) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
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
      setStoryType(type);
      setScreen('story');
    },
    [diff, highScores]
  );

  const startGame = useCallback((d: Difficulty) => {
    setDiff(d);
    setStoryType('intro');
    setScreen('story');
  }, []);

  const onStoryDone = useCallback(() => {
    if (storyType === 'intro') {
      gameRef.current = GameStateFactory.create(diff);
      setScreen('playing');
    } else setScreen('title');
  }, [storyType, diff]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (screen !== 'playing' || !gameRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = CONFIG.render;

    const loop = () => {
      const g = gameRef.current;
      if (!g) return;

      const now = performance.now();
      const dt = Math.min(50, now - g.lastT);
      g.lastT = now;
      g.gTime += dt;
      g.time -= dt;
      if (g.invince > 0) g.invince -= dt;
      if (g.msgTimer > 0) g.msgTimer -= dt;

      if (g.time <= 0) {
        endGame('timeout');
        return;
      }

      const k = keysRef.current;
      const input = {
        left: k['a'] || k['arrowleft'],
        right: k['d'] || k['arrowright'],
        forward: k['w'] || k['arrowup'],
        backward: k['s'] || k['arrowdown'],
      };

      GameLogic.updateHiding(g, k[' '], dt);
      GameLogic.updateSprinting(g, k['shift'], dt);
      const moved = GameLogic.updatePlayer(g, input, dt);
      GameLogic.updateFootstep(g, moved, dt);
      GameLogic.updateItems(g);

      const exitResult = GameLogic.checkExit(g);
      if (exitResult) {
        endGame(exitResult);
        return;
      }

      const closestEnemy = GameLogic.updateEnemies(g, dt);
      if (g.lives <= 0) {
        endGame('gameover');
        return;
      }

      GameLogic.updateSounds(g, closestEnemy, dt);
      Renderer.render(ctx, g, W, H, closestEnemy);

      setHud({
        keys: g.keys,
        req: g.reqKeys,
        time: Math.ceil(g.time / 1000),
        lives: g.lives,
        maxL: g.maxLives,
        hide: g.hiding,
        energy: Math.round(g.energy),
        eNear: Math.max(0, 1 - closestEnemy / 7),
        score: g.score,
        stamina: Math.round(g.player.stamina),
        highScore: highScores[diff] || 0,
      });

      setMapData({
        maze: g.maze,
        player: g.player,
        exit: g.exit,
        items: g.items,
        enemies: g.enemies,
        keys: g.keys,
        reqKeys: g.reqKeys,
        explored: g.explored,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screen, endGame, diff, highScores]);

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
      {mapData.maze.length > 0 && <Minimap {...mapData} />}
      <MessageOverlay $visible={!!(gameRef.current && gameRef.current.msgTimer > 0)}>
        {gameRef.current?.msg}
      </MessageOverlay>
    </PageContainer>
  );
}
