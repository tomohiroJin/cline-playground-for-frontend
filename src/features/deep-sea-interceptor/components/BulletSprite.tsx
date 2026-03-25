// ============================================================================
// Deep Sea Interceptor - 弾描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
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
        boxShadow: bullet.charged ? '0 0 22px #64c8ff' : '0 0 9px #64c8ff',
      }}
    />
  );
});

export default BulletSprite;
