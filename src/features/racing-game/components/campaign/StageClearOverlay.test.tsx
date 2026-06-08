// StageClearOverlay のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageClearOverlay } from './StageClearOverlay';

describe('StageClearOverlay', () => {
  it('GOLD ランクで全要素が表示される', () => {
    const onContinue = jest.fn();
    render(<StageClearOverlay goalTimeSec={50} rank="GOLD" onContinue={onContinue} />);
    expect(screen.getByText('STAGE CLEAR!')).toBeTruthy();
    expect(screen.getByText('0:50:00')).toBeTruthy();
    expect(screen.getByText(/GOLD/)).toBeTruthy();
  });

  it('SILVER ランク表示', () => {
    render(<StageClearOverlay goalTimeSec={60} rank="SILVER" onContinue={() => {}} />);
    expect(screen.getByText(/SILVER/)).toBeTruthy();
  });

  it('BRONZE ランク表示', () => {
    render(<StageClearOverlay goalTimeSec={75} rank="BRONZE" onContinue={() => {}} />);
    expect(screen.getByText(/BRONZE/)).toBeTruthy();
  });

  it('CONTINUE クリックで onContinue が呼ばれる', () => {
    const onContinue = jest.fn();
    render(<StageClearOverlay goalTimeSec={50} rank="GOLD" onContinue={onContinue} />);
    fireEvent.click(screen.getByText('CONTINUE'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('タイム表示は M:SS:cc 形式', () => {
    render(<StageClearOverlay goalTimeSec={83.45} rank="SILVER" onContinue={() => {}} />);
    expect(screen.getByText('1:23:45')).toBeTruthy();
  });
});
