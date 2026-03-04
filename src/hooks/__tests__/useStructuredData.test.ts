import { renderHook } from '@testing-library/react';
import { useStructuredData } from '../useStructuredData';

describe('useStructuredData', () => {
  /** JSON-LDスクリプトタグを取得するヘルパー */
  const getJsonLdScripts = (): HTMLScriptElement[] =>
    Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

  /** 静的に配置されたJSON-LDの数（index.html の WebSite スキーマ） */
  let staticScriptCount: number;

  beforeEach(() => {
    // テスト前の既存スクリプト数を記録
    staticScriptCount = getJsonLdScripts().length;
  });

  afterEach(() => {
    // テスト後に動的に追加されたスクリプトをクリーンアップ
    const scripts = getJsonLdScripts();
    scripts.slice(staticScriptCount).forEach((s) => s.remove());
  });

  describe('VideoGame スキーマ', () => {
    it('head に JSON-LD スクリプトが挿入されること', () => {
      const gameData = {
        name: 'Test Game',
        description: 'テスト用ゲーム説明文',
        url: 'https://niku9.click/test',
      };

      renderHook(() => useStructuredData({ type: 'VideoGame', data: gameData }));

      const scripts = getJsonLdScripts();
      expect(scripts.length).toBeGreaterThan(staticScriptCount);

      const lastScript = scripts[scripts.length - 1];
      const parsed = JSON.parse(lastScript.textContent ?? '');
      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('VideoGame');
      expect(parsed.name).toBe('Test Game');
      expect(parsed.description).toBe('テスト用ゲーム説明文');
      expect(parsed.url).toBe('https://niku9.click/test');
      expect(parsed.gamePlatform).toBe('Web Browser');
      expect(parsed.applicationCategory).toBe('Game');
      expect(parsed.operatingSystem).toBe('Any');
      expect(parsed.offers).toEqual({
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'JPY',
      });
      expect(parsed.inLanguage).toBe('ja');
      expect(parsed.isPartOf).toEqual({
        '@type': 'WebSite',
        name: 'Game Platform',
        url: 'https://niku9.click/',
      });
    });

    it('アンマウント時にスクリプトが削除されること', () => {
      const gameData = {
        name: 'Test Game',
        description: 'テスト用',
        url: 'https://niku9.click/test',
      };

      const { unmount } = renderHook(() =>
        useStructuredData({ type: 'VideoGame', data: gameData })
      );

      expect(getJsonLdScripts().length).toBeGreaterThan(staticScriptCount);

      unmount();

      expect(getJsonLdScripts().length).toBe(staticScriptCount);
    });
  });

  describe('BreadcrumbList スキーマ', () => {
    it('パンくずリストの JSON-LD が正しく挿入されること', () => {
      const breadcrumbData = {
        items: [
          { name: 'ホーム', url: 'https://niku9.click/' },
          { name: 'Test Game', url: 'https://niku9.click/test' },
        ],
      };

      renderHook(() =>
        useStructuredData({ type: 'BreadcrumbList', data: breadcrumbData })
      );

      const scripts = getJsonLdScripts();
      const lastScript = scripts[scripts.length - 1];
      const parsed = JSON.parse(lastScript.textContent ?? '');

      expect(parsed['@context']).toBe('https://schema.org');
      expect(parsed['@type']).toBe('BreadcrumbList');
      expect(parsed.itemListElement).toHaveLength(2);
      expect(parsed.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'ホーム',
        item: 'https://niku9.click/',
      });
      expect(parsed.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'Test Game',
        item: 'https://niku9.click/test',
      });
    });

    it('アンマウント時にパンくずリストスクリプトが削除されること', () => {
      const breadcrumbData = {
        items: [
          { name: 'ホーム', url: 'https://niku9.click/' },
          { name: 'Test', url: 'https://niku9.click/test' },
        ],
      };

      const { unmount } = renderHook(() =>
        useStructuredData({ type: 'BreadcrumbList', data: breadcrumbData })
      );

      expect(getJsonLdScripts().length).toBeGreaterThan(staticScriptCount);

      unmount();

      expect(getJsonLdScripts().length).toBe(staticScriptCount);
    });
  });

  describe('データの安全性', () => {
    it('textContent でスクリプトが挿入されること（XSS対策）', () => {
      const gameData = {
        name: '<script>alert("xss")</script>',
        description: 'テスト',
        url: 'https://niku9.click/test',
      };

      renderHook(() => useStructuredData({ type: 'VideoGame', data: gameData }));

      const scripts = getJsonLdScripts();
      const lastScript = scripts[scripts.length - 1];

      // textContent 経由で挿入されているため、HTML としてパースされない
      // JSON.stringify によりダブルクォートはエスケープされる
      const parsed = JSON.parse(lastScript.textContent ?? '');
      expect(parsed.name).toBe('<script>alert("xss")</script>');
    });
  });
});
