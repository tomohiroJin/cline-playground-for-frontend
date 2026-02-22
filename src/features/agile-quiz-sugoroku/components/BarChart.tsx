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
        const color = getColorByThreshold(s.correctRate, 70, 50);
        return (
          <BarChartItem key={i}>
            <BarChartLabel>SP{s.sprintNumber}</BarChartLabel>
            <BarChartTrack>
              <BarChartBar $height={s.correctRate} $color={color} />
            </BarChartTrack>
            <BarChartValue $color={color}>{s.correctRate}%</BarChartValue>
            <BarChartSub>
              {s.averageSpeed.toFixed(1)}s{s.hadEmergency ? ' 🚨' : ''}
            </BarChartSub>
          </BarChartItem>
        );
      })}
    </BarChartContainer>
  );
};
