import React from 'react';
import { render } from '@testing-library/react';
import PlayerSprite from '../PlayerSprite';
import { playerHitboxRadius } from '../../visuals';

describe('PlayerSprite', () => {
  test('当たり判定コア（data-testid=hitbox-core）を中心に描画する', () => {
    const { getByTestId } = render(
      <PlayerSprite x={200} y={300} opacity={1} shield={false} />
    );
    const core = getByTestId('hitbox-core');
    expect(core).toBeInTheDocument();
  });

  test('当たり判定リングの直径が実判定半径の2倍に一致する', () => {
    const { getByTestId } = render(
      <PlayerSprite x={200} y={300} opacity={1} shield={false} />
    );
    const ring = getByTestId('hitbox-ring');
    const expectedDiameter = playerHitboxRadius() * 2;
    expect(ring.style.width).toBe(`${expectedDiameter}px`);
    expect(ring.style.height).toBe(`${expectedDiameter}px`);
  });
});
