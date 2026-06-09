/**
 * スピードラインの SVG 描画コンポーネント
 * HIGH ランク時に画面端から中央へ流れる速度線を描画する
 */

import React from 'react';
import type { SpeedLine } from '../../domain/services/speed-line-service';

/** スピードラインの色（白〜シアン系） */
const LINE_COLOR = '#aaeeff';

/** ラインの線幅 */
const LINE_STROKE_WIDTH = 2;

type Props = {
  lines: readonly SpeedLine[];
};

/**
 * スピードラインを SVG の <line> 要素で描画するコンポーネント
 * left ラインは左端から右方向、right ラインは右端から左方向に向かって描画する
 */
export const SpeedLinesRenderer: React.FC<Props> = React.memo(({ lines }) => (
  <>
    {lines.map((line, index) => {
      // left は右方向（x → x+len）、right は左方向（x → x-len）
      const x2 = line.side === 'left' ? line.x + line.len : line.x - line.len;
      return (
        <line
          key={index}
          x1={line.x}
          y1={line.y}
          x2={x2}
          y2={line.y}
          stroke={LINE_COLOR}
          strokeWidth={LINE_STROKE_WIDTH}
          opacity={line.opacity}
        />
      );
    })}
  </>
)) as React.FC<Props>;
SpeedLinesRenderer.displayName = 'SpeedLinesRenderer';
