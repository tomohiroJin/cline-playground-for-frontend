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
 * フッターのレンダリングヘルパー
 * ホームルートでAppをレンダリングし、フッター要素を返す
 */
const renderFooter = () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  return screen.getByRole('contentinfo');
};

describe('App フッター', () => {
  describe('上段: サイト内リンク', () => {
    it('フッターナビゲーションに5つのサイト内リンクが表示される', () => {
      const footer = renderFooter();
      const nav = within(footer).getByRole('navigation', { name: /footer/i });

      const links = within(nav).getAllByRole('link');
      expect(links).toHaveLength(5);
    });

    it.each([
      { label: 'ホーム', href: '/' },
      { label: 'サイトについて', href: '/about' },
      { label: 'プライバシーポリシー', href: '/privacy-policy' },
      { label: '利用規約', href: '/terms' },
      { label: 'お問い合わせ', href: '/contact' },
    ])('「$label」リンクが $href に遷移する', ({ label, href }) => {
      const footer = renderFooter();
      const link = within(footer).getByRole('link', { name: label });

      expect(link).toHaveAttribute('href', href);
    });
  });

  describe('中段: 姉妹サイトリンク', () => {
    it('姉妹サイトのリンクが表示される', () => {
      const footer = renderFooter();
      const sisterLink = within(footer).getByRole('link', {
        name: /gallery/i,
      });

      expect(sisterLink).toBeInTheDocument();
    });

    it('姉妹サイトリンクが新しいタブで開く設定になっている', () => {
      const footer = renderFooter();
      const sisterLink = within(footer).getByRole('link', {
        name: /gallery/i,
      });

      expect(sisterLink).toHaveAttribute('target', '_blank');
      expect(sisterLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('姉妹サイトリンクが gallery.niku9.click を指す', () => {
      const footer = renderFooter();
      const sisterLink = within(footer).getByRole('link', {
        name: /gallery/i,
      });

      expect(sisterLink).toHaveAttribute(
        'href',
        expect.stringContaining('gallery.niku9.click')
      );
    });
  });

  describe('下段: コピーライト', () => {
    it('コピーライト表記が表示される', () => {
      const footer = renderFooter();

      expect(footer).toHaveTextContent(
        '© 2026 niku9.click All Rights Reserved.'
      );
    });
  });

  describe('構造', () => {
    it('フッターが3段構成（ナビ・姉妹サイト・コピーライト）で表示される', () => {
      const footer = renderFooter();

      // 上段: ナビゲーション
      const nav = within(footer).getByRole('navigation', {
        name: /footer/i,
      });
      expect(nav).toBeInTheDocument();

      // 中段: 姉妹サイト（「姉妹サイト」というテキストが含まれる）
      expect(footer).toHaveTextContent(/姉妹サイト/);

      // 下段: コピーライト
      expect(footer).toHaveTextContent(/© 2026/);
    });
  });
});
