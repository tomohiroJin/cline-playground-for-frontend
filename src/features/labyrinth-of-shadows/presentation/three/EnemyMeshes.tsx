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

/** 敵の点光源強度（有効時） */
const ENEMY_LIGHT_INTENSITY = 3.5;

/** 敵1体。active な間だけ表示し、live な座標(gameRef経由)を毎フレーム反映 */
function SingleEnemy({ enemy }: { enemy: Enemy }) {
  const groupRef = useRef<THREE.Group>(null);
  const visualRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const v = ENEMY_VISUAL[enemy.type];

  useFrame((state) => {
    const g = groupRef.current;
    const visual = visualRef.current;
    const light = lightRef.current;
    if (!g || !visual || !light) return;
    // 有効ライト数を一定に保つため group/light の visible は切り替えない。
    // 未出現の敵は見た目メッシュを隠しライト強度を0にする（敵が湧いてライト数が変わると
    // three.js が全被照明マテリアルのシェーダを同期再コンパイルしカクつくため）
    visual.visible = enemy.active;
    light.intensity = enemy.active ? ENEMY_LIGHT_INTENSITY : 0;
    if (!enemy.active) return;
    // enemy.x/y は game-logic が毎フレーム書き換える live な値
    g.position.set(enemy.x, 1.0, enemy.y);
    // 目が進行方向を向くように回転（local +Z を (cos dir, sin dir) に合わせる）
    g.rotation.y = Math.PI / 2 - enemy.dir;
    // 微動（浮遊感）とテレポート型の脈動
    const t = state.clock.elapsedTime;
    g.position.y = 1.0 + Math.sin(t * 3 + enemy.x) * 0.08;
    const pulse = enemy.type === 'teleporter' ? 1 + Math.sin(t * 5) * 0.12 : 1;
    g.scale.setScalar(pulse);
  });

  return (
    <group ref={groupRef}>
      <group ref={visualRef}>
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
      {/* 「敵」と一目で分かるよう、進行方向を向く一対の目を付ける
          （アイテムも発光体のため、形状・光だけでは区別できないという実機FBへの対応） */}
      <mesh position={[-0.14, 0.18, 0.38]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffdddd" emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0.14, 0.18, 0.38]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffdddd" emissiveIntensity={2.5} />
      </mesh>
      </group>
      {/* 点光源は未出現時も mount したまま intensity=0 にしてライト数を一定に保つ（物理ベース照明準拠の強度） */}
      <pointLight ref={lightRef} color={v.color} intensity={ENEMY_LIGHT_INTENSITY} distance={4} decay={2} />
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
