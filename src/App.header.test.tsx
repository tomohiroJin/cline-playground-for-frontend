import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

// ゲームページ等の重いコンポーネントをモック
jest.mock('./pages/GameListPage', () => {
  return function MockGameListPage() {
    return <div data-testid="game-list-page">Game List</div>;
  };
});

/**
 * ヘッダーのレンダリングヘルパー
 * ホームルートでAppをレンダリングし、ヘッダー要素を返す
 */
const renderHeader = () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  return screen.getByRole('banner');
};

describe('App ヘッダー', () => {
  describe('ロゴ', () => {
    it('GP モノグラムが表示されること', () => {
      const header = renderHeader();
      expect(within(header).getByText('GP')).toBeInTheDocument();
    });

    it('ロゴ部分が h1 タグであること（SEO 観点）', () => {
      const header = renderHeader();
      const heading = within(header).getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('ロゴクリックでホームに遷移するリンクがあること', () => {
      const header = renderHeader();
      const heading = within(header).getByRole('heading', { level: 1 });
      const link = within(heading).getByRole('link');
      expect(link).toHaveAttribute('href', '/');
    });
  });

  describe('サイト名', () => {
    it('niku9 のサイト名が表示されること', () => {
      const header = renderHeader();
      expect(within(header).getByText('niku9')).toBeInTheDocument();
    });
  });

  describe('ナビゲーション', () => {
    it('About リンクが表示されること', () => {
      const header = renderHeader();
      const aboutLink = within(header).getByRole('link', { name: /about/i });
      expect(aboutLink).toHaveAttribute('href', '/about');
    });
  });

  describe('構造', () => {
    it('グローバルナビゲーション領域が存在すること', () => {
      const header = renderHeader();
      const nav = within(header).getByRole('navigation', { name: /global/i });
      expect(nav).toBeInTheDocument();
    });
  });
});
