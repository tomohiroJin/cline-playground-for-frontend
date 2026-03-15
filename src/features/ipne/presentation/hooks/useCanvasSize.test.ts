/**
 * useCanvasSize フックのテスト
 * calculateTileSize と getCanvasSize の統合テスト
 */
import { calculateTileSize, getCanvasSize, VIEWPORT_CONFIG } from '../services/viewportService';

describe('useCanvasSize 関連関数', () => {
  describe('calculateTileSize の計算精度', () => {
    it('フルHD PCで正しいタイルサイズを計算する', () => {
      const tileSize = calculateTileSize(1880, 1020);
      expect(tileSize).toBe(92);
    });

    it('MacBook Air で正しいタイルサイズを計算する', () => {
      const tileSize = calculateTileSize(1400, 840);
      expect(tileSize).toBe(76);
    });

    it('iPad で正しいタイルサイズを計算する', () => {
      const tileSize = calculateTileSize(984, 708);
      expect(tileSize).toBe(64);
    });

    it('モバイルではminTileSizeでクランプされる', () => {
      const tileSize = calculateTileSize(370, 780);
      // min(370/15, 780/11) = min(24.6, 70.9) = 24 -> クランプ 32
      expect(tileSize).toBe(32);
    });

    it('常に整数値を返す', () => {
      const testCases = [
        { w: 1000, h: 700 },
        { w: 1234, h: 567 },
        { w: 800, h: 600 },
        { w: 1920, h: 1080 },
      ];
      for (const { w, h } of testCases) {
        const tileSize = calculateTileSize(w, h);
        expect(Number.isInteger(tileSize)).toBe(true);
      }
    });
  });

  describe('minTileSize / maxTileSize のクランプ', () => {
    it('小さい領域では minTileSize が適用される', () => {
      const tileSize = calculateTileSize(100, 100);
      expect(tileSize).toBe(VIEWPORT_CONFIG.minTileSize);
    });

    it('大きい領域では maxTileSize が適用される', () => {
      const tileSize = calculateTileSize(5000, 5000);
      expect(tileSize).toBe(VIEWPORT_CONFIG.maxTileSize);
    });

    it('ちょうど minTileSize の境界値', () => {
      // tilesX=15, tilesY=11, minTileSize=32
      // 15*32=480, 11*32=352 → これ以下ならクランプ
      const tileSize = calculateTileSize(480, 352);
      expect(tileSize).toBe(32);
    });

    it('ちょうど maxTileSize の境界値', () => {
      // tilesX=15, tilesY=11, maxTileSize=128
      // 15*128=1920, 11*128=1408 → これ以上ならクランプ
      const tileSize = calculateTileSize(1920, 1408);
      expect(tileSize).toBe(128);
    });
  });

  describe('getCanvasSize の整合性', () => {
    it('タイルサイズとタイル数の積がキャンバスサイズとなる', () => {
      const tileSizes = [32, 48, 64, 76, 92, 128];
      for (const ts of tileSizes) {
        const { width, height } = getCanvasSize(ts);
        expect(width).toBe(VIEWPORT_CONFIG.tilesX * ts);
        expect(height).toBe(VIEWPORT_CONFIG.tilesY * ts);
      }
    });

    it('calculateTileSize の結果を getCanvasSize に渡して整合性がとれる', () => {
      const testCases = [
        { w: 1880, h: 1020 },
        { w: 984, h: 708 },
        { w: 370, h: 780 },
      ];
      for (const { w, h } of testCases) {
        const tileSize = calculateTileSize(w, h);
        const { width, height } = getCanvasSize(tileSize);
        // キャンバスサイズはタイル数 × タイルサイズ
        expect(width).toBe(VIEWPORT_CONFIG.tilesX * tileSize);
        expect(height).toBe(VIEWPORT_CONFIG.tilesY * tileSize);
        // キャンバスサイズは元の利用可能領域以下（クランプ前提を除く）
        if (tileSize > VIEWPORT_CONFIG.minTileSize) {
          expect(width).toBeLessThanOrEqual(w);
          expect(height).toBeLessThanOrEqual(h);
        }
      }
    });
  });
});
