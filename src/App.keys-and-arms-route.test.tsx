import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/KeysAndArmsPage', () => {
  const MockKeysAndArmsPage = () => (
    <iframe title="KEYS & ARMS" src="/games/keys-and-arms/index.html" />
  );
  MockKeysAndArmsPage.displayName = 'MockKeysAndArmsPage';
  return MockKeysAndArmsPage;
});

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
