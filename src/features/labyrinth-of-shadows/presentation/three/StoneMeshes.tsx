/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState } from '../../types';
import { GAME_BALANCE } from '../../domain/constants';

const THROW_HEIGHT = 0.9;

/** 飛行中の石を描画する。最大同時数ぶんのメッシュを使い回し、毎フレーム位置だけ更新する */
export function StoneMeshes({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }) {
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const slots = GAME_BALANCE.stone.MAX_COUNT;

  useFrame(() => {
    const projectiles = gameRef.current?.stoneProjectiles ?? [];
    for (let i = 0; i < slots; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      const p = projectiles[i];
      mesh.visible = !!p;
      if (p) {
        // 放物線風に僅かに沈ませる（演出のみ、当たり判定はドメイン側）
        const drop = (p.traveled / GAME_BALANCE.stone.THROW_RANGE) * 0.4;
        mesh.position.set(p.x, THROW_HEIGHT - drop, p.y);
      }
    }
  });

  return (
    <>
      {Array.from({ length: slots }).map((_, i) => (
        <mesh
          key={i}
          ref={el => {
            meshRefs.current[i] = el;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#c0b8a8" />
        </mesh>
      ))}
    </>
  );
}
