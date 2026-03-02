import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GamePageWrapper } from './GamePageWrapper';

/** テスト用の子コンポーネント */
const TestChild: React.FC = () => <div>ゲーム画面</div>;

/** テスト用のエラーを発生させるコンポーネント */
const ThrowError: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('ゲーム内エラー');
  }
  return <div>ゲーム画面</div>;
};

/** MemoryRouter でラップするヘルパー */
const renderWithRouter = (path: string, children?: React.ReactNode) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <GamePageWrapper>
        {children ?? <TestChild />}
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

  describe('ErrorBoundary によるゲームエラーの隔離', () => {
    // console.error を抑制（意図的なエラーのため）
    const originalConsoleError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalConsoleError;
    });

    it('ゲーム内でエラーが発生した場合、ErrorBoundary のフォールバック UI を表示する', () => {
      // Arrange: 受諾済みの状態にしてゲーム画面を表示させる
      localStorage.setItem('game-notice-accepted:/puzzle', 'true');

      // Act: エラーを投げるコンポーネントをレンダリング
      renderWithRouter('/puzzle', <ThrowError shouldThrow={true} />);

      // Assert: ErrorBoundary のフォールバック UI が表示される
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /予期せぬエラーが発生しました/i })
      ).toBeInTheDocument();
    });

    it('エラー画面に「再試行」と「ホームに戻る」ボタンが表示される', () => {
      localStorage.setItem('game-notice-accepted:/puzzle', 'true');

      renderWithRouter('/puzzle', <ThrowError shouldThrow={true} />);

      expect(screen.getByRole('button', { name: /再試行/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /ホームに戻る/i })).toBeInTheDocument();
    });

    it('エラーがないゲームは正常に表示される', () => {
      localStorage.setItem('game-notice-accepted:/puzzle', 'true');

      renderWithRouter('/puzzle', <ThrowError shouldThrow={false} />);

      expect(screen.getByText('ゲーム画面')).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
