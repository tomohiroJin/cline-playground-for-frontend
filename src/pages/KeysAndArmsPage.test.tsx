import React from 'react';
import { render, screen } from '@testing-library/react';
import KeysAndArmsPage from './KeysAndArmsPage';

describe('KeysAndArmsPage', () => {
  it('KEYS & ARMS の iframe を表示する', () => {
    render(<KeysAndArmsPage />);
    const frame = screen.getByTitle('KEYS & ARMS');
    expect(frame).toBeInTheDocument();
    expect(frame).toHaveAttribute('src', '/games/keys-and-arms/index.html');
  });
});
