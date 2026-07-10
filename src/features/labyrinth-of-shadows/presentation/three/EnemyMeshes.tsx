/* eslint-disable react/no-unknown-property */
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { GameState, Enemy, EnemyType } from '../../types';
import { CONTENT } from '../../constants';

/** 敵タイプごとの見た目パラメータ */
const ENEMY_VISUAL: Record<EnemyType, { color: string; opacity: number; emissive: number }> = {
  chaser: { color: CONTENT.items.enemy.color, opacity: 1, emissive: 0.8 },       // 威圧的な赤い塊
  wanderer: { color: CONTENT.items.wanderer.color, opacity: 0.55, emissive: 0.5 }, // 半透明の漂う霊
  teleporter: { color: CONTENT.items.teleporter.color, opacity: 0.75, emissive: 1.1 }, // 歪む渦
};

/** 敵1体。active な間だけ表示し、live な座標(gameRef経由)を毎フレーム反映 */
function SingleEnemy({ enemy }: { enemy: Enemy }) {
  const groupRef = useRef<THREE.Group>(null);
  const v = ENEMY_VISUAL[enemy.type];

  useFrame((state) => {
    const g = groupRef.current;
    if (!g) return;
    g.visible = enemy.active;
    // enemy.x/y は game-logic が毎フレーム書き換える live な値
    g.position.set(enemy.x, 1.0, enemy.y);
    // 微動（浮遊感）とテレポート型の脈動
    const t = state.clock.elapsedTime;
    g.position.y = 1.0 + Math.sin(t * 3 + enemy.x) * 0.08;
    const pulse = enemy.type === 'teleporter' ? 1 + Math.sin(t * 5) * 0.12 : 1;
    g.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow>
        {/* タイプで形状を分ける: 追跡=球塊 / 徘徊=縦長 / テレポート=八面体 */}
        {enemy.type === 'teleporter' ? (
          <octahedronGeometry args={[0.5, 0]} />
        ) : enemy.type === 'wanderer' ? (
          <capsuleGeometry args={[0.28, 0.7, 4, 8]} />
        ) : (
          <sphereGeometry args={[0.45, 16, 16]} />
        )}
        <meshStandardMaterial
          color={v.color}
          emissive={v.color}
          emissiveIntensity={v.emissive}
          transparent={v.opacity < 1}
          opacity={v.opacity}
        />
      </mesh>
      {/* 物理ベース照明準拠の強度 */}
      <pointLight color={v.color} intensity={3.5} distance={4} decay={2} />
    </group>
  );
}

/** 全敵を描画する。敵配列は対局中に長さが変わらない */
export function EnemyMeshes({ gameRef }: { gameRef: React.MutableRefObject<GameState | null> }) {
  const enemies = gameRef.current?.enemies ?? [];
  return (
    <>
      {enemies.map((enemy, i) => (
        <SingleEnemy key={i} enemy={enemy} />
      ))}
    </>
  );
}
