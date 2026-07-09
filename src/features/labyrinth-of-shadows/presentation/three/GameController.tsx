/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { GameState, HUDData } from '../../types';
import { CONTENT } from '../../constants';
import { advanceGame, TickInput } from '../../game-tick';
import { cameraYaw, EYE_HEIGHT } from './geometry';
import { MinimapRenderer } from '../../minimap-renderer';

export interface GameControllerProps {
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  lookRef: React.MutableRefObject<{ dx: number }>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  onHudUpdate: (hud: HUDData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
}

/** keysRef からティック入力を生成 */
function readInput(k: Record<string, boolean>): TickInput {
  return {
    left: k['a'] || k['arrowleft'] || false,
    right: k['d'] || k['arrowright'] || false,
    forward: k['w'] || k['arrowup'] || false,
    backward: k['s'] || k['arrowdown'] || false,
    hide: k[' '] || false,
    sprint: k['shift'] || false,
  };
}

/** HUDData の浅い比較（既存 use-game-loop と同一） */
const hudEqual = (a: HUDData, b: HUDData): boolean =>
  a.keys === b.keys && a.req === b.req && a.time === b.time && a.lives === b.lives &&
  a.maxL === b.maxL && a.hide === b.hide && a.energy === b.energy && a.eNear === b.eNear &&
  a.score === b.score && a.stamina === b.stamina && a.highScore === b.highScore;

/**
 * ゲーム進行の心臓部。useFrame（R3FのrAF）で毎フレーム:
 * 1) マウスルック蓄積を角度へ反映 2) advanceGame でロジック更新
 * 3) カメラを player に同期 4) トーチ揺らぎ 5) HUD/ミニマップ更新
 */
export function GameController(props: GameControllerProps) {
  const { gameRef, keysRef, lookRef, minimapCanvasRef, paused, diff, highScores, onHudUpdate, onGameEnd } = props;
  const { camera } = useThree();
  const torchRef = useRef<THREE.PointLight>(null);
  const prevHudRef = useRef<HUDData | null>(null);
  const endedRef = useRef(false);

  useFrame(() => {
    const g = gameRef.current;
    if (!g || endedRef.current) return;

    const now = performance.now();
    const dt = Math.min(50, now - g.lastT);
    g.lastT = now;
    if (paused) return;

    // マウスルック: 蓄積分を角度へ反映して消費
    if (lookRef.current.dx !== 0) {
      g.player.angle += lookRef.current.dx;
      lookRef.current.dx = 0;
    }

    const result = advanceGame(g, dt, readInput(keysRef.current ?? {}));

    // カメラ同期（ロジック更新後の最新 player を反映）
    camera.position.set(g.player.x, EYE_HEIGHT, g.player.y);
    camera.rotation.order = 'YXZ';
    camera.rotation.y = cameraYaw(g.player.angle);

    // トーチ点光源をカメラ位置へ。既存 renderer の複数周波数フリッカを流用
    if (torchRef.current) {
      const time = g.gTime / 1000;
      const flicker = Math.sin(time * 3.7) * 0.3 + Math.sin(time * 7.1) * 0.15 + Math.sin(time * 11.3) * 0.05 + 0.5;
      torchRef.current.position.set(g.player.x, EYE_HEIGHT, g.player.y);
      torchRef.current.intensity = 2.2 + flicker * 0.8;
    }

    if (result.status !== 'playing') {
      endedRef.current = true;
      onGameEnd(result.status);
      return;
    }

    // ミニマップ更新（既存 MinimapRenderer をそのまま利用）
    const minimapCtx = minimapCanvasRef.current?.getContext('2d');
    if (minimapCtx) {
      MinimapRenderer.render(minimapCtx, {
        maze: g.maze, player: g.player, exit: g.exit, items: g.items, enemies: g.enemies,
        keys: g.keys, reqKeys: g.reqKeys, explored: g.explored, time: g.gTime / 1000,
      });
    }

    // HUD更新（変化検知付き）
    const newHud: HUDData = {
      keys: g.keys, req: g.reqKeys, time: Math.ceil(g.time / 1000), lives: g.lives, maxL: g.maxLives,
      hide: g.hiding, energy: Math.round(g.energy), eNear: Math.max(0, 1 - result.closestEnemy / 7),
      score: g.score, stamina: Math.round(g.player.stamina), highScore: highScores[diff] || 0,
    };
    if (!prevHudRef.current || !hudEqual(newHud, prevHudRef.current)) {
      prevHudRef.current = newHud;
      onHudUpdate(newHud);
    }
  });

  return <pointLight ref={torchRef} color="#ffb060" intensity={2.2} distance={8} decay={1.6} castShadow />;
}
