import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/KeysAndArmsPage', () => () => (
  <div role="region" aria-label="KEYS & ARMS ゲーム画面">
    KEYS & ARMS MOCK
  </div>
));

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
