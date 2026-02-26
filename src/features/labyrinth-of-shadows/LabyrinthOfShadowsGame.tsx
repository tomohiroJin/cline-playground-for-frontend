// 注: このファイルではパフォーマンス最適化のため、ref経由でゲーム状態を管理しています
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { saveScore, getHighScore } from '../../utils/score-storage';
import { CONFIG, CONTENT } from './constants';
import type { Difficulty, Item, Enemy, GameState, HUDData } from './types';
import { GameStateFactory } from './entity-factory';
import { GameLogic } from './game-logic';
import { Renderer } from './renderer';
import { MinimapRenderer } from './minimap-renderer';
import { AudioService } from './audio';
import { TitleScreen } from './components/TitleScreen';
import { ResultScreen } from './components/ResultScreen';
import { HUD } from './components/HUD';
import { Minimap } from './components/Minimap';
import { Controls } from './components/Controls';
import {
  PageContainer,
  Canvas,
  MessageOverlay,
  Overlay,
  ModalContent,
  ControlBtn,
} from '../../pages/MazeHorrorPage.styles';

// HUD データの浅い比較
const hudEqual = (a: HUDData, b: HUDData): boolean =>
  a.keys === b.keys &&
  a.req === b.req &&
  a.time === b.time &&
  a.lives === b.lives &&
  a.maxL === b.maxL &&
  a.hide === b.hide &&
  a.energy === b.energy &&
  a.eNear === b.eNear &&
  a.score === b.score &&
  a.stamina === b.stamina &&
  a.highScore === b.highScore;

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
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number | null>(null);
  const prevHudRef = useRef<HUDData>(hud);
  const prevMapKeyRef = useRef('');
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && screen === 'playing') {
        e.preventDefault();
        togglePause();
        return;
      }
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
  }, [screen, togglePause]);

  useEffect(() => {
    if (screen !== 'playing' || !gameRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = CONFIG.render;

    // BGM開始
    AudioService.startBGM();

    const loop = () => {
      const g = gameRef.current;
      if (!g) return;

      const now = performance.now();
      const dt = Math.min(50, now - g.lastT);
      g.lastT = now;

      // ポーズ中は描画のみ
      if (paused) {
        Renderer.render(ctx, g, W, H, 99);
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      g.gTime += dt;
      g.time -= dt;
      if (g.invince > 0) g.invince -= dt;
      if (g.msgTimer > 0) g.msgTimer -= dt;
      if (g.speedBoost > 0) g.speedBoost -= dt;

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
      AudioService.updateBGM(Math.max(0, 1 - closestEnemy / 8));
      Renderer.render(ctx, g, W, H, closestEnemy);

      // Minimap Canvas描画
      const minimapCtx = minimapCanvasRef.current?.getContext('2d');
      if (minimapCtx) {
        MinimapRenderer.render(minimapCtx, {
          maze: g.maze,
          player: g.player,
          exit: g.exit,
          items: g.items,
          enemies: g.enemies,
          keys: g.keys,
          reqKeys: g.reqKeys,
          explored: g.explored,
          time: g.gTime / 1000,
        });
      }

      // HUD更新（変化検知付き）
      const newHud: HUDData = {
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
      };
      if (!hudEqual(newHud, prevHudRef.current)) {
        prevHudRef.current = newHud;
        setHud(newHud);
      }

      // MapData更新（変化検知: 重要フィールドのみ比較）
      const mapKey = `${g.keys}-${Math.floor(g.player.x)},${Math.floor(g.player.y)}-${g.enemies.map(e => `${e.active}${Math.floor(e.x)}${Math.floor(e.y)}`).join('')}-${g.items.filter(i => i.got).length}`;
      if (mapKey !== prevMapKeyRef.current) {
        prevMapKeyRef.current = mapKey;
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
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      AudioService.stopBGM();
    };
  }, [screen, endGame, diff, highScores, paused]);

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
