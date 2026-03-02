import * as fs from 'fs';
import * as path from 'path';

describe('sitemap.xml', () => {
  const sitemapPath = path.resolve(__dirname, '../../public/sitemap.xml');
  let sitemapContent: string;

  beforeAll(() => {
    sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
  });

  it('有効な XML 形式である', () => {
    expect(sitemapContent).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    expect(sitemapContent).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(sitemapContent).toContain('</urlset>');
  });

  describe('新規ページの URL が含まれている', () => {
    it('/about が priority 0.5 で含まれている', () => {
      expect(sitemapContent).toContain('<loc>https://niku9.click/about</loc>');
      // about の priority が 0.5 であることを検証
      const aboutMatch = sitemapContent.match(
        /<url>\s*<loc>https:\/\/niku9\.click\/about<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>\s*<\/url>/
      );
      expect(aboutMatch).not.toBeNull();
      expect(aboutMatch![1]).toBe('0.5');
    });

    it('/privacy-policy が priority 0.3 で含まれている', () => {
      expect(sitemapContent).toContain('<loc>https://niku9.click/privacy-policy</loc>');
      const match = sitemapContent.match(
        /<url>\s*<loc>https:\/\/niku9\.click\/privacy-policy<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>\s*<\/url>/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toBe('0.3');
    });

    it('/terms が priority 0.3 で含まれている', () => {
      expect(sitemapContent).toContain('<loc>https://niku9.click/terms</loc>');
      const match = sitemapContent.match(
        /<url>\s*<loc>https:\/\/niku9\.click\/terms<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>\s*<\/url>/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toBe('0.3');
    });

    it('/contact が priority 0.3 で含まれている', () => {
      expect(sitemapContent).toContain('<loc>https://niku9.click/contact</loc>');
      const match = sitemapContent.match(
        /<url>\s*<loc>https:\/\/niku9\.click\/contact<\/loc>[\s\S]*?<priority>([\d.]+)<\/priority>\s*<\/url>/
      );
      expect(match).not.toBeNull();
      expect(match![1]).toBe('0.3');
    });
  });

  it('lastmod が 2026-03-01 で設定されている', () => {
    const newPages = ['/about', '/privacy-policy', '/terms', '/contact'];
    for (const page of newPages) {
      const escapedPage = page.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = sitemapContent.match(
        new RegExp(
          `<url>\\s*<loc>https://niku9\\.click${escapedPage}</loc>\\s*<lastmod>([^<]+)</lastmod>`
        )
      );
      expect(match).not.toBeNull();
      expect(match![1]).toBe('2026-03-01');
    }
  });
});
