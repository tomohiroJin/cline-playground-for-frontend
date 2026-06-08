// CheckpointBonusToast のテスト

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { CheckpointBonusToast } from './CheckpointBonusToast';

describe('CheckpointBonusToast', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('bonusSec が定義されているときに表示される', () => {
    render(<CheckpointBonusToast bonusSec={12} triggerKey={1} />);
    expect(screen.getByRole('status').textContent).toBe('+12 SECONDS');
  });

  it('bonusSec が undefined のとき表示されない', () => {
    render(<CheckpointBonusToast bonusSec={undefined} triggerKey={0} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('1 秒後に自動的に消える', () => {
    const onDone = jest.fn();
    render(<CheckpointBonusToast bonusSec={12} triggerKey={1} onDone={onDone} />);
    expect(screen.getByRole('status')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('status')).toBeNull();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('triggerKey が変わると再表示される', () => {
    const { rerender } = render(<CheckpointBonusToast bonusSec={12} triggerKey={1} />);
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.queryByRole('status')).toBeNull();

    rerender(<CheckpointBonusToast bonusSec={12} triggerKey={2} />);
    expect(screen.getByRole('status').textContent).toBe('+12 SECONDS');
  });
});
