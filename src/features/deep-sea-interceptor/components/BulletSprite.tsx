// ============================================================================
// Deep Sea Interceptor - 弾描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
import { neonGlow } from '../visuals';
import type { Bullet } from '../types';

/** プレイヤー弾のスプライト */
const BulletSprite = memo(function BulletSprite({ bullet }: { bullet: Bullet }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: bullet.x - bullet.size / 2,
        top: bullet.y - bullet.size / 2,
        width: bullet.size,
        height: bullet.size,
        borderRadius: '50%',
        background: bullet.charged
          ? 'radial-gradient(circle,#fff,#64c8ff,#06c)'
          : 'radial-gradient(circle,#fff,#64c8ff)',
        filter: neonGlow('#64c8ff', bullet.charged ? 'strong' : 'soft'),
      }}
    />
  );
});

export default BulletSprite;
