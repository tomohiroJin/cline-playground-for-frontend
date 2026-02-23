import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  beforeEach(() => {
    localStorage.clear();
  });

  it('/keys-and-arms でページを表示する', async () => {
    render(
      <MemoryRouter initialEntries={['/keys-and-arms']}>
        <App />
      </MemoryRouter>
    );

    // 注意書きモーダルの OK ボタンを押してゲーム画面を表示
    const okButton = await screen.findByRole('button', { name: 'OK' });
    fireEvent.click(okButton);

    expect(await screen.findByTitle('KEYS & ARMS')).toBeInTheDocument();
  });
});
