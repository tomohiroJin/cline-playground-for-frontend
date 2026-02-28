import React from 'react';
import { LE_OVERLAY_IMAGES } from '../images';

export interface StatusOverlayProps {
  /** 現在のプレイヤーの状態異常リスト */
  statuses: string[];
}

const OPACITY_MAP: Record<string, number> = {
  injured: 0.3,
  confused: 0.25,
  bleeding: 0.35,
  fear: 0.3,
  curse: 0.2,
};

const ANIMATION_MAP: Record<string, string> = {
  injured: 'none',
  confused: 'confusionSpin 8s linear infinite',
  bleeding: 'bleedDrip 3s linear infinite alternate',
  fear: 'fearPulse 2s ease-in-out infinite',
  curse: 'curseFloat 6s ease-in-out infinite alternate',
};

export const StatusOverlay: React.FC<StatusOverlayProps> = ({ statuses }) => {
  const activeStatuses = statuses.filter(s => OPACITY_MAP[s] !== undefined);
  if (activeStatuses.length === 0) return null;

  const count = activeStatuses.length;
  const baseMultiplier = count === 1 ? 1 : count === 2 ? 0.8 : 0.6;

  // 複数状態異常時の opacity 合計が最大0.5を超えないよう調整
  const rawTotalOpacity = activeStatuses.reduce((acc, s) => acc + (OPACITY_MAP[s] * baseMultiplier), 0);
  const finalMultiplier = rawTotalOpacity > 0.5 ? (0.5 / rawTotalOpacity) * baseMultiplier : baseMultiplier;

  return (
    <>
      <style>{`
        @keyframes confusionSpin {
          from { transform: rotate(0deg) scale(1.2); }
          to { transform: rotate(360deg) scale(1.2); }
        }
        @keyframes bleedDrip {
          from { transform: translateY(-10%); }
          to { transform: translateY(10%); }
        }
        @keyframes fearPulse {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.4; }
        }
        @keyframes curseFloat {
          from { transform: rotate(-5deg) scale(0.95); }
          to { transform: rotate(5deg) scale(1.05); }
        }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>
        {activeStatuses.map(s => {
          const img = LE_OVERLAY_IMAGES[s] || '';
          if (!img) return null;

          const wrapperOpacity = OPACITY_MAP[s] * finalMultiplier;

          return (
            <div key={s} style={{ position: 'absolute', inset: -50, opacity: wrapperOpacity }}>
              <div style={{
                width: '100%', height: '100%',
                backgroundImage: `url(${img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                animation: ANIMATION_MAP[s],
              }} />
            </div>
          );
        })}
      </div>
    </>
  );
};
