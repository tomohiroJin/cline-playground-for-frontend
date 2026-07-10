/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState } from '../../types';
import { CONTENT } from '../../constants';

const LOCKED_COLOR = new THREE.Color(CONTENT.items.exitLocked.color);
const OPEN_COLOR = new THREE.Color(CONTENT.items.exit.color);

/**
 * 出口をドア状のプロシージャル3Dオブジェクトとして描画する。
 * 施錠中は灰色・低発光、鍵が揃うと緑色に発光しつつ脈動する。
 * 状態は毎フレーム useFrame 内で material/light に直接反映し、React state は使わない。
 */
export function ExitMesh({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }) {
  const groupRef = useRef<THREE.Group>(null);
  const doorMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const g = gameRef.current;
    const group = groupRef.current;
    const doorMaterial = doorMaterialRef.current;
    const lampMaterial = lampMaterialRef.current;
    const light = lightRef.current;
    if (!g || !group || !doorMaterial || !lampMaterial || !light) return;

    // entity-factory の createExit は生成時点で +0.5 済みのセル中心座標を返すため、
    // 旧スプライト実装（g.exit.x, g.exit.y をそのまま使用）と同じくそのまま使う
    group.position.set(g.exit.x, 1.1, g.exit.y);

    const unlocked = g.keys >= g.reqKeys;
    const color = unlocked ? OPEN_COLOR : LOCKED_COLOR;

    doorMaterial.color.copy(color);
    doorMaterial.emissive.copy(color);
    doorMaterial.emissiveIntensity = unlocked ? 1.2 : 0.3;

    lampMaterial.color.copy(color);
    lampMaterial.emissive.copy(color);
    lampMaterial.emissiveIntensity = unlocked ? 1.2 : 0.3;

    light.color.copy(color);
    light.intensity = unlocked ? 3 : 0.6;

    // 開放時は旧実装の pulse 演出を踏襲
    const scale = unlocked ? 1 + Math.sin(state.clock.elapsedTime * 5) * 0.06 : 1;
    group.scale.setScalar(scale);
  });

  return (
    <group ref={groupRef}>
      {/* ドア本体 */}
      <mesh castShadow>
        <boxGeometry args={[0.9, 2.2, 0.15]} />
        <meshStandardMaterial ref={doorMaterialRef} color={LOCKED_COLOR} emissive={LOCKED_COLOR} emissiveIntensity={0.3} />
      </mesh>
      {/* 上部の発光ランプ */}
      <mesh position={[0, 1.25, 0.1]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial ref={lampMaterialRef} color={LOCKED_COLOR} emissive={LOCKED_COLOR} emissiveIntensity={0.3} />
      </mesh>
      {/* 出口を照らす点光源。施錠中は弱く、開放時は強く発光する */}
      <pointLight ref={lightRef} color={LOCKED_COLOR} intensity={0.6} distance={4} decay={2} />
    </group>
  );
}
