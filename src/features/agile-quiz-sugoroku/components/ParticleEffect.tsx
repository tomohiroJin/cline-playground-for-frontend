/**
 * パーティクルエフェクトコンポーネント
 */
import React, { useState, useEffect } from 'react';
import { ParticlesContainer, Particle } from './styles';

interface ParticleData {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

interface ParticleEffectProps {
  /** パーティクル数 */
  count?: number;
}

/**
 * パーティクルデータを生成（初回マウント時のみ実行）
 */
function generateParticles(count: number): ParticleData[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2.5,
    duration: 18 + Math.random() * 30,
    delay: -Math.random() * 20,
    opacity: 0.06 + Math.random() * 0.1,
  }));
}

/**
 * 浮遊するパーティクルエフェクト
 */
export const ParticleEffect: React.FC<ParticleEffectProps> = ({ count = 18 }) => {
  const [particles, setParticles] = useState<ParticleData[]>([]);

  // マウント時にパーティクルを生成
  useEffect(() => {
    setParticles(generateParticles(count));
  }, [count]);

  if (particles.length === 0) {
    return null;
  }

  return (
    <ParticlesContainer>
      {particles.map((p) => (
        <Particle
          key={p.id}
          $x={p.x}
          $y={p.y}
          $size={p.size}
          $duration={p.duration}
          $delay={p.delay}
          $opacity={p.opacity}
        />
      ))}
    </ParticlesContainer>
  );
};
