import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ContactPage from '../ContactPage';

/** ContactPage をラップしてレンダリングするヘルパー */
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/contact']}>
      <ContactPage />
    </MemoryRouter>
  );

describe('ContactPage', () => {
  describe('基本コンテンツ', () => {
    it('ページタイトルが表示されること', () => {
      renderPage();
      expect(screen.getByRole('heading', { level: 2, name: 'お問い合わせ' })).toBeInTheDocument();
    });

    it('連絡先情報が結論ファーストで配置されていること', () => {
      renderPage();
      expect(
        screen.getByText(/メールアドレスまでご連絡ください/)
      ).toBeInTheDocument();
    });
  });

  describe('コンテンツ構造改善', () => {
    it('メールアドレスが表示されること', () => {
      renderPage();
      expect(screen.getByText('contact@niku9.click')).toBeInTheDocument();
    });

    it('メール送信ボタンが表示されること', () => {
      renderPage();
      const button = screen.getByRole('link', { name: 'メールを送信' });
      expect(button).toBeInTheDocument();
      expect(button.getAttribute('href')).toMatch(/^mailto:/);
    });

    it('注記セクションが表示されること', () => {
      renderPage();
      expect(screen.getByText('注記')).toBeInTheDocument();
    });

    it('注記の内容が表示されること', () => {
      renderPage();
      expect(screen.getByText(/スパム防止のため/)).toBeInTheDocument();
      expect(screen.getByText(/返信までにお時間/)).toBeInTheDocument();
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
      expect(screen.getByText('✉️')).toBeInTheDocument();
    });

    it('コンタクトカード内のメールアイコンが表示されること', () => {
      renderPage();
      expect(screen.getByText('📧')).toBeInTheDocument();
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
