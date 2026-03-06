import { renderHook } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useItemListSchema } from '../useItemListSchema';
import { GAME_SEO_DATA, SITE_BASE_URL } from '../../constants/game-seo-data';

/** JSON-LD スクリプトタグを取得するヘルパー */
const getJsonLdScripts = (): HTMLScriptElement[] =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

/** MemoryRouter でラップする wrapper を生成 */
const createWrapper = (initialPath: string) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries: [initialPath] }, children);
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
};

describe('useItemListSchema', () => {
  let staticScriptCount: number;

  beforeEach(() => {
    staticScriptCount = getJsonLdScripts().length;
  });

  afterEach(() => {
    const scripts = getJsonLdScripts();
    scripts.slice(staticScriptCount).forEach((s) => s.remove());
  });

  it('ホームページ（/）で ItemList スキーマが挿入されること', () => {
    renderHook(() => useItemListSchema(), {
      wrapper: createWrapper('/'),
    });

    const scripts = getJsonLdScripts();
    expect(scripts.length).toBeGreaterThan(staticScriptCount);

    const lastScript = scripts[scripts.length - 1];
    const parsed = JSON.parse(lastScript.textContent ?? '');

    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('ItemList');
    expect(parsed['@id']).toBe('https://play.niku9.click/#gamelist');
    expect(parsed.name).toBe('Game Platform ゲーム一覧');
  });

  it('13 ゲームが全て含まれること', () => {
    renderHook(() => useItemListSchema(), {
      wrapper: createWrapper('/'),
    });

    const scripts = getJsonLdScripts();
    const lastScript = scripts[scripts.length - 1];
    const parsed = JSON.parse(lastScript.textContent ?? '');

    const gameCount = Object.keys(GAME_SEO_DATA).length;
    expect(parsed.numberOfItems).toBe(gameCount);
    expect(parsed.itemListElement).toHaveLength(gameCount);
  });

  it('各 ListItem の position, url, name, description が正しいこと', () => {
    renderHook(() => useItemListSchema(), {
      wrapper: createWrapper('/'),
    });

    const scripts = getJsonLdScripts();
    const lastScript = scripts[scripts.length - 1];
    const parsed = JSON.parse(lastScript.textContent ?? '');

    const gameEntries = Object.values(GAME_SEO_DATA);
    parsed.itemListElement.forEach(
      (item: Record<string, unknown>, index: number) => {
        const game = gameEntries[index];
        expect(item['@type']).toBe('ListItem');
        expect(item.position).toBe(index + 1);
        expect(item.url).toBe(`${SITE_BASE_URL}${game.path}`);
        expect(item.name).toBe(game.name);
        expect(item.description).toBe(game.description);
      }
    );
  });

  it('非ホームページでは挿入されないこと', () => {
    renderHook(() => useItemListSchema(), {
      wrapper: createWrapper('/about'),
    });

    const scripts = getJsonLdScripts();
    expect(scripts.length).toBe(staticScriptCount);
  });

  it('ゲームページでは挿入されないこと', () => {
    renderHook(() => useItemListSchema(), {
      wrapper: createWrapper('/puzzle'),
    });

    const scripts = getJsonLdScripts();
    expect(scripts.length).toBe(staticScriptCount);
  });

  it('アンマウント時にスクリプトが削除されること', () => {
    const { unmount } = renderHook(() => useItemListSchema(), {
      wrapper: createWrapper('/'),
    });

    expect(getJsonLdScripts().length).toBeGreaterThan(staticScriptCount);

    unmount();

    expect(getJsonLdScripts().length).toBe(staticScriptCount);
  });
});
