/**
 * パーティクル生成ユーティリティ
 * バイオーム別の天候パーティクルを生成
 */
import React from 'react';

const DEFAULT_PARTICLE_COUNT = 24;

/** パーティクルのランダム配置を生成 */
export function renderParticles(biome: string, count = DEFAULT_PARTICLE_COUNT): React.ReactNode[] {
  if (biome !== 'glacier' && biome !== 'volcano' && biome !== 'grassland') return [];
  return Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 6;
    const duration = 4 + Math.random() * 4;
    return React.createElement('span', {
      key: i,
      style: {
        left: `${left}%`,
        top: biome === 'volcano' ? 'auto' : `${Math.random() * 20}%`,
        bottom: biome === 'volcano' ? '0' : 'auto',
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      },
    });
  });
}
