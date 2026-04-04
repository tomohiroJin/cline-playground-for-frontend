/**
 * デザイントークン定数のテスト
 */
import { DESIGN_TOKENS } from '../design-tokens';

describe('デザイントークン定義', () => {
  describe('フォントサイズトークン', () => {
    it('PC デフォルトのフォントサイズが定義されている', () => {
      expect(DESIGN_TOKENS.fontSize.title).toBe('clamp(22px, 4vw, 28px)');
      expect(DESIGN_TOKENS.fontSize.subtitle).toBe('clamp(15px, 2.5vw, 18px)');
      expect(DESIGN_TOKENS.fontSize.button).toBe('15px');
      expect(DESIGN_TOKENS.fontSize.body).toBe('14px');
      expect(DESIGN_TOKENS.fontSize.panel).toBe('13px');
      expect(DESIGN_TOKENS.fontSize.small).toBe('12px');
      expect(DESIGN_TOKENS.fontSize.tiny).toBe('11px');
    });

    it('モバイルのフォントサイズが 11px 以上を保証する', () => {
      const mobileValues = Object.values(DESIGN_TOKENS.fontSizeMobile);
      for (const val of mobileValues) {
        const numericPart = parseInt(val, 10);
        expect(numericPart).toBeGreaterThanOrEqual(11);
      }
    });
  });

  describe('スペーシングトークン', () => {
    it('PC デフォルトのスペーシングが定義されている', () => {
      expect(DESIGN_TOKENS.spacing.screenPad).toBe('14px 20px');
      expect(DESIGN_TOKENS.spacing.sectionGap).toBe('14px');
      expect(DESIGN_TOKENS.spacing.cardPad).toBe('12px');
      expect(DESIGN_TOKENS.spacing.btnPad).toBe('10px 22px');
    });
  });

  describe('カラーパレットトークン', () => {
    it('基本 UI カラーが定義されている', () => {
      expect(DESIGN_TOKENS.colors.accent).toBe('#f0c040');
      expect(DESIGN_TOKENS.colors.text).toBe('#e0d8c8');
      expect(DESIGN_TOKENS.colors.bg).toBe('#12121e');
      expect(DESIGN_TOKENS.colors.bgDeep).toBe('#0a0a12');
    });

    it('文明タイプカラーが定義されている', () => {
      expect(DESIGN_TOKENS.colors.civTech).toBe('#f08050');
      expect(DESIGN_TOKENS.colors.civLife).toBe('#50e090');
      expect(DESIGN_TOKENS.colors.civRit).toBe('#d060ff');
      expect(DESIGN_TOKENS.colors.civBal).toBe('#e0c060');
    });

    it('機能カラーが定義されている', () => {
      expect(DESIGN_TOKENS.colors.danger).toBe('#f05050');
      expect(DESIGN_TOKENS.colors.safe).toBe('#50e090');
      expect(DESIGN_TOKENS.colors.info).toBe('#50c8e8');
      expect(DESIGN_TOKENS.colors.reward).toBe('#f0c040');
    });
  });

  describe('ゲームサイズトークン', () => {
    it('PC デフォルトのゲームサイズが定義されている', () => {
      expect(DESIGN_TOKENS.gameSize.width).toBe('720px');
      expect(DESIGN_TOKENS.gameSize.height).toBe('960px');
    });
  });

  describe('CSS 変数文字列生成', () => {
    it('generateCssVariables が正しい CSS 変数文字列を返す', () => {
      const css = DESIGN_TOKENS.generateCssVariables();
      expect(css).toContain('--fs-title:');
      expect(css).toContain('--fs-tiny:');
      expect(css).toContain('--sp-screen-pad:');
      expect(css).toContain('--c-accent:');
      expect(css).toContain('--game-width:');
      expect(css).toContain('--game-height:');
    });

    it('モバイル用 CSS 変数文字列が生成される', () => {
      const css = DESIGN_TOKENS.generateMobileCssVariables();
      expect(css).toContain('--fs-button:');
      expect(css).toContain('--fs-tiny:');
      expect(css).toContain('--sp-screen-pad:');
    });
  });
});
