// StageIntroOverlay のテスト

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { StageIntroOverlay } from './StageIntroOverlay';

const baseProps = {
  numberLabel: 'STAGE 1',
  title: 'FOREST CALLING',
  intro: '霧の向こうで、東の空がうっすらと白んでいる。',
  isReplay: false,
  onComplete: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('StageIntroOverlay', () => {
  it('番号 / タイトル / intro が表示される', () => {
    render(<StageIntroOverlay {...baseProps} />);
    expect(screen.getByText('STAGE 1')).toBeInTheDocument();
    expect(screen.getByText('FOREST CALLING')).toBeInTheDocument();
    expect(screen.getByText(/霧の向こうで/)).toBeInTheDocument();
  });

  it('未クリアは 4 秒後に onComplete', () => {
    const onComplete = jest.fn();
    render(<StageIntroOverlay {...baseProps} onComplete={onComplete} isReplay={false} />);
    act(() => { jest.advanceTimersByTime(3999); });
    expect(onComplete).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(2); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('既クリア（リプレイ）は 1.5 秒で onComplete', () => {
    const onComplete = jest.fn();
    render(<StageIntroOverlay {...baseProps} onComplete={onComplete} isReplay={true} />);
    act(() => { jest.advanceTimersByTime(1500); });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('スキップヒントは 0.5 秒後に表示', () => {
    render(<StageIntroOverlay {...baseProps} />);
    expect(screen.queryByText(/PRESS ANY KEY TO SKIP/)).toBeNull();
    act(() => { jest.advanceTimersByTime(500); });
    expect(screen.getByText(/PRESS ANY KEY TO SKIP/)).toBeInTheDocument();
  });

  it('任意キーで即 onComplete', () => {
    const onComplete = jest.fn();
    render(<StageIntroOverlay {...baseProps} onComplete={onComplete} />);
    fireEvent.keyDown(window, { key: 'x' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('タップでも即 onComplete', () => {
    const onComplete = jest.fn();
    render(<StageIntroOverlay {...baseProps} onComplete={onComplete} />);
    fireEvent.pointerDown(window);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
