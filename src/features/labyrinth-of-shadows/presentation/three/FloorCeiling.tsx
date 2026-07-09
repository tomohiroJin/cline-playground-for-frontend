/* eslint-disable react/no-unknown-property */
import React from 'react';
import '@react-three/fiber';
import { WALL_HEIGHT } from './geometry';

/** 迷路全体を覆う床・天井の平面 */
export function FloorCeiling({ width, depth }: { width: number; depth: number }) {
  return (
    <>
      {/* 床（原点隅から width×depth を覆うため中心へオフセット） */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#141014" roughness={1} />
      </mesh>
      {/* 天井 */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[width / 2, WALL_HEIGHT, depth / 2]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#0c0a0e" roughness={1} />
      </mesh>
    </>
  );
}
