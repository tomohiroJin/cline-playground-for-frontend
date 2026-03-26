/**
 * 原始進化録 - PRIMAL PATH - フォントサイズ拡大テスト
 *
 * 仕様書に基づくフォントサイズ定数の検証。
 */
import { FONT_SIZES } from '../constants/ui';

describe('フォントサイズ拡大', () => {
  describe('大サイズフォント', () => {
    it('title は 32px である', () => {
      expect(FONT_SIZES.title).toBe(32);
    });

    it('paused は 36px である', () => {
      expect(FONT_SIZES.paused).toBe(36);
    });

    it('overlayIcon は 64px である', () => {
      expect(FONT_SIZES.overlayIcon).toBe(64);
    });
  });

  describe('中サイズフォント', () => {
    it('subTitle は 20px である', () => {
      expect(FONT_SIZES.subTitle).toBe(20);
    });

    it('overlayText は 22px である', () => {
      expect(FONT_SIZES.overlayText).toBe(22);
    });

    it('skillBtn は 20px である', () => {
      expect(FONT_SIZES.skillBtn).toBe(20);
    });

    it('gameButton は 16px である', () => {
      expect(FONT_SIZES.gameButton).toBe(16);
    });
  });

  describe('小サイズフォント', () => {
    it('statText は 14px である', () => {
      expect(FONT_SIZES.statText).toBe(14);
    });

    it('log は 13px である', () => {
      expect(FONT_SIZES.log).toBe(13);
    });

    it('speedBtn は 13px である', () => {
      expect(FONT_SIZES.speedBtn).toBe(13);
    });

    it('allyBadge は 13px である', () => {
      expect(FONT_SIZES.allyBadge).toBe(13);
    });

    it('surrenderBtn は 12px である', () => {
      expect(FONT_SIZES.surrenderBtn).toBe(12);
    });
  });

  describe('最小フォントサイズ制約', () => {
    it('全フォントサイズが 12px 以上である', () => {
      const MIN_FONT_SIZE = 12;
      for (const [key, size] of Object.entries(FONT_SIZES)) {
        expect(size).toBeGreaterThanOrEqual(MIN_FONT_SIZE);
      }
    });
  });
});
