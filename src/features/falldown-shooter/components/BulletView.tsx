// 弾丸描画コンポーネント

import React from 'react';
import type { BulletData } from '../types';
import { BulletWrapper } from '../../../pages/FallingShooterPage.styles';

interface BulletViewProps {
  bullet: BulletData;
  size: number;
}

export const BulletView: React.FC<BulletViewProps> = React.memo(({ bullet, size }) => {
  const isDownshot = bullet.dy > 0;
  return (
    <BulletWrapper
      $x={bullet.x}
      $y={bullet.y}
      $size={size}
      $color={isDownshot ? '#9932CC' : bullet.pierce ? '#0F0' : '#facc15'}
      $pierce={bullet.pierce}
      $downshot={isDownshot}
    />
  );
});
BulletView.displayName = 'BulletView';
