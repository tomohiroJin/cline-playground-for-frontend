/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MOOD, torchFlicker } from './lighting-config';

/**
 * 一人称の手元に見える小さな炎メッシュ。カメラ手前下にオフセット配置し、
 * 発光マテリアルで bloom の対象になる。reducedMotion 時は揺らぎを止める。
 */
export function TorchFlame({ reducedMotion }: { reducedMotion: boolean }) {
  const { camera } = useThree();
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state) => {
    const mesh = meshRef.current;
    const mat = matRef.current;
    if (!mesh || !mat) return;
    // カメラ手前やや下・右にオフセット（手に持つ松明のイメージ）
    const offset = new THREE.Vector3(0.35, -0.45, -0.9).applyQuaternion(camera.quaternion);
    mesh.position.copy(camera.position).add(offset);
    mesh.quaternion.copy(camera.quaternion);
    const flick = reducedMotion ? 0.5 : torchFlicker(state.clock.elapsedTime);
    mat.opacity = 0.7 + flick * 0.3;
    const s = 1 + (reducedMotion ? 0 : flick * 0.2);
    mesh.scale.set(s, s * 1.4, s);
  });

  return (
    <mesh ref={meshRef}>
      <coneGeometry args={[0.12, 0.3, 8]} />
      <meshBasicMaterial ref={matRef} color={MOOD.torch} transparent opacity={0.9} />
    </mesh>
  );
}
