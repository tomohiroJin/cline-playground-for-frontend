import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

jest.mock('./pages/KeysAndArmsPage', () => () => <div aria-label="KEYS & ARMS">mocked game</div>);

describe('App routes', () => {
  it('/keys-and-arms でページを表示する', async () => {
    render(
      <MemoryRouter initialEntries={['/keys-and-arms']}>
        <App />
      </MemoryRouter>
    );

    expect(await screen.findByLabelText('KEYS & ARMS')).toBeInTheDocument();
  });
});
