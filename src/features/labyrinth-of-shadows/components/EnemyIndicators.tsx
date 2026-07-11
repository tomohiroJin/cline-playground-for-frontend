import React from 'react';
import { clamp } from '../utils';

/** 索敵マーカー。angle はプレイヤー正面を0とした相対角（ラジアン、右が正） */
export interface AlertMarker {
  readonly id: number;
  readonly kind: 'spotted' | 'searching';
  readonly angle: number;
}

interface EnemyIndicatorsProps {
  markers: readonly AlertMarker[];
}

/** 敵の状態変化（発見=!/捜索=?）を画面端に方向付きで表示するオーバーレイ */
export const EnemyIndicators: React.FC<EnemyIndicatorsProps> = ({ markers }) => (
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
    {markers.map(m => {
      // 相対角 -π..π を画面の水平位置 6%..94% に写像（正面=中央、真横=端）
      const ratio = clamp(m.angle / Math.PI, -1, 1);
      const isSpotted = m.kind === 'spotted';
      return (
        <span
          key={m.id}
          style={{
            position: 'absolute',
            top: '12%',
            left: `${50 + ratio * 44}%`,
            transform: 'translateX(-50%)',
            fontSize: '3rem',
            fontWeight: 'bold',
            color: isSpotted ? '#ef4444' : '#facc15',
            textShadow: '0 0 8px rgba(0,0,0,0.9), 0 0 16px currentColor',
          }}
          aria-label={isSpotted ? '敵に発見された' : '敵が捜索中'}
        >
          {isSpotted ? '!' : '?'}
        </span>
      );
    })}
  </div>
);
