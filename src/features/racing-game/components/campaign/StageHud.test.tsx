// StageHud のテスト

import React from 'react';
import { render, screen } from '@testing-library/react';
import { StageHud } from './StageHud';

const baseProps = {
  timeRemainingSec: 60,
  stageNumber: 3,
  totalStages: 8,
  speed: 180,
  livesRemaining: 3,
  maxLives: 3,
};

describe('StageHud', () => {
  it('TIME / SPEED / STAGE を表示する', () => {
    render(<StageHud {...baseProps} />);
    expect(screen.getByLabelText('残り時間').textContent).toBe('TIME 1:00');
    expect(screen.getByText(/SPEED 180/)).toBeTruthy();
    expect(screen.getByText(/STAGE 3\/8/)).toBeTruthy();
  });

  it('残機を ● と · で表示する（残機 3）', () => {
    render(<StageHud {...baseProps} livesRemaining={3} maxLives={3} />);
    expect(screen.getByLabelText('残機').textContent).toBe('LIVES ●●●');
  });

  it('残機 1 で warning スタイル（テキストのみで確認）', () => {
    render(<StageHud {...baseProps} livesRemaining={1} maxLives={3} />);
    expect(screen.getByLabelText('残機').textContent).toBe('LIVES ●··');
  });

  it('残機 2 のとき ●●·', () => {
    render(<StageHud {...baseProps} livesRemaining={2} maxLives={3} />);
    expect(screen.getByLabelText('残機').textContent).toBe('LIVES ●●·');
  });

  it('1 ラップ stage では LAP を表示しない', () => {
    render(<StageHud {...baseProps} currentLap={1} maxLaps={1} />);
    expect(screen.queryByText(/LAP/)).toBeNull();
  });

  it('複数ラップ stage では LAP を表示する', () => {
    render(<StageHud {...baseProps} currentLap={2} maxLaps={3} />);
    expect(screen.getByText(/LAP 2\/3/)).toBeTruthy();
  });

  it('残時間 0 でも 0:00 を表示する', () => {
    render(<StageHud {...baseProps} timeRemainingSec={0} />);
    expect(screen.getByLabelText('残り時間').textContent).toBe('TIME 0:00');
  });

  it('小数秒も切り捨てて整数表示', () => {
    render(<StageHud {...baseProps} timeRemainingSec={42.7} />);
    expect(screen.getByLabelText('残り時間').textContent).toBe('TIME 0:42');
  });
});
