import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrivacyPolicyPage from '../PrivacyPolicyPage';

/** PrivacyPolicyPage をラップしてレンダリングするヘルパー */
const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/privacy-policy']}>
      <PrivacyPolicyPage />
    </MemoryRouter>
  );

describe('PrivacyPolicyPage', () => {
  describe('基本コンテンツ', () => {
    it('ページタイトルが表示されること', () => {
      renderPage();
      expect(screen.getByText('プライバシーポリシー')).toBeInTheDocument();
    });

    it('冒頭の要約文が結論ファーストで表示されること', () => {
      renderPage();
      expect(
        screen.getByText(/ユーザーのプライバシーを尊重し/)
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

    it('重要情報「サーバーには送信されません」が含まれること', () => {
      renderPage();
      expect(screen.getByText(/サーバーには送信されません/)).toBeInTheDocument();
    });

    it('お問い合わせリンクが含まれること', () => {
      renderPage();
      const link = screen.getByRole('link', { name: /contact@niku9\.click/ });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'mailto:contact@niku9.click');
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
