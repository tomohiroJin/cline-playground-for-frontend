import React from 'react';
import { render, screen } from '@testing-library/react';
import AirHockeyPage from './AirHockeyPage';

// Mock audio context
window.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 0 },
    type: 'sine',
  }),
  createGain: () => ({
    connect: jest.fn(),
    gain: {
      value: 0,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  }),
  currentTime: 0,
  destination: {},
}));

describe('AirHockeyPage', () => {
  it('renders the menu correctly', () => {
    render(<AirHockeyPage />);
    expect(screen.getByText('🏒 Air Hockey')).toBeInTheDocument();
    expect(screen.getByText('START')).toBeInTheDocument();
  });

  it('Size選択セクションが存在しない', () => {
    render(<AirHockeyPage />);
    expect(screen.queryByText('Size')).not.toBeInTheDocument();
    expect(screen.queryByText('Standard')).not.toBeInTheDocument();
    expect(screen.queryByText('Large')).not.toBeInTheDocument();
  });

  it('BGMトグルが表示される', () => {
    render(<AirHockeyPage />);
    expect(screen.getByText('BGM')).toBeInTheDocument();
    expect(screen.getByText('OFF')).toBeInTheDocument();
  });
});
