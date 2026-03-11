// FloatingScore コンポーネントのテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { FloatingScore } from '../../components/FloatingScore';

describe('FloatingScore', () => {
  it('スコアアイテムがない場合は何も表示しない', () => {
    const { container } = render(<FloatingScore items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('スコアアイテムを表示する', () => {
    const items = [
      { id: '1', x: 100, y: 50, score: 10, multiplier: 1.0 },
    ];
    render(<FloatingScore items={items} />);
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('コンボ倍率適用時のスコアを表示する', () => {
    const items = [
      { id: '2', x: 100, y: 50, score: 10, multiplier: 2.0 },
    ];
    render(<FloatingScore items={items} />);
    expect(screen.getByText('+20')).toBeInTheDocument();
  });

  it('複数のスコアアイテムを同時に表示する', () => {
    const items = [
      { id: '1', x: 50, y: 50, score: 10, multiplier: 1.0 },
      { id: '2', x: 150, y: 80, score: 10, multiplier: 3.0 },
    ];
    render(<FloatingScore items={items} />);
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getByText('+30')).toBeInTheDocument();
  });
});
