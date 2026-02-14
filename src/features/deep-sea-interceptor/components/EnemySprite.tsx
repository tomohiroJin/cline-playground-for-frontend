// ============================================================================
// Deep Sea Interceptor - 敵描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
import { ColorPalette } from '../constants';
import type { Enemy } from '../types';

/** 敵キャラクターのスプライト */
const EnemySprite = memo(function EnemySprite({ enemy }: { enemy: Enemy }) {
  const color = ColorPalette.enemy[enemy.enemyType];
  const isBoss = enemy.enemyType === 'boss';
  return (
    <div
      style={{
        position: 'absolute',
        left: enemy.x - enemy.size / 2,
        top: enemy.y - enemy.size / 2,
      }}
    >
      <svg width={enemy.size} height={enemy.size} viewBox="0 0 40 40">
        <ellipse
          cx="20"
          cy="20"
          rx={isBoss ? 18 : 16}
          ry={isBoss ? 16 : 14}
          fill={color}
          opacity="0.9"
        />
        {isBoss && <ellipse cx="20" cy="20" rx="12" ry="10" fill="rgba(0,0,0,0.4)" />}
        <circle cx="13" cy="15" r={isBoss ? 4 : 3} fill="#f66" opacity="0.8" />
        <circle cx="27" cy="15" r={isBoss ? 4 : 3} fill="#f66" opacity="0.8" />
        {isBoss &&
          [0, 1, 2, 3].map(i => (
            <path
              key={i}
              d={`M${8 + i * 8} 34 Q${10 + i * 8} 42 ${6 + i * 9} 48`}
              stroke={color}
              strokeWidth="2.5"
              fill="none"
              opacity="0.6"
            />
          ))}
      </svg>
    </div>
  );
});

export default EnemySprite;
