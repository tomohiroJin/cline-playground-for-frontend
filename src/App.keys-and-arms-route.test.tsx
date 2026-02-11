import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/KeysAndArmsPage', () => () => (
  <iframe title="KEYS & ARMS" src="/games/keys-and-arms/index.html" />
));

describe('App routes', () => {
  it('/keys-and-arms でページを表示する', async () => {
    render(
      <MemoryRouter initialEntries={['/keys-and-arms']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByTitle('KEYS & ARMS')).toBeInTheDocument();
  });
});
