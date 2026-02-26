import React from 'react';
import { render, screen } from '@testing-library/react';
import { PowerUpIndicator } from '../../components/PowerUpIndicator';
import { POWER_TYPES } from '../../constants';
import type { Powers } from '../../types';

const defaultPowers: Powers = {
  triple: false,
  pierce: false,
  slow: false,
  downshot: false,
};

describe('PowerUpIndicator', () => {
  test('全パワーが無効の場合何も表示しないこと', () => {
    const { container } = render(<PowerUpIndicator powers={defaultPowers} />);
    expect(container.firstChild).toBeNull();
  });

  test('tripleが有効の場合バッジを表示すること', () => {
    const powers: Powers = { ...defaultPowers, triple: true };
    render(<PowerUpIndicator powers={powers} />);
    expect(screen.getByText(POWER_TYPES.triple.icon)).toBeInTheDocument();
  });

  test('pierceが有効の場合バッジを表示すること', () => {
    const powers: Powers = { ...defaultPowers, pierce: true };
    render(<PowerUpIndicator powers={powers} />);
    expect(screen.getByText(POWER_TYPES.pierce.icon)).toBeInTheDocument();
  });

  test('slowが有効の場合バッジを表示すること', () => {
    const powers: Powers = { ...defaultPowers, slow: true };
    render(<PowerUpIndicator powers={powers} />);
    expect(screen.getByText(POWER_TYPES.slow.icon)).toBeInTheDocument();
  });

  test('downshotが有効の場合バッジを表示すること', () => {
    const powers: Powers = { ...defaultPowers, downshot: true };
    render(<PowerUpIndicator powers={powers} />);
    expect(screen.getByText(POWER_TYPES.downshot.icon)).toBeInTheDocument();
  });

  test('複数のパワーが有効の場合すべてのバッジを表示すること', () => {
    const powers: Powers = { triple: true, pierce: true, slow: false, downshot: true };
    render(<PowerUpIndicator powers={powers} />);
    expect(screen.getByText(POWER_TYPES.triple.icon)).toBeInTheDocument();
    expect(screen.getByText(POWER_TYPES.pierce.icon)).toBeInTheDocument();
    expect(screen.getByText(POWER_TYPES.downshot.icon)).toBeInTheDocument();
  });
});
