import { renderHook } from '@testing-library/react';
import { useFaqSchema } from '../useFaqSchema';
import { ABOUT_FAQ_ITEMS } from '../../constants/game-seo-data';
import type { FaqItem } from '../../constants/game-seo-data';

/** JSON-LD スクリプトタグを取得するヘルパー */
const getJsonLdScripts = (): HTMLScriptElement[] =>
  Array.from(document.querySelectorAll('script[type="application/ld+json"]'));

describe('useFaqSchema', () => {
  let staticScriptCount: number;

  beforeEach(() => {
    staticScriptCount = getJsonLdScripts().length;
  });

  afterEach(() => {
    const scripts = getJsonLdScripts();
    scripts.slice(staticScriptCount).forEach((s) => s.remove());
  });

  it('FAQ スキーマが正しく挿入されること', () => {
    const faqItems: ReadonlyArray<FaqItem> = [
      { question: 'テスト質問1', answer: 'テスト回答1' },
      { question: 'テスト質問2', answer: 'テスト回答2' },
    ];

    renderHook(() => useFaqSchema(faqItems));

    const scripts = getJsonLdScripts();
    expect(scripts.length).toBeGreaterThan(staticScriptCount);

    const lastScript = scripts[scripts.length - 1];
    const parsed = JSON.parse(lastScript.textContent ?? '');

    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('FAQPage');
    expect(parsed['@id']).toBe('https://niku9.click/about#faq');
    expect(parsed.mainEntity).toHaveLength(2);
  });

  it('各 Question と Answer が正しい構造であること', () => {
    const faqItems: ReadonlyArray<FaqItem> = [
      { question: '無料ですか？', answer: 'はい、無料です。' },
    ];

    renderHook(() => useFaqSchema(faqItems));

    const scripts = getJsonLdScripts();
    const lastScript = scripts[scripts.length - 1];
    const parsed = JSON.parse(lastScript.textContent ?? '');

    const question = parsed.mainEntity[0];
    expect(question['@type']).toBe('Question');
    expect(question.name).toBe('無料ですか？');
    expect(question.acceptedAnswer['@type']).toBe('Answer');
    expect(question.acceptedAnswer.text).toBe('はい、無料です。');
  });

  it('ABOUT_FAQ_ITEMS で 6 つの FAQ が挿入されること', () => {
    renderHook(() => useFaqSchema(ABOUT_FAQ_ITEMS));

    const scripts = getJsonLdScripts();
    const lastScript = scripts[scripts.length - 1];
    const parsed = JSON.parse(lastScript.textContent ?? '');

    expect(parsed.mainEntity).toHaveLength(6);
  });

  it('skip: true で挿入されないこと', () => {
    const faqItems: ReadonlyArray<FaqItem> = [
      { question: 'テスト', answer: 'テスト' },
    ];

    renderHook(() => useFaqSchema(faqItems, true));

    const scripts = getJsonLdScripts();
    expect(scripts.length).toBe(staticScriptCount);
  });

  it('アンマウント時にスクリプトが削除されること', () => {
    const faqItems: ReadonlyArray<FaqItem> = [
      { question: 'テスト', answer: 'テスト' },
    ];

    const { unmount } = renderHook(() => useFaqSchema(faqItems));

    expect(getJsonLdScripts().length).toBeGreaterThan(staticScriptCount);

    unmount();

    expect(getJsonLdScripts().length).toBe(staticScriptCount);
  });

  it('空の配列では挿入されないこと', () => {
    renderHook(() => useFaqSchema([]));

    const scripts = getJsonLdScripts();
    expect(scripts.length).toBe(staticScriptCount);
  });
});
