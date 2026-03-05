import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TermsPage from '../TermsPage';

/** TermsPage をラップしてレンダリングするヘルパー */
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/terms']}>
      <TermsPage />
    </MemoryRouter>
  );

describe('TermsPage', () => {
  describe('基本コンテンツ', () => {
    it('ページタイトルが表示されること', () => {
      renderPage();
      expect(screen.getByRole('heading', { level: 2, name: '利用規約' })).toBeInTheDocument();
    });

    it('冒頭の要約文が表示されること', () => {
      renderPage();
      expect(
        screen.getByText(/利用条件を定めるものです/)
      ).toBeInTheDocument();
    });
  });

  describe('コンテンツ構造改善', () => {
    it('全 7 条の見出しが表示されること', () => {
      renderPage();
      expect(screen.getByText(/第1条/)).toBeInTheDocument();
      expect(screen.getByText(/第2条/)).toBeInTheDocument();
      expect(screen.getByText(/第3条/)).toBeInTheDocument();
      expect(screen.getByText(/第4条/)).toBeInTheDocument();
      expect(screen.getByText(/第5条/)).toBeInTheDocument();
      expect(screen.getByText(/第6条/)).toBeInTheDocument();
      expect(screen.getByText(/第7条/)).toBeInTheDocument();
    });

    it('禁止事項リストが表示されること', () => {
      renderPage();
      expect(screen.getByText(/不正アクセスまたはその試み/)).toBeInTheDocument();
    });

    it('免責事項の内容が表示されること', () => {
      renderPage();
      expect(screen.getByText(/趣味・学習目的で運営/)).toBeInTheDocument();
    });

    it('お問い合わせリンクが含まれること', () => {
      renderPage();
      const link = screen.getByRole('link', { name: /contact@niku9\.click/ });
      expect(link).toBeInTheDocument();
    });
  });

  describe('ビジュアルブラッシュアップ', () => {
    it('パンくずリストが表示されること', () => {
      renderPage();
      const nav = screen.getByRole('navigation', { name: 'パンくずリスト' });
      expect(nav).toBeInTheDocument();
    });

    it('ページアイコンが表示されること', () => {
      renderPage();
      expect(screen.getByText('📋')).toBeInTheDocument();
    });
  });

  describe('E-E-A-T シグナル', () => {
    it('制定日が表示されること', () => {
      const { container } = renderPage();
      const timeElement = container.querySelector('time[datetime="2026-03"]');
      expect(timeElement).toBeInTheDocument();
    });

    it('最終更新日が表示されること', () => {
      const { container } = renderPage();
      const timeElement = container.querySelector('time[datetime="2026-03-05"]');
      expect(timeElement).toBeInTheDocument();
    });
  });
});
