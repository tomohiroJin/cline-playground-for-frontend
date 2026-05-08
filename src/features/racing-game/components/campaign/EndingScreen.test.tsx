// EndingScreen のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EndingScreen } from './EndingScreen';

describe('EndingScreen (Phase 1 簡易版)', () => {
  it('CONGRATULATIONS とメッセージ表示', () => {
    render(<EndingScreen onBackToStageSelect={() => {}} />);
    expect(screen.getByText('CONGRATULATIONS!')).toBeTruthy();
    expect(screen.getByText(/CLEARED ALL 8 STAGES/)).toBeTruthy();
  });

  it('BACK TO STAGE SELECT クリックで onBackToStageSelect が呼ばれる', () => {
    const onBack = jest.fn();
    render(<EndingScreen onBackToStageSelect={onBack} />);
    fireEvent.click(screen.getByText('BACK TO STAGE SELECT'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
