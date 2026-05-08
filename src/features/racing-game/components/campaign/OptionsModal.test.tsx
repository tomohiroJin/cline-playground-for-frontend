// OptionsModal のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionsModal } from './OptionsModal';

const defaultProps = {
  canReplayEnding: false,
  onReplayEnding: jest.fn(),
  onResetProgress: jest.fn(),
  onClose: jest.fn(),
};

describe('OptionsModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('OPTIONS タイトルと 3 つのアクションを表示', () => {
    render(<OptionsModal {...defaultProps} />);
    expect(screen.getByText('OPTIONS')).toBeTruthy();
    expect(screen.getByLabelText('REPLAY ENDING')).toBeTruthy();
    expect(screen.getByLabelText('RESET PROGRESS')).toBeTruthy();
    expect(screen.getByText('CLOSE')).toBeTruthy();
  });

  it('REPLAY ENDING は canReplayEnding=false で disabled', () => {
    render(<OptionsModal {...defaultProps} canReplayEnding={false} />);
    expect((screen.getByLabelText('REPLAY ENDING') as HTMLButtonElement).disabled).toBe(true);
  });

  it('REPLAY ENDING は canReplayEnding=true で押せる', () => {
    const onReplay = jest.fn();
    render(<OptionsModal {...defaultProps} canReplayEnding={true} onReplayEnding={onReplay} />);
    fireEvent.click(screen.getByLabelText('REPLAY ENDING'));
    expect(onReplay).toHaveBeenCalledTimes(1);
  });

  it('RESET PROGRESS は二重確認モーダルが出る', () => {
    const onReset = jest.fn();
    render(<OptionsModal {...defaultProps} onResetProgress={onReset} />);
    fireEvent.click(screen.getByLabelText('RESET PROGRESS'));
    expect(screen.getByText(/DELETE ALL RECORDS/)).toBeTruthy();
    expect(onReset).not.toHaveBeenCalled();  // まだ確定していない
  });

  it('Y クリックで onResetProgress が呼ばれる', () => {
    const onReset = jest.fn();
    render(<OptionsModal {...defaultProps} onResetProgress={onReset} />);
    fireEvent.click(screen.getByLabelText('RESET PROGRESS'));
    fireEvent.click(screen.getByText('Y (DELETE)'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('N クリックで onResetProgress は呼ばれずキャンセルされる', () => {
    const onReset = jest.fn();
    render(<OptionsModal {...defaultProps} onResetProgress={onReset} />);
    fireEvent.click(screen.getByLabelText('RESET PROGRESS'));
    fireEvent.click(screen.getByText('N (CANCEL)'));
    expect(onReset).not.toHaveBeenCalled();
    expect(screen.getByLabelText('RESET PROGRESS')).toBeTruthy();  // 元の画面に戻る
  });

  it('CLOSE で onClose が呼ばれる', () => {
    const onClose = jest.fn();
    render(<OptionsModal {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('CLOSE'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
