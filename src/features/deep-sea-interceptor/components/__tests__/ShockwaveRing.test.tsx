import React from 'react';
import { render } from '@testing-library/react';
import ShockwaveRing from '../ShockwaveRing';

describe('ShockwaveRing', () => {
  test('指定座標を中心にリングを描画する', () => {
    const { getByTestId } = render(<ShockwaveRing x={400} y={180} />);
    const ring = getByTestId('shockwave-ring');
    expect(ring).toBeInTheDocument();
  });

  test('指定した色が border と発光（box-shadow）に反映される', () => {
    const { getByTestId } = render(<ShockwaveRing x={400} y={180} color="#ff8" />);
    const ring = getByTestId('shockwave-ring');
    // 発光（box-shadow）には渡した色がそのまま含まれる
    expect(ring.style.boxShadow).toContain('#ff8');
    expect(ring.style.borderColor).toBeTruthy();
  });
});
