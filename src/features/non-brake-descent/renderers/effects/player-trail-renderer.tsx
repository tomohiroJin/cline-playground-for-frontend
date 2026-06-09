/**
 * プレイヤー残像トレイルレンダラー
 * 各サンプルをシアン系の半透明サークルで描画する。
 * effects/index.tsx は編集しないため独立ファイルとして配置。
 */

import React from 'react';
import type { TrailSample } from '../../domain/services/trail-service';

/** 残像サークルの半径 */
const TRAIL_RADIUS = 10;
/** 残像の色（シアン系） */
const TRAIL_COLOR = '#44eeff';

type Props = {
  trail: readonly TrailSample[];
};

/**
 * プレイヤー残像トレイルの SVG 描画コンポーネント。
 * index が小さいほど新しいサンプルで opacity が高い。
 */
export const PlayerTrailRenderer: React.FC<Props> = React.memo(({ trail }) => (
  <>
    {trail.map((sample, index) => (
      <circle
        // index が一意な識別子として機能する（サンプルは位置がほぼ連続して重なるためインデックスで十分）
        key={index}
        cx={sample.x}
        cy={sample.y}
        r={TRAIL_RADIUS}
        fill={TRAIL_COLOR}
        opacity={sample.opacity}
      />
    ))}
  </>
)) as React.FC<Props>;
PlayerTrailRenderer.displayName = 'PlayerTrailRenderer';
