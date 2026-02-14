// ============================================================================
// Deep Sea Interceptor - プレイヤー描画コンポーネント
// ============================================================================

import React, { memo } from 'react';

interface PlayerSpriteProps {
  x: number;
  y: number;
  opacity: number;
  shield: boolean;
}

/** プレイヤー潜水艦のスプライト */
const PlayerSprite = memo(function PlayerSprite({ x, y, opacity, shield }: PlayerSpriteProps) {
  return (
    <>
      {shield && (
        <div
          style={{
            position: 'absolute',
            left: x - 20,
            top: y - 20,
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid #4af',
            opacity: 0.5,
            animation: 'pulse 0.5s infinite',
          }}
        />
      )}
      <svg
        style={{ position: 'absolute', left: x - 10, top: y - 10, opacity }}
        width={20}
        height={26}
        viewBox="0 0 24 32"
      >
        <defs>
          <linearGradient id="subGrad" x1="0%" y1="0%" x2="100%">
            <stop offset="0%" stopColor="#1a3a5c" />
            <stop offset="50%" stopColor="#2d5a87" />
            <stop offset="100%" stopColor="#1a3a5c" />
          </linearGradient>
        </defs>
        <ellipse
          cx="12"
          cy="17"
          rx="8"
          ry="11"
          fill="url(#subGrad)"
          stroke="#4a8ac7"
          strokeWidth="0.7"
        />
        <ellipse
          cx="12"
          cy="13"
          rx="4"
          ry="2.5"
          fill="#0a1520"
          stroke="#4a8ac7"
          strokeWidth="0.3"
        />
        <rect x="10" y="3" width="4" height="5" fill="#3a6a9c" />
        <rect x="9" y="1" width="6" height="2" fill="#4a8ac7" rx="0.5" />
        <path d="M4 18 L2 22 L7 20 Z" fill="#2d5a87" />
        <path d="M20 18 L22 22 L17 20 Z" fill="#2d5a87" />
        <ellipse cx="12" cy="29" rx="3" ry="1.5" fill="rgba(100,200,255,0.4)" />
      </svg>
    </>
  );
});

export default PlayerSprite;
