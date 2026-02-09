import React from 'react';
import { render, screen } from '@testing-library/react';
import RiskLcdGame from './RiskLcdGame';

// AudioContext のモック
const mockAudioContext = {
  state: 'running',
  resume: jest.fn(),
  createOscillator: jest.fn(() => ({
    type: '',
    frequency: { value: 0 },
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
  })),
  createGain: jest.fn(() => ({
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
    connect: jest.fn(),
  })),
  currentTime: 0,
  destination: {},
};
(window as unknown as { AudioContext: unknown }).AudioContext = jest.fn(
  () => mockAudioContext,
);

describe('RiskLcdGame', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('タイトル画面が表示される', () => {
    render(<RiskLcdGame />);
    // DeviceFrame の Brand テキスト
    expect(screen.getByText('RISK LCD')).toBeInTheDocument();
    // TitleScreen 内の CHOOSE YOUR FATE サブタイトル
    expect(
      screen.getByText('── CHOOSE YOUR FATE ──'),
    ).toBeInTheDocument();
  });

  it('メニュー項目が表示される', () => {
    render(<RiskLcdGame />);
    expect(screen.getByText('GAME START')).toBeInTheDocument();
    // PLAY STYLE / UNLOCK / HELP はメニューとサブ画面タイトルの両方に存在する
    expect(screen.getAllByText('PLAY STYLE').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('UNLOCK').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('HELP').length).toBeGreaterThanOrEqual(1);
  });

  it('操作説明が表示される', () => {
    render(<RiskLcdGame />);
    expect(
      screen.getByText(/パークを重ねてビルドを構築せよ/),
    ).toBeInTheDocument();
  });
});
