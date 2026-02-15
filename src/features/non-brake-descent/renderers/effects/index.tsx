import React from 'react';
import { Config } from '../../config';
import { NearMissEffect, Particle, ScorePopup } from '../../types';

// パーティクルの描画コンポーネント
export const ParticlesRenderer: React.FC<{ particles: Particle[] }> = React.memo(({ particles }) => (
  <>
    {particles.map((particle, index) => (
      <circle
        key={index}
        cx={particle.x}
        cy={particle.y}
        r={2.5}
        fill={particle.color}
        opacity={particle.life / Config.particle.lifetime}
      />
    ))}
  </>
)) as React.FC<{ particles: Particle[] }>;

// スコアポップアップの描画コンポーネント
export const ScorePopupsRenderer: React.FC<{ popups: ScorePopup[] }> = React.memo(({ popups }) => (
  <>
    {popups.map((popup, index) => (
      <text
        key={index}
        x={popup.x}
        y={popup.y}
        textAnchor="middle"
        fill={popup.color}
        fontSize="14"
        fontWeight="bold"
        opacity={popup.life / 60}
      >
        {popup.text}
      </text>
    ))}
  </>
)) as React.FC<{ popups: ScorePopup[] }>;

// ニアミスエフェクトの描画コンポーネント
export const NearMissRenderer: React.FC<{ effects: NearMissEffect[] }> = React.memo(({ effects }) => (
  <>
    {effects.map((effect, index) => (
      <g key={index} opacity={effect.life / 30}>
        <circle cx={effect.x} cy={effect.y} r={20 * effect.scale} fill="none" stroke="#44ffaa" strokeWidth="3" />
        <text x={effect.x} y={effect.y - 30} textAnchor="middle" fill="#44ffaa" fontSize="12" fontWeight="bold">
          NEAR MISS!
        </text>
      </g>
    ))}
  </>
)) as React.FC<{ effects: NearMissEffect[] }>;

// 危険度ビネットエフェクトの描画コンポーネント
export const DangerVignette: React.FC<{ level: number }> = React.memo(({ level }) =>
  level < 0.3 ? (
    <></>
  ) : (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at center, transparent 50%, rgba(255,0,0,${
          (level - 0.3) * 0.5
        }) 100%)`,
        pointerEvents: 'none',
        zIndex: 20,
      }}
    />
  )
) as React.FC<{ level: number }>;
