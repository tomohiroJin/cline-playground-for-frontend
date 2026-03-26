/**
 * TeamSetupScreen のテスト
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TeamSetupScreen } from './TeamSetupScreen';

describe('TeamSetupScreen', () => {
  const defaultProps = {
    onStart: jest.fn(),
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('チーム構成が表示される', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    expect(screen.getByText('P1: あなた')).toBeDefined();
    expect(screen.getByText('P2: CPU（味方）')).toBeDefined();
    expect(screen.getByText('P3: CPU（敵1）')).toBeDefined();
    expect(screen.getByText('P4: CPU（敵2）')).toBeDefined();
  });

  it('「対戦開始！」ボタンで onStart が呼ばれる', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('対戦開始！'));
    expect(defaultProps.onStart).toHaveBeenCalledTimes(1);
  });

  it('「戻る」ボタンで onBack が呼ばれる', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    fireEvent.click(screen.getByText('← 戻る'));
    expect(defaultProps.onBack).toHaveBeenCalledTimes(1);
  });

  it('Field / Win Score の選択 UI が存在しない', () => {
    render(<TeamSetupScreen {...defaultProps} />);
    expect(screen.queryByText('Field')).toBeNull();
    expect(screen.queryByText('Win Score')).toBeNull();
  });
});
