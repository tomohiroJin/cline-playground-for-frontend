import React from 'react';
import { render, screen } from '@testing-library/react';
import KeysAndArmsPage from './KeysAndArmsPage';

describe('KeysAndArmsPage', () => {
  it('KEYS & ARMS のゲームキャンバスを表示する', () => {
    render(<KeysAndArmsPage />);
    expect(screen.getByLabelText('KEYS & ARMS')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'アクション' })).toBeInTheDocument();
  });
});
