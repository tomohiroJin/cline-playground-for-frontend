// ============================================================================
// Deep Sea Interceptor - プレイヤー描画コンポーネント
// ============================================================================

import React, { memo } from 'react';
import { playerHitboxRadius, neonGlow } from '../visuals';

interface PlayerSpriteProps {
  x: number;
  y: number;
  opacity: number;
  shield: boolean;
}

/** 当たり判定コア（中心の高輝度点）の直径（px） */
const HITBOX_CORE_SIZE = 6;
/** 当たり判定コアの半径（配置座標のオフセット計算に使用） */
const HITBOX_CORE_RADIUS = HITBOX_CORE_SIZE / 2;

/** プレイヤー潜水艦のスプライト */
const PlayerSprite = memo(function PlayerSprite({ x, y, opacity, shield }: PlayerSpriteProps) {
  return (
    <>
      {shield && (
        <div
          style={{
            position: 'absolute',
            left: x - 40,
            top: y - 40,
            width: 80,
            height: 80,
            borderRadius: '50%',
            border: '3px solid #4af',
            opacity: 0.5,
            animation: 'pulse 0.5s infinite',
          }}
        />
      )}
      <svg
        style={{ position: 'absolute', left: x - 20, top: y - 20, opacity }}
        width={40}
        height={52}
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
      {/* 実当たり判定の可視化: 薄いリング（真の判定範囲）＋ 中心の高輝度コア */}
      <div
        data-testid="hitbox-ring"
        style={{
          position: 'absolute',
          left: x - playerHitboxRadius(),
          top: y - playerHitboxRadius(),
          width: playerHitboxRadius() * 2,
          height: playerHitboxRadius() * 2,
          borderRadius: '50%',
          border: '1px solid rgba(120,220,255,0.35)',
          pointerEvents: 'none',
          opacity,
        }}
      />
      <div
        data-testid="hitbox-core"
        style={{
          position: 'absolute',
          left: x - HITBOX_CORE_RADIUS,
          top: y - HITBOX_CORE_RADIUS,
          width: HITBOX_CORE_SIZE,
          height: HITBOX_CORE_SIZE,
          borderRadius: '50%',
          background: '#eaffff',
          filter: neonGlow('#6cf', 'soft'),
          pointerEvents: 'none',
          opacity,
        }}
      />
    </>
  );
});

export default PlayerSprite;
