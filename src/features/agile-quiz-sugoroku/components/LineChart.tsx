/**
 * SVGベースの折れ線グラフコンポーネント
 */
import React from 'react';
import { COLORS, FONTS } from '../constants';

interface LineChartProps {
  /** データポイント（0〜100の数値配列） */
  data: number[];
  /** ラベル（各データポイントに対応） */
  labels?: string[];
  /** グラフの幅 */
  width?: number;
  /** グラフの高さ */
  height?: number;
  /** 線の色 */
  color?: string;
  /** Y軸の最大値 */
  maxValue?: number;
  /** Y軸のラベル */
  yLabel?: string;
}

/** パディング */
const PADDING = { top: 20, right: 20, bottom: 30, left: 40 };

export const LineChart: React.FC<LineChartProps> = ({
  data,
  labels,
  width = 400,
  height = 200,
  color = COLORS.accent,
  maxValue = 100,
  yLabel,
}) => {
  if (data.length === 0) {
    return (
      <div style={{ color: COLORS.muted, fontSize: 12, textAlign: 'center', padding: 20 }}>
        データがありません
      </div>
    );
  }

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;

  /** データポイントのX座標 */
  const getX = (index: number): number => {
    if (data.length === 1) return PADDING.left + chartWidth / 2;
    return PADDING.left + (index / (data.length - 1)) * chartWidth;
  };

  /** データポイントのY座標 */
  const getY = (value: number): number => {
    const clamped = Math.max(0, Math.min(maxValue, value));
    return PADDING.top + chartHeight - (clamped / maxValue) * chartHeight;
  };

  /** 折れ線パスを生成 */
  const linePath = data
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(v)}`)
    .join(' ');

  /** グラデーション領域パス */
  const areaPath = `${linePath} L ${getX(data.length - 1)} ${PADDING.top + chartHeight} L ${getX(0)} ${PADDING.top + chartHeight} Z`;

  /** Y軸の目盛り */
  const yTicks = [0, 25, 50, 75, 100].filter(v => v <= maxValue);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', maxWidth: '100%' }}
      role="img"
      aria-label={yLabel ? `${yLabel}のグラフ` : '折れ線グラフ'}
    >
      {/* グラデーション定義 */}
      <defs>
        <linearGradient id={`lineGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Y軸グリッドライン */}
      {yTicks.map(tick => (
        <g key={tick}>
          <line
            x1={PADDING.left}
            y1={getY(tick)}
            x2={width - PADDING.right}
            y2={getY(tick)}
            stroke={COLORS.border}
            strokeDasharray="3,3"
          />
          <text
            x={PADDING.left - 8}
            y={getY(tick) + 4}
            textAnchor="end"
            fill={COLORS.muted}
            fontSize={10}
            fontFamily={FONTS.mono}
          >
            {tick}
          </text>
        </g>
      ))}

      {/* グラデーション領域 */}
      {data.length > 1 && (
        <path
          d={areaPath}
          fill={`url(#lineGradient-${color.replace('#', '')})`}
        />
      )}

      {/* 折れ線 */}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* データポイント */}
      {data.map((v, i) => (
        <g key={i}>
          <circle
            cx={getX(i)}
            cy={getY(v)}
            r={4}
            fill={COLORS.bg}
            stroke={color}
            strokeWidth={2}
          />
          {/* 値ラベル */}
          <text
            x={getX(i)}
            y={getY(v) - 10}
            textAnchor="middle"
            fill={COLORS.text}
            fontSize={10}
            fontFamily={FONTS.mono}
            fontWeight={700}
          >
            {Math.round(v)}
          </text>
        </g>
      ))}

      {/* X軸ラベル */}
      {labels && labels.map((label, i) => (
        <text
          key={i}
          x={getX(i)}
          y={height - 6}
          textAnchor="middle"
          fill={COLORS.muted}
          fontSize={9}
          fontFamily={FONTS.mono}
        >
          {label}
        </text>
      ))}

      {/* Y軸ラベル */}
      {yLabel && (
        <text
          x={8}
          y={PADDING.top - 6}
          fill={COLORS.muted}
          fontSize={9}
          fontFamily={FONTS.mono}
        >
          {yLabel}
        </text>
      )}
    </svg>
  );
};
