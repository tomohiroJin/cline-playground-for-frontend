/* eslint-disable react/no-unknown-property */
import React from 'react';
import type * as THREE from 'three';
import '@react-three/fiber';
import { WALL_HEIGHT } from './geometry';
import { useStoneMaps } from './textures/use-stone-texture';

/** 迷路全体を覆う床・天井の平面 */
export function FloorCeiling({ width, depth }: { width: number; depth: number }) {
  const floor = useStoneMaps('floor');
  const ceil = useStoneMaps('ceiling');
  // 迷路全体をタイル状に覆うよう width×depth 回繰り返す。
  // テクスチャは useStoneMaps 内で安定参照として生成済みのため、
  // ここでは repeat プロパティの設定のみ（副作用を伴う useMemo は避ける）。
  Object.values(floor).forEach((t: THREE.Texture) => t.repeat.set(width, depth));
  Object.values(ceil).forEach((t: THREE.Texture) => t.repeat.set(width, depth));

  return (
    <>
      {/* 床（原点隅から width×depth を覆うため中心へオフセット） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          map={floor.map}
          roughnessMap={floor.roughnessMap}
          normalMap={floor.normalMap}
          roughness={1}
        />
      </mesh>
      {/* 天井 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2, WALL_HEIGHT, depth / 2]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          map={ceil.map}
          roughnessMap={ceil.roughnessMap}
          normalMap={ceil.normalMap}
          roughness={1}
        />
      </mesh>
    </>
  );
}
