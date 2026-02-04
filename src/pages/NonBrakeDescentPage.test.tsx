import React from 'react';
import { render, screen } from '@testing-library/react';
import NonBrakeDescentPage from './NonBrakeDescentPage';

window.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: () => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { setValueAtTime: jest.fn(), exponentialRampToValueAtTime: jest.fn() },
    type: 'sine',
  }),
  createGain: () => ({
    connect: jest.fn(),
    gain: {
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
    },
  }),
  currentTime: 0,
  destination: {},
}));

describe('NonBrakeDescentPage', () => {
  it('renders the title and game region', () => {
    render(<NonBrakeDescentPage />);

    expect(screen.getByText('NON-BRAKE DESCENT')).toBeInTheDocument();
    expect(
      screen.getByRole('region', {
        name: 'Non-Brake Descent ゲーム画面',
      })
    ).toBeInTheDocument();
  });
});
