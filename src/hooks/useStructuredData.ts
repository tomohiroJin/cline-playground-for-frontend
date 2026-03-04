import { useEffect } from 'react';
import { SITE_NAME, SITE_BASE_URL } from '../constants/game-seo-data';

/** VideoGame スキーマ用データ */
interface VideoGameData {
  readonly name: string;
  readonly description: string;
  readonly url: string;
}

/** パンくずリストのアイテム */
interface BreadcrumbItem {
  readonly name: string;
  readonly url: string;
}

/** BreadcrumbList スキーマ用データ */
interface BreadcrumbData {
  readonly items: readonly BreadcrumbItem[];
}

/** フックの引数型 */
type StructuredDataOptions =
  | { type: 'VideoGame'; data: VideoGameData; skip?: boolean }
  | { type: 'BreadcrumbList'; data: BreadcrumbData; skip?: boolean };

/** VideoGame スキーマの JSON-LD を生成 */
const buildVideoGameSchema = (data: VideoGameData): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'VideoGame',
  name: data.name,
  description: data.description,
  url: data.url,
  gamePlatform: 'Web Browser',
  applicationCategory: 'Game',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'JPY',
  },
  inLanguage: 'ja',
  isPartOf: {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: `${SITE_BASE_URL}/`,
  },
});

/** BreadcrumbList スキーマの JSON-LD を生成 */
const buildBreadcrumbSchema = (data: BreadcrumbData): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: data.items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

/**
 * 構造化データ（JSON-LD）を <head> に動的に挿入するフック
 * アンマウント時にスクリプトをクリーンアップする
 */
export const useStructuredData = (options: StructuredDataOptions): void => {
  const { skip = false } = options;

  useEffect(() => {
    if (skip) return;

    const schema =
      options.type === 'VideoGame'
        ? buildVideoGameSchema(options.data as VideoGameData)
        : buildBreadcrumbSchema(options.data as BreadcrumbData);

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    // XSS 対策: innerHTML ではなく textContent を使用
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [options.type, options.data, skip]);
};
