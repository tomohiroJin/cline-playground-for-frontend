import React from 'react';
import { render } from '@testing-library/react';
import { PlayerShip } from '../../components/PlayerShip';

describe('PlayerShip', () => {
  test('SVGを含むコンポーネントが描画されること', () => {
    const { container } = render(
      <PlayerShip x={5} y={16} size={30} />
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  test('ポリゴンが描画されること', () => {
    const { container } = render(
      <PlayerShip x={5} y={16} size={30} />
    );
    const polygon = container.querySelector('polygon');
    expect(polygon).toBeInTheDocument();
    expect(polygon?.getAttribute('fill')).toBe('#0FF');
  });

  test('異なる座標で描画されること', () => {
    const { container: c1 } = render(<PlayerShip x={0} y={0} size={30} />);
    const { container: c2 } = render(<PlayerShip x={11} y={17} size={30} />);
    expect(c1.firstChild).toBeInTheDocument();
    expect(c2.firstChild).toBeInTheDocument();
  });
});
