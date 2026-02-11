import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App routes', () => {
  it('/keys-and-arms でページを表示する', async () => {
    render(
      <MemoryRouter initialEntries={['/keys-and-arms']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByRole('region', { name: 'KEYS & ARMS ゲーム画面' })).toBeInTheDocument();
  });
});
