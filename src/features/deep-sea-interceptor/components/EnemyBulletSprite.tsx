// ============================================================================
// Deep Sea Interceptor - 敵弾描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
import { ColorPalette } from '../constants';
import { neonGlow, enemyBulletCoreSize } from '../visuals';
import type { EnemyBullet } from '../types';

/**
 * 敵弾スプライト。
 * 白コア＋暖色グローリング＋縁取りの二層構造で、背景やネオン発光に
 * 埋もれず「必ず見える弾」にする（見やすさ最優先）。
 */
const EnemyBulletSprite = memo(function EnemyBulletSprite({ bullet }: { bullet: EnemyBullet }) {
  const { enemyCore, enemyGlow, enemyEdge } = ColorPalette.bullet;
  const size = bullet.size;
  const coreSize = enemyBulletCoreSize(size);
  const coreOffset = (size - coreSize) / 2;

  return (
    <div
      style={{
        position: 'absolute',
        left: bullet.x - size / 2,
        top: bullet.y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${enemyGlow}, ${enemyEdge})`,
        border: `1px solid ${enemyEdge}`,
        filter: neonGlow(enemyGlow, 'soft'),
        boxSizing: 'border-box',
      }}
    >
      {/* 中心の高輝度コア */}
      <div
        style={{
          position: 'absolute',
          left: coreOffset,
          top: coreOffset,
          width: coreSize,
          height: coreSize,
          borderRadius: '50%',
          background: enemyCore,
        }}
      />
    </div>
  );
});

export default EnemyBulletSprite;
