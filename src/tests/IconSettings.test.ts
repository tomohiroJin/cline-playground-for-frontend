import fs from 'fs';
import path from 'path';

describe('Icon Settings', () => {
  const publicDir = path.resolve(__dirname, '../../public');
  const indexHtmlPath = path.join(publicDir, 'index.html');
  const manifestJsonPath = path.join(publicDir, 'manifest.json');

  describe('index.html', () => {
    let indexHtmlContent: string;

    beforeAll(() => {
      indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    });

    it('should include favicon.ico link with proper sizes', () => {
      // <link rel="icon" href="/favicon.ico" sizes="16x16 32x32">
      expect(indexHtmlContent).toMatch(/<link\s+rel=["']icon["']\s+href=["']\/favicon\.ico["']\s+sizes=["']16x16 32x32["']\s*\/?>/i);
    });

    it('should include icon-192.png link', () => {
      // <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192">
      expect(indexHtmlContent).toMatch(/<link\s+rel=["']icon["']\s+href=["']\/icon-192\.png["']\s+type=["']image\/png["']\s+sizes=["']192x192["']\s*\/?>/i);
    });

    it('should include apple-touch-icon.png link', () => {
      // <link rel="apple-touch-icon" href="/apple-touch-icon.png">
      expect(indexHtmlContent).toMatch(/<link\s+rel=["']apple-touch-icon["']\s+href=["']\/apple-touch-icon\.png["']\s*\/?>/i);
    });
  });

  describe('manifest.json', () => {
    let manifest: any;

    beforeAll(() => {
      const content = fs.readFileSync(manifestJsonPath, 'utf8');
      manifest = JSON.parse(content);
    });

    it('should have icons array', () => {
      expect(Array.isArray(manifest.icons)).toBe(true);
      expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    });

    it('should include 192x192 icon configuration', () => {
      const icon192 = manifest.icons.find((i: any) => i.src === '/icon-192.png');
      expect(icon192).toBeDefined();
      expect(icon192.sizes).toBe('192x192');
      expect(icon192.type).toBe('image/png');
    });

    it('should include 512x512 icon configuration', () => {
      const icon512 = manifest.icons.find((i: any) => i.src === '/icon-512.png');
      expect(icon512).toBeDefined();
      expect(icon512.sizes).toBe('512x512');
      expect(icon512.type).toBe('image/png');
    });
  });
});
