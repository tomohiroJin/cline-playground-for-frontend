// RetryConfirmOverlay のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetryConfirmOverlay } from './RetryConfirmOverlay';

const defaultProps = {
  stageNumber: 3,
  totalStages: 8,
  livesRemaining: 2,
  onRetry: jest.fn(),
  onBackToStageSelect: jest.fn(),
};

describe('RetryConfirmOverlay', () => {
  it('TIME UP とステージ情報を表示', () => {
    render(<RetryConfirmOverlay {...defaultProps} />);
    expect(screen.getByText('TIME UP')).toBeTruthy();
    expect(screen.getByText('STAGE 3 / 8')).toBeTruthy();
  });

  it('残機を表示する', () => {
    render(<RetryConfirmOverlay {...defaultProps} livesRemaining={2} />);
    expect(screen.getByText(/LIVES.*2/)).toBeTruthy();
  });

  it('RETRY と STAGE SELECT のボタンがある', () => {
    render(<RetryConfirmOverlay {...defaultProps} />);
    expect(screen.getByRole('button', { name: /RETRY/ })).toBeTruthy();
    expect(screen.getByRole('button', { name: /STAGE SELECT/ })).toBeTruthy();
  });

  it('RETRY クリックで onRetry が呼ばれる', () => {
    const onRetry = jest.fn();
    render(<RetryConfirmOverlay {...defaultProps} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /RETRY/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('STAGE SELECT クリックで onBackToStageSelect が呼ばれる', () => {
    const onBack = jest.fn();
    render(<RetryConfirmOverlay {...defaultProps} onBackToStageSelect={onBack} />);
    fireEvent.click(screen.getByRole('button', { name: /STAGE SELECT/ }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
