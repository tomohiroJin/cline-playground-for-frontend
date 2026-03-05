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
      expect(screen.getByText('お問い合わせ')).toBeInTheDocument();
    });

    it('連絡先情報が結論ファーストで配置されていること', () => {
      renderPage();
      expect(
        screen.getByText(/メールアドレスまでご連絡ください/)
      ).toBeInTheDocument();
    });
  });

  describe('コンテンツ構造改善', () => {
    it('メールリンクが表示されること', () => {
      renderPage();
      const link = screen.getByRole('link', { name: /contact@niku9\.click/ });
      expect(link).toBeInTheDocument();
    });

    it('メールリンクの href が正しいこと', () => {
      renderPage();
      const link = screen.getByRole('link', { name: /contact@niku9\.click/ });
      expect(link.getAttribute('href')).toMatch(/^mailto:/);
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
