import React from 'react';
import { render, screen } from '@testing-library/react';
import { HUD } from '../HUD';
import type { HUDData } from '../../types';

const baseHud: HUDData = {
  keys: 0, req: 2, maxL: 5, lives: 5, stamina: 100, time: 200, score: 0,
  eNear: 0, hide: false, energy: 100, highScore: 0, stones: 3, sprinting: false,
  speedCharges: 2, boostActive: false,
};

describe('HUD 加速チャージ表示', () => {
  test('⚡ とストック数が表示される', () => {
    render(<HUD h={baseHud} />);
    expect(screen.getByText('⚡')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
