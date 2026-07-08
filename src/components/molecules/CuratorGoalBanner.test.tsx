import React from 'react';
import { render, screen } from '@testing-library/react';
import CuratorGoalBanner from './CuratorGoalBanner';
import { CuratorGoal } from '../../domain/collection/types';

describe('CuratorGoalBanner', () => {
  it('収蔵コンプと★★★コンプの2段進捗を表示する', () => {
    const goal: CuratorGoal = { collected: 12, appraised3star: 4, total: 15, isHonorary: false };
    render(<CuratorGoalBanner goal={goal} />);
    expect(screen.getByText('12 / 15')).toBeInTheDocument();
    expect(screen.getByText('4 / 15')).toBeInTheDocument();
    expect(screen.queryByText(/名誉学芸員に認定/)).not.toBeInTheDocument();
  });

  it('名誉学芸員達成時は称号を表示する', () => {
    const goal: CuratorGoal = { collected: 15, appraised3star: 15, total: 15, isHonorary: true };
    render(<CuratorGoalBanner goal={goal} />);
    expect(screen.getByText(/名誉学芸員に認定/)).toBeInTheDocument();
  });
});
