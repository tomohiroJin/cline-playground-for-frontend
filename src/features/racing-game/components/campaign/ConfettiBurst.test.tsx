// ConfettiBurst のテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { ConfettiBurst } from './ConfettiBurst';

describe('ConfettiBurst', () => {
  it('紙吹雪コンテナがレンダリングされる', () => {
    render(<ConfettiBurst burstKey={1} />);
    expect(screen.getByTestId('confetti-burst')).toBeInTheDocument();
  });

  it('aria-hidden で支援技術から隠す', () => {
    render(<ConfettiBurst burstKey={1} />);
    expect(screen.getByTestId('confetti-burst')).toHaveAttribute('aria-hidden', 'true');
  });
});
