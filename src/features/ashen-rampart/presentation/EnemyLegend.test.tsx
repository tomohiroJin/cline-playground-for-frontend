import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyLegend } from './EnemyLegend';

describe('EnemyLegend', () => {
  it('3種の敵の名前をすべて表示する', () => {
    render(<EnemyLegend />);

    expect(screen.getByText('雑兵')).toBeInTheDocument();
    expect(screen.getByText('俊足')).toBeInTheDocument();
    expect(screen.getByText('重装')).toBeInTheDocument();
  });

  it('敵ごとの最大HPを表示する（強さの差を数値で読めるようにする）', () => {
    render(<EnemyLegend />);

    expect(screen.getByText('HP20')).toBeInTheDocument();
    expect(screen.getByText('HP12')).toBeInTheDocument();
    expect(screen.getByText('HP60')).toBeInTheDocument();
  });

  it('凡例であることが支援技術から分かる', () => {
    render(<EnemyLegend />);

    expect(screen.getByLabelText('敵の凡例')).toBeInTheDocument();
  });
});
