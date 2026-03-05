import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AboutPage from '../AboutPage';
import { ABOUT_FAQ_ITEMS } from '../../constants/game-seo-data';

/** JSON-LD スクリプトタグを取得するヘルパー */
const getJsonLdScripts = (): HTMLScriptElement[] =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

/** AboutPage をラップしてレンダリングするヘルパー */
const renderAboutPage = () =>
  render(
    <MemoryRouter initialEntries={['/about']}>
      <AboutPage />
    </MemoryRouter>
  );

describe('AboutPage', () => {
  let staticScriptCount: number;

  beforeEach(() => {
    staticScriptCount = getJsonLdScripts().length;
  });

  afterEach(() => {
    const scripts = getJsonLdScripts();
    scripts.slice(staticScriptCount).forEach((s) => s.remove());
  });

  describe('基本コンテンツ', () => {
    it('ページタイトルが表示されること', () => {
      renderAboutPage();
      expect(screen.getByRole('heading', { level: 2, name: 'サイトについて' })).toBeInTheDocument();
    });

    it('Game Platform の概要説明が表示されること', () => {
      renderAboutPage();
      expect(
        screen.getByText(/13 種類の無料ブラウザゲームが楽しめるプラットフォーム/)
      ).toBeInTheDocument();
    });

    it('特徴が箇条書きで表示されること', () => {
      renderAboutPage();
      expect(screen.getByText(/完全無料: 課金要素は一切ありません/)).toBeInTheDocument();
      expect(screen.getByText(/登録不要: アカウント作成なし/)).toBeInTheDocument();
      expect(screen.getByText(/インストール不要: ブラウザからワンクリック/)).toBeInTheDocument();
    });
  });

  describe('フィーチャーカード', () => {
    it('3 つのフィーチャーカードが表示されること', () => {
      const { container } = renderAboutPage();
      const cards = container.querySelectorAll('[data-testid="section-card"]');
      expect(cards).toHaveLength(3);
    });

    it('各カードのタイトルが表示されること', () => {
      renderAboutPage();
      expect(screen.getByText('13種類のゲーム')).toBeInTheDocument();
      expect(screen.getByText('完全無料')).toBeInTheDocument();
      expect(screen.getByText('登録不要')).toBeInTheDocument();
    });
  });

  describe('ゲームジャンル', () => {
    it('ジャンルタグが表示されること', () => {
      renderAboutPage();
      expect(screen.getByText('パズル')).toBeInTheDocument();
      expect(screen.getByText('RPG')).toBeInTheDocument();
      expect(screen.getByText('ホラー')).toBeInTheDocument();
    });
  });

  describe('FAQ セクション', () => {
    it('「よくある質問」見出しが表示されること', () => {
      renderAboutPage();
      expect(screen.getByText('よくある質問')).toBeInTheDocument();
    });

    it('全 6 つの FAQ 質問が表示されること', () => {
      renderAboutPage();
      for (const faq of ABOUT_FAQ_ITEMS) {
        expect(screen.getByText(faq.question)).toBeInTheDocument();
      }
    });

    it('FAQ が details/summary でアコーディオン表示されること', () => {
      const { container } = renderAboutPage();
      const details = container.querySelectorAll('details');
      expect(details.length).toBe(ABOUT_FAQ_ITEMS.length);
    });

    it('FAQ の全回答テキストが DOM に含まれること', () => {
      renderAboutPage();
      for (const faq of ABOUT_FAQ_ITEMS) {
        expect(screen.getByText(faq.answer)).toBeInTheDocument();
      }
    });

    it('useFaqSchema により FAQPage スキーマが挿入されること', () => {
      renderAboutPage();
      const scripts = getJsonLdScripts();
      const faqScript = scripts.find((s) => {
        const parsed = JSON.parse(s.textContent ?? '');
        return parsed['@type'] === 'FAQPage';
      });
      expect(faqScript).toBeTruthy();
    });
  });

  describe('免責事項', () => {
    it('免責事項セクションが表示されること', () => {
      renderAboutPage();
      expect(screen.getByText('免責事項')).toBeInTheDocument();
    });

    it('免責事項の内容が表示されること', () => {
      renderAboutPage();
      expect(
        screen.getByText(/趣味・学習目的で運営/)
      ).toBeInTheDocument();
    });
  });

  describe('E-E-A-T シグナル', () => {
    it('運営者情報にサイト名が表示されること', () => {
      renderAboutPage();
      expect(screen.getByText(/サイト名: niku9\.click/)).toBeInTheDocument();
    });

    it('運営者情報にメールアドレスが表示されること', () => {
      renderAboutPage();
      expect(screen.getByText(/contact@niku9\.click/)).toBeInTheDocument();
    });

    it('サイトの目的（趣味・学習目的）が明記されていること', () => {
      renderAboutPage();
      expect(
        screen.getByText(/趣味・学習目的で個人運営/)
      ).toBeInTheDocument();
    });

    it('使用技術が記載されていること', () => {
      renderAboutPage();
      expect(screen.getByText(/React/)).toBeInTheDocument();
      expect(screen.getByText(/TypeScript/)).toBeInTheDocument();
    });
  });

  describe('パンくずリスト', () => {
    it('パンくずリストが表示されること', () => {
      renderAboutPage();
      const nav = screen.getByRole('navigation', { name: 'パンくずリスト' });
      expect(nav).toBeInTheDocument();
    });

    it('ホームリンクが含まれること', () => {
      renderAboutPage();
      const homeLink = screen.getByRole('link', { name: 'ホーム' });
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('アイコン', () => {
    it('ページアイコンが表示されること', () => {
      renderAboutPage();
      expect(screen.getByText('ℹ️')).toBeInTheDocument();
    });
  });
});
