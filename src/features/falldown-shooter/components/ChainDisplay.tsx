// 連鎖数を大きくポップ表示するコンポーネント

import React from 'react';
import { CHAIN_EFFECT } from '../constants';

interface ChainDisplayProps {
  chain: number;
}

/** 2連鎖以上のとき「N CHAIN!」を段階色で表示する */
export const ChainDisplay: React.FC<ChainDisplayProps> = React.memo(({ chain }) => {
  if (chain < 2) return null;
  const colors = CHAIN_EFFECT.colorByChain;
  const color = colors[Math.min(chain - 2, colors.length - 1)];
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color,
        fontWeight: 'bold',
        fontSize: `${Math.min(2 + chain * 0.3, 4)}rem`,
        textShadow: '0 0 12px currentColor',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      {chain} CHAIN!
    </div>
  );
});

ChainDisplay.displayName = 'ChainDisplay';
