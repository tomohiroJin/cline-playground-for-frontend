/* eslint-disable react/no-unknown-property */
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import { collectWallCells, WALL_HEIGHT, CELL_SIZE } from './geometry';
import { useStoneMaps } from './textures/use-stone-texture';

/** 迷路の壁を InstancedMesh（1ドローコール）で描画する */
export function MazeWalls({ maze }: { maze: number[][] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // 壁セルは対局中に変化しないため maze 参照が変わったときのみ再計算
  const cells = useMemo(() => collectWallCells(maze), [maze]);
  const { map, roughnessMap, normalMap } = useStoneMaps('wall');
  // 壁1セルあたり縦2回繰り返して石のスケール感を出す。
  // テクスチャは useStoneMaps 内で安定参照として生成済みのため、
  // ここでは repeat プロパティの設定のみ（副作用を伴う useMemo は避ける）。
  [map, roughnessMap, normalMap].forEach((t) => t.repeat.set(1, WALL_HEIGHT / CELL_SIZE));

  useLayoutEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    cells.forEach((c, i) => {
      // セル中心をワールド座標へ（X=x+0.5, Z=z+0.5, Y=壁の中央高さ）
      dummy.position.set(c.x + 0.5, WALL_HEIGHT / 2, c.z + 0.5);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [cells]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, cells.length]}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, CELL_SIZE]} />
      {/* 石積みテクスチャ。トーチ点光源で目地・凹凸の陰影が付く */}
      <meshStandardMaterial
        map={map}
        roughnessMap={roughnessMap}
        normalMap={normalMap}
        roughness={0.9}
        metalness={0.05}
      />
    </instancedMesh>
  );
}
