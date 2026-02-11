import React from 'react';
import { render, screen } from '@testing-library/react';
import KeysAndArmsPage from './KeysAndArmsPage';

describe('KeysAndArmsPage', () => {
  it('ゲーム画面リージョンを表示する', () => {
    render(<KeysAndArmsPage />);
    expect(screen.getByRole('region', { name: 'KEYS & ARMS ゲーム画面' })).toBeInTheDocument();
  });
});
