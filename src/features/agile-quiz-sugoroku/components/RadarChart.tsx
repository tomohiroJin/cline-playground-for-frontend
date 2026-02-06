/**
 * レーダーチャートコンポーネント
 */
import React from 'react';
import { RadarDataPoint } from '../types';
import { COLORS, FONTS } from '../constants';
import { RadarPolygon } from './styles';

interface RadarChartProps {
  /** データポイント */
  data: RadarDataPoint[];
  /** サイズ（ピクセル） */
  size?: number;
}

/**
 * SVGレーダーチャート
 */
export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 200 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = data.length;

  // 値から座標を計算
  const getPoints = (values: number[]): [number, number][] => {
    return values.map((v, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      return [cx + r * v * Math.cos(angle), cy + r * v * Math.sin(angle)];
    });
  };

  // グリッドレベル
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // ラベル位置
  const labelPoints = data.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return {
      x: cx + (r + 24) * Math.cos(angle),
      y: cy + (r + 24) * Math.sin(angle),
      label: d.label,
    };
  });

  // データポイント
  const dataPoints = getPoints(data.map((d) => d.value));
  const polyStr = dataPoints.map((p) => p.join(',')).join(' ');

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', margin: '0 auto' }}
    >
      {/* グリッド */}
      {gridLevels.map((lv, li) => {
        const gp = getPoints(Array(n).fill(lv));
        return (
          <polygon
            key={li}
            points={gp.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke={COLORS.border}
            strokeWidth={0.8}
            opacity={0.5}
          />
        );
      })}

      {/* 軸線 */}
      {data.map((_, i) => {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke={COLORS.border}
            strokeWidth={0.5}
            opacity={0.4}
          />
        );
      })}

      {/* データ領域 */}
      <RadarPolygon
        points={polyStr}
        fill={`${COLORS.accent}22`}
        stroke={COLORS.accent}
        strokeWidth={1.5}
      />

      {/* データポイント */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill={COLORS.accent} />
      ))}

      {/* ラベル */}
      {labelPoints.map((lp, i) => (
        <text
          key={i}
          x={lp.x}
          y={lp.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={COLORS.muted}
          fontSize={9}
          fontFamily={FONTS.mono}
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
};
