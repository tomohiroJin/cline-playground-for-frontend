import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumb } from './Breadcrumb';

/** Breadcrumb をラップしてレンダリングするヘルパー */
const renderBreadcrumb = (items: Array<{ label: string; path?: string }>) =>
  render(
    <MemoryRouter>
      <Breadcrumb items={items} />
    </MemoryRouter>
  );

describe('Breadcrumb', () => {
  describe('基本レンダリング', () => {
    it('nav 要素が aria-label="パンくずリスト" で表示されること', () => {
      renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const nav = screen.getByRole('navigation', { name: 'パンくずリスト' });
      expect(nav).toBeInTheDocument();
    });

    it('ol リスト構造でレンダリングされること', () => {
      const { container } = renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const ol = container.querySelector('ol');
      expect(ol).toBeInTheDocument();
    });

    it('全てのラベルが表示されること', () => {
      renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      expect(screen.getByText('ホーム')).toBeInTheDocument();
      expect(screen.getByText('サイトについて')).toBeInTheDocument();
    });
  });

  describe('リンク生成', () => {
    it('path が指定されたアイテムはリンクとして表示されること', () => {
      renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const homeLink = screen.getByRole('link', { name: 'ホーム' });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });

    it('path が未指定のアイテムはリンクなしで表示されること', () => {
      renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const currentItem = screen.getByText('サイトについて');
      expect(currentItem.closest('a')).toBeNull();
    });
  });

  describe('アクセシビリティ', () => {
    it('現在のページに aria-current="page" が設定されること', () => {
      renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const currentItem = screen.getByText('サイトについて').closest('li');
      expect(currentItem).toHaveAttribute('aria-current', 'page');
    });

    it('リンクアイテムには aria-current が設定されないこと', () => {
      renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const homeItem = screen.getByText('ホーム').closest('li');
      expect(homeItem).not.toHaveAttribute('aria-current');
    });
  });

  describe('区切り文字', () => {
    it('最初のアイテム以外に区切り文字が表示されること', () => {
      const { container } = renderBreadcrumb([
        { label: 'ホーム', path: '/' },
        { label: 'サイトについて' },
      ]);
      const listItems = container.querySelectorAll('li');
      expect(listItems).toHaveLength(2);
    });
  });
});
