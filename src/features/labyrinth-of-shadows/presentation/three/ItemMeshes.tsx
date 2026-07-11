/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState, Item } from '../../types';
import { CONTENT } from '../../constants';

/** アイテムタイプごとの固有形状。色だけでは種類が判別できないという実機FBへの対応 */
function ItemGeometry({ type }: { type: Item['type'] }) {
  switch (type) {
    case 'key': // 鍵 = リング（鍵輪）
      return <torusGeometry args={[0.2, 0.07, 8, 16]} />;
    case 'trap': // 罠 = 怪しい箱
      return <boxGeometry args={[0.42, 0.42, 0.42]} />;
    case 'heal': // 回復薬 = カプセル
      return <capsuleGeometry args={[0.14, 0.3, 4, 8]} />;
    case 'speed': // 加速 = 尖った矢型（円錐）
      return <coneGeometry args={[0.2, 0.5, 6]} />;
    case 'map': // 地図 = 薄い板
      return <boxGeometry args={[0.45, 0.32, 0.04]} />;
    case 'stone': // 小石 = 小さな球
      return <sphereGeometry args={[0.14, 8, 8]} />;
    default:
      return <octahedronGeometry args={[0.28, 0]} />;
  }
}

/** アイテム1個。取得済みなら非表示、未取得なら上下にbobしつつゆっくり回転 */
function SingleItem({ item }: { item: Item }) {
  const groupRef = useRef<THREE.Group>(null);
  const color = CONTENT.items[item.type].color;
  const baseY = 0.6;

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.visible = !item.got;
    // ふわふわと上下（既存 renderer の bob 相当）＋回転で形状を見せる
    g.position.y = baseY + Math.sin(state.clock.elapsedTime * 4) * 0.12;
    g.rotation.y = state.clock.elapsedTime * 1.2;
  });

  return (
    <group ref={groupRef} position={[item.x + 0.5, baseY, item.y + 0.5]}>
      <mesh castShadow>
        <ItemGeometry type={item.type} />
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
