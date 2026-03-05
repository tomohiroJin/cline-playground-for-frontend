import { useEffect } from 'react';
import { SITE_BASE_URL } from '../constants/game-seo-data';
import type { FaqItem } from '../constants/game-seo-data';

/**
 * FAQ 構造化データ（FAQPage スキーマ）を <head> に動的挿入するフック
 *
 * FAQ アイテムの配列を受け取り、FAQPage スキーマとして挿入する。
 * アンマウント時にクリーンアップする。
 *
 * @param faqItems FAQ アイテムの配列
 * @param skip true の場合、挿入をスキップする
 */
export const useFaqSchema = (
  faqItems: ReadonlyArray<FaqItem>,
  skip = false
): void => {
  useEffect(() => {
    if (skip || faqItems.length === 0) return;

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${SITE_BASE_URL}/about#faq`,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    // XSS 対策: textContent で安全に挿入
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [faqItems, skip]);
};
