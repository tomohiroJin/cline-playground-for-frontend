/**
 * ゲームループ管理カスタムフック
 * requestAnimationFrame ベースのゲームループを管理し、
 * 描画・ロジック更新・HUD更新を統括する
 */
import { useEffect, useRef, useCallback } from 'react';
import type { GameState, HUDData, Item, Enemy } from '../../types';
import { CONFIG } from '../../constants';
import { GameLogic } from '../../game-logic';
import { Renderer } from '../../renderer';
import { MinimapRenderer } from '../../minimap-renderer';
import { AudioService } from '../../audio';
import type { CONTENT } from '../../constants';

/** ゲームループのパラメータ */
interface UseGameLoopParams {
  screen: string;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  onHudUpdate: (hud: HUDData) => void;
  onMapUpdate: (data: MapData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
}

/** ミニマップデータ */
export interface MapData {
  maze: number[][];
  player: { x: number; y: number };
  exit: { x: number; y: number };
  items: Item[];
  enemies: Enemy[];
  keys: number;
  reqKeys: number;
  explored: Record<string, boolean>;
}

/** HUD データの浅い比較 */
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

/**
 * ゲームループを管理するカスタムフック
 */
export const useGameLoop = ({
  screen,
  paused,
  diff,
  highScores,
  canvasRef,
  minimapCanvasRef,
  gameRef,
  keysRef,
  onHudUpdate,
  onMapUpdate,
  onGameEnd,
}: UseGameLoopParams) => {
  const rafRef = useRef<number | null>(null);
  const prevHudRef = useRef<HUDData | null>(null);
  const prevMapKeyRef = useRef('');

  /** ゲームループの停止 */
  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

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
        onGameEnd('timeout');
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
        onGameEnd(exitResult);
        return;
      }

      const closestEnemy = GameLogic.updateEnemies(g, dt);
      if (g.lives <= 0) {
        onGameEnd('gameover');
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
      if (!prevHudRef.current || !hudEqual(newHud, prevHudRef.current)) {
        prevHudRef.current = newHud;
        onHudUpdate(newHud);
      }

      // MapData更新（変化検知: 重要フィールドのみ比較）
      const mapKey = `${g.keys}-${Math.floor(g.player.x)},${Math.floor(g.player.y)}-${g.enemies.map(e => `${e.active}${Math.floor(e.x)}${Math.floor(e.y)}`).join('')}-${g.items.filter(i => i.got).length}`;
      if (mapKey !== prevMapKeyRef.current) {
        prevMapKeyRef.current = mapKey;
        onMapUpdate({
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
      stopLoop();
      AudioService.stopBGM();
    };
  }, [screen, paused, diff, highScores, canvasRef, minimapCanvasRef, gameRef, keysRef, onHudUpdate, onMapUpdate, onGameEnd, stopLoop]);

  return { stopLoop };
};
