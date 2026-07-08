import React from 'react';
import { CuratorGoal } from '../../domain/collection/types';
import {
  BannerContainer,
  BannerTitle,
  GoalRow,
  GoalLabel,
  Track,
  Fill,
  GoalCount,
  Honor,
} from './CuratorGoalBanner.styles';

export interface CuratorGoalBannerProps {
  readonly goal: CuratorGoal;
}

const toPercent = (value: number, total: number): number =>
  total > 0 ? (value / total) * 100 : 0;

/** 名誉学芸員への2段プログレス（収蔵コンプ／★★★コンプ）を表示する */
const CuratorGoalBanner: React.FC<CuratorGoalBannerProps> = ({ goal }) => (
  <BannerContainer>
    <BannerTitle>名誉学芸員への道</BannerTitle>
    <GoalRow>
      <GoalLabel>収蔵コンプ</GoalLabel>
      <Track>
        <Fill $percent={toPercent(goal.collected, goal.total)} />
      </Track>
      <GoalCount>{goal.collected} / {goal.total}</GoalCount>
    </GoalRow>
    <GoalRow>
      <GoalLabel>鑑定コンプ ★★★</GoalLabel>
      <Track>
        <Fill $percent={toPercent(goal.appraised3star, goal.total)} $gold />
      </Track>
      <GoalCount>{goal.appraised3star} / {goal.total}</GoalCount>
    </GoalRow>
    {goal.isHonorary && <Honor>あなたは名誉学芸員に認定されました</Honor>}
  </BannerContainer>
);

export default CuratorGoalBanner;
