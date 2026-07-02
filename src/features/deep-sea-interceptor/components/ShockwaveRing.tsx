// ============================================================================
// Deep Sea Interceptor - 衝撃波リング（ボス撃破演出）
// ============================================================================

import React, { memo } from 'react';
import { neonGlow } from '../visuals';

/** 衝撃波リングの初期直径（px） */
const RING_START_SIZE = 40;

/** 衝撃波アニメーションの持続時間 */
const RING_ANIMATION_DURATION = '0.6s';

interface ShockwaveRingProps {
  x: number;
  y: number;
  color?: string;
}

/**
 * 撃破位置から拡大しながらフェードする衝撃波リング。
 * CSS keyframe `shockwave`（styles.ts）で拡大・減衰する。発光は他スプライトと
 * 同じ neonGlow ヘルパーで統一する。
 * prefers-reduced-motion 環境では既存のグローバルガードでアニメが抑制される。
 */
const ShockwaveRing = memo(function ShockwaveRing({ x, y, color = '#8ff' }: ShockwaveRingProps) {
  return (
    <div
      data-testid="shockwave-ring"
      style={{
        position: 'absolute',
        left: x - RING_START_SIZE / 2,
        top: y - RING_START_SIZE / 2,
        width: RING_START_SIZE,
        height: RING_START_SIZE,
        borderRadius: '50%',
        border: `3px solid ${color}`,
        filter: neonGlow(color, 'strong'),
        pointerEvents: 'none',
        animation: `shockwave ${RING_ANIMATION_DURATION} ease-out forwards`,
        zIndex: 40,
      }}
    />
  );
});

export default ShockwaveRing;
