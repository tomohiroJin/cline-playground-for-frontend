// ============================================================================
// Deep Sea Interceptor - タッチコントロール
// ============================================================================

import React, { memo } from 'react';

interface TouchControlsProps {
  onMove: (dx: number, dy: number) => void;
  onShoot: () => void;
  onCharge: (e: { type: string }) => void;
  charging: boolean;
}

/** モバイル用タッチコントロールUI */
const TouchControls = memo(function TouchControls({
  onMove,
  onShoot,
  onCharge,
  charging,
}: TouchControlsProps) {
  const btnStyle: React.CSSProperties = {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'rgba(100,150,200,0.5)',
    border: 'none',
    color: '#fff',
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  const actStyle = (c: boolean): React.CSSProperties => ({
    width: 110,
    height: 110,
    borderRadius: '50%',
    background: c ? 'rgba(255,200,100,0.8)' : 'rgba(100,200,255,0.6)',
    border: `3px solid ${c ? '#fa6' : '#6cf'}`,
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  });
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 240,
        display: 'flex',
        justifyContent: 'space-between',
        padding: 18,
        pointerEvents: 'none',
      }}
    >
      <div style={{ position: 'relative', width: 200, height: 200, pointerEvents: 'auto' }}>
        <div
          style={{
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(100,150,200,0.1)',
            border: '3px solid rgba(100,150,200,0.2)',
          }}
        />
        {[
          { l: '↑', t: 10, x: 72 },
          { l: '↓', t: 130, x: 72 },
          { l: '←', t: 70, x: 10 },
          { l: '→', t: 70, x: 134 },
        ].map((d, i) => (
          <button
            key={i}
            style={{ ...btnStyle, top: d.t, left: d.x }}
            onTouchStart={() =>
              onMove(d.l === '←' ? -1 : d.l === '→' ? 1 : 0, d.l === '↑' ? -1 : d.l === '↓' ? 1 : 0)
            }
            onTouchEnd={() => onMove(0, 0)}
            onMouseDown={() =>
              onMove(d.l === '←' ? -1 : d.l === '→' ? 1 : 0, d.l === '↑' ? -1 : d.l === '↓' ? 1 : 0)
            }
            onMouseUp={() => onMove(0, 0)}
          >
            {d.l}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', pointerEvents: 'auto' }}>
        <button style={actStyle(false)} onTouchStart={onShoot} onMouseDown={onShoot}>
          SHOT
        </button>
        <button
          style={actStyle(charging)}
          onTouchStart={onCharge}
          onTouchEnd={onCharge}
          onMouseDown={onCharge}
          onMouseUp={onCharge}
        >
          {charging ? 'CHARGE' : 'CHARGE'}
        </button>
      </div>
    </div>
  );
});

export default TouchControls;
