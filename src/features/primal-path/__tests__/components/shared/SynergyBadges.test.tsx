/**
 * SynergyBadges コンポーネントテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SynergyBadges } from '../../../components/shared/SynergyBadges';
import type { ActiveSynergy } from '../../../types';

describe('SynergyBadges', () => {
  it('シナジーがない場合は何も表示しない', () => {
    // Arrange & Act
    const { container } = render(<SynergyBadges synergies={[]} />);

    // Assert
    expect(container.innerHTML).toBe('');
  });

  it('シナジーのボーナス名が表示される', () => {
    // Arrange
    const synergies: ActiveSynergy[] = [
      { tag: 'fire', count: 3, tier: 1, bonusName: '炎の力' },
    ];

    // Act
    render(<SynergyBadges synergies={synergies} />);

    // Assert
    expect(screen.getByText(/炎の力/)).toBeInTheDocument();
  });

  it('showCountでカウントが表示される', () => {
    // Arrange
    const synergies: ActiveSynergy[] = [
      { tag: 'fire', count: 3, tier: 1, bonusName: '炎の力' },
    ];

    // Act
    render(<SynergyBadges synergies={synergies} showCount />);

    // Assert
    expect(screen.getByText(/×3/)).toBeInTheDocument();
  });
});
