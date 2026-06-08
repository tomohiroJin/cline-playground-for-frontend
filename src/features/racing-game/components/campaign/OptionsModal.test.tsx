// OptionsModal のテスト

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OptionsModal, parseVolumePercent } from './OptionsModal';

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

  it('volume / onVolumeChange を渡すと音量スライダーが表示される（M3 対応）', () => {
    const onVolumeChange = jest.fn();
    render(
      <OptionsModal
        {...defaultProps}
        volume={{ master: 0.5, bgm: 0.6, se: 0.7 }}
        onVolumeChange={onVolumeChange}
      />,
    );
    expect(screen.getByLabelText('マスター音量')).toBeInTheDocument();
    expect(screen.getByLabelText('BGM 音量')).toBeInTheDocument();
    expect(screen.getByLabelText('SE 音量')).toBeInTheDocument();
  });

  it('音量スライダー変更で onVolumeChange が呼ばれる', () => {
    const onVolumeChange = jest.fn();
    render(
      <OptionsModal
        {...defaultProps}
        volume={{ master: 0.5, bgm: 0.6, se: 0.7 }}
        onVolumeChange={onVolumeChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('マスター音量'), { target: { value: '80' } });
    expect(onVolumeChange).toHaveBeenCalledWith({ master: 0.8, bgm: 0.6, se: 0.7 });
  });

  it('volume を渡さない場合は音量スライダーが出ない', () => {
    render(<OptionsModal {...defaultProps} />);
    expect(screen.queryByLabelText('マスター音量')).toBeNull();
  });

  describe('parseVolumePercent', () => {
    it('数値文字列（0..100）を 0..1 の音量に変換する', () => {
      expect(parseVolumePercent('80')).toBe(0.8);
      expect(parseVolumePercent('0')).toBe(0);
      expect(parseVolumePercent('100')).toBe(1);
    });

    it('範囲外は 0..1 にクランプする', () => {
      expect(parseVolumePercent('150')).toBe(1);
      expect(parseVolumePercent('-10')).toBe(0);
    });

    it('非数値・空文字は 0 にフォールバックし NaN を返さない', () => {
      expect(parseVolumePercent('abc')).toBe(0);
      expect(parseVolumePercent('')).toBe(0);
      expect(Number.isNaN(parseVolumePercent('abc'))).toBe(false);
    });
  });

  it('visibleVolumeChannels で master のみ指定すると BGM/SE スライダーは出ない', () => {
    render(
      <OptionsModal
        {...defaultProps}
        volume={{ master: 0.5, bgm: 0.6, se: 0.7 }}
        onVolumeChange={jest.fn()}
        visibleVolumeChannels={['master']}
      />,
    );
    expect(screen.getByLabelText('マスター音量')).toBeInTheDocument();
    expect(screen.queryByLabelText('BGM 音量')).toBeNull();
    expect(screen.queryByLabelText('SE 音量')).toBeNull();
  });
});
