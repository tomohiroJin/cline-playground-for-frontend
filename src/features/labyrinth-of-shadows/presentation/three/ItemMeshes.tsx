/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState, Item } from '../../types';
import { CONTENT } from '../../constants';

/** アイテム1個。取得済みなら非表示、未取得なら上下にbob */
function SingleItem({ item }: { item: Item }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = CONTENT.items[item.type].color;
  const baseY = 0.6;

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.visible = !item.got;
    // ふわふわと上下（既存 renderer の bob 相当）
    g.position.y = baseY + Math.sin(state.clock.elapsedTime * 4) * 0.12;
  });

  return (
    <group ref={groupRef} position={[item.x + 0.5, baseY, item.y + 0.5]}>
      <mesh castShadow>
        <octahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
      </mesh>
      {/* アイテムを照らす小さな点光源で存在感を出す（物理ベース照明準拠の強度） */}
      <pointLight color={color} intensity={3} distance={3} decay={2} />
    </group>
  );
}

/** 全アイテムを描画する。アイテム配列は対局中に長さが変わらない */
export function ItemMeshes({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }) {
  const items = gameRef.current?.items ?? [];
  return (
    <>
      {items.map((item, i) => (
        <SingleItem key={i} item={item} />
      ))}
    </>
  );
}
