/* eslint-disable react/no-unknown-property */
import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import type { GameState, HUDData } from '../../types';
import { CONFIG, CONTENT } from '../../constants';
import { EYE_HEIGHT } from './geometry';
import { MazeWalls } from './MazeWalls';
import { FloorCeiling } from './FloorCeiling';
import { ItemMeshes } from './ItemMeshes';
import { EnemyMeshes } from './EnemyMeshes';
import { GameController } from './GameController';
import { usePointerLook } from '../hooks/use-pointer-look';

export interface LabyrinthSceneProps {
  gameRef: React.MutableRefObject<GameState | null>;
  keysRef: React.RefObject<Record<string, boolean>>;
  minimapCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  paused: boolean;
  diff: string;
  highScores: Record<string, number>;
  onHudUpdate: (hud: HUDData) => void;
  onGameEnd: (type: keyof typeof CONTENT.stories) => void;
}

/** 3D迷宮シーンのルート。<Canvas> にフォグ・ライト・全要素を配置 */
export function LabyrinthScene(props: LabyrinthSceneProps) {
  const { gameRef } = props;
  const maze = gameRef.current?.maze ?? [];
  const size = maze.length;
  // デスクトップのマウスルック（ポーズ中は無効）
  const { lookRef, bindTargetRef } = usePointerLook(!props.paused);

  return (
    <div
      ref={bindTargetRef as React.RefObject<HTMLDivElement | null>}
      style={{ width: CONFIG.render.width, height: CONFIG.render.height, maxWidth: '100%' }}
    >
      <Canvas
        shadows={{ type: THREE.PCFShadowMap }}
        camera={{ fov: 75, near: 0.05, far: CONFIG.render.maxDepth, position: [0, EYE_HEIGHT, 0] }}
        gl={{ antialias: true }}
      >
        {/* 恐怖演出＋描画距離制限を兼ねる指数フォグ */}
        <fogExp2 attach="fog" args={['#05040a', 0.14]} />
        <color attach="background" args={['#05040a']} />
        {/* 環境光は控えめだが物理ベース照明準拠で床・壁が視認できる強度を確保 */}
        <ambientLight intensity={0.35} />

        {size > 0 && (
          <>
            <MazeWalls maze={maze} />
            <FloorCeiling width={maze[0].length} depth={size} />
            <ItemMeshes gameRef={gameRef} />
            <EnemyMeshes gameRef={gameRef} />
          </>
        )}
        <GameController {...props} lookRef={lookRef} />
      </Canvas>
    </div>
  );
}
