import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BgmController from './BgmController';
import { BgmTrack } from '../../types/puzzle';

describe('BgmController', () => {
  const mockTrack: BgmTrack = {
    id: 'calm-water',
    name: '静かな水面',
    bpm: 72,
    bars: 8,
    melody: [],
    bass: [],
    melodyWaveform: 'sine',
    bassWaveform: 'triangle',
    melodyGain: 0.08,
    bassGain: 0.04,
  };

  const defaultProps = {
    currentTrack: mockTrack,
    isPlaying: false,
    volume: 70,
    onTogglePlay: jest.fn(),
    onNextTrack: jest.fn(),
    onPrevTrack: jest.fn(),
    onVolumeChange: jest.fn(),
  };

  it('トラック名が表示されること', () => {
    render(<BgmController {...defaultProps} />);
    expect(screen.getByText(/静かな水面/)).toBeInTheDocument();
  });

  it('再生ボタンをクリックするとonTogglePlayが呼ばれること', () => {
    const onTogglePlay = jest.fn();
    render(<BgmController {...defaultProps} onTogglePlay={onTogglePlay} />);
    fireEvent.click(screen.getByTitle('再生'));
    expect(onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('再生中は停止ボタンが表示されること', () => {
    render(<BgmController {...defaultProps} isPlaying={true} />);
    expect(screen.getByTitle('停止')).toBeInTheDocument();
  });

  it('前のトラックボタンが動作すること', () => {
    const onPrevTrack = jest.fn();
    render(<BgmController {...defaultProps} onPrevTrack={onPrevTrack} />);
    fireEvent.click(screen.getByTitle('前のトラック'));
    expect(onPrevTrack).toHaveBeenCalledTimes(1);
  });

  it('次のトラックボタンが動作すること', () => {
    const onNextTrack = jest.fn();
    render(<BgmController {...defaultProps} onNextTrack={onNextTrack} />);
    fireEvent.click(screen.getByTitle('次のトラック'));
    expect(onNextTrack).toHaveBeenCalledTimes(1);
  });

  it('音量スライダーが表示されること', () => {
    render(<BgmController {...defaultProps} />);
    const slider = screen.getByLabelText('BGM音量');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveValue('70');
  });

  it('音量変更時にonVolumeChangeが呼ばれること', () => {
    const onVolumeChange = jest.fn();
    render(<BgmController {...defaultProps} onVolumeChange={onVolumeChange} />);
    fireEvent.change(screen.getByLabelText('BGM音量'), { target: { value: '50' } });
    expect(onVolumeChange).toHaveBeenCalledWith(50);
  });
});
