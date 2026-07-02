import React from 'react';
import { render } from '@testing-library/react';
import ShockwaveRing from '../ShockwaveRing';

describe('ShockwaveRing', () => {
  test('指定座標を中心にリングを描画する', () => {
    const { getByTestId } = render(<ShockwaveRing x={400} y={180} />);
    const ring = getByTestId('shockwave-ring');
    expect(ring).toBeInTheDocument();
  });

  test('色を指定できる', () => {
    const { getByTestId } = render(<ShockwaveRing x={400} y={180} color="#ff8" />);
    expect(getByTestId('shockwave-ring').style.borderColor).toBeTruthy();
  });
});
