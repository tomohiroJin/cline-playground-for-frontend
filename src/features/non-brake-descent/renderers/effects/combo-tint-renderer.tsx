import React from 'react';

// intensity が小さいとき（レンダリングコスト節約の閾値）
const VISIBLE_THRESHOLD = 0.05;

// 金色系オーバーレイの RGB 値
const TINT_R = 255;
const TINT_G = 200;
const TINT_B = 40;

// DangerVignette(20) より小さめの z-index で背面に配置
const Z_INDEX = 15;

/**
 * コンボ時の画面ティントオーバーレイコンポーネント。
 * DangerVignette と同様の DOM 全面オーバーレイ方式で実装。
 *
 * - intensity < VISIBLE_THRESHOLD のときは非表示（<></>）。
 * - それ以外は金色系(rgba(255,200,40,...))の淡い radial-gradient 縁取りオーバーレイ。
 * - position:absolute, inset:0, pointerEvents:'none' で操作の邪魔をしない。
 */
export const ComboTintRenderer: React.FC<{ intensity: number }> = React.memo(({ intensity }) =>
  intensity < VISIBLE_THRESHOLD ? (
    <></>
  ) : (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        // 中央から外縁に向かって金色系グローを広げる
        background: `radial-gradient(ellipse at center, transparent 40%, rgba(${TINT_R},${TINT_G},${TINT_B},${intensity * 0.35}) 100%)`,
        pointerEvents: 'none',
        zIndex: Z_INDEX,
      }}
    />
  )
) as React.FC<{ intensity: number }>;
ComboTintRenderer.displayName = 'ComboTintRenderer';
