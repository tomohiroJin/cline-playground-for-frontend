/**
 * 敵凡例のテスト
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyLegend } from './EnemyLegend';

describe('EnemyLegend', () => {
  it('敵5種すべてが名前付きで並ぶ', () => {
    render(<EnemyLegend />);
    ['雑兵', '俊足', '群れ', '重装'].forEach((name) => {
      expect(screen.getByText(name)).toBeInTheDocument();
    });
  });

  it('飛行する敵には対処法が添えられる', () => {
    render(<EnemyLegend />);
    expect(screen.getByText('鴉（飛行・弩砲のみ有効）')).toBeInTheDocument();
  });
});
