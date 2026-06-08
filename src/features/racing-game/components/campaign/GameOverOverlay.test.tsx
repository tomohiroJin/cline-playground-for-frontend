// GameOverOverlay のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOverOverlay } from './GameOverOverlay';

describe('GameOverOverlay', () => {
  it('GAME OVER + STAGE 表示', () => {
    render(<GameOverOverlay stageNumber={5} totalStages={8} onBackToStageSelect={() => {}} />);
    expect(screen.getByText('GAME OVER')).toBeTruthy();
    expect(screen.getByText('STAGE 5 / 8')).toBeTruthy();
  });

  it('STAGE SELECT ボタンのみ。Retry は無い', () => {
    render(<GameOverOverlay stageNumber={1} totalStages={8} onBackToStageSelect={() => {}} />);
    expect(screen.getByText('STAGE SELECT')).toBeTruthy();
    expect(screen.queryByText(/RETRY/i)).toBeNull();
  });

  it('クリックで onBackToStageSelect が呼ばれる', () => {
    const onBack = jest.fn();
    render(<GameOverOverlay stageNumber={1} totalStages={8} onBackToStageSelect={onBack} />);
    fireEvent.click(screen.getByText('STAGE SELECT'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
