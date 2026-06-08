// EndingScreenFull のテスト

import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { getAllStages } from '../../domain/race/stage-catalog';
import { createInitialProgress, updateBestRecord, unlockNextStage } from '../../domain/race/campaign-progress';
import { EndingScreenFull } from './EndingScreenFull';

const stages = getAllStages();

const buildCompletedProgress = () => {
  let p = createInitialProgress();
  for (let i = 1; i <= 8; i++) {
    const id = i as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
    p = unlockNextStage(p, id);
    p = updateBestRecord(p, id, { bestTimeSec: 50, rank: i % 2 === 0 ? 'SILVER' : 'GOLD' });
  }
  return p;
};

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('EndingScreenFull', () => {
  it('独白 1 行目が表示される', () => {
    render(
      <EndingScreenFull
        stages={stages}
        progress={buildCompletedProgress()}
        isReplay={false}
        onComplete={jest.fn()}
      />,
    );
    expect(screen.getByText(/最初のステージとは違っていた/)).toBeInTheDocument();
  });

  it('3 秒で独白 2 行目に進む', () => {
    render(
      <EndingScreenFull
        stages={stages}
        progress={buildCompletedProgress()}
        isReplay={false}
        onComplete={jest.fn()}
      />,
    );
    act(() => { jest.advanceTimersByTime(3000); });
    expect(screen.getByText(/夜明けは、まだ来ない/)).toBeInTheDocument();
  });

  it('isReplay=true なら 4 倍速（750ms で 2 行目）', () => {
    render(
      <EndingScreenFull
        stages={stages}
        progress={buildCompletedProgress()}
        isReplay={true}
        onComplete={jest.fn()}
      />,
    );
    act(() => { jest.advanceTimersByTime(750); });
    expect(screen.getByText(/夜明けは、まだ来ない/)).toBeInTheDocument();
  });

  it('Esc で onComplete', () => {
    const onComplete = jest.fn();
    render(
      <EndingScreenFull
        stages={stages}
        progress={buildCompletedProgress()}
        isReplay={false}
        onComplete={onComplete}
      />,
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('クレジット phase で GOLD/SILVER/BRONZE 集計表示（クリック駆動でフェーズ進行）', () => {
    jest.useRealTimers();  // fake timer による効果無効化、自然進行はキー駆動で行う
    const { container } = render(
      <EndingScreenFull
        stages={stages}
        progress={buildCompletedProgress()}
        isReplay={true}
        onComplete={jest.fn()}
      />,
    );
    // 任意キーで phase を 1 つずつ進める（Esc 以外で advance）
    // monologue-1 → -2 → -3 → thank-you → credits
    for (let i = 0; i < 4; i++) {
      fireEvent.keyDown(window, { key: 'a' });
    }
    // クレジット画面に到達しているか container.textContent で検証
    expect(container.textContent).toContain('GOLD');
    expect(container.textContent).toContain('SILVER');
    expect(container.textContent).toContain('BRONZE');
  });
});
