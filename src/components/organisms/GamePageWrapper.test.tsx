import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GamePageWrapper } from './GamePageWrapper';

/** テスト用の子コンポーネント */
const TestChild: React.FC = () => <div>ゲーム画面</div>;

/** MemoryRouter でラップするヘルパー */
const renderWithRouter = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GamePageWrapper>
        <TestChild />
      </GamePageWrapper>
    </MemoryRouter>
  );

describe('GamePageWrapper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('初回アクセス', () => {
    it('ゲームページで注意書きモーダルを表示する', () => {
      renderWithRouter('/puzzle');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Picture Puzzle')).toBeInTheDocument();
    });

    it('注意書きモーダル表示中はゲーム画面を表示しない', () => {
      renderWithRouter('/puzzle');
      expect(screen.queryByText('ゲーム画面')).not.toBeInTheDocument();
    });
  });

  describe('OKボタン押下後', () => {
    it('OKを押すとゲーム画面が表示される', () => {
      renderWithRouter('/puzzle');
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));
      expect(screen.getByText('ゲーム画面')).toBeInTheDocument();
    });

    it('OKを押すとlocalStorageに記録される', () => {
      renderWithRouter('/puzzle');
      fireEvent.click(screen.getByRole('button', { name: 'OK' }));
      expect(localStorage.getItem('game-notice-accepted:/puzzle')).toBe('true');
    });
  });

  describe('2回目以降のアクセス', () => {
    it('受諾済みの場合はモーダルをスキップしゲーム画面を表示する', () => {
      localStorage.setItem('game-notice-accepted:/puzzle', 'true');
      renderWithRouter('/puzzle');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('ゲーム画面')).toBeInTheDocument();
    });
  });

  describe('注意事項がないルート', () => {
    it('トップページではモーダルを表示せずそのまま表示する', () => {
      renderWithRouter('/');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
