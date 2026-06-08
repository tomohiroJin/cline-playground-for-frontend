// CrtOverlay のテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { CrtOverlay } from './CrtOverlay';

describe('CrtOverlay', () => {
  it('enabled=true で表示', () => {
    render(<CrtOverlay enabled={true} />);
    expect(screen.getByTestId('crt-overlay')).toBeInTheDocument();
  });

  it('enabled=false で非表示', () => {
    render(<CrtOverlay enabled={false} />);
    expect(screen.queryByTestId('crt-overlay')).toBeNull();
  });
});
