import React from 'react';
import { render, screen } from '@testing-library/react';
import { EnemyIndicators } from '../components/EnemyIndicators';

describe('EnemyIndicators', () => {
  it('spotted マーカーは "!" を赤系で表示する', () => {
    render(<EnemyIndicators markers={[{ id: 1, kind: 'spotted', angle: 0 }]} />);
    expect(screen.getByText('!')).toBeInTheDocument();
  });

  it('searching マーカーは "?" を表示する', () => {
    render(<EnemyIndicators markers={[{ id: 2, kind: 'searching', angle: 1 }]} />);
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('相対角度に応じて水平位置が変わる（右手方向は右側）', () => {
    render(
      <EnemyIndicators
        markers={[
          { id: 1, kind: 'spotted', angle: -Math.PI / 2 },
          { id: 2, kind: 'searching', angle: Math.PI / 2 },
        ]}
      />
    );
    const left = screen.getByText('!');
    const right = screen.getByText('?');
    expect(parseFloat(left.style.left)).toBeLessThan(parseFloat(right.style.left));
  });

  it('マーカーがなければ何も描画しない', () => {
    const { container } = render(<EnemyIndicators markers={[]} />);
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });
});
