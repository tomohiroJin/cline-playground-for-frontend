/**
 * バーチャートコンポーネント
 */
import React from 'react';
import { SprintSummary } from '../types';
import { getColorByThreshold } from '../constants';
import {
  BarChartContainer,
  BarChartItem,
  BarChartLabel,
  BarChartTrack,
  BarChartBar,
  BarChartValue,
  BarChartSub,
} from './styles';

interface BarChartProps {
  /** スプリントログ */
  logs: SprintSummary[];
}

/**
 * スプリント履歴バーチャート
 */
export const BarChart: React.FC<BarChartProps> = ({ logs }) => {
  return (
    <BarChartContainer>
      {logs.map((s, i) => {
        const color = getColorByThreshold(s.pct, 70, 50);
        return (
          <BarChartItem key={i}>
            <BarChartLabel>SP{s.sp}</BarChartLabel>
            <BarChartTrack>
              <BarChartBar $height={s.pct} $color={color} />
            </BarChartTrack>
            <BarChartValue $color={color}>{s.pct}%</BarChartValue>
            <BarChartSub>
              {s.spd.toFixed(1)}s{s.em ? ' 🚨' : ''}
            </BarChartSub>
          </BarChartItem>
        );
      })}
    </BarChartContainer>
  );
};
