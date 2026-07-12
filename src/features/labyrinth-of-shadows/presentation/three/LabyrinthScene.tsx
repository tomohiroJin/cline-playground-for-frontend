/* eslint-disable react/no-unknown-property */
import React, { useEffect } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import type { GameState, HUDData } from '../../types';
import { CONFIG, CONTENT } from '../../constants';
import { EYE_HEIGHT } from './geometry';
import { MazeWalls } from './MazeWalls';
import { FloorCeiling } from './FloorCeiling';
import { ItemMeshes } from './ItemMeshes';
import { ExitMesh } from './ExitMesh';
import { EnemyMeshes } from './EnemyMeshes';
import { StoneMeshes } from './StoneMeshes';
import { GameController } from './GameController';
import { PostFx } from './PostFx';
import { usePointerLook } from '../hooks/use-pointer-look';
import { EnemyIndicators, type AlertMarker } from '../../components/EnemyIndicators';

export interface LabyrinthSceneProps {
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  onHudUpdate: (hud: HUDData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
  throwRef: React.MutableRefObject<boolean>;
  onAlert: (marker: AlertMarker) => void;
  alertMarkers: readonly AlertMarker[];
}

/** 3D迷宮シーンのルート。<Canvas> にフォグ・ライト・全要素を配置 */
export function LabyrinthScene(props: LabyrinthSceneProps) {
  const { gameRef } = props;
  const maze = gameRef.current?.maze ?? [];
  const size = maze.length;
  // デスクトップのマウスルック（ポーズ中は無効）
  const { lookRef, bindTargetRef } = usePointerLook(!props.paused);
  // prefers-reduced-motion 時は Bloom 強度を抑制する（SSR/jsdom では window/matchMedia が無いためガード）
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;

  // ポインタロック中の左クリック = 石を投げる（非ロック時のクリックはロック要求に使われる）
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && document.pointerLockElement) props.throwRef.current = true;
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [props.throwRef]);

  return (
    <div
      ref={bindTargetRef as React.RefObject<HTMLDivElement | null>}
      style={{ width: CONFIG.render.width, height: CONFIG.render.height, maxWidth: '100%', position: 'relative' }}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{
          fov: 75,
          near: 0.05,
          far: CONFIG.render.maxDepth,
          position: [0, EYE_HEIGHT, 0],
          // rotation 未指定だと R3F が初期化時に lookAt(0,0,0) を実行し真下向きになるため明示する
          rotation: [0, 0, 0],
        }}
        gl={{ antialias: true }}
      >
        {/* 恐怖演出＋描画距離制限を兼ねる指数フォグ。
            敵の索敵距離（5〜9セル）でプレイヤー側も敵を視認できるよう 0.14→0.11 に緩和 */}
        <fogExp2 attach="fog" args={['#05040a', 0.11]} />
        <color attach="background" args={['#05040a']} />
        {/* 環境光は控えめだが物理ベース照明準拠で床・壁が視認できる強度を確保 */}
        <ambientLight intensity={0.35} />

        {size > 0 && (
          <>
            <MazeWalls maze={maze} />
            <FloorCeiling width={maze[0].length} depth={size} />
            <ItemMeshes gameRef={gameRef} />
            <ExitMesh gameRef={gameRef} />
            <EnemyMeshes gameRef={gameRef} />
            <StoneMeshes gameRef={gameRef} />
          </>
        )}
        <GameController {...props} lookRef={lookRef} />
        <PostFx reducedMotion={reducedMotion} />
      </Canvas>
      {/* 索敵マーカーはゲーム画面内に重ねる（ページ端では気づけないという実機FB対応） */}
      <EnemyIndicators markers={props.alertMarkers} />
    </div>
  );
}
