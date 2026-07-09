/* eslint-disable react/no-unknown-property */
import React, { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import '@react-three/fiber';
import { collectWallCells, WALL_HEIGHT, CELL_SIZE } from './geometry';

/** 迷路の壁を InstancedMesh（1ドローコール）で描画する */
export function MazeWalls({ maze }: { maze: number[][] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // 壁セルは対局中に変化しないため maze 参照が変わったときのみ再計算
  const cells = useMemo(() => collectWallCells(maze), [maze]);

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
      {/* 石壁風。トーチ点光源で陰影が付く */}
      <meshStandardMaterial color="#3a3630" roughness={0.9} metalness={0.05} />
    </instancedMesh>
  );
}
