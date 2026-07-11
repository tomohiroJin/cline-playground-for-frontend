/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { GameState, HUDData } from '../../types';
import { CONTENT } from '../../constants';
import { advanceGame, TickInput } from '../../game-tick';
import { cameraYaw, EYE_HEIGHT } from './geometry';
import { MinimapRenderer } from '../../minimap-renderer';
import { normAngle } from '../../utils';
import type { AlertMarker } from '../../components/EnemyIndicators';
import { clampPitch, type LookRef } from '../hooks/use-pointer-look';

export interface GameControllerProps {
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  lookRef: React.MutableRefObject<LookRef>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  onHudUpdate: (hud: HUDData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
  throwRef: React.MutableRefObject<boolean>;
  onAlert: (marker: AlertMarker) => void;
}

/**
 * keysRef からティック入力を生成（投擲は throwStone 引数で合成する）。
 * FPS 標準: A/D はストレイフ、旋回はマウスルックと矢印キーのみ
 */
function readInput(k: Record<string, boolean>, throwStone: boolean): TickInput {
  return {
    left: k['arrowleft'] || false,
    right: k['arrowright'] || false,
    forward: k['w'] || k['arrowup'] || false,
    backward: k['s'] || k['arrowdown'] || false,
    strafeLeft: k['a'] || false,
    strafeRight: k['d'] || false,
    hide: k[' '] || false,
    sprint: k['shift'] || false,
    throwStone,
  };
}

/** HUDData の浅い比較（旧描画ループ実装と同一） */
const hudEqual = (a: HUDData, b: HUDData): boolean =>
  a.keys === b.keys && a.req === b.req && a.time === b.time && a.lives === b.lives &&
  a.maxL === b.maxL && a.hide === b.hide && a.energy === b.energy && a.eNear === b.eNear &&
  a.score === b.score && a.stamina === b.stamina && a.highScore === b.highScore &&
  a.stones === b.stones;

/**
 * ゲーム進行の心臓部。useFrame（R3FのrAF）で毎フレーム:
 * 1) マウスルック蓄積を角度へ反映 2) advanceGame でロジック更新
 * 3) カメラを player に同期 4) トーチ揺らぎ 5) HUD/ミニマップ更新
 */
export function GameController(props: GameControllerProps) {
  const {
    gameRef, keysRef, lookRef, minimapCanvasRef, paused, diff, highScores,
    onHudUpdate, onGameEnd, throwRef, onAlert,
  } = props;
  const { camera } = useThree();
  const torchRef = useRef<THREE.PointLight>(null);
  const prevHudRef = useRef<HUDData | null>(null);
  const endedRef = useRef(false);
  const alertIdRef = useRef(0);
  // 上下視点（ピッチ）。演出のみでゲームロジック（angle）には影響させない
  const pitchRef = useRef(0);

  useFrame(() => {
    const g = gameRef.current;
    if (!g || endedRef.current) return;

    const now = performance.now();
    const dt = Math.min(50, now - g.lastT);
    g.lastT = now;
    if (paused) return;

    // マウスルック: 蓄積分を角度へ反映して消費（dy は上下視点、可動域内にクランプ）
    if (lookRef.current.dx !== 0) {
      g.player.angle += lookRef.current.dx;
      lookRef.current.dx = 0;
    }
    if (lookRef.current.dy !== 0) {
      pitchRef.current = clampPitch(pitchRef.current + lookRef.current.dy);
      lookRef.current.dy = 0;
    }

    const input = readInput(keysRef.current ?? {}, throwRef.current);
    throwRef.current = false;
    const result = advanceGame(g, dt, input);

    // 索敵アラートをプレイヤー相対角に変換して通知（!/? マーカーの元データ）
    for (const a of result.alerts) {
      const angle = normAngle(Math.atan2(a.y - g.player.y, a.x - g.player.x) - g.player.angle);
      onAlert({ id: ++alertIdRef.current, kind: a.kind, angle });
    }

    // カメラ同期（ロジック更新後の最新 player を反映）。
    // R3F は camera オプションに rotation が無いと初期化時に lookAt(0,0,0) を実行し
    // 真下向きのピッチが混入するため、yaw だけでなく姿勢全体を毎フレーム上書きする
    camera.position.set(g.player.x, EYE_HEIGHT, g.player.y);
    camera.rotation.order = 'YXZ';
    camera.rotation.set(pitchRef.current, cameraYaw(g.player.angle), 0);

    // トーチ点光源をカメラ位置へ。既存 renderer の複数周波数フリッカを流用
    if (torchRef.current) {
      const time = g.gTime / 1000;
      const flicker = Math.sin(time * 3.7) * 0.3 + Math.sin(time * 7.1) * 0.15 + Math.sin(time * 11.3) * 0.05 + 0.5;
      torchRef.current.position.set(g.player.x, EYE_HEIGHT, g.player.y);
      // 物理ベース照明準拠の強度（point light は距離減衰が急峻なため高めに設定）
      torchRef.current.intensity = 9 + flicker * 3;
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
      stones: g.stones,
    };
    if (!prevHudRef.current || !hudEqual(newHud, prevHudRef.current)) {
      prevHudRef.current = newHud;
      onHudUpdate(newHud);
    }
  });

  return <pointLight ref={torchRef} color="#ffb060" intensity={9} distance={8} decay={1.6} castShadow />;
}
